import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { useConnectorData, useWidgetConfig, useHubbleSDK } from '@hubble/sdk';
import HubbleYoutubeViz from '../../visualizations/default/index';

vi.mock('@hubble/sdk', () => ({
  useConnectorData: vi.fn(() => null),
  useWidgetConfig: vi.fn(() => ({ widgetId: 'test-widget', defaultVolume: 80, playMode: 'fullscreen' })),
  useHubbleSDK: vi.fn(() => ({
    expandWidget: vi.fn(),
    dismissWidget: vi.fn(),
    onButton: vi.fn(() => vi.fn()),
  })),
}));

const mockUseConnectorData = vi.mocked(useConnectorData);
const mockUseHubbleSDK = vi.mocked(useHubbleSDK);

beforeEach(() => {
  vi.clearAllMocks();
  mockUseConnectorData.mockReturnValue(null);
  mockUseHubbleSDK.mockReturnValue({
    expandWidget: vi.fn(),
    dismissWidget: vi.fn(),
    onButton: vi.fn(() => vi.fn()),
  } as never);
  vi.mocked(useWidgetConfig).mockReturnValue({ widgetId: 'test-widget', defaultVolume: 80, playMode: 'fullscreen' });
});

describe('HubbleYoutubeViz', () => {
  describe('idle state', () => {
    it('renders the idle spacer on initial mount', () => {
      render(<HubbleYoutubeViz />);
      expect(document.querySelector('.hy-idle')).not.toBeNull();
    });

    it('does not render the player container when idle', () => {
      render(<HubbleYoutubeViz />);
      expect(document.querySelector('.hy-player-container')).toBeNull();
    });
  });

  describe('playing state', () => {
    beforeEach(() => {
      mockUseConnectorData.mockReturnValue({
        action: 'play',
        videoId: 'dQw4w9WgXcQ',
        targetWidgetId: 'test-widget',
      });
    });

    it('renders the player container when a play command is received', () => {
      render(<HubbleYoutubeViz />);
      expect(document.querySelector('.hy-player-container')).not.toBeNull();
    });

    it('does not render the idle spacer when playing', () => {
      render(<HubbleYoutubeViz />);
      expect(document.querySelector('.hy-idle')).toBeNull();
    });

    it('sets a widgetId-scoped id on the player div', () => {
      render(<HubbleYoutubeViz />);
      expect(document.getElementById('yt-player-test-widget')).not.toBeNull();
    });
  });

  describe('command handling', () => {
    it('ignores commands targeted at a different widgetId', () => {
      const expandWidget = vi.fn();
      mockUseHubbleSDK.mockReturnValue({ expandWidget, dismissWidget: vi.fn(), onButton: vi.fn(() => vi.fn()) } as never);
      mockUseConnectorData.mockReturnValue({
        action: 'play',
        videoId: 'dQw4w9WgXcQ',
        targetWidgetId: 'other-widget',
      });

      render(<HubbleYoutubeViz />);

      expect(expandWidget).not.toHaveBeenCalled();
      expect(document.querySelector('.hy-player-container')).toBeNull();
    });

    it('calls expandWidget on play in fullscreen mode', () => {
      const expandWidget = vi.fn();
      mockUseHubbleSDK.mockReturnValue({ expandWidget, dismissWidget: vi.fn(), onButton: vi.fn(() => vi.fn()) } as never);
      vi.mocked(useWidgetConfig).mockReturnValue({ widgetId: 'test-widget', defaultVolume: 80, playMode: 'fullscreen' });
      mockUseConnectorData.mockReturnValue({ action: 'play', videoId: 'dQw4w9WgXcQ', targetWidgetId: 'test-widget' });

      render(<HubbleYoutubeViz />);

      expect(expandWidget).toHaveBeenCalled();
    });

    it('does not call expandWidget on play in inline mode', () => {
      const expandWidget = vi.fn();
      mockUseHubbleSDK.mockReturnValue({ expandWidget, dismissWidget: vi.fn(), onButton: vi.fn(() => vi.fn()) } as never);
      vi.mocked(useWidgetConfig).mockReturnValue({ widgetId: 'test-widget', defaultVolume: 80, playMode: 'inline' });
      mockUseConnectorData.mockReturnValue({ action: 'play', videoId: 'dQw4w9WgXcQ', targetWidgetId: 'test-widget' });

      render(<HubbleYoutubeViz />);

      expect(expandWidget).not.toHaveBeenCalled();
    });

    it('calls dismissWidget on stop after a fullscreen play', () => {
      const expandWidget = vi.fn();
      const dismissWidget = vi.fn();
      mockUseHubbleSDK.mockReturnValue({ expandWidget, dismissWidget, onButton: vi.fn(() => vi.fn()) } as never);
      vi.mocked(useWidgetConfig).mockReturnValue({ widgetId: 'test-widget', defaultVolume: 80, playMode: 'fullscreen' });

      mockUseConnectorData.mockReturnValue({ action: 'play', videoId: 'dQw4w9WgXcQ', targetWidgetId: 'test-widget' });
      const { rerender } = render(<HubbleYoutubeViz />);
      expect(expandWidget).toHaveBeenCalled();

      mockUseConnectorData.mockReturnValue({ action: 'stop', targetWidgetId: 'test-widget' });
      rerender(<HubbleYoutubeViz />);

      expect(dismissWidget).toHaveBeenCalled();
      expect(document.querySelector('.hy-idle')).not.toBeNull();
    });

    it('does not call dismissWidget on stop after an inline play', () => {
      const dismissWidget = vi.fn();
      mockUseHubbleSDK.mockReturnValue({ expandWidget: vi.fn(), dismissWidget, onButton: vi.fn(() => vi.fn()) } as never);
      vi.mocked(useWidgetConfig).mockReturnValue({ widgetId: 'test-widget', defaultVolume: 80, playMode: 'inline' });

      mockUseConnectorData.mockReturnValue({ action: 'play', videoId: 'dQw4w9WgXcQ', targetWidgetId: 'test-widget' });
      const { rerender } = render(<HubbleYoutubeViz />);

      mockUseConnectorData.mockReturnValue({ action: 'stop', targetWidgetId: 'test-widget' });
      rerender(<HubbleYoutubeViz />);

      expect(dismissWidget).not.toHaveBeenCalled();
      expect(document.querySelector('.hy-idle')).not.toBeNull();
    });
  });
});
