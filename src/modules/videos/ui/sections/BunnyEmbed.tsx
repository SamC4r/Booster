// components/BunnyEmbed.tsx
'use client'
import { useEffect, useRef, } from 'react';

declare global {
  interface Window {
    playerjs: any;
  }
}

export function BunnyEmbed({
  libraryId,
  videoId,
  autoplay = false,
  muted = false,
  token,
  expires,
  onVideoEnd,
  onVideoPlay,
  onVideoPause,
  onVideoReady,
}: {
  libraryId: string | null;
  videoId: string | null;
  autoplay?: boolean;
  muted?: boolean;
  token?: string;
  expires?: number;
  onVideoEnd?: () => void;
  onVideoPlay?: () => void;
  onVideoPause?: () => void;
  onVideoReady?: (duration: number) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);

  const params = new URLSearchParams({ 
    autoplay: String(autoplay), 
    muted: String(muted) 
  });
  
  if (token && expires && autoplay) { 
    params.set("token", token); 
    params.set("expires", String(expires)); 
    params.set('autoplay', String(autoplay));
  }
  
  params.set('loading', 'lazy');
  params.set('loop', 'false');

  const src = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?${params}`;

  useEffect(() => {
    if (!iframeRef.current) return;

    const initializePlayer = () => {
      try {
        // Initialize Player.js
        const player = new window.playerjs.Player(iframeRef.current);
        playerRef.current = player;

        player.on('ready', () => {
          console.log('Player.js: Player is ready');

          // Get video duration
          // player.getDuration((duration: number) => {
          //   console.log('Video duration:', duration);
          //   onVideoReady?.(duration);
          // });

          // Set up event listeners
          player.on('play', () => {
            console.log('Player.js: Video started playing');
            onVideoPlay?.();
          });

          player.on('pause', () => {
            console.log('Player.js: Video paused');
            onVideoPause?.();
          });

          player.on('ended', () => {
            console.log('Player.js: Video ended');
            onVideoEnd?.();
          });

          player.on('error', (error: any) => {
            console.error('Player.js: Error occurred', error);
          });

          // player.on('timeupdate', (data: any) => {
          //   // Optional: Track progress
          //   // console.log('Current time:', data.currentTime);
          // });

          // Apply initial settings
          if (player.supports('method', 'mute') && muted) {
            player.mute();
          }

          if (player.supports('method', 'play') && autoplay) {
            player.play();
          }
        });

        player.on('error', (error: any) => {
          console.error('Player.js: Failed to initialize', error);
        });

      } catch (error) {
        console.error('Player.js initialization error:', error);
      }
    };

    // Check if Player.js is available
    if (window.playerjs) {
      initializePlayer();
    } else {
      // Load Player.js script if not available
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/player.js@latest/dist/player.min.js';
      script.onload = initializePlayer;
      script.onerror = () => console.error('Failed to load Player.js');
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup
      if (playerRef.current) {
        try {
          playerRef.current.off('ready');
          playerRef.current.off('play');
          playerRef.current.off('pause');
          playerRef.current.off('ended');
          playerRef.current.off('error');
          playerRef.current.off('timeupdate');
        } catch (error) {
          console.error('Error cleaning up player:', error);
        }
      }
    };
  }, [libraryId, videoId, autoplay, muted]); // Removed callback dependencies to prevent re-initialization

  // // Methods to control the player
  // const play = () => {
  //   if (playerRef.current && playerRef.current.supports('method', 'play')) {
  //     playerRef.current.play();
  //   }
  // };

  // const pause = () => {
  //   if (playerRef.current && playerRef.current.supports('method', 'pause')) {
  //     playerRef.current.pause();
  //   }
  // };

  // const seek = (time: number) => {
  //   if (playerRef.current && playerRef.current.supports('method', 'seek')) {
  //     playerRef.current.seek(time);
  //   }
  // };

  // const setVolume = (volume: number) => {
  //   if (playerRef.current && playerRef.current.supports('method', 'setVolume')) {
  //     playerRef.current.setVolume(volume);
  //   }
  // };

  // const mute = () => {
  //   if (playerRef.current && playerRef.current.supports('method', 'mute')) {
  //     playerRef.current.mute();
  //   }
  // };

  // const unmute = () => {
  //   if (playerRef.current && playerRef.current.supports('method', 'unmute')) {
  //     playerRef.current.unmute();
  //   }
  // };

  return (
    <div className="w-full" style={{ paddingTop: '56.25%', background: 'black'}}>
      <iframe
        ref={iframeRef}
        src={src}
        style={{ 
          border: 0, 
          position: "absolute", 
          top: 0, 
          left: 0, 
          width: "100%", 
          height: "100%" 
        }}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
        loading="lazy"
        className="h-full w-full"
      />
      {/* {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <Spinner />
        </div>
      )} */}
    </div>
  );
}