/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MusicProvider, useMusic } from './context/MusicContext';
import { YouTubeProvider } from './context/YouTubeContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { PublicSyncProvider } from './context/PublicSyncProvider';
import { Conversation, User, Track } from './types';

// UI & Layout Components
import { MusicReactiveAurora } from './components/ui/MusicReactiveAurora';
import { AmbientFloatingEmojis } from './components/ui/AmbientFloatingEmojis';
import { AnimatedRouteView } from './components/ui/AnimatedRouteView';
import { SidebarNav } from './components/navigation/SidebarNav';
import { MobileBottomNav } from './components/navigation/MobileBottomNav';
import { PersistentMusicPlayer } from './components/player/PersistentMusicPlayer';

// Route Views
import { HomeView } from './components/routes/HomeView';
import { ChatView } from './components/routes/ChatView';
import { VibeRoomsView } from './components/routes/VibeRoomsView';
import { MusicView } from './components/routes/MusicView';
import { ListenTogetherView } from './components/routes/ListenTogetherView';
import { SingTogetherView } from './components/routes/SingTogetherView';
import { VoiceCallView } from './components/routes/VoiceCallView';
import { CameraView } from './components/routes/CameraView';
import { FeedbackView } from './components/routes/FeedbackView';
import { SuggestFeatureView } from './components/routes/SuggestFeatureView';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminUserManagement } from './components/admin/AdminUserManagement';
import { AdminUserDetail } from './components/admin/AdminUserDetail';
import { AdminComplaintsReports } from './components/admin/AdminComplaintsReports';
import { AdminFeedback } from './components/admin/AdminFeedback';
import { AdminFeatureRequests } from './components/admin/AdminFeatureRequests';
import { NotFoundPage } from './components/routes/NotFoundPage';

// Views
import { LibraryView } from './components/views/LibraryView';
import { SettingsView } from './components/views/SettingsView';
import { ProfileSettings } from './components/settings/ProfileSettings';
import { MusicSettings } from './components/settings/MusicSettings';
import { PrivacySettings } from './components/settings/PrivacySettings';
import { NotificationsSettings } from './components/settings/NotificationsSettings';
import { PlaybackSettings } from './components/settings/PlaybackSettings';
import { AccountSettings } from './components/settings/AccountSettings';
import { OwnerCreditsSection } from './components/credits/OwnerCreditsSection';
import { NotificationsView } from './components/views/NotificationsView';
import { CoOwnerSpaceView } from './components/views/CoOwnerSpaceView';

// Auth & Entry Flow Components
import { LandingAuthPage } from './components/auth/LandingAuthPage';
import { AuthLoadingScreen } from './components/auth/AuthLoadingScreen';

// Modals
import { FindSomeoneModal } from './components/modals/FindSomeoneModal';
import { AccessCodeModal } from './components/modals/AccessCodeModal';
import { ReportUserModal } from './components/modals/ReportUserModal';
import { OnboardingModal } from './components/auth/OnboardingModal';
import { CoOwnerIntroModal } from './components/coowner/CoOwnerIntroModal';
import { GlobalYouTubeHost } from './components/player/GlobalYouTubeHost';


function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { togglePlay, nextTrack, toggleMute } = useMusic();

  const isAdminRoute = location.pathname.startsWith('/admin');

  // Seeded conversations so user immediately has live chat connections
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'convo-sunaina',
      roomId: 'room-sunaina',
      participant: {
        id: 'user-sunaina',
        email: 'snaina6330@gmail.com',
        username: 'sunaina',
        displayName: 'SUNAINA',
        gender: 'Female',
        birthYear: 2003,
        isAgeEligible: true,
        onboardingCompleted: true,
        musicInterests: ['Bollywood', 'Lo-Fi', 'Pop', 'Romantic'],
        role: 'co_owner',
        createdAt: '2026-01-01T00:00:00.000Z',
        isOnline: true,
        status: 'active',
        currentSong: { id: 'track-kesariya', title: 'Kesariya', artist: 'Arijit Singh' },
        vibes: ['Romantic', 'Chill', 'Bollywood'],
        favoriteGenres: ['Bollywood', 'Lo-Fi', 'Pop'],
        languages: ['Hindi', 'English'],
        favoriteArtists: ['Arijit Singh', 'Shreya Ghoshal']
      },
      lastMessage: 'Listening to anything good right now? 🎧',
      lastTimestamp: Date.now() - 1000 * 60 * 4,
      unreadCount: 0,
      isE2EE: true,
      compatibilityScore: 98
    },
    {
      id: 'convo-ayush',
      roomId: 'room-ayush',
      participant: {
        id: 'user-ayush',
        email: 'itsanshmishra34@gmail.com',
        username: 'ayush_mishra',
        displayName: 'Ayush Mishra',
        gender: 'Male',
        birthYear: 2002,
        isAgeEligible: true,
        onboardingCompleted: true,
        musicInterests: ['Electronic', 'EDM', 'Indie', 'Synthwave'],
        role: 'super_admin',
        createdAt: '2026-01-01T00:00:00.000Z',
        isOnline: true,
        status: 'active',
        currentSong: { id: 'track-midnight', title: 'Midnight City', artist: 'M83' },
        vibes: ['Energetic', 'Focused', 'Late Night'],
        favoriteGenres: ['Electronic', 'Indie', 'Synthwave'],
        languages: ['English', 'Hindi'],
        favoriteArtists: ['M83', 'Daft Punk']
      },
      lastMessage: 'Ready for a Listen Together session?',
      lastTimestamp: Date.now() - 1000 * 60 * 18,
      unreadCount: 0,
      isE2EE: true,
      compatibilityScore: 95
    }
  ]);
  const [activeConversationId, setActiveConversationId] = useState<string>('room-sunaina');

  // Transient Modals state
  const [isFindSomeoneOpen, setIsFindSomeoneOpen] = useState(false);
  const [isAccessCodeOpen, setIsAccessCodeOpen] = useState(false);
  const [accessCodeMode, setAccessCodeMode] = useState<'create' | 'join'>('create');
  const [reportingUser, setReportingUser] = useState<User | null>(null);

  // Mouse position tracker
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.body.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.body.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    
    let rafId: number;
    const throttledMouseMove = (e: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => handleMouseMove(e));
    };

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('.premium-interactive');
      if (target instanceof HTMLElement) {
        const rect = target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        target.style.setProperty('--click-x', `${x}px`);
        target.style.setProperty('--click-y', `${y}px`);
        target.classList.add('clicked');
        
        setTimeout(() => target.classList.remove('clicked'), 250);
      }
    };

    window.addEventListener('mousemove', throttledMouseMove);
    document.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
      document.removeEventListener('click', handleClick);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigate('/music');
      } else if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        nextTrack();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'Escape') {
        setIsFindSomeoneOpen(false);
        setIsAccessCodeOpen(false);
        setReportingUser(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, nextTrack, toggleMute, navigate]);

  const activeConversation = conversations.find((c) => c.roomId === activeConversationId) || conversations[0];

  const handleSelectConversation = (convo: Conversation) => {
    setActiveConversationId(convo.roomId);
  };

  // When random match is found
  const handleRandomMatched = (partner: User, roomId: string, compatibility: number) => {
    const existing = conversations.find((c) => c.participant.id === partner.id);
    if (existing) {
      setActiveConversationId(existing.roomId);
      navigate(`/chat/${existing.roomId}`);
      return;
    }

    const newConvo: Conversation = {
      id: `convo-${partner.id}`,
      roomId,
      participant: partner,
      lastMessage: 'Matched via music vibe!',
      lastTimestamp: Date.now(),
      unreadCount: 0,
      isE2EE: true,
      compatibilityScore: compatibility
    };

    setConversations((prev) => [newConvo, ...prev]);
    setActiveConversationId(roomId);
    navigate(`/chat/${roomId}`);
  };

  // When user joins private room with 6-digit access code
  const handleRoomJoined = (roomId: string, code: string, isHost: boolean) => {
    const partnerId = isHost ? 'guest-listener' : 'host-listener';
    const newConvo: Conversation = {
      id: `convo-${roomId}`,
      roomId,
      participant: {
        id: partnerId,
        email: 'room.partner@soniva.internal',
        username: `code_${code}`,
        displayName: isHost ? `Private Room #${code}` : `Host (Room #${code})`,
        gender: 'Male',
        birthYear: 2002,
        musicInterests: ['Electronic', 'Lo-Fi', 'Indie'],
        role: 'user',
        createdAt: new Date().toISOString(),
        isOnline: true,
        status: 'active'
      },
      lastMessage: `Joined private room with code ${code}`,
      lastTimestamp: Date.now(),
      unreadCount: 0,
      isE2EE: true,
      compatibilityScore: 95
    };

    setConversations((prev) => [newConvo, ...prev]);
    setActiveConversationId(roomId);
    navigate(`/chat/${roomId}`);
  };

  return (
    <div className="flex flex-col h-dvh min-h-0 w-screen overflow-hidden bg-transparent text-slate-100 relative">
      {/* Level 0: Music Reactive Aurora Canvas */}
      <MusicReactiveAurora />

      {/* Level 5: Floating Ambient Reactions */}
      <AmbientFloatingEmojis />

      {/* Main Workspace Row (Flex 1, occupies full space above player) */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Navigation Sidebar (Level 1) - Rendered for standard user routes */}
        {!isAdminRoute && (
          <SidebarNav
            onOpenFindSomeone={() => setIsFindSomeoneOpen(true)}
            onOpenFeedback={() => navigate('/feedback')}
            onOpenSuggest={() => navigate('/suggest-feature')}
            onOpenSearch={() => navigate('/music')}
            onOpenCamera={() => navigate('/camera')}
          />
        )}

        {/* Main Routed View Area with layout-safe, cinematic page transition wrapper */}
        <main className="flex-1 min-h-0 flex overflow-hidden relative">
          <AnimatedRouteView className="flex-1">
            <Routes>
              <Route path="/" element={<HomeView />} />
              <Route
                path="/chat"
                element={
                  <ChatView
                    conversations={conversations}
                    activeConversationId={activeConversationId}
                    onSelectConversation={handleSelectConversation}
                    onOpenFindSomeone={() => setIsFindSomeoneOpen(true)}
                    onOpenCreatePrivate={() => {
                      setAccessCodeMode('create');
                      setIsAccessCodeOpen(true);
                    }}
                    onOpenJoinCode={() => {
                      setAccessCodeMode('join');
                      setIsAccessCodeOpen(true);
                    }}
                    onReportUser={(target) => setReportingUser(target)}
                  />
                }
              />
              <Route
                path="/chat/:roomId"
                element={
                  <ChatView
                    conversations={conversations}
                    activeConversationId={activeConversationId}
                    onSelectConversation={handleSelectConversation}
                    onOpenFindSomeone={() => setIsFindSomeoneOpen(true)}
                    onOpenCreatePrivate={() => {
                      setAccessCodeMode('create');
                      setIsAccessCodeOpen(true);
                    }}
                    onOpenJoinCode={() => {
                      setAccessCodeMode('join');
                      setIsAccessCodeOpen(true);
                    }}
                    onReportUser={(target) => setReportingUser(target)}
                  />
                }
              />
              <Route path="/music" element={<MusicView />} />
              <Route path="/vibe-rooms" element={<VibeRoomsView />} />
              <Route path="/vibe-rooms/:roomId" element={<VibeRoomsView />} />
              <Route path="/listen-together" element={<ListenTogetherView />} />
              <Route path="/listen-together/:roomId" element={<ListenTogetherView />} />
              <Route path="/sing-together" element={<SingTogetherView />} />
              <Route path="/voice-call" element={<VoiceCallView activeConversation={activeConversation} />} />
              <Route path="/camera" element={<CameraView />} />
              <Route path="/settings" element={<SettingsView />}>
                <Route index element={<ProfileSettings />} />
                <Route path="profile" element={<ProfileSettings />} />
                <Route path="music" element={<MusicSettings />} />
                <Route path="privacy" element={<PrivacySettings />} />
                <Route path="notifications" element={<NotificationsSettings />} />
                <Route path="playback" element={<PlaybackSettings />} />
                <Route path="account" element={<AccountSettings />} />
              </Route>
              <Route path="/feedback" element={<FeedbackView />} />
              <Route path="/suggest-feature" element={<SuggestFeatureView />} />
              <Route
                path="/library"
                element={
                  <LibraryView
                    onOpenSearch={() => navigate('/music')}
                    onOpenListenTogether={() => navigate('/listen-together')}
                  />
                }
              />
              <Route path="/notifications" element={<NotificationsView />} />
              <Route path="/coowner-space" element={<CoOwnerSpaceView />} />
              <Route
                path="/credits"
                element={
                  <div className="flex-1 overflow-y-auto">
                    <OwnerCreditsSection />
                  </div>
                }
              />

              {/* Protected Admin Control Center with persistent AdminLayout sidebar & outlet */}
              <Route path="/admin/*" element={<AdminLayout />}>
                <Route index element={<AdminDashboard onBackToApp={() => navigate('/')} hideHeader={true} />} />
                <Route path="users" element={<AdminUserManagement />} />
                <Route path="users/:uid" element={<AdminUserDetail />} />
                <Route path="reports" element={<AdminComplaintsReports mode="reports" />} />
                <Route path="complaints" element={<AdminComplaintsReports mode="complaints" />} />
                <Route path="feedback" element={<AdminFeedback />} />
                <Route path="feature-requests" element={<AdminFeatureRequests />} />
                <Route path="audit-log" element={<AdminDashboard onBackToApp={() => navigate('/')} hideHeader={true} defaultTab="audit" />} />
                <Route path="audit" element={<AdminDashboard onBackToApp={() => navigate('/')} hideHeader={true} defaultTab="audit" />} />
                <Route path="flags" element={<AdminDashboard onBackToApp={() => navigate('/')} hideHeader={true} defaultTab="flags" />} />
                <Route path="*" element={<AdminDashboard onBackToApp={() => navigate('/')} hideHeader={true} />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AnimatedRouteView>
        </main>
      </div>

      {/* Persistent Bottom Music Player (Level 3) - Reserved bottom layout region */}
      <div className="shrink-0 z-30">
        <PersistentMusicPlayer
          onOpenSearch={() => navigate('/music')}
          onOpenListenTogether={() => navigate('/listen-together')}
        />
      </div>

      {/* Mobile Bottom Navigation (Level 2) - Switch standard user routes to mobile layout model */}
      {!isAdminRoute && (
        <MobileBottomNav onOpenFindSomeone={() => setIsFindSomeoneOpen(true)} />
      )}

      {/* Transient Modals & Dialogs (Level 4) */}
      <React.Suspense fallback={null}>
        <FindSomeoneModal
          isOpen={isFindSomeoneOpen}
          onClose={() => setIsFindSomeoneOpen(false)}
          onMatched={handleRandomMatched}
        />

        <AccessCodeModal
          isOpen={isAccessCodeOpen}
          initialMode={accessCodeMode}
          onClose={() => setIsAccessCodeOpen(false)}
          onRoomJoined={handleRoomJoined}
        />

        <ReportUserModal
          targetUser={reportingUser}
          isOpen={!!reportingUser}
          onClose={() => setReportingUser(null)}
        />
      </React.Suspense>

      <CoOwnerIntroModal />
      <GlobalYouTubeHost />
    </div>
  );
}

function AppContent() {
  const { user, isAuthenticated, isLoading, refreshSession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNavigatingToMain, setIsNavigatingToMain] = useState(false);

  // Diagnostic logging for render state
  useEffect(() => {
    console.log("[APP_CONTENT_DEBUG] RENDER_STATE", {
      pathname: location.pathname,
      isAuthenticated,
      userExists: !!user,
      onboardingCompleted: user?.onboardingCompleted,
      isNavigatingToMain,
      loading: isLoading
    });
  }, [location.pathname, isAuthenticated, user, isNavigatingToMain, isLoading]);

  if (isLoading && !isNavigatingToMain) {
    return <AuthLoadingScreen />;
  }

  // Direct Admin Login route
  if (location.pathname === '/admin/login') {
    if (isAuthenticated && user?.role === 'super_admin') {
      return <Navigate to="/admin" replace />;
    }
    return <LandingAuthPage initialShowAdminModal={true} />;
  }

  // Direct User Login route
  if (location.pathname === '/login') {
    if (isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    return <LandingAuthPage />;
  }

  // Unauthenticated users visiting any protected route
  if (!isAuthenticated) {
    return <LandingAuthPage />;
  }

  // Authenticated user requiring onboarding
  if (user && !user.onboardingCompleted && !isNavigatingToMain) {
    return (
      <div className="flex h-dvh min-h-0 w-screen overflow-hidden bg-slate-950 text-slate-100 relative">
        <MusicReactiveAurora />
        <OnboardingModal 
          isOpen={true} 
          onComplete={async () => {
            console.log("[ONBOARDING_DEBUG] NAVIGATION_START", "Navigating to main app");
            setIsNavigatingToMain(true);
            try {
              await refreshSession();
              const redirectRoute = (user?.role === 'admin' || user?.role === 'super_admin') ? '/admin' : '/';
              console.log("[ONBOARDING_DEBUG] NAVIGATION_COMPLETE", redirectRoute);
              navigate(redirectRoute);
            } catch (e) {
              console.error("[ONBOARDING_DEBUG] NAVIGATION_FAILED", e);
              setIsNavigatingToMain(false);
            }
          }}
        />
      </div>
    );
  }

  return <MainLayout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MusicProvider>
          <YouTubeProvider>
            <PublicSyncProvider>
              <ThemeProvider>
                <AppContent />
              </ThemeProvider>
            </PublicSyncProvider>
          </YouTubeProvider>
        </MusicProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
