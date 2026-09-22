import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../AppContext';
import { SafeAreaView } from 'react-native-safe-area-context'

import {
  getCurrentClip,
  nextIndex,
  prevIndex,
  openClipInYouTube,
} from '../services/clipPlayerService';

import { deleteClipFromPlaylist } from '../services/playlistService';


// -------------------- Time Helpers --------------------
function toSecondsMaybe(value) {
  if (value == null) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const s = String(value).trim();

  // "120"
  if (/^\d+$/.test(s)) return Number(s);

  // "mm:ss" or "hh:mm:ss"
  const parts = s.split(':').map(Number);
  if (parts.some(Number.isNaN)) return 0;

  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];

  return 0;
}

function formatTime(value) {
  const sec = toSecondsMaybe(value);
  const m = Math.floor(sec / 60);
  const r = Math.floor(sec % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}


// -------------------- Component --------------------
export default function ClipPlayerScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { clips = [], startIndex = 0, playlistName } = route.params ?? {};

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const currentClip = getCurrentClip(clips, currentIndex);

  const { removeClipFromPlaylist } = useAppContext();

  if (!currentClip) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={26} color="#111" />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>No clip selected</Text>
      </SafeAreaView>
    );
}
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={26} color="#111" />
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>{currentClip.title}</Text>
      <Text style={styles.djSetTitle}>From: {currentClip.djSetTitle}</Text>

      <Text style={styles.timestamp}>
        {formatTime(currentClip.start)} - {formatTime(currentClip.end)}
      </Text>

      <View style={styles.playerWrapper}>
        <Image
          source={{ uri: `https://img.youtube.com/vi/${currentClip.videoId}/hqdefault.jpg` }}
          style={styles.thumbnail}
        />

        <TouchableOpacity
          style={styles.playButton}
          onPress={async () => {
            console.log('PLAY pressed', currentClip?.videoId, currentClip?.start);
            try {
              await openClipInYouTube(currentClip);
              console.log('PLAY success');
            } catch (e) {
              console.log('PLAY failed', e?.message ?? e);
            }
          }}
        >
          <Text style={styles.playButtonText}>▶️ Play in YouTube</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setCurrentIndex((i) => prevIndex(i))}
        >
          <Text style={styles.buttonText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#d9534f' }]}
          onPress={() =>
            deleteClipFromPlaylist({
              clip: currentClip,
              playlistName,
              removeClipFromPlaylist,
              navigation,
            })
          }
        >
          <Text style={styles.buttonText}>Delete Clip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setCurrentIndex((i) => nextIndex(i, clips.length))}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


// -------------------- Styles --------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 20 },
  headerRow: { marginBottom: 4 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginVertical: 8 },
  djSetTitle: { textAlign: 'center', fontSize: 14, color: '#666' },
  timestamp: { textAlign: 'center', fontSize: 14, marginBottom: 16, color: '#444' },
  playerWrapper: { alignItems: 'center', marginBottom: 30 },
  thumbnail: { width: 240, height: 135, borderRadius: 12 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  button: { backgroundColor: '#33498e', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  playButton: { marginTop: 15, backgroundColor: '#e62117', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  playButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
