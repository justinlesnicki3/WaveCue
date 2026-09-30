import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  View,
  Animated,
  Easing,
} from 'react-native';
import { useAppContext } from '../AppContext';
import { openYouTubeAt } from '../utils/openYouTubeAt';
import ProfileButton from '../components/ProfileButton';
import useTabBarSpace from '../utils/useTabBarSpace';

import {
  buildClipNavParams,
  removeSavedSetById,
  keyForSavedSet,
  toggleExpandedId,
  isExpanded,
  buildYouTubeVideoId,
} from '../services/djLibraryService';

function LibraryRow({ item, expanded, onToggle, onRemove, onViewYouTube, onCreateClip }) {
  const anim = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: expanded ? 1 : 0,
      duration: expanded ? 260 : 200,
      easing: expanded ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [expanded, anim]);

  const height = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 0],
  });

  return (
    <View style={styles.cardWrap}>
      <TouchableOpacity activeOpacity={0.85} style={styles.item} onPress={onToggle}>
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />

        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.rowMeta}>
            <Text style={styles.hint}>{expanded ? 'Tap to hide options' : 'Tap for options'}</Text>

            <TouchableOpacity
              style={styles.removeButton}
              activeOpacity={0.85}
              onPress={onRemove}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      <View
        pointerEvents="none"
        style={styles.hiddenMeasure}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h && h !== contentHeight) setContentHeight(h);
        }}
      >
        <View style={styles.dropdown}>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionText}>View in YouTube</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.actionPrimary]}>
            <Text style={[styles.actionText, styles.actionPrimaryText]}>Create a clip</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View style={{ height, overflow: 'hidden' }}>
        <Animated.View style={{ opacity, transform: [{ translateY }] }}>
          <View style={styles.dropdown}>
            <TouchableOpacity style={styles.actionBtn} onPress={onViewYouTube} activeOpacity={0.85}>
              <Text style={styles.actionText}>View in YouTube</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionPrimary]}
              onPress={onCreateClip}
              activeOpacity={0.85}
            >
              <Text style={[styles.actionText, styles.actionPrimaryText]}>Create a clip</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function DJLibraryScreen({ navigation }) {
  const { savedSets, removeSavedSet } = useAppContext();
  const [expandedId, setExpandedId] = useState(null);
  const bottomSpace = useTabBarSpace();

  const onToggleRow = useCallback((item) => {
    setExpandedId((prev) => toggleExpandedId(prev, item));
  }, []);

  const renderItem = ({ item }) => {
    const expanded = isExpanded(expandedId, item);

    const onRemove = (e) => {
      e?.stopPropagation?.();
      removeSavedSetById(removeSavedSet, item.id);
    };

    const onViewYouTube = async () => {
      const videoId = buildYouTubeVideoId(item);
      if (!videoId) return;

      try {
        await openYouTubeAt({ videoId, start: 0 });
      } catch (e) {
        console.log('openYouTubeAt failed:', e?.message ?? e);
      }
    };

    const onCreateClip = () => {
      navigation.navigate('Clip', buildClipNavParams(item));
    };

    return (
      <LibraryRow
        item={item}
        expanded={expanded}
        onToggle={() => onToggleRow(item)}
        onRemove={onRemove}
        onViewYouTube={onViewYouTube}
        onCreateClip={onCreateClip}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Your DJ Library</Text>
        <ProfileButton />
      </View>
      <FlatList
        data={savedSets}
        keyExtractor={keyForSavedSet}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No DJ sets saved yet.</Text>}
        contentContainerStyle={{ paddingBottom: bottomSpace }}
        showsVerticalScrollIndicator={false}
      />
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

  cardWrap: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },

  thumbnail: {
    width: 120,
    height: 67,
    marginRight: 10,
    borderRadius: 6,
    backgroundColor: '#000',
  },

  title: { fontSize: 16, fontWeight: '500' },

  rowMeta: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  hint: { color: '#888', fontSize: 12 },

  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  removeButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  dropdown: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 10,
    gap: 8,
  },

  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
  },
  actionText: { fontWeight: '700', color: '#222' },

  actionPrimary: { backgroundColor: '#33498e' },
  actionPrimaryText: { color: '#fff' },

  hiddenMeasure: {
    position: 'absolute',
    left: 0,
    right: 0,
    opacity: 0,
    zIndex: -1,
  },

  empty: { textAlign: 'center', marginTop: 50, color: '#888' },
});

export default DJLibraryScreen;
