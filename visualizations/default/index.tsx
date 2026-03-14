import { useEffect, useRef, useState } from 'react';
import { useConnectorData, useWidgetConfig, useHubbleSDK } from '@hubble/sdk';
import './style.css';

interface YTPlayer {
  loadVideoById(videoId: string): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  destroy(): void;
  getPlayerState(): number;
  setVolume(volume: number): void;
}

interface YTPlayerOptions {
  videoId?: string;
  playerVars?: Record<string, number | string>;
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onStateChange?: (event: { data: number }) => void;
  };
}

declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, options: YTPlayerOptions) => YTPlayer;
      PlayerState: { ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface Command {
  action: 'play' | 'pause' | 'stop';
  videoId?: string;
  targetWidgetId: string;
}

interface Config {
  widgetId: string;
  defaultVolume?: number;
  playMode?: 'fullscreen' | 'inline';
}

interface PlayerState {
  videoId: string | null;
  status: 'idle' | 'playing' | 'paused';
}

const HubbleYoutubeViz = () => {
  const command = useConnectorData<Command>();
  const config = useWidgetConfig<Config>();
  const [state, setState] = useState<PlayerState>({ videoId: null, status: 'idle' });
  const sdk = useHubbleSDK();
  const playerRef = useRef<YTPlayer | null>(null);
  const isExpandedRef = useRef(false);

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (window.YT) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }, []);

  // Destroy player on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  // Initialize or reload player when videoId changes
  useEffect(() => {
    if (!state.videoId) return;

    const volume = config.defaultVolume ?? 80;
    const playerId = `yt-player-${config.widgetId}`;

    const doInit = () => {
      if (playerRef.current) {
        playerRef.current.loadVideoById(state.videoId!);
        return;
      }
      playerRef.current = new window.YT.Player(playerId, {
        videoId: state.videoId!,
        playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: (e) => e.target.setVolume(volume),
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              setState({ videoId: null, status: 'idle' });
              if (isExpandedRef.current) {
                sdk.dismissWidget();
                isExpandedRef.current = false;
              }
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      doInit();
    } else {
      window.onYouTubeIframeAPIReady = doInit;
    }
  }, [state.videoId]); // eslint-disable-line react-hooks/exhaustive-deps

  // React to connector commands
  useEffect(() => {
    if (!command || command.targetWidgetId !== config.widgetId) return;

    switch (command.action) {
      case 'play':
        if (command.videoId) {
          setState({ videoId: command.videoId, status: 'playing' });
          if (config.playMode !== 'inline') {
            sdk.expandWidget();
            isExpandedRef.current = true;
          }
        }
        break;
      case 'pause':
        if (playerRef.current && window.YT?.PlayerState) {
          const ps = playerRef.current.getPlayerState();
          if (ps === window.YT.PlayerState.PLAYING) {
            playerRef.current.pauseVideo();
            setState(prev => ({ ...prev, status: 'paused' }));
          } else if (ps === window.YT.PlayerState.PAUSED) {
            playerRef.current.playVideo();
            setState(prev => ({ ...prev, status: 'playing' }));
          }
        }
        break;
      case 'stop':
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }
        setState({ videoId: null, status: 'idle' });
        if (isExpandedRef.current) {
          sdk.dismissWidget();
          isExpandedRef.current = false;
        }
        break;
    }
  }, [command]); // eslint-disable-line react-hooks/exhaustive-deps

  const playerId = `yt-player-${config.widgetId}`;

  if (state.status === 'idle') {
    return <div className="hy-idle" />;
  }

  return (
    <div className="hy-player-container">
      <div id={playerId} className="hy-player" />
    </div>
  );
};

export default HubbleYoutubeViz;
