// services/clipService.js

export function validateClipInputs({ start, end, clipTitle }) {
  if (!start || !end || !clipTitle?.trim()) {
    return { ok: false, message: 'Please enter a title, start time, and end time' };
  }
  return { ok: true };
}

export function buildLeak({ videoId, start, end, clipTitle, djSetTitle }) {
  return {
    // local-only id (not DB id)
    id: `${videoId}-${start}-${end}`,
    title: clipTitle.trim(),
    djSetTitle,
    videoId,
    start,
    end,
  };
}

/**
 * IMPORTANT:
 * - If a playlistName is provided, ONLY call addClipToPlaylist (so playlist_id gets set).
 * - Otherwise call addLeak (playlist_id = null).
 * - Await the async calls so the save actually finishes before you navigate away.
 */
export async function saveLeakFlow({
  leak,
  playlistName,
  addLeak,
  addClipToPlaylist,
}) {
  if (playlistName) {
    await addClipToPlaylist(playlistName, leak);
    return { ok: true, playlistName };
  }

  await addLeak(leak);
  return { ok: true, playlistName: '' };
}
