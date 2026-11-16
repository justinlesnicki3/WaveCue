import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useClipPlayback } from '../context/ClipPlaybackContext';
import { navigationRef } from '../navigation/navigationRef';

// YouTube requires embedded players to be at least 200 x 200 and fully visible,
// so the mini player can't be smaller than this, and its controls sit below the
// video rather than on top of it.
const MINI_SIZE = 200;
const STRIP_HEIGHT = 40; // control bar under the mini video
const MINI_HEIGHT = MINI_SIZE + STRIP_HEIGHT;
const MINI_BOTTOM = 100; // clears the floating tab bar (bottom: 25 + height: 60 in App.js)
const EDGE = 12; // gap between the mini player and the screen edges
const DRAG_THRESHOLD = 8; // px of movement before a touch becomes a drag (less = still a tap)
const FLING = 0.15; // how far a quick flick carries toward a corner (seconds of velocity)
const SKIP_SECONDS = 10; // mini player's back / forward buttons
const CONTROLS_HIDE_MS = 3000; // mini player's tap controls hide after this long

// Runs inside the player's web page before its own scripts.
//
// 1. Command bridge: react-native-youtube-iframe 2.4.1 sends play/pause as JSON
//    ('{"eventName":"playVideo",...}'), but the hosted page it loads by default
//    (lonelycpp.github.io/.../iframe_v2.html) only understands the bare string 'playVideo',
//    so every play/pause from the app was silently ignored. This listener understands the
//    JSON form and calls YouTube's player directly. (`player` is the page's global.)
// 2. The page pins the 16:9 video to the top of the player; center it vertically instead.
const PLAYER_PAGE_JS = `
  (function () {
    function run(name) {
      if (typeof player === 'undefined' || !player) return;
      if (name === 'playVideo') player.playVideo();
      else if (name === 'pauseVideo') player.pauseVideo();
      else if (name === 'muteVideo') player.mute();
      else if (name === 'unMuteVideo') player.unMute();
    }
    function onMessage(ev) {
      var d = ev && ev.data;
      if (typeof d !== 'string' || d.charAt(0) !== '{') return;
      try {
        var m = JSON.parse(d);
        if (m && m.eventName) run(m.eventName);
      } catch (e) {}
    }
    window.addEventListener('message', onMessage);
    document.addEventListener('message', onMessage);

    function addStyle() {
      var s = document.createElement('style');
      s.innerHTML = 'html,body{height:100%;background:#000}body{display:flex;flex-direction:column;justify-content:center}';
      (document.head || document.documentElement).appendChild(s);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addStyle);
    else addStyle();
  })();
  true;
`;

// The one YouTube player in the app. When the clip screen is showing it reports a "slot"
// and the player is drawn exactly there; otherwise the player shrinks to a mini player in
// the corner and keeps playing. It's the same player either way, so the video never reloads.
export default function ClipPlayerOverlay() {
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();

  // ---------- Draggable mini player: drag it anywhere, it snaps to the nearest corner ----------
  // While minimized, the video itself doesn't take touches (YouTube's player would otherwise
  // grab them: press-and-hold is its 2x speed, and it cancels our drag). Instead a tap shows
  // our own controls (back 10s / play-pause / forward 10s), the same idea as YouTube's
  // `controls: 0` setting plus app-provided controls. The full-size player is untouched.
  // corner is 'tl' | 'tr' | 'bl' | 'br'; remembered for the rest of the session
  const [corner, setCorner] = useState('br');
  const pan = useRef(new Animated.ValueXY()).current;

  const cornerPos = (c) => ({
    x: c.endsWith('l') ? EDGE : screenW - MINI_SIZE - EDGE,
    y: c.startsWith('t') ? insets.top + EDGE : screenH - insets.bottom - MINI_BOTTOM - MINI_HEIGHT,
  });

  // latest values for the gesture handlers, which are created once
  const cornerPosRef = useRef(cornerPos);
  cornerPosRef.current = cornerPos;
  const sizeRef = useRef({ screenW, screenH });
  sizeRef.current = { screenW, screenH };
  const cornerRef = useRef(corner);
  cornerRef.current = corner;

  // Where the mini player currently sits (top-left corner, in screen points). Kept in a ref
  // because Animated listeners don't reliably report while a drag offset is applied.
  const posRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });

  // tap controls on the mini video
  const [controlsVisible, setControlsVisible] = useState(false);
  const hideTimer = useRef(null);
  const showControls = () => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), CONTROLS_HIDE_MS);
  };
  const hideControls = () => {
    clearTimeout(hideTimer.current);
    setControlsVisible(false);
  };
  useEffect(() => () => clearTimeout(hideTimer.current), []);
  // Settle at the corner nearest to where the player was dropped
  const snapToCorner = (dropX, dropY, velocityX = 0, velocityY = 0) => {
    const { screenW: w, screenH: h } = sizeRef.current;
    // where the player's center will end up, letting a flick carry it further
    const cx = dropX + MINI_SIZE / 2 + velocityX * FLING;
    const cy = dropY + MINI_HEIGHT / 2 + velocityY * FLING;
    const next = `${cy < h / 2 ? 't' : 'b'}${cx < w / 2 ? 'l' : 'r'}`;
    const target = cornerPosRef.current(next);
    setCorner(next);
    posRef.current = target;
    Animated.spring(pan, {
      toValue: target,
      useNativeDriver: false,
      friction: 7,
      tension: 60,
    }).start();
  };

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
    onReady,
  } = useClipPlayback();

  const mini = !slot;

  // Whenever the player becomes the mini player (or the screen size changes), put it in
  // its remembered corner (before the frame is drawn, so it never flashes at 0,0)
  useLayoutEffect(() => {
    if (!mini) return;
    const p = cornerPos(corner);
    posRef.current = p;
    pan.setValue(p);
  }, [mini, screenW, screenH, insets.top, insets.bottom]);

  // tap controls only belong to the mini player
  useEffect(() => {
    if (!mini) hideControls();
  }, [mini]);

  // Jump within the clip, never before its start or past its end
  const seekBy = async (delta) => {
    showControls();
    try {
      const t = await playerRef.current?.getCurrentTime();
      if (t == null) return;
      const max = endSec > startSec ? endSec - 0.5 : Infinity;
      playerRef.current?.seekTo(Math.min(max, Math.max(startSec, t + delta)), true);
    } catch {}
  };

  // Drag the whole mini player (video + bar). Only active as the mini player; the full-size
  // player on the clip screen stays put. runOnJS: drives the same Animated values as above.
  // When the drag starts, gesture-handler cancels any tap in progress on the controls.
  const dragGesture = Gesture.Pan()
    .enabled(mini)
    .minDistance(DRAG_THRESHOLD)
    .runOnJS(true)
    .onStart(() => {
      pan.stopAnimation();
      dragStartRef.current = { ...posRef.current }; // drag from where the player sits now
    })
    .onUpdate((e) => {
      pan.setValue({
        x: dragStartRef.current.x + e.translationX,
        y: dragStartRef.current.y + e.translationY,
      });
    })
    .onEnd((e) => {
      const dropX = dragStartRef.current.x + e.translationX;
      const dropY = dragStartRef.current.y + e.translationY;
      snapToCorner(dropX, dropY, e.velocityX, e.velocityY); // velocities are px/second
    });

  // Nothing to show, or the clip screen is showing its "can't play here" message
  if (!open || !currentClip || error) return null;

  const width = mini ? MINI_SIZE : slot.width;
  const height = mini ? MINI_SIZE : slot.height;

  // Same style keys in both modes (see the note below): the full player is placed at the
  // clip screen's slot; the mini player sits at 0,0 and is moved by the drag offset.
  const position = mini
    ? { left: 0, top: 0, width: MINI_SIZE, transform: pan.getTranslateTransform() }
    : { left: slot.x, top: slot.y, width: slot.width, transform: [{ translateX: 0 }, { translateY: 0 }] };

  const expand = () => {
    if (navigationRef.isReady()) navigationRef.navigate('ClipPlayer', { resume: true });
  };

  // The containers must never be optimized away ("flattened") by React Native: if the
  // wrapper switched between flattened and real views when going full <-> mini, Android
  // would move the WebView to a new parent and destroy it, stopping the video. So both are
  // collapsable={false}, and the same style keys are set in both modes (only values change).
  return (
    <GestureDetector gesture={dragGesture}>
    <Animated.View
      collapsable={false}
      style={[styles.container, position, mini ? styles.miniCard : styles.fullCard]}
    >
      {/* minimized: the video ignores touches; the tap layer below handles them */}
      <View
        collapsable={false}
        pointerEvents={mini ? 'none' : 'auto'}
        style={[styles.video, { width, height }]}
      >
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
          webViewProps={{ injectedJavaScriptBeforeContentLoaded: PLAYER_PAGE_JS }}
          onChangeState={onStateChange}
          onReady={onReady}
          onError={(e) => setError(e)}
        />
      </View>

      {/* mini player's tap layer over the video: tap shows back 10s / play-pause / forward 10s.
          It's a sibling of the video (not a wrapper) so the WebView's parent never changes. */}
      {mini && (
        <Pressable
          style={[styles.tapLayer, { width, height }]}
          onPress={controlsVisible ? hideControls : showControls}
        >
          {controlsVisible && (
            <View style={styles.controls}>
              <TouchableOpacity onPress={() => seekBy(-SKIP_SECONDS)} hitSlop={hit} style={styles.ctrlBtn}>
                <Ionicons name="play-back" size={22} color="#fff" />
                <Text style={styles.ctrlLabel}>{SKIP_SECONDS}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  showControls();
                  if (playing) pause();
                  else play();
                }}
                hitSlop={hit}
                style={styles.ctrlMain}
              >
                <Ionicons name={playing ? 'pause' : 'play'} size={30} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => seekBy(SKIP_SECONDS)} hitSlop={hit} style={styles.ctrlBtn}>
                <Ionicons name="play-forward" size={22} color="#fff" />
                <Text style={styles.ctrlLabel}>{SKIP_SECONDS}</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      )}

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
    </Animated.View>
    </GestureDetector>
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
  tapLayer: { position: 'absolute', top: 0, left: 0 },
  controls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  ctrlBtn: { alignItems: 'center', padding: 6 },
  ctrlLabel: { color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 1 },
  ctrlMain: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: STRIP_HEIGHT,
    paddingHorizontal: 6,
  },
  stripBtn: { padding: 4 },
  stripTitleWrap: { flex: 1, marginHorizontal: 4 },
  stripTitle: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
