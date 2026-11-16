import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useAppContext } from '../AppContext';
import { useClipPlayback } from '../context/ClipPlaybackContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

function norm(s) {
  return (s || '').trim().toLowerCase();
}

export default function PlaylistDetailScreen() {
  const { playlists, removeClipFromPlaylist, renamePlaylist } = useAppContext();
  const playback = useClipPlayback();
  const route = useRoute();
  const navigation = useNavigation();
  const { playlistName } = route.params;

  // Swipe-to-delete: keep only one row swiped open at a time
  const openRowRef = useRef(null);
  const onRowWillOpen = (row) => {
    if (openRowRef.current && openRowRef.current !== row) openRowRef.current.close();
    openRowRef.current = row;
  };

  // Rename: the pencil turns the title into a text field with save / cancel
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const startRename = () => {
    setDraftName(playlistName);
    setEditingName(true);
  };

  const cancelRename = () => {
    setEditingName(false);
    setDraftName('');
  };

  const saveRename = async () => {
    if (savingName) return;
    const next = draftName.trim();
    if (!next || next === playlistName) {
      cancelRename();
      return;
    }
    setSavingName(true);
    try {
      const saved = await renamePlaylist(playlistName, next);
      // this screen looks its playlist up by name, so follow the new name
      navigation.setParams({ playlistName: saved });
      setEditingName(false);
    } catch (e) {
      Alert.alert('Could not rename playlist', e?.message ?? 'Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const deleteClip = async (clip) => {
    try {
      // don't leave a deleted clip playing in the player / mini player
      if (playback.currentClip?.id === clip.id) playback.close();
      await removeClipFromPlaylist(playlistName, clip.id);
      openRowRef.current = null;
    } catch (e) {
      Alert.alert('Could not delete clip', e?.message ?? 'Please try again.');
    }
  };

  // Always pull the latest playlist from context
  const playlist = useMemo(() => {
    const target = norm(playlistName);
    return playlists.find((p) => norm(p.name) === target) || null;
  }, [playlists, playlistName]);

  const playClips = (clips) => {
    if (!clips?.length) {
      Alert.alert('No clips', 'This playlist has no clips yet.');
      return;
    }
    navigation.navigate('ClipPlayer', {
      clips,
      startIndex: 0,
      playlistName,
    });
  };

  const handlePlayAll = () => {
    playClips(playlist?.clips || []);
  };

  const handleShuffle = () => {
    const clips = playlist?.clips || [];
    if (!clips.length) {
      Alert.alert('No clips', 'This playlist has no clips yet.');
      return;
    }
    const shuffledClips = [...clips].sort(() => Math.random() - 0.5);
    playClips(shuffledClips);
  };

  const renderClip = ({ item }) => {
    const thumbnailURL =
      item.thumbnail ||
      item.thumnail || // keeping your typo fallback
      (item.videoId ? `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg` : '');

    const clips = playlist?.clips || [];
    const idx = clips.findIndex((c) => c.id === item.id);

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

    let rowRef = null;

    // Revealed by swiping the clip to the left (like Apple Music); tapping it deletes
    const renderDeleteAction = () => (
      <TouchableOpacity
        style={styles.swipeDelete}
        activeOpacity={0.85}
        onPress={() => deleteClip(item)}
      >
        <Ionicons name="trash-outline" size={22} color="#fff" />
        <Text style={styles.swipeDeleteText}>Delete</Text>
      </TouchableOpacity>
    );

    return (
      <Swipeable
        ref={(r) => {
          rowRef = r;
        }}
        renderRightActions={renderDeleteAction}
        overshootRight={false}
        rightThreshold={40}
        onSwipeableWillOpen={() => onRowWillOpen(rowRef)}
      >
        <TouchableOpacity
          style={styles.clipTouchable}
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate('ClipPlayer', {
              clips,
              startIndex: Math.max(idx, 0),
              playlistName,
            })
          }
        >
          <LinearGradient
            colors={['#33498e', '#5a74e0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.clipCard}
          >
            <View style={styles.cardContent}>
              <Image source={{ uri: thumbnailURL || '' }} style={styles.thumbnail} />
              <View style={styles.textContent}>
                <Text style={styles.clipTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.clipTime}>
                  {formatTime(item.start)} - {formatTime(item.end)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  if (!playlist) {
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
        <Text style={styles.empty}>Playlist not found.</Text>
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

        {editingName ? (
          <>
            <TextInput
              style={[styles.header, styles.nameInput]}
              value={draftName}
              onChangeText={setDraftName}
              autoFocus
              selectTextOnFocus
              maxLength={60}
              returnKeyType="done"
              onSubmitEditing={saveRename}
              editable={!savingName}
              placeholder="Playlist name"
              placeholderTextColor="#9aa3c7"
            />
            {savingName ? (
              <ActivityIndicator color="#33498e" style={styles.headerIcon} />
            ) : (
              <>
                <TouchableOpacity onPress={saveRename} hitSlop={hit} style={styles.headerIcon}>
                  <Ionicons name="checkmark" size={26} color="#33498e" />
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelRename} hitSlop={hit} style={styles.headerIcon}>
                  <Ionicons name="close" size={24} color="#888" />
                </TouchableOpacity>
              </>
            )}
          </>
        ) : (
          <>
            <Text style={[styles.header, styles.headerTitle]} numberOfLines={1}>
              {playlist.name}
            </Text>
            <TouchableOpacity onPress={startRename} hitSlop={hit} style={styles.headerIcon}>
              <Ionicons name="pencil" size={20} color="#33498e" />
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handlePlayAll}>
          <Text style={styles.actionText}>Play All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleShuffle}>
          <Text style={styles.actionText}>Shuffle</Text>
        </TouchableOpacity>
      </View>

      {playlist.clips?.length === 0 ? (
        <Text style={styles.empty}>No clips in this playlist yet.</Text>
      ) : (
        <FlatList
          data={playlist.clips}
          keyExtractor={(item) => String(item.id)}   //  always string
          renderItem={renderClip}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const hit = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#33498e',
  },
  headerTitle: { flex: 1 },
  headerIcon: { padding: 4 },
  // same height as the title so the header doesn't jump when editing starts
  nameInput: {
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
    includeFontPadding: false,
    borderBottomWidth: 2,
    borderBottomColor: '#33498e',
    marginBottom: -2, // the underline sits below the text instead of pushing it
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  clipTouchable: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  clipCard: {
    padding: 12,
    borderRadius: 12,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  thumbnail: {
    width: 120,
    height: (120 * 9) / 16,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#000',
  },
  textContent: { flex: 1 },
  swipeDelete: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 92,
    marginBottom: 15, // matches clipTouchable so the button lines up with the card
    marginLeft: 10,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
  },
  swipeDeleteText: { color: '#fff', fontWeight: '700', fontSize: 13, marginTop: 2 },
  clipTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  clipTime: { fontSize: 14, color: '#ccc' },
  empty: { marginTop: 40, textAlign: 'center', color: '#999', fontSize: 16 },
  actionButton: {
    backgroundColor: '#33498e',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
