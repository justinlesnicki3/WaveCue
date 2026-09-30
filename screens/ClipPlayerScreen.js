import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../AppContext';

import {
  getCurrentClip,
  nextIndex,
  prevIndex,
  openClipInYouTube,
  findDjForSetTitle,
  clipDurationLabel,
  toSecondsMaybe,
} from '../services/clipPlayerService';

import { deleteClipFromPlaylist } from '../services/playlistService';

const BG = '#0e0e12';
const PLAY_RED = '#e62117';

function formatTime(value) {
  const sec = toSecondsMaybe(value);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const r = Math.floor(sec % 60);
  const ss = String(r).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

// -------------------- Component --------------------
export default function ClipPlayerScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { clips = [], startIndex = 0, playlistName } = route.params ?? {};

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const currentClip = getCurrentClip(clips, currentIndex);

  const { removeClipFromPlaylist } = useAppContext();

  const backButton = (
    <TouchableOpacity
      style={[styles.circleBtn, { top: insets.top + 8 }]}
      onPress={() => navigation.goBack()}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="chevron-back" size={22} color="#fff" />
    </TouchableOpacity>
  );

  if (!currentClip) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar style="light" />
        {backButton}
        <Text style={styles.emptyText}>No clip selected</Text>
      </View>
    );
  }

  const thumbnailUri = `https://img.youtube.com/vi/${currentClip.videoId}/hqdefault.jpg`;
  const dj = findDjForSetTitle(currentClip.djSetTitle);
  const backdrop = dj?.image ?? { uri: thumbnailUri };

  const startSec = toSecondsMaybe(currentClip.start);
  const endSec = toSecondsMaybe(currentClip.end);

  const isFirst = currentIndex === 0;
  const isLast = currentIndex >= clips.length - 1;

  const handlePlay = async () => {
    try {
      await openClipInYouTube(currentClip);
    } catch (e) {
      console.log('PLAY failed', e?.message ?? e);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ---------- Hero: DJ photo fading into the dark background ---------- */}
      <ImageBackground
        source={backdrop}
        style={[styles.hero, { height: height * 0.55 }]}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)', 'rgba(14,14,18,0.65)', BG]}
          locations={[0, 0.3, 0.72, 1]}
          style={StyleSheet.absoluteFill}
        />

        {clips.length > 1 && (
          <View style={[styles.positionPill, { top: insets.top + 12 }]}>
            <Text style={styles.positionText}>
              {currentIndex + 1} / {clips.length}
            </Text>
          </View>
        )}

        <View style={styles.heroText}>
          {dj && <Text style={styles.djName}>{dj.name}</Text>}
          <Text style={styles.title} numberOfLines={2}>
            {currentClip.title}
          </Text>
          {!!currentClip.djSetTitle && (
            <Text style={styles.setTitle} numberOfLines={2}>
              {currentClip.djSetTitle}
            </Text>
          )}

          <View style={styles.timePill}>
            <Ionicons name="time-outline" size={14} color="#fff" />
            <Text style={styles.timeText}>
              {formatTime(startSec)} – {formatTime(endSec)}
            </Text>
            <Text style={styles.timeDivider}>·</Text>
            <Text style={styles.timeText}>{clipDurationLabel(startSec, endSec)}</Text>
          </View>
        </View>
      </ImageBackground>

      {backButton}

      {/* ---------- Thumbnail + play ---------- */}
      <View style={styles.body}>
        <View style={styles.playRow}>
          <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} />

          <View style={styles.playInfo}>
            <Text style={styles.playLabel}>Play clip</Text>
            <Text style={styles.playSub}>Opens YouTube at {formatTime(startSec)}</Text>
          </View>

          <TouchableOpacity style={styles.playButton} onPress={handlePlay} activeOpacity={0.85}>
            <Ionicons name="play" size={30} color="#fff" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {!!playlistName && (
          <View style={styles.playlistRow}>
            <Ionicons name="list" size={16} color="#8a8a96" />
            <Text style={styles.playlistText} numberOfLines={1}>
              {playlistName}
            </Text>
          </View>
        )}

        {/* ---------- Previous / Delete / Next ---------- */}
        <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={styles.control}
            onPress={() => setCurrentIndex((i) => prevIndex(i))}
          >
            <View style={[styles.controlCircle, isFirst && styles.dimmed]}>
              <Ionicons name="play-skip-back" size={24} color="#fff" />
            </View>
            <Text style={styles.controlLabel}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.control}
            onPress={() =>
              deleteClipFromPlaylist({
                clip: currentClip,
                playlistName,
                removeClipFromPlaylist,
                navigation,
              })
            }
          >
            <View style={[styles.controlCircle, styles.deleteCircle]}>
              <Ionicons name="trash-outline" size={24} color="#ff5a52" />
            </View>
            <Text style={styles.controlLabel}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.control}
            onPress={() => setCurrentIndex((i) => nextIndex(i, clips.length))}
          >
            <View style={[styles.controlCircle, isLast && styles.dimmed]}>
              <Ionicons name="play-skip-forward" size={24} color="#fff" />
            </View>
            <Text style={styles.controlLabel}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// -------------------- Styles --------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  center: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#aaa', fontSize: 16 },

  circleBtn: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: { width: '100%', justifyContent: 'flex-end' },
  positionPill: {
    position: 'absolute',
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  positionText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  heroText: { paddingHorizontal: 20, paddingBottom: 8 },
  djName: {
    color: '#c9c9d4',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: { color: '#fff', fontSize: 30, fontWeight: '800' },
  setTitle: { color: '#b4b4be', fontSize: 15, marginTop: 4 },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  timeText: { color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 6 },
  timeDivider: { color: '#aaa', marginLeft: 6 },

  body: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },

  playRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#1b1b22',
  },
  thumbnail: { width: 112, height: 63, borderRadius: 8, backgroundColor: '#2a2a33' },
  playInfo: { flex: 1, marginHorizontal: 12 },
  playLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  playSub: { color: '#8a8a96', fontSize: 12, marginTop: 3 },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PLAY_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },

  playlistRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingHorizontal: 4 },
  playlistText: { color: '#8a8a96', fontSize: 13, marginLeft: 6, flex: 1 },

  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    marginTop: 'auto',
  },
  control: { alignItems: 'center', width: 80 },
  controlCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#23232b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCircle: { backgroundColor: 'rgba(255,90,82,0.12)' },
  dimmed: { opacity: 0.35 },
  controlLabel: { color: '#8a8a96', fontSize: 12, marginTop: 6 },
});
