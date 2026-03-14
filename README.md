# hubble-youtube

A YouTube player widget for the Hubble home dashboard. Send a YouTube URL via API and the video expands to fullscreen overlay on the dashboard. When the video ends (or is stopped), the widget silently disappears.

---

## Setup

1. Add the widget to a dashboard page in the Hubble editor.
2. In the widget settings, configure:
   - **Title** — display name in the editor.
   - **Widget ID** — a unique slug used to target this widget via API (e.g. `kitchen-tv`). Must be unique if you place multiple YouTube widgets.
   - **Default Volume** — playback volume when a video starts (0–100, default 80).
3. Note your **Module ID** from the Hubble admin panel — you'll need it to construct API URLs.

---

## API Endpoints

All requests go to the Hubble API. Replace `{moduleId}` with your module's numeric ID from the admin panel.

### POST `/api/modules/{moduleId}/play`

Start playing a YouTube video. The widget expands to fullscreen immediately.

**Body**
```json
{
  "widgetId": "kitchen-tv",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Supported URL formats**
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`

**Response**
```json
{ "ok": true }
```
```json
{ "error": "Invalid YouTube URL" }
```

---

### POST `/api/modules/{moduleId}/pause`

Toggle pause/resume on the currently playing video.

**Body**
```json
{
  "widgetId": "kitchen-tv"
}
```

**Response**
```json
{ "ok": true }
```

---

### POST `/api/modules/{moduleId}/stop`

Stop the video and dismiss the fullscreen overlay.

**Body**
```json
{
  "widgetId": "kitchen-tv"
}
```

**Response**
```json
{ "ok": true }
```

---

## Behavior

| State | Dashboard | Editor canvas |
|---|---|---|
| Idle (no video) | Invisible | Occupies its grid cell |
| Playing | Fullscreen overlay | — |
| Paused | Fullscreen overlay | — |
| Video ends | Auto-dismisses to idle | — |

- The widget is **invisible** when idle — it takes up its grid cell but renders no visible content.
- `play` automatically expands the widget to full-page overlay on top of all other widgets.
- `pause` toggles between paused and playing without dismissing.
- `stop` (or video end) dismisses the overlay and returns the widget to idle.
- Volume is set at video start from the **Default Volume** property; the viewer can also adjust it via YouTube's native controls.

---

## Example: play from a shell script

```bash
MODULE_ID=42
WIDGET_ID=kitchen-tv

curl -X POST http://hubble.local/api/modules/$MODULE_ID/play \
  -H "Content-Type: application/json" \
  -d "{\"widgetId\": \"$WIDGET_ID\", \"url\": \"https://youtu.be/dQw4w9WgXcQ\"}"
```
