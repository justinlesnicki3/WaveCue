import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  LayoutAnimation,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { CLIP_PLAYBACK } from '../config/playback';
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

// YouTube requires embedded players to be at least 200 x 200
const MIN_PLAYER_SIZE = 200;
const END_CHECK_MS = 400; // how often we check whether the clip's end time was reached

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
  const { width, height } = useWindowDimensions();
  const { clips = [], startIndex = 0, playlistName } = route.params ?? {};

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const currentClip = getCurrentClip(clips, currentIndex);

  const { removeClipFromPlaylist } = useAppContext();

  // In-app YouTube player state
  const playerRef = useRef(null);
  const [playerOpen, setPlayerOpen] = useState(false); // card has turned into the player
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false); // reached the clip's end time
  const [playerError, setPlayerError] = useState(null); // e.g. 'embed_not_allowed'

  const startSec = toSecondsMaybe(currentClip?.start);
  const endSec = toSecondsMaybe(currentClip?.end);

  // Switching clips: keep the player open (and auto-play) if it was already open
  useEffect(() => {
    setEnded(false);
    setPlayerError(null);
    setPlaying(playerOpen);
  }, [currentIndex]);

  // Stop at the clip's end time. YouTube's own `end` setting only applies to the first
  // play-through, so we check the time ourselves (this also covers Replay).
  useEffect(() => {
    if (!playing || !playerOpen || !(endSec > startSec)) return;
    const timer = setInterval(async () => {
      try {
        const t = await playerRef.current?.getCurrentTime();
        if (t != null && t >= endSec) {
          setPlaying(false);
          setEnded(true);
        }
      } catch {}
    }, END_CHECK_MS);
    return () => clearInterval(timer);
  }, [playing, playerOpen, startSec, endSec]);

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

  const isFirst = currentIndex === 0;
  const isLast = currentIndex >= clips.length - 1;

  // Player fills the card width at 16:9, but never below YouTube's 200px minimum
  const playerW = Math.max(MIN_PLAYER_SIZE, width - 40);
  const playerH = Math.max(MIN_PLAYER_SIZE, Math.round((playerW * 9) / 16));

  const inApp = CLIP_PLAYBACK === 'in-app';

  // Other clips in this playlist from the same set (same YouTube video), in set order
  const setClips = clips
    .map((clip, index) => ({ clip, index }))
    .filter(({ clip }) => clip.videoId === currentClip.videoId)
    .sort((a, b) => toSecondsMaybe(a.clip.start) - toSecondsMaybe(b.clip.start));

  const openPlayer = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPlayerOpen(true);
    setEnded(false);
    setPlaying(true);
  };

  const handlePlay = () => {
    if (inApp) openPlayer();
    else handleOpenInYouTube();
  };

  // Picking a clip from "From this set" switches to it and starts it playing
  const handleSelectSetClip = (index) => {
    if (index === currentIndex) {
      if (inApp && !playerOpen) openPlayer();
      else if (inApp && ended) handleReplay();
      return;
    }
    setCurrentIndex(index);
    if (inApp && !playerOpen) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setPlayerOpen(true);
    }
  };

  const handleReplay = () => {
    setEnded(false);
    playerRef.current?.seekTo(startSec, true);
    setPlaying(true);
  };

  // Backup for videos that can't play inside the app
  const handleOpenInYouTube = async () => {
    setPlaying(false);
    try {
      await openClipInYouTube(currentClip);
    } catch (e) {
      console.log('Open in YouTube failed', e?.message ?? e);
    }
  };

  const onPlayerStateChange = (state) => {
    if (state === 'playing') {
      setPlaying(true);
      setEnded(false);
    } else if (state === 'paused') {
      setPlaying(false);
    } else if (state === 'ended') {
      setPlaying(false);
      setEnded(true);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ---------- Hero: DJ photo fading into the dark background ---------- */}
      <ImageBackground
        source={backdrop}
        style={[styles.hero, { height: height * (playerOpen ? 0.4 : 0.55) }]}
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

      {/* ---------- Thumbnail + play, which turns into the in-app player ---------- */}
      <View style={styles.body}>
        {!playerOpen ? (
          <View style={styles.playRow}>
            <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} />

            <View style={styles.playInfo}>
              <Text style={styles.playLabel}>Play clip</Text>
              <Text style={styles.playSub}>
                {inApp
                  ? `Plays ${formatTime(startSec)} – ${formatTime(endSec)}`
                  : `Opens YouTube at ${formatTime(startSec)}`}
              </Text>
            </View>

            <TouchableOpacity style={styles.playButton} onPress={handlePlay} activeOpacity={0.85}>
              <Ionicons name="play" size={30} color="#fff" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        ) : playerError ? (
          <View style={[styles.playerFallback, { height: playerH }]}>
            <Ionicons name="logo-youtube" size={36} color={PLAY_RED} />
            <Text style={styles.fallbackTitle}>This set can't play inside WaveCue</Text>
            <Text style={styles.fallbackSub}>
              {playerError === 'embed_not_allowed'
                ? "The channel doesn't allow playback in other apps."
                : 'Something went wrong loading the video.'}
            </Text>
            <TouchableOpacity style={styles.fallbackButton} onPress={handleOpenInYouTube}>
              <Text style={styles.fallbackButtonText}>Open in YouTube at {formatTime(startSec)}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.playerWrap, { height: playerH }]}>
              <YoutubePlayer
                key={currentClip.id ?? `${currentClip.videoId}-${currentIndex}`}
                ref={playerRef}
                width={playerW}
                height={playerH}
                videoId={currentClip.videoId}
                play={playing}
                forceAndroidAutoplay
                initialPlayerParams={{
                  start: Math.floor(startSec),
                  ...(endSec > startSec ? { end: Math.ceil(endSec) } : {}),
                  rel: false,
                }}
                onChangeState={onPlayerStateChange}
                onError={(e) => setPlayerError(e)}
              />
            </View>

            <View style={styles.playerActions}>
              {ended ? (
                <TouchableOpacity style={styles.replayButton} onPress={handleReplay}>
                  <Ionicons name="refresh" size={16} color="#fff" />
                  <Text style={styles.replayText}>Replay clip</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.playSub}>
                  Clip {formatTime(startSec)} – {formatTime(endSec)}
                </Text>
              )}

              <TouchableOpacity onPress={handleOpenInYouTube} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.openInYouTube}>Open in YouTube</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <ScrollView style={styles.middle} showsVerticalScrollIndicator={false}>
          {!!playlistName && (
            <View style={styles.playlistRow}>
              <Ionicons name="list" size={16} color="#8a8a96" />
              <Text style={styles.playlistText} numberOfLines={1}>
                {playlistName}
              </Text>
            </View>
          )}

          {/* ---------- Other clips from the same set ---------- */}
          {setClips.length > 1 && (
            <View style={styles.setSection}>
              <Text style={styles.sectionTitle}>From this set · {setClips.length} clips</Text>
              {setClips.map(({ clip, index }) => {
                const isCurrent = index === currentIndex;
                const s = toSecondsMaybe(clip.start);
                const e = toSecondsMaybe(clip.end);
                return (
                  <TouchableOpacity
                    key={clip.id ?? `${clip.videoId}-${index}`}
                    style={[styles.setClipRow, isCurrent && styles.setClipRowActive]}
                    onPress={() => handleSelectSetClip(index)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isCurrent && playing ? 'volume-high' : 'play-circle'}
                      size={22}
                      color={isCurrent ? PLAY_RED : '#8a8a96'}
                    />
                    <View style={styles.setClipText}>
                      <Text style={[styles.setClipTitle, isCurrent && styles.setClipTitleActive]} numberOfLines={1}>
                        {clip.title}
                      </Text>
                      <Text style={styles.setClipTime}>
                        {formatTime(s)} – {formatTime(e)} · {clipDurationLabel(s, e)}
                      </Text>
                    </View>
                    {isCurrent && <Text style={styles.nowTag}>NOW</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

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

  playerWrap: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  playerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#23232b',
  },
  replayText: { color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 6 },
  openInYouTube: { color: '#8a8a96', fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },

  playerFallback: {
    borderRadius: 12,
    backgroundColor: '#1b1b22',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  fallbackTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 10, textAlign: 'center' },
  fallbackSub: { color: '#8a8a96', fontSize: 13, marginTop: 4, textAlign: 'center' },
  fallbackButton: {
    marginTop: 14,
    backgroundColor: PLAY_RED,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  fallbackButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  middle: { flex: 1, marginBottom: 12 },
  setSection: { marginTop: 14 },
  sectionTitle: {
    color: '#c9c9d4',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  setClipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#16161c',
    marginBottom: 6,
  },
  setClipRowActive: { backgroundColor: '#23232b' },
  setClipText: { flex: 1, marginLeft: 10 },
  setClipTitle: { color: '#d6d6de', fontSize: 14, fontWeight: '600' },
  setClipTitleActive: { color: '#fff' },
  setClipTime: { color: '#8a8a96', fontSize: 12, marginTop: 2 },
  nowTag: { color: PLAY_RED, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginLeft: 8 },

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
