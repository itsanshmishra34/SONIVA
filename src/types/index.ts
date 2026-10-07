export type UserRole = 'super_admin' | 'admin' | 'co_owner' | 'user';

export interface User {
  id: string;
  email: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  phoneVerified?: boolean;
  phoneMasked?: string;
  accountStatus?: 'pending_email_verification' | 'pending_phone_verification' | 'verified';
  username: string;
  displayName: string;
  gender?: 'Male' | 'Female' | 'Non-binary' | 'Custom' | 'Prefer not to say';
  customGender?: string;
  pronouns?: 'He/Him' | 'She/Her' | 'They/Them' | 'Custom' | 'Prefer not to say';
  customPronouns?: string;
  bio?: string;
  dateOfBirth?: string;
  birthYear: number;
  languages?: string[];
  musicInterests: string[];
  favoriteGenres?: string[];
  favoriteArtists?: string[];
  vibes?: string[];
  profileVisibility?: 'Everyone' | 'Connections only' | 'Private';
  fieldVisibility?: Record<string, 'Everyone' | 'Connections only' | 'Nobody'>;
  onlineStatusVisibility?: boolean;
  lastSeenVisibility?: boolean;
  locationVisibility?: 'Off' | 'Approximate';
  showNowPlaying?: 'Everyone' | 'Connections' | 'Nobody';
  isAgeEligible?: boolean;
  onboardingCompleted?: boolean;
  role: UserRole;
  createdAt: string;
  isOnline: boolean;
  currentSong?: {
    id: string;
    title: string;
    artist: string;
    artwork?: string;
  } | null;
  notificationSettings?: {
    newMessages: boolean;
    reactions: boolean;
    randomConnect: boolean;
    listenTogether: boolean;
    singTogether: boolean;
    voiceCall: boolean;
    friendActivity: boolean;
    productUpdates: boolean;
    featureAnnouncements: boolean;
  };
  playbackSettings?: {
    autoplay: boolean;
    resumePlayback: boolean;
    crossfade: boolean;
  };
  status: 'active' | 'suspended' | 'banned';
  publicKey?: string;
}

export type MusicProviderType = 'audius' | 'soundcloud' | 'youtube' | 'local';

export type NormalizedTrack = {
  id: string;
  provider: 'audius' | 'youtube' | 'soundcloud';
  providerTrackId: string;

  title: string;
  artist: string;
  artwork?: string | null;

  streamUrl?: string | null;
  duration?: number | null;
  genre?: string | null;

  isStreamable: boolean;

  playbackType:
    | 'native_audio'
    | 'youtube_embed';

  videoId?: string | null;
};

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  artwork: string;
  artworkUrl?: string;
  streamUrl?: string | null;
  duration: number;
  durationMs?: number;
  genre: string;
  playable?: boolean;
  playbackType?: 'native_audio' | 'youtube_embed';
  isFavorite?: boolean;
  isStreamable?: boolean;
  streamConditions?: any;
  provider?: MusicProviderType;
  providerId?: string;
  providerTrackId?: string;
  youtubeVideoId?: string | null;
  videoId?: string | null;
  soundcloudTrackId?: string | null;
  externalUrl?: string;
  providerUrl?: string;
  attributionName?: string;
  attributionUrl?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  ciphertext?: string;
  iv?: string;
  decryptedText?: string;
  messageType: 'text' | 'song_card' | 'voice_memo' | 'action';
  metadata?: {
    track?: Track;
    voiceDuration?: number;
    actionType?: string;
  };
  timestamp: number;
  reactions: { emoji: string; userId: string }[];
  isPending?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  readAt?: number;
}

export interface Conversation {
  id: string;
  roomId: string;
  participant: User;
  lastMessage?: string;
  lastTimestamp?: number;
  unreadCount: number;
  isE2EE: boolean;
  compatibilityScore: number;
  themeId?: string;
  isPartnerTyping?: boolean;
}

export interface AccessCodeRoom {
  code: string;
  roomId: string;
  hostId: string;
  expiresAt: number;
  mode: 'private_chat' | 'listen_together' | 'sing_together';
  participants: string[];
}

export interface ListenSessionState {
  sessionId: string;
  track: Track;
  isPlaying: boolean;
  currentTime: number;
  hostId: string;
  participants: string[];
}

export interface ListenTogetherHistoryItem {
  id: string;
  track: Track;
  playedAt: number;
  sessionId?: string;
  partnerName?: string;
}

export interface SingSessionState {
  sessionId: string;
  track: Track;
  musicVolume: number;
  selfMicVolume: number;
  partnerMicVolume: number;
  isCameraActive: boolean;
  cameraFilter: 'none' | 'studio-warm' | 'dreamy-cool' | 'velvet-retro' | 'cyber-glow';
  isRingLightOn: boolean;
  isMirrorOn: boolean;
}

export type WebSearchResult = {
  type: "web";
  title: string;
  url: string;
  displayUrl?: string;
  snippet?: string;
  source: "google";
};

export type ThemeMode = 'aurora-night' | 'sunset-lounge' | 'pure-black';

export interface FeatureFlags {
  randomConnect: boolean;
  voiceCalls: boolean;
  singTogether: boolean;
  groupChat: boolean;
  voiceMessages: boolean;
  audiusStreaming: boolean;
}
