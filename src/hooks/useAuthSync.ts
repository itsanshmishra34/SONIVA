import { useState, useCallback } from 'react';
import { auth as clientAuth } from '../services/firebase';
import { User } from '../types';

export function useAuthSync() {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncProfile = useCallback(async (retryCount = 0): Promise<User | null> => {
    const firebaseUser = clientAuth.currentUser;
    if (!firebaseUser) {
      console.log('[useAuthSync] [sync_skipped] No authenticated Firebase user active.');
      return null;
    }

    const uid = firebaseUser.uid;
    const email = firebaseUser.email || '';
    const displayName = firebaseUser.displayName || email.split('@')[0];

    console.log(`[useAuthSync] [sync_start] Beginning atomic profile synchronization for UID: ${uid}. Attempt: ${retryCount + 1}`);
    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const idToken = await firebaseUser.getIdToken(true);
      
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          uid,
          email,
          displayName
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Server rejected user profile database synchronization');
      }

      const data = await res.json();
      console.log(`[useAuthSync] [sync_success] Handshake completed. Profile successfully synchronized for UID: ${uid}`);
      setSyncStatus('success');
      return data.user;
    } catch (err: any) {
      console.error(`[useAuthSync] [sync_error] Synchronization failed for UID: ${uid}:`, err);

      const maxRetries = 3;
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`[useAuthSync] [sync_retry] Attempting automatic retry in ${delay}ms...`);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(syncProfile(retryCount + 1));
          }, delay);
        });
      } else {
        console.error(`[useAuthSync] [sync_failed_terminal] All retry attempts exhausted for UID: ${uid}`);
        setSyncStatus('error');
        setSyncError(err.message || "Google sign-in succeeded, but SONIVA couldn't finish setting up your account. Please try again.");
        return null;
      }
    }
  }, []);

  return {
    syncStatus,
    syncError,
    syncProfile
  };
}
