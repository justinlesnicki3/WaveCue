import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { supabase } from './lib/supabase';
import { searchDJSets } from './services/youtube';

export const AppContext = createContext();

// How far back the New Sets screen looks
const NEW_SET_WINDOW_DAYS = 45;

function normalizeName(name) {
  return (name || '').trim().toLowerCase();
}

// Converts "mm:ss" or "hh:mm:ss" or "123" or 123 -> seconds (number)
function toSeconds(t) {
  if (t == null) return null;
  if (typeof t === 'number') return t;

  const s = String(t).trim();

  // if it's pure digits, treat as seconds
  if (/^\d+$/.test(s)) return Number(s);

  // mm:ss or hh:mm:ss
  const parts = s.split(':').map((x) => Number(x));
  if (parts.some(Number.isNaN)) return null;

  if (parts.length === 2) {
    const [m, sec] = parts;
    return m * 60 + sec;
  }

  if (parts.length === 3) {
    const [h, m, sec] = parts;
    return h * 3600 + m * 60 + sec;
  }

  return null;
}


async function getUserId() {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ?? null;
}

async function loadUserData() {
  const userId = await getUserId();
  if (!userId) {
    return { trackedDJs: [], savedSets: [], playlists: [], clips: [] };
  }

  const [subsRes, savedRes, playlistsRes, clipsRes] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('created_at, dj_id, djs:dj_id ( id, name, image_url )')
      .eq('user_id', userId),

    supabase
      .from('saved_sets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

    supabase
      .from('playlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),

    supabase
      .from('clips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
  ]);

  if (subsRes.error) throw subsRes.error;
  if (savedRes.error) throw savedRes.error;
  if (playlistsRes.error) throw playlistsRes.error;
  if (clipsRes.error) throw clipsRes.error;

  const trackedDJs = (subsRes.data || [])
    .map((row) => ({
      djId: row.dj_id,
      name: normalizeName(row?.djs?.name),
      imageUrl: row?.djs?.image_url ?? null,
      subscribeDate: row.created_at,
    }))
    .filter((d) => d.name);

  const savedSets = (savedRes.data || []).map((row) => ({
    id: row.video_id,
    videoId: row.video_id,
    title: row.title,
    thumbnail: row.thumbnail,
    djName: row.dj_name,
    publishDate: row.publish_date,
  }));

  const playlistRows = playlistsRes.data || [];
  const clipRows = clipsRes.data || [];

  const clipsByPlaylistId = clipRows.reduce((acc, c) => {
    const pid = c.playlist_id || '__NO_PLAYLIST__';
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push({
      id: c.id,
      title: c.title,
      djSetTitle: c.dj_set_title,
      videoId: c.video_id,
      start: c.start_sec,
      end: c.end_sec,
      playlistId: c.playlist_id,
      createdAt: c.created_at,
    });
    return acc;
  }, {});

  const playlists = playlistRows.map((p) => ({
    id: p.id,
    name: p.name,
    clips: clipsByPlaylistId[p.id] || [],
  }));

  return { trackedDJs, savedSets, playlists, clips: clipRows };
}

export const AppProvider = ({ children }) => {
  const [trackedDJs, setTrackedDJs] = useState([]);
  const [savedSets, setSavedSets] = useState([]);
  const [playlists, setPlaylists] = useState([]);

  const [djLibrary, setDjLibrary] = useState([]);
  const [newSets, setNewSets] = useState([]);

  const [currentClip, setCurrentClip] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [loading, setLoading] = useState(true);
  const didInitialYouTubeRefresh = useRef(false);

  // ---------- Supabase load on mount + auth changes ----------
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      try {
        const userId = await getUserId();
        if (!userId) {
          if (!mounted) return;
          setTrackedDJs([]);
          setSavedSets([]);
          setPlaylists([]);
          setDjLibrary([]);
          setNewSets([]);
          return;
        }

        const data = await loadUserData();
        if (!mounted) return;

        setTrackedDJs(data.trackedDJs);
        setSavedSets(data.savedSets);
        setPlaylists(data.playlists);
      } catch (e) {
        console.log('❌ Supabase init error:', e?.message ?? e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      init();
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // ---------- DJ tracking ----------
  const addTrackedDJ = (dj) => {
    const cleanName = normalizeName(dj?.name);
    if (!cleanName) return;

    setTrackedDJs((prev) => {
      if (prev.some((d) => d.name === cleanName)) return prev;
      return [
        ...prev,
        {
          name: cleanName,
          imageUrl: dj?.image_url ?? dj?.imageUrl ?? null,
          subscribeDate: new Date().toISOString(),
          djId: dj?.djId ?? dj?.id ?? null,
        },
      ];
    });
  };

  const removeTrackedDJ = (djName) => {
    const clean = normalizeName(djName);
    if (!clean) return;
    setTrackedDJs((prev) => prev.filter((dj) => dj.name !== clean));
  };

  // ---------- Saved sets ----------
  const addSavedSet = async (setItem) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not logged in');

    const videoId = setItem?.videoId ?? setItem?.id;
    if (!videoId) throw new Error('Missing videoId');

    if (savedSets.some((s) => (s.videoId ?? s.id) === videoId)) return;

    const payload = {
      user_id: userId,
      video_id: videoId,
      title: setItem?.title ?? '',
      thumbnail: setItem?.thumbnail ?? null,
      dj_name: setItem?.djName ?? null,
      publish_date: setItem?.publishDate ?? null,
    };

    const { error } = await supabase.from('saved_sets').insert(payload);
    if (error) throw error;

    setSavedSets((prev) => [{ ...payload, id: videoId, videoId }, ...prev]);
  };

  const removeSavedSet = async (setIdOrVideoId) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not logged in');

    const videoId = setIdOrVideoId;
    if (!videoId) return;

    const { error } = await supabase
      .from('saved_sets')
      .delete()
      .eq('user_id', userId)
      .eq('video_id', videoId);

    if (error) throw error;

    setSavedSets((prev) => prev.filter((s) => (s.videoId ?? s.id) !== videoId));
  };

  // ---------- Playlists ----------
  const upsertPlaylistByName = async (nameRaw) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not logged in');

    const name = (nameRaw || '').trim();
    if (!name) throw new Error('Playlist name required');

    // UPSERT uses your unique constraint (user_id, name)
    // This prevents duplicate key crashes.
    const { data, error } = await supabase
      .from('playlists')
      .upsert({ user_id: userId, name }, { onConflict: 'user_id,name' })
      .select('id, name')
      .single();

    if (error) throw error;

    // Ensure playlist exists in local state
    setPlaylists((prev) => {
      const exists = prev.some((p) => p.id === data.id);
      if (exists) return prev;
      return [...prev, { id: data.id, name: data.name, clips: [] }];
    });

    return data; // {id, name}
  };

  const addPlaylist = async (name) => {
    return upsertPlaylistByName(name);
  };

  const removePlaylist = async (nameRaw) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not logged in');

    const name = (nameRaw || '').trim();
    if (!name) return;

    // Find in state (case-insensitive)
    const match = playlists.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (!match?.id) {
      setPlaylists((prev) => prev.filter((p) => p.name.toLowerCase() !== name.toLowerCase()));
      return;
    }

    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('user_id', userId)
      .eq('id', match.id);

    if (error) throw error;

    setPlaylists((prev) => prev.filter((p) => p.id !== match.id));
  };

  // Rename a playlist. Names are unique per user (case-insensitive here, and the
  // user_id + name constraint in the database), so a clashing name is rejected.
  const renamePlaylist = async (oldNameRaw, newNameRaw) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not logged in');

    const oldName = (oldNameRaw || '').trim();
    const newName = (newNameRaw || '').trim();
    if (!newName) throw new Error('Playlist name can’t be empty.');

    const match = playlists.find((p) => p.name.toLowerCase() === oldName.toLowerCase());
    if (!match?.id) throw new Error('Playlist not found.');
    if (newName === match.name) return match.name; // nothing changed

    const taken = playlists.some(
      (p) => p.id !== match.id && p.name.toLowerCase() === newName.toLowerCase()
    );
    if (taken) throw new Error(`You already have a playlist called "${newName}".`);

    const { error } = await supabase
      .from('playlists')
      .update({ name: newName })
      .eq('user_id', userId)
      .eq('id', match.id);

    if (error) throw error;

    setPlaylists((prev) => prev.map((p) => (p.id === match.id ? { ...p, name: newName } : p)));
    return newName;
  };

  // ---------- Clips ----------
  const addLeak = async (leak) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not logged in');

    const startSec = toSeconds(leak?.start);
    const endSec = toSeconds(leak?.end);

    if (!leak?.videoId) throw new Error('Missing videoId');
    if (startSec == null || endSec == null) throw new Error('Invalid start/end time');
    if (!leak?.title?.trim()) throw new Error('Missing clip title');

    const payload = {
      user_id: userId,
      playlist_id: null,
      video_id: leak.videoId,
      title: leak.title.trim(),
      dj_set_title: leak.djSetTitle ?? null,
      start_sec: startSec,
      end_sec: endSec,
    };

    const { data, error } = await supabase
      .from('clips')
      .insert([payload])
      .select('*')
      .single();

    if (error) throw error;

    return data;
  };

  const addClipToPlaylist = async (playlistName, clip) => {
  const startSec = toSeconds(clip?.start);
  const endSec = toSeconds(clip?.end);

  console.log('RAW clip.start/end ->', clip?.start, clip?.end);
  console.log('toSeconds(start/end) ->', startSec, endSec);

  if (!clip?.videoId) throw new Error('Missing videoId');
  if (startSec == null || endSec == null) throw new Error('Invalid start/end time');
  if (!clip?.title?.trim()) throw new Error('Missing clip title');

  // Always ensure playlist exists in DB (no stale state issues)
  const pl = await upsertPlaylistByName(playlistName);

  const userId = await getUserId();
  if (!userId) throw new Error('Not logged in');

  const payload = {
    user_id: userId,
    playlist_id: pl.id,
    video_id: clip.videoId,
    title: clip.title.trim(),
    dj_set_title: clip.djSetTitle ?? null,
    start_sec: startSec,
    end_sec: endSec,
  };

  const { data: inserted, error } = await supabase
    .from('clips')
    .insert([payload])
    .select('*')
    .single();

  if (error) throw error;

  setPlaylists((prev) =>
    prev.map((p) => {
      if (p.id !== pl.id) return p;

      const exists = p.clips?.some((c) => c.id === inserted.id);
      if (exists) return p;

      const newClip = {
        id: inserted.id,
        title: inserted.title,
        djSetTitle: inserted.dj_set_title,
        videoId: inserted.video_id,
        start: inserted.start_sec,
        end: inserted.end_sec,
        playlistId: inserted.playlist_id,
        createdAt: inserted.created_at,
      };

      return { ...p, clips: [...(p.clips || []), newClip] };
    })
  );

  return inserted;
};


  const removeClipFromPlaylist = async (playlistNameRaw, clipId) => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not logged in');
    if (!clipId) return;

    const { error } = await supabase
      .from('clips')
      .delete()
      .eq('user_id', userId)
      .eq('id', clipId);

    if (error) throw error;

    // Clip ids are unique, so remove it wherever it is. (Matching by playlist name
    // would miss it if the playlist was renamed while the clip player was open.)
    setPlaylists((prev) =>
      prev.map((p) =>
        p.clips?.some((c) => c.id === clipId)
          ? { ...p, clips: p.clips.filter((c) => c.id !== clipId) }
          : p
      )
    );
  };

  // ---------- YouTube refresh ----------
  // New Sets = every set published in the last NEW_SET_WINDOW_DAYS by a subscribed DJ.
  // Each refresh rebuilds the list, so sets drop off once they age past the window.
  const refreshTrackedDJs = async (djList) => {
    if (!Array.isArray(djList) || djList.length === 0) {
      setNewSets([]);
      return;
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - NEW_SET_WINDOW_DAYS);

    const found = new Map();
    let anySucceeded = false;

    for (const dj of djList) {
      try {
        // ask YouTube for recent uploads only, newest first
        const results = await searchDJSets(dj.name, {
          publishedAfter: cutoff.toISOString(),
          order: 'date',
          throwOnError: true,
        });
        anySucceeded = true;

        for (const set of results) {
          const fullSet = { ...set, djName: (dj.name || '').toLowerCase() };

          setDjLibrary((prev) =>
            prev.some((s) => s.id === fullSet.id) ? prev : [...prev, fullSet]
          );

          if (new Date(set.publishDate) >= cutoff) {
            found.set(fullSet.id, fullSet);
          }
        }
      } catch (err) {
        console.warn(`⚠️ Failed to fetch for ${dj.name}:`, err?.message || err);
      }
    }

    // if every request failed (e.g. offline), keep showing the previous list
    if (anySucceeded) setNewSets(Array.from(found.values()));
  };

  useEffect(() => {
    if (loading) return;
    if (didInitialYouTubeRefresh.current) return;
    didInitialYouTubeRefresh.current = true;

    refreshTrackedDJs(trackedDJs).catch(() => {});
  }, [loading, trackedDJs]);

  const clearAllData = async () => {
    const userId = await getUserId();
    if (!userId) throw new Error('Not logged in');

    await supabase.from('clips').delete().eq('user_id', userId);
    await supabase.from('playlists').delete().eq('user_id', userId);
    await supabase.from('saved_sets').delete().eq('user_id', userId);
    await supabase.from('subscriptions').delete().eq('user_id', userId);

    setTrackedDJs([]);
    setSavedSets([]);
    setPlaylists([]);
    setDjLibrary([]);
    setNewSets([]);
    setCurrentClip(null);
    setIsPlaying(false);
  };

  return (
    <AppContext.Provider
      value={{
        trackedDJs,
        addTrackedDJ,
        removeTrackedDJ,

        djLibrary,
        addSetToLibrary: () => {},

        // you’re not using a separate leaks array yet; saving still works in DB
        myLeaks: [],
        addLeak,

        refreshTrackedDJs,
        newSets,
        loading,

        savedSets,
        addSavedSet,
        removeSavedSet,

        playlists,
        addPlaylist,
        addClipToPlaylist,
        removeClipFromPlaylist,
        removePlaylist,
        renamePlaylist,

        currentClip,
        setCurrentClip,
        isPlaying,
        setIsPlaying,

        clearAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
