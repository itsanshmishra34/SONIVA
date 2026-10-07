import React, { createContext, useContext, useState, useCallback } from 'react';
import { Track } from '../types';

interface YouTubeContextType {
  activeYouTubeTrack: Track | null;
  isYouTubePlayerOpen: boolean;
  openYouTubePlayer: (track: Track) => void;
  closeYouTubePlayer: () => void;
  searchYouTube: (query: string) => Promise<Track[]>;
  searchResults: Track[];
}

const YouTubeContext = createContext<YouTubeContextType | undefined>(undefined);

export const YouTubeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeYouTubeTrack, setActiveYouTubeTrack] = useState<Track | null>(null);
  const [isYouTubePlayerOpen, setIsYouTubePlayerOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Track[]>([]);

  const openYouTubePlayer = useCallback((track: Track) => {
    setActiveYouTubeTrack(track);
    setIsYouTubePlayerOpen(true);
  }, []);

  const closeYouTubePlayer = useCallback(() => {
    setActiveYouTubeTrack(null);
    setIsYouTubePlayerOpen(false);
  }, []);

  const searchYouTube = useCallback(async (query: string): Promise<Track[]> => {
    // Check if API key is configured (on the server-side proxy)
    // Note: VITE_ variables are for client-side, but the backend requires YOUTUBE_API_KEY
    // The existence of the proxy route implies configuration. 
    // We add a basic guard here if we want to check client-side availability of an indicator.
    console.log('[YOUTUBE_CONTEXT_SEARCH_START]', { query });
    try {
      const url = `/api/youtube/search?q=${encodeURIComponent(query)}`;
      console.log('[YOUTUBE_CONTEXT_API_REQUEST]', { url });
      
      const response = await fetch(url);
      console.log('[YOUTUBE_CONTEXT_API_RESPONSE_STATUS]', response.status);
      
      const data = await response.json();
      console.log('[YOUTUBE_CONTEXT_API_RESPONSE_DATA]', data);

      if (data.ok && data.tracks) {
        console.log('[YOUTUBE_CONTEXT_NORMALIZATION_SUCCESS]', data.tracks.length);
        setSearchResults(data.tracks);
        return data.tracks;
      }
      
      // Surface specific backend error messages
      const errorMessage = data.message || data.error || 'Unknown YouTube search error';
      console.warn('[YOUTUBE_CONTEXT_ERROR]', errorMessage);
      // We could add setErrorMessage(errorMessage) if such state exists in this context
      return [];
    } catch (error) {
      console.error('[YOUTUBE_CONTEXT_SEARCH_ERROR]', error);
      return [];
    }
  }, []);

  return (
    <YouTubeContext.Provider
      value={{
        activeYouTubeTrack,
        isYouTubePlayerOpen,
        openYouTubePlayer,
        closeYouTubePlayer,
        searchYouTube,
        searchResults
      }}
    >
      {children}
    </YouTubeContext.Provider>
  );
};

export const useYouTube = () => {
  const context = useContext(YouTubeContext);
  if (!context) throw new Error('useYouTube must be used within a YouTubeProvider');
  return context;
};
