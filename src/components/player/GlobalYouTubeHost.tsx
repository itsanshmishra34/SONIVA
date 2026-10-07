import React, { useEffect } from 'react';
import { youtubePlayerManager } from '../../services/youtubePlayerManager';

/**
 * GlobalYouTubeHost mounts the persistent hidden container for the singleton
 * official YouTube IFrame Player API. This ensures the player is never destroyed
 * or recreated when navigating views or opening/closing modals.
 */
export const GlobalYouTubeHost: React.FC = () => {
  useEffect(() => {
    youtubePlayerManager.initPlayer('global-youtube-player').catch((err) => {
      console.warn('[GLOBAL_YOUTUBE_HOST_INIT_NOTICE]', err);
    });
  }, []);

  return (
    <div
      id="global-youtube-player-host"
      className="fixed pointer-events-none opacity-0 invisible"
      style={{ left: '-9999px', top: '-9999px', width: '320px', height: '180px' }}
      aria-hidden="true"
    >
      <div id="global-youtube-player" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
