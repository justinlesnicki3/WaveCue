import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useClipPlayback } from '../context/ClipPlaybackContext';
import { navigationRef } from '../navigation/navigationRef';

// YouTube requires embedded players to be at least 200 x 200 and fully visible,
// so the mini player can't be smaller than this, and its controls sit below the
// video rather than on top of it.
const MINI_SIZE = 200;
const MINI_BOTTOM = 100; // clears the floating tab bar (bottom: 25 + height: 60 in App.js)

// The embed pins the 16:9 video to the top of the player; center it vertically instead
const CENTER_VIDEO_JS = `
  (function () {
    var s = document.createElement('style');
    s.innerHTML = 'html,body{height:100%;background:#000}body{display:flex;flex-direction:column;justify-content:center}';
    document.head.appendChild(s);
  })();
  true;
`;

// The one YouTube player in the app. When the clip screen is showing it reports a "slot"
// and the player is drawn exactly there; otherwise the player shrinks to a mini player in
// the corner and keeps playing. It's the same player either way, so the video never reloads.
export default function ClipPlayerOverlay() {
  const insets = useSafeAreaInsets();
  const {
    playerRef,
    currentClip,
    startSec,
    endSec,
    open,
    playing,
    error,
    slot,
    setError,
    play,
    pause,
    close,
    onStateChange,
  } = useClipPlayback();

  // Nothing to show, or the clip screen is showing its "can't play here" message
  if (!open || !currentClip || error) return null;

  const mini = !slot;
  const width = mini ? MINI_SIZE : slot.width;
  const height = mini ? MINI_SIZE : slot.height;

  const position = mini
    ? { right: 12, bottom: insets.bottom + MINI_BOTTOM, width: MINI_SIZE }
    : { left: slot.x, top: slot.y, width: slot.width };

  const expand = () => {
    if (navigationRef.isReady()) navigationRef.navigate('ClipPlayer', { resume: true });
  };

  // The containers must never be optimized away ("flattened") by React Native: if the
  // wrapper switched between flattened and real views when going full <-> mini, Android
  // would move the WebView to a new parent and destroy it, stopping the video. So both are
  // collapsable={false}, and the same style keys are set in both modes (only values change).
  return (
    <View
      collapsable={false}
      style={[styles.container, position, mini ? styles.miniCard : styles.fullCard]}
      pointerEvents="box-none"
    >
      <View collapsable={false} style={[styles.video, { width, height }]}>
        <YoutubePlayer
          key={currentClip.id ?? currentClip.videoId}
          ref={playerRef}
          width={width}
          height={height}
          videoId={currentClip.videoId}
          play={playing}
          forceAndroidAutoplay
          initialPlayerParams={{
            start: Math.floor(startSec),
            ...(endSec > startSec ? { end: Math.ceil(endSec) } : {}),
            rel: false,
          }}
          webViewProps={{ injectedJavaScript: CENTER_VIDEO_JS }}
          onChangeState={onStateChange}
          onError={(e) => setError(e)}
        />
      </View>

      {mini && (
        <View style={styles.strip}>
          <TouchableOpacity onPress={playing ? pause : play} hitSlop={hit} style={styles.stripBtn}>
            <Ionicons name={playing ? 'pause' : 'play'} size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={expand} style={styles.stripTitleWrap} activeOpacity={0.7}>
            <Text style={styles.stripTitle} numberOfLines={1}>
              {currentClip.title}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={expand} hitSlop={hit} style={styles.stripBtn}>
            <Ionicons name="chevron-up" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={close} hitSlop={hit} style={styles.stripBtn}>
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const hit = { top: 8, bottom: 8, left: 6, right: 6 };

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
  },
  // same keys in both, only values differ (see the note in the component)
  fullCard: { backgroundColor: 'transparent', shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  miniCard: { backgroundColor: '#16161c', shadowOpacity: 0.4, shadowRadius: 10, elevation: 12 },
  video: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 6,
  },
  stripBtn: { padding: 4 },
  stripTitleWrap: { flex: 1, marginHorizontal: 4 },
  stripTitle: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
