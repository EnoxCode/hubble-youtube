import { type HubbleConnector, type ServerSdk } from '../hubble-sdk';

const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function extractVideoId(url: string): string | null {
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

const connector: HubbleConnector = (sdk: ServerSdk) => {
  sdk.onApiCall(async ({ action, body }) => {
    const { widgetId, url } = body as { widgetId?: string; url?: string };

    if (!widgetId) return { error: 'widgetId is required' };

    switch (action) {
      case 'play': {
        if (!url) return { error: 'url is required' };
        const videoId = extractVideoId(url);
        if (!videoId) return { error: 'Invalid YouTube URL' };
        sdk.emit('hubble-youtube:data', { action: 'play', videoId, targetWidgetId: widgetId });
        return { ok: true };
      }
      case 'pause':
        sdk.emit('hubble-youtube:data', { action: 'pause', targetWidgetId: widgetId });
        return { ok: true };
      case 'stop':
        sdk.emit('hubble-youtube:data', { action: 'stop', targetWidgetId: widgetId });
        return { ok: true };
      default:
        return { error: `Unknown action: ${action}` };
    }
  });
};

export default connector;
