import { Alert } from 'react-native';
import { openYouTubeAt } from '../utils/openYouTubeAt';
import { DJ_DATABASE } from '../djData';

// Clips only store the set title, so find the DJ whose name appears in it.
// Longest match wins so e.g. "Fred again.." isn't beaten by a shorter name inside it.
export function findDjForSetTitle(setTitle = '', database = DJ_DATABASE) {
  const title = (setTitle || '').toLowerCase();
  if (!title) return null;

  let best = null;
  for (const dj of database) {
    const name = (dj.name || '').toLowerCase();
    if (name && containsWord(title, name) && (!best || name.length > best.name.length)) {
      best = dj;
    }
  }
  return best;
}

// whole-word match, so "Discip" doesn't match inside "discipline"
function containsWord(text, word) {
  const isWordChar = (c) => !!c && /[a-z0-9]/.test(c);
  let i = text.indexOf(word);
  while (i !== -1) {
    if (!isWordChar(text[i - 1]) && !isWordChar(text[i + word.length])) return true;
    i = text.indexOf(word, i + 1);
  }
  return false;
}

export function clipDurationLabel(startSec = 0, endSec = 0) {
  const d = Math.max(0, Math.round(endSec - startSec));
  const m = Math.floor(d / 60);
  const s = d % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// supports numbers (seconds) OR "mm:ss" / "hh:mm:ss"
export function toSecondsMaybe(value) {
  if (value == null) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const s = String(value).trim();
  if (/^\d+$/.test(s)) return Number(s);

  const parts = s.split(':').map(Number);
  if (parts.some(Number.isNaN)) return 0;

  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

export function getCurrentClip(clips = [], currentIndex = 0) {
  return clips?.[currentIndex] ?? null;
}

export function nextIndex(currentIndex, clipsLength) {
  if (currentIndex < clipsLength - 1) return currentIndex + 1;
  Alert.alert('End of Playlist', 'No more clips to play.');
  return currentIndex;
}

export function prevIndex(currentIndex) {
  if (currentIndex > 0) return currentIndex - 1;
  Alert.alert('Start of Playlist', 'You are at the first clip.');
  return currentIndex;
}

export async function openClipInYouTube(clip) {
  if (!clip?.videoId) {
    Alert.alert('Missing video', 'This clip has no videoId.');
    return;
  }

  const startSeconds = toSecondsMaybe(clip.start);

  try {
    await openYouTubeAt({ videoId: clip.videoId, start: startSeconds });
  } catch (e) {
    Alert.alert('Could not open YouTube', e?.message ?? String(e));
    throw e;
  }
}
