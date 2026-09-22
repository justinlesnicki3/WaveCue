import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../AppContext';
import ProfileButton from '../components/ProfileButton';

import { Swipeable } from 'react-native-gesture-handler';

import {
  confirmDeletePlaylist,
  buildPlaylistNavParams,
  playlistKey,
  clipCountLabel,
} from '../services/myLeaksService';

function MyLeaksScreen() {
  const { playlists, removePlaylist } = useAppContext();
  const navigation = useNavigation();

  const renderRightActions = (item) => (
    <TouchableOpacity
      style={styles.swipeDelete}
      onPress={() =>
        confirmDeletePlaylist({
          name: item.name,
          onConfirm: removePlaylist,
        })
      }
      activeOpacity={0.9}
    >
      <Text style={styles.swipeDeleteText}>Delete</Text>
    </TouchableOpacity>
  );

  const renderPlaylist = ({ item }) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item)}
      overshootRight={false}
    >
      <TouchableOpacity
        style={styles.playlistItem}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('PlaylistDetail', buildPlaylistNavParams(item.name))
        }
      >
        <Text style={styles.playlistName}>{item.name}</Text>
        <Text style={styles.count}>{clipCountLabel(item.clips.length)}</Text>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>My Playlists</Text>
        <ProfileButton />
      </View>

      {playlists.length === 0 ? (
        <Text style={styles.empty}>
          No playlists yet. Create one by saving a clip.
        </Text>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={playlistKey}
          renderItem={renderPlaylist}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 10 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  header: { fontSize: 24, fontWeight: 'bold' },

  playlistItem: {
    padding: 15,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    marginBottom: 10,
  },

  playlistName: { fontSize: 18, fontWeight: 'bold' },
  count: { fontSize: 14, color: '#666', marginTop: 5 },

  swipeDelete: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 92,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    marginBottom: 10,
    marginLeft: 10,
  },
  swipeDeleteText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  empty: { marginTop: 40, textAlign: 'center', color: '#999' },
});

export default MyLeaksScreen;
