import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

function norm(s) {
  return (s || '').trim().toLowerCase();
}

export default function PlaylistDetailScreen() {
  const { playlists } = useAppContext();
  const route = useRoute();
  const navigation = useNavigation();
  const { playlistName } = route.params;

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

    return (
      <TouchableOpacity
        style={styles.clipTouchable}
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
        <Text style={styles.header}>{playlist.name}</Text>
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
