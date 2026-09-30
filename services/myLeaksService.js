// services/myLeaksService.js
import { Alert } from 'react-native';

export function confirmDeletePlaylist({ name, onConfirm }) {
  if (!name) return;

  Alert.alert(
    'Delete playlist',
    `Are you sure you want to delete "${name}"? This will remove all clips in it.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onConfirm?.(name),
      },
    ]
  );
}

export function buildPlaylistNavParams(playlistName) {
  return { playlistName };
}

export function playlistKey(item, index) {
  return item?.name ?? String(index);
}

export function clipCountLabel(count = 0) {
  return `${count} clip${count === 1 ? '' : 's'}`;
}

// Thumbnails for the most recently added distinct sets in a playlist (newest first).
// mqdefault is 16:9 with no letterboxing, so it crops cleanly into square tiles.
export function playlistCoverThumbnails(clips = [], max = 4) {
  const sorted = [...clips].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  const videoIds = [];
  for (const clip of sorted) {
    if (clip?.videoId && !videoIds.includes(clip.videoId)) {
      videoIds.push(clip.videoId);
      if (videoIds.length === max) break;
    }
  }

  return videoIds.map((id) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`);
}
