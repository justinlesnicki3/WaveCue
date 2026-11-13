import { Linking } from 'react-native';
import { YOUTUBE_LINK_STYLE } from '../config/playback';

/**
 * Preferred usage:
 *   openYouTubeAt({ videoId: "abc123", start: 85 })
 *
 * Backwards-compatible usage:
 *   openYouTubeVideo("abc123")              // start defaults to 0
 *   openYouTubeVideo("abc123", 85)
 */

// Backwards-compatible wrapper (so old code keeps working)
export async function openYouTubeVideo(videoId, start = 0) {
  return openYouTubeAt({ videoId, start });
}

export async function openYouTubeAt({ videoId, start = 0 }) {
  if (!videoId) throw new Error('Missing videoId');

  const t = Math.max(0, Math.floor(Number(start) || 0));
  const id = encodeURIComponent(videoId);

  // Standard web link: opens the YouTube app when installed, otherwise the browser
  const webUrl = `https://www.youtube.com/watch?v=${id}&t=${t}s`;

  // 'web' link style ("plan A", see config/playback.js): skip the app scheme entirely
  if (YOUTUBE_LINK_STYLE === 'web') {
    await Linking.openURL(webUrl);
    return;
  }

  // vnd.youtube scheme works on both iOS and Android
  const appUrl = `vnd.youtube://${id}?t=${t}`;

  // Try app first
  const canOpenApp = await Linking.canOpenURL(appUrl);
  if (canOpenApp) {
    await Linking.openURL(appUrl);
    return;
  }

  // Fallback to web
  const canOpenWeb = await Linking.canOpenURL(webUrl);
  if (!canOpenWeb) throw new Error('No app can open YouTube links on this device.');
  await Linking.openURL(webUrl);
}
