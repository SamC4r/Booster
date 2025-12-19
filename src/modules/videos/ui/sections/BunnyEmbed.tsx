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
    autoplay = true,
    muted = false,
    token,
    expires,
    onVideoEnd,
    onVideoPlay,
    onVideoPause,
    onTimeUpdate,
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
    onTimeUpdate?: (data: { seconds: number, duration: number, percent: number }) => void;
}) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const playerRef = useRef<any>(null);

    const onVideoEndRef = useRef(onVideoEnd);
    const onVideoPlayRef = useRef(onVideoPlay);
    const onVideoPauseRef = useRef(onVideoPause);
    const onTimeUpdateRef = useRef(onTimeUpdate);

    useEffect(() => {
        onVideoEndRef.current = onVideoEnd;
        onVideoPlayRef.current = onVideoPlay;
        onVideoPauseRef.current = onVideoPause;
        onTimeUpdateRef.current = onTimeUpdate;
    }, [onVideoEnd, onVideoPlay, onVideoPause, onTimeUpdate]);

    const params = new URLSearchParams({
        autoplay: String(autoplay),
        muted: String(muted)
    });

    if (token && expires) {
        params.set("token", token);
        params.set("expires", String(expires));
    }

    params.set('loading', 'lazy');
    params.set('loop', 'false');
    params.set('includeRum', 'false');

    const src = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?${params}`;

    if (!libraryId || !videoId) {
        return <div className="w-full bg-black flex items-center justify-center text-white" style={{ paddingTop: '56.25%' }}>Video Unavailable</div>;
    }

    useEffect(() => {
        if (!iframeRef.current) return;

        const initializePlayer = () => {
            try {
                // Initialize Player.js
                const player = new window.playerjs.Player(iframeRef.current);
                playerRef.current = player;

                player.on('ready', () => {

                    // Get video duration
                    // player.getDuration((duration: number) => {
                    //   console.log('Video duration:', duration);
                    //   onVideoReady?.(duration);
                    // });

                    // Set up event listeners
                    player.on('play', () => {
                        onVideoPlayRef.current?.();
                    });

                    player.on('pause', () => {
                        onVideoPauseRef.current?.();
                    });

                    player.on('ended', () => {
                        onVideoEndRef.current?.();
                    });


                    player.on('timeupdate', (data: any) => {
                        // Optional: Track progress
                        // console.log('Current time:', data);
                        onTimeUpdateRef.current?.(data);
                    });

                    // Apply initial settings
                    if (player.supports('method', 'mute') && muted) {
                        player.mute();
                    }

                    if (player.supports('method', 'play') && autoplay) {
                        player.play();
                    }
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
                    // Check if iframe still exists and has a valid contentWindow
                    const iframe = iframeRef.current;
                    if (iframe && iframe.contentWindow) {
                        playerRef.current.off('ready');
                        playerRef.current.off('play');
                        playerRef.current.off('pause');
                        playerRef.current.off('ended');
                        playerRef.current.off('error');
                        playerRef.current.off('timeupdate');
                    }
                } catch (error) {
                    // Silently ignore cleanup errors as component is unmounting
                    console.debug('Player cleanup skipped:', error);
                }
            }
        };
    }, [libraryId, videoId, autoplay, muted]);

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
        <div className="w-full" style={{ paddingTop: '56.25%', background: 'black' }}>
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
