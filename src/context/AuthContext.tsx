import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, FeatureFlags } from '../types';
import { e2eeService } from '../services/e2ee';
import { socketService } from '../services/socket';
import { auth as clientAuth } from '../services/firebase';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut as firebaseLogout, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { useAuthSync } from '../hooks/useAuthSync';
import { audioManager } from '../services/audioManager';
import { youtubePlayerManager } from '../services/youtubePlayerManager';

// Reliable helper to detect embedded / iframe preview context
export const isEmbeddedPreview = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

export type AuthStatus = 'idle' | 'authenticating' | 'redirecting' | 'authenticated' | 'error';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authStatus: AuthStatus;
  authMessage: string | null;
  isRedirecting: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCoOwner: boolean;
  isPrivileged: boolean;
  featureFlags: FeatureFlags;
  authError: string | null;
  clearAuthError: () => void;
  googleLogin: () => Promise<{ redirectUrl: string } | null>;
  adminLogin: (accessCode: string) => Promise<{ redirectUrl: string } | null>;
  completeOnboarding: (data: Partial<User> & { phone?: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshSession: () => Promise<void>;
  handleAuthenticatedFirebaseUser: (firebaseUser: FirebaseUser) => Promise<{ redirectUrl: string; user: User } | null>;
}

const defaultFlags: FeatureFlags = {
  randomConnect: true,
  voiceCalls: true,
  singTogether: true,
  groupChat: false,
  voiceMessages: true,
  audiusStreaming: true
};

// HMR-safe single context instance registry to prevent context duplication
const globalAuthContextSymbol = Symbol.for('soniva.auth_context');
const AuthContext: React.Context<AuthContextType | undefined> = (() => {
  if (import.meta.env.DEV) {
    const g = globalThis as any;
    if (!g[globalAuthContextSymbol]) {
      g[globalAuthContextSymbol] = createContext<AuthContextType | undefined>(undefined);
    }
    return g[globalAuthContextSymbol];
  }
  return createContext<AuthContextType | undefined>(undefined);
})();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(defaultFlags);

  const { syncProfile } = useAuthSync();
  const redirectProcessedRef = useRef(false);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const isCoOwner = user?.role === 'co_owner';
  const isPrivileged = isAdmin || isCoOwner;
  const isRedirecting = authStatus === 'redirecting';

  const clearAuthError = () => {
    setAuthError(null);
    if (authStatus === 'error') {
      setAuthStatus('idle');
    }
  };

  // Shared function to handle authenticated Firebase user after Popup OR Redirect
  const handleAuthenticatedFirebaseUser = async (firebaseUser: FirebaseUser) => {
    console.log('[GOOGLE_FIREBASE_USER] Authenticated Firebase user UID:', firebaseUser.uid);
    setAuthStatus('authenticating');
    setAuthMessage('Authenticating with SONIVA...');
    setIsLoading(true);

    try {
      console.log('[GOOGLE_BACKEND_VERIFY] Fetching fresh ID token...');
      await firebaseUser.getIdToken(true);

      console.log('[GOOGLE_BACKEND_VERIFY] Synchronizing profile document with server...');
      const verifiedUser = await syncProfile();

      if (!verifiedUser) {
        throw new Error('Database synchronization failed during production auth sync');
      }

      console.log('[GOOGLE_ROLE_RESOLVED] Server resolved role:', verifiedUser.role);
      setUser(verifiedUser);

      const idToken = await firebaseUser.getIdToken();
      await e2eeService.init();
      socketService.connect(verifiedUser.id, idToken);

      setAuthStatus('authenticated');
      setAuthMessage(null);
      console.log('[GOOGLE_AUTH_COMPLETE] User successfully authenticated:', verifiedUser.email);

      let redirectUrl = '/app';
      if (verifiedUser.role === 'admin' || verifiedUser.role === 'super_admin') {
        console.log('[ADMIN_ACCESS_GRANTED]');
        redirectUrl = '/admin';
      } else if (!verifiedUser.onboardingCompleted) {
        redirectUrl = '/onboarding';
      }

      if (verifiedUser.role === 'co_owner') {
        console.log('[CO_OWNER_WELCOME_START]');
      }

      return { redirectUrl, user: verifiedUser };
    } catch (err: any) {
      console.error('[GOOGLE_BACKEND_VERIFY] Auth handshake failed:', err);
      setAuthStatus('error');
      setAuthError(err.message || 'Unable to complete Google sign-in. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // One-time startup check for redirect result
  useEffect(() => {
    if (redirectProcessedRef.current) return;
    redirectProcessedRef.current = true;

    const checkRedirectResult = async () => {
      try {
        console.log('[GOOGLE_AUTH_START] Checking getRedirectResult on startup...');
        const result = await getRedirectResult(clientAuth);
        if (result && result.user) {
          console.log('[GOOGLE_REDIRECT_RESULT] Redirect login completed for:', result.user.email);
          await handleAuthenticatedFirebaseUser(result.user);
        }
      } catch (err: any) {
        console.warn('[GOOGLE_REDIRECT_RESULT] getRedirectResult exception:', err?.code, err?.message);
        if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized domain')) {
          setAuthStatus('error');
          setAuthError('Google sign-in is not configured for this domain.');
        } else if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
          setAuthStatus('error');
          setAuthError(err.message || 'Your Google account could not be authenticated.');
        }
      }
    };

    checkRedirectResult();
  }, []);

  // Sync session check
  const checkSession = async () => {
    setIsLoading(true);
    try {
      const firebaseUser = clientAuth.currentUser;
      if (!firebaseUser) {
        setUser(null);
        return;
      }
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.flags) setFeatureFlags(data.flags);
        await e2eeService.init();
        socketService.connect(data.user.id, idToken);
        setAuthStatus('authenticated');
      } else {
        setUser(null);
        setAuthStatus('idle');
      }
    } catch (e) {
      console.warn('Session check failed:', e);
      setUser(null);
      setAuthStatus('idle');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(clientAuth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const tokenResult = await firebaseUser.getIdTokenResult();
          console.log('[FIREBASE_AUTH_DIAGNOSTIC] User status: ACTIVE', {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            tokenIssuedAt: tokenResult.issuedAtTime,
            tokenExpirationTime: tokenResult.expirationTime,
            tokenValid: Date.now() < new Date(tokenResult.expirationTime).getTime()
          });
        } catch (diagErr: any) {
          console.warn('[FIREBASE_AUTH_DIAGNOSTIC] Failed to evaluate token result:', diagErr?.message || diagErr);
        }

        console.log('[SESSION_RESTORE_START] Firebase user detected, restoring session...');
        try {
          const idToken = await firebaseUser.getIdToken(true);
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${idToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            if (data.flags) setFeatureFlags(data.flags);
            await e2eeService.init();
            socketService.connect(data.user.id, idToken);
            setAuthStatus('authenticated');
          } else {
            setUser(null);
            setAuthStatus('idle');
          }
        } catch (err) {
          console.warn('Session restore verify failed:', err);
          setUser(null);
          setAuthStatus('idle');
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log('[FIREBASE_AUTH_DIAGNOSTIC] User status: NULL / NO_SESSION');
        setUser(null);
        setIsLoading(false);
        setAuthStatus('idle');
      }
    });

    return () => unsubscribe();
  }, []);

  // Unified Google Login Flow: Popup in top-level browser, clear instruction in embedded preview
  const googleLogin = async () => {
    clearAuthError();

    if (isEmbeddedPreview()) {
      console.warn('[GOOGLE_AUTH_EMBEDDED] Google sign-in attempted inside embedded iframe preview. Blocked to prevent Google 403 error.');
      setAuthStatus('error');
      setAuthError('Google sign-in is unavailable inside the embedded preview. Open SONIVA in a new browser tab to continue.');
      setIsLoading(false);
      return null;
    }

    setAuthStatus('authenticating');
    setAuthMessage('Signing in with Google...');
    setIsLoading(true);
    console.log('[GOOGLE_AUTH_START] Google login sequence initiated.');

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const userCredential = await signInWithPopup(clientAuth, provider);
      console.log('[GOOGLE_POPUP_SUCCESS] Popup login succeeded for UID:', userCredential.user.uid);
      return await handleAuthenticatedFirebaseUser(userCredential.user);
    } catch (err: any) {
      console.warn('[GOOGLE_POPUP_ATTEMPT] Popup attempt caught exception:', err?.code, err?.message);

      const isUnauthorizedDomain = 
        err.code === 'auth/unauthorized-domain' || 
        (err.message && err.message.toLowerCase().includes('unauthorized domain'));

      if (isUnauthorizedDomain) {
        console.error('[GOOGLE_AUTH_ERROR] Domain is not authorized in Firebase Console:', err.message);
        setAuthStatus('error');
        setAuthError('Google sign-in is not configured for this domain.');
        setIsLoading(false);
        return null;
      }

      if (err.code === 'auth/popup-closed-by-user') {
        console.log('[GOOGLE_AUTH_CANCELLED] Popup closed by user.');
        setAuthStatus('idle');
        setAuthError('Google sign-in was cancelled.');
        setIsLoading(false);
        return null;
      }

      const isPopupBlocked = 
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/popup-operation-not-supported-in-this-environment' ||
        err.code === 'auth/cancelled-popup-request' ||
        (err.message && err.message.toLowerCase().includes('popup'));

      if (isPopupBlocked) {
        setAuthStatus('error');
        setAuthError('Popup was blocked by your browser. Please allow popups for Google sign-in.');
        setIsLoading(false);
        return null;
      }

      console.error('[GOOGLE_AUTH_ERROR] Google auth error:', err);
      setAuthStatus('error');
      setAuthError(err.message || 'Unable to complete Google sign-in. Please try again.');
      setIsLoading(false);
      return null;
    }
  };

  // Server-Side Validated Admin Authentication Flow
  const adminLogin = async (accessCode: string) => {
    setAuthStatus('authenticating');
    setAuthMessage('Authorizing admin credentials...');
    setIsLoading(true);
    clearAuthError();

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    let firebaseUser: FirebaseUser | null = null;

    try {
      const userCredential = await signInWithPopup(clientAuth, provider);
      firebaseUser = userCredential.user;
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-operation-not-supported-in-this-environment') {
        setAuthStatus('redirecting');
        setAuthMessage('Opening secure Google sign-in...');
        await signInWithRedirect(clientAuth, provider);
        return null;
      } else if (err.code === 'auth/popup-closed-by-user') {
        setAuthStatus('idle');
        setAuthError('Google sign-in was cancelled.');
        setIsLoading(false);
        return null;
      } else {
        setAuthStatus('error');
        setAuthError(err.message || 'Admin authentication failed.');
        setIsLoading(false);
        return null;
      }
    }

    if (firebaseUser) {
      try {
        const idToken = await firebaseUser.getIdToken(true);
        const res = await fetch('/api/auth/login-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ accessCode })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Admin authentication failed.');
        }

        const data = await res.json();
        const verifiedAdmin = data.user;
        setUser(verifiedAdmin);

        await e2eeService.init();
        socketService.connect(verifiedAdmin.id, idToken);

        setAuthStatus('authenticated');
        return { redirectUrl: '/admin' };
      } catch (err: any) {
        setAuthStatus('error');
        setAuthError(err.message || 'Admin authentication failed.');
        return null;
      } finally {
        setIsLoading(false);
      }
    }
    return null;
  };

  // Complete First-Time Onboarding
  const completeOnboarding = async (data: Partial<User> & { phone?: string }) => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Client-side Firestore persistence
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('../services/firebase');
        const userDocRef = doc(db, 'users', user.id);
        const { phone, ...onboardingData } = data;
        await updateDoc(userDocRef, { ...onboardingData, onboardingCompleted: true });
        console.log('[AuthContext] Client-side onboarding sync successful');
      } catch (fsErr) {
        console.warn('[AuthContext] Client-side onboarding sync failed:', fsErr);
      }

      // 2. Server-side update
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          username: data.username,
          displayName: data.displayName,
          gender: data.gender,
          birthYear: data.birthYear,
          musicInterests: data.musicInterests,
          phone: data.phone,
          vibes: data.vibes,
          favoriteGenres: data.favoriteGenres,
          languages: data.languages,
          favoriteArtists: data.favoriteArtists
        })
      });

      if (res.ok) {
        const result = await res.json();
        setUser(result.user);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to complete onboarding');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseLogout(clientAuth);
    } catch (e) {
      console.warn('Firebase SignOut exception:', e);
    }
    // Stop all active playback on logout
    audioManager.stop();
    youtubePlayerManager.stopVideo();
    socketService.disconnect();
    setUser(null);
    setAuthStatus('idle');
    setAuthError(null);
    // Return to public entry page
    window.location.hash = '';
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    
    try {
      const firebaseUser = clientAuth.currentUser;
      if (!firebaseUser) throw new Error('No authenticated Firebase user found');
      
      const idToken = await firebaseUser.getIdToken(true);

      // We perform a real authenticated API call to persist changes
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(data) // userId is extracted server-side from token
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      const result = await res.json();
      
      // Only update local state after server confirms durable persistence
      if (result.success && result.persisted && result.user) {
        setUser(result.user);
        console.log('[AuthContext] Profile successfully persisted to backend database');
      } else {
        throw new Error(result.error || 'Profile could not be durably persisted.');
      }
    } catch (e: any) {
      console.error('[AuthContext] Profile update failed:', e.message || e);
      throw e; // Propagate error so component can handle it
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        authStatus,
        authMessage,
        isRedirecting,
        isAdmin,
        isSuperAdmin,
        isCoOwner,
        isPrivileged,
        featureFlags,
        authError,
        clearAuthError,
        googleLogin,
        adminLogin,
        completeOnboarding,
        logout,
        updateProfile,
        refreshSession: checkSession,
        handleAuthenticatedFirebaseUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      `[SONIVA_DIAGNOSTIC] useAuth must be used within an AuthProvider.\n` +
      `Expected Provider: AuthProvider\n` +
      `Current Environment: ${import.meta.env.MODE || 'development'}\n` +
      `Possible Cause: You are calling useAuth() in a component that is not nested inside <AuthProvider>, or Vite HMR re-evaluation created duplicate context instances.\n` +
      `Remedy: Check that the calling component is nested under <AuthProvider> in App.tsx. If the issue persists during development, please reload the browser tab to reset the context registry.`
    );
  }
  return context;
};
