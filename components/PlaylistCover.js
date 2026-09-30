import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Apple Music style cover: a 2x2 grid of the most recent distinct sets,
// a single full thumbnail when there's only one set, and a placeholder icon when empty.
// `size` is the height; pass `width` for a rectangular cover (defaults to square).
function PlaylistCover({ thumbnails = [], size = 64, width = size }) {
  const box = { width, height: size, borderRadius: size * 0.12 };

  if (thumbnails.length === 0) {
    return (
      <View style={[styles.cover, styles.placeholder, box]}>
        <Ionicons name="musical-notes" size={size * 0.45} color="#999" />
      </View>
    );
  }

  if (thumbnails.length === 1) {
    return (
      <View style={[styles.cover, box]}>
        <Image source={{ uri: thumbnails[0] }} style={styles.fill} />
      </View>
    );
  }

  // With 2-3 sets, repeat thumbnails to fill all 4 tiles (2 sets -> checkerboard A B / B A)
  const tiles =
    thumbnails.length === 2
      ? [thumbnails[0], thumbnails[1], thumbnails[1], thumbnails[0]]
      : [0, 1, 2, 3].map((i) => thumbnails[i % thumbnails.length]);

  return (
    <View style={[styles.cover, styles.grid, box]}>
      {tiles.map((uri, i) => (
        <Image key={i} source={{ uri }} style={{ width: width / 2, height: size / 2 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { overflow: 'hidden', backgroundColor: '#ddd' },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#e4e4e4' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  fill: { width: '100%', height: '100%' },
});

export default PlaylistCover;
