import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { toSecondsMaybe } from '../services/clipPlayerService';

// App-wide clip playback. One YouTube player lives at the top of the app (see
// components/ClipPlayerOverlay.js) so a clip keeps playing while you move around:
// it sits inside the clip screen when that screen is showing, and shrinks to a
// mini player in the corner everywhere else.

const END_CHECK_MS = 400; // how often we check whether the clip's end time was reached
// If a clip hasn't started this long after Play, nudge it again (see the watchdog below)
const START_RETRY_MS = [2000, 4500];

const ClipPlaybackContext = createContext(null);

export function ClipPlaybackProvider({ children }) {
  const playerRef = useRef(null);

  // { clips, index, playlistName } for whatever the clip screen last opened
  const [session, setSession] = useState(null);
  const [open, setOpen] = useState(false); // player visible (full or mini)
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false); // reached the clip's end time
  const [error, setError] = useState(null); // e.g. 'embed_not_allowed'
  // where the clip screen wants the player drawn ({ x, y, width, height } in window
  // coordinates); null whenever that screen isn't showing, which means "mini player"
  const [slot, setSlot] = useState(null);

  const sessionRef = useRef(null);
  sessionRef.current = session;

  const currentClip = session?.clips?.[session.index] ?? null;
  const startSec = toSecondsMaybe(currentClip?.start);
  const endSec = toSecondsMaybe(currentClip?.end);

  // ---------- One-press play ----------
  // Pressing Play should start the clip without also tapping YouTube's own play button.
  // Besides the normal play command, we "kick" the player by seeking to the clip's start:
  // YouTube starts playback when you seek a video that's waiting to be played, and seeking
  // goes through a different, reliable channel. Done when the player reports ready, and by a
  // watchdog if the video still hasn't started a few seconds after Play.
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const startSecRef = useRef(startSec);
  startSecRef.current = startSec;
  const ytStateRef = useRef(null); // last state YouTube reported

  const kickPlayback = useCallback(() => {
    playerRef.current?.seekTo(startSecRef.current, true);
  }, []);

  const onReady = useCallback(() => {
    ytStateRef.current = null;
    if (playingRef.current) kickPlayback();
  }, [kickPlayback]);

  const clipKey = currentClip ? currentClip.id ?? currentClip.videoId : null;
  useEffect(() => {
    if (!open || !playing) return;
    const timers = START_RETRY_MS.map((ms) =>
      setTimeout(() => {
        const s = ytStateRef.current;
        const started = s === 'playing' || s === 'buffering' || s === 'paused' || s === 'ended';
        if (playingRef.current && !started) kickPlayback();
      }, ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [open, playing, clipKey, kickPlayback]);

  // Stop at the clip's end time. YouTube's own `end` setting only applies to the first
  // play-through, so we check the time ourselves (this also covers Replay).
  useEffect(() => {
    if (!open || !playing || !(endSec > startSec)) return;
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
  }, [open, playing, startSec, endSec]);

  // Called when the clip screen opens. Keeps playing if it's the clip already loaded
  // (e.g. reopening from the mini player); otherwise loads the new clip, not yet playing.
  const startSession = useCallback(({ clips = [], index = 0, playlistName }) => {
    const prev = sessionRef.current;
    const prevClip = prev?.clips?.[prev.index];
    const nextClip = clips[index];
    const sameClip =
      prevClip && nextClip && (prevClip.id ?? prevClip.videoId) === (nextClip.id ?? nextClip.videoId);

    if (!sameClip) {
      setOpen(false);
      setPlaying(false);
      setEnded(false);
      setError(null);
    }
    setSession({ clips, index, playlistName });
  }, []);

  // Switch to another clip in the session; plays straight away if the player is open
  const selectIndex = useCallback(
    (index) => {
      setSession((prev) => (prev ? { ...prev, index } : prev));
      setEnded(false);
      setError(null);
      setPlaying(open);
    },
    [open]
  );

  const play = useCallback(() => {
    setOpen(true);
    setEnded(false);
    setPlaying(true);
  }, []);

  const pause = useCallback(() => setPlaying(false), []);

  const replay = useCallback(() => {
    setEnded(false);
    playerRef.current?.seekTo(startSec, true);
    setPlaying(true);
  }, [startSec]);

  // Close the player entirely (mini player X, deleting the clip, signing out)
  const close = useCallback(() => {
    setOpen(false);
    setPlaying(false);
    setEnded(false);
    setError(null);
  }, []);

  const onStateChange = useCallback((state) => {
    ytStateRef.current = state;
    if (state === 'playing') {
      setPlaying(true);
      setEnded(false);
    } else if (state === 'paused') {
      setPlaying(false);
    } else if (state === 'ended') {
      setPlaying(false);
      setEnded(true);
    }
  }, []);

  const value = {
    playerRef,
    session,
    currentClip,
    startSec,
    endSec,
    open,
    playing,
    ended,
    error,
    slot,
    setSlot,
    setError,
    startSession,
    selectIndex,
    play,
    pause,
    replay,
    close,
    onStateChange,
    onReady,
  };

  return <ClipPlaybackContext.Provider value={value}>{children}</ClipPlaybackContext.Provider>;
}

export function useClipPlayback() {
  const ctx = useContext(ClipPlaybackContext);
  if (!ctx) throw new Error('useClipPlayback must be used inside <ClipPlaybackProvider>');
  return ctx;
}
