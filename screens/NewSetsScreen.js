import React, { useCallback, useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useAppContext } from '../AppContext';
import { openYouTubeAt } from '../utils/openYouTubeAt';
import ProfileButton from '../components/ProfileButton';

import {
  sortSetsByNewest,
  formatPostedDate,
  keyForSet,
  refreshNewSetsFlow,
  isSetSaved,
  saveSetFlow,
} from '../services/newSetsService';

function NewSetsScreen() {
  const { newSets, trackedDJs, refreshTrackedDJs, savedSets, addSavedSet, removeSavedSet } =
    useAppContext();

  const [refreshing, setRefreshing] = useState(false);

  const sortedSets = useMemo(() => sortSetsByNewest(newSets), [newSets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshNewSetsFlow({ trackedDJs, refreshTrackedDJs });
    } finally {
      setRefreshing(false);
    }
  }, [trackedDJs, refreshTrackedDJs]);

  const renderSet = ({ item }) => {
    const saved = isSetSaved(savedSets, item);

    const onOpen = async () => {
      const videoId = item?.videoId ?? item?.id;
      if (!videoId) return;

      try {
        await openYouTubeAt({ videoId, start: 0 });
      } catch (e) {
        console.log('openYouTubeAt failed:', e?.message ?? e);
      }
    };

    const onToggleSave = () => {
      saveSetFlow({
        setItem: item,
        isSaved: saved,
        addSavedSet,
        removeSavedSet,
      });
    };

    return (
      <View style={styles.card}>
        <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={onOpen}>
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />

          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.meta}>{item.djName}</Text>
            <Text style={styles.meta}>Posted: {formatPostedDate(item.publishDate)}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleSave();
            }}
            style={[styles.saveBtn, saved && styles.saveBtnSaved]}
            activeOpacity={0.85}
          >
            <Text style={[styles.saveText, saved && styles.saveTextSaved]}>
              {saved ? 'Saved' : 'Save for later'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>New Sets</Text>
        <ProfileButton />
      </View>
      <FlatList
        style={styles.list}
        data={sortedSets}
        keyExtractor={keyForSet}
        renderItem={renderSet}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>No new sets yet</Text>
          </View>
        }
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.content}
        alwaysBounceVertical
        bounces
        overScrollMode="always"
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  list: { flex: 1 },

  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 15,
  },

  header: { fontSize: 24, fontWeight: 'bold' },

  card: {
    marginBottom: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },

  row: { flexDirection: 'row', padding: 12 },
  thumbnail: { width: 120, height: 67, borderRadius: 8, marginRight: 10 },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600' },
  meta: { color: '#666', fontSize: 14, marginTop: 4 },

  actions: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 0,
    alignItems: 'flex-start',
  },

  saveBtn: {
    backgroundColor: '#33498e',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  saveBtnSaved: {
    backgroundColor: '#e9eefc',
    borderWidth: 1,
    borderColor: '#33498e',
  },
  saveText: { color: '#fff', fontWeight: '700' },
  saveTextSaved: { color: '#33498e' },

  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#888' },
});

export default NewSetsScreen;
