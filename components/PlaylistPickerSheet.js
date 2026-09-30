import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PlaylistCover from './PlaylistCover';
import { playlistCoverThumbnails, clipCountLabel } from '../services/myLeaksService';

// Bottom sheet for picking which playlist a clip is saved to.
// Opens straight into "create" mode when the user has no playlists yet.
function PlaylistPickerSheet({ visible, playlists = [], onSelect, onClose }) {
  const insets = useSafeAreaInsets();
  const hasPlaylists = playlists.length > 0;

  const [mode, setMode] = useState('list');
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset every time the sheet opens
  useEffect(() => {
    if (visible) {
      setMode(hasPlaylists ? 'list' : 'create');
      setNewName('');
      setSaving(false);
    }
  }, [visible]);

  const choose = async (name) => {
    if (saving) return;
    setSaving(true);
    try {
      await onSelect(name);
    } finally {
      setSaving(false);
    }
  };

  const trimmedName = newName.trim();

  const renderPlaylist = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.7}
      disabled={saving}
      onPress={() => choose(item.name)}
    >
      <PlaylistCover thumbnails={playlistCoverThumbnails(item.clips)} size={52} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.rowSub}>{clipCountLabel(item.clips?.length ?? 0)}</Text>
      </View>
      <Ionicons name="add-circle-outline" size={24} color="#33498e" />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={saving ? undefined : onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}
        pointerEvents="box-none"
      >
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />

          {mode === 'list' ? (
            <>
              <Text style={styles.heading}>Save to Playlist</Text>

              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                disabled={saving}
                onPress={() => setMode('create')}
              >
                <View style={styles.newIcon}>
                  <Ionicons name="add" size={28} color="#33498e" />
                </View>
                <Text style={[styles.rowTitle, styles.rowText, { color: '#33498e' }]}>
                  New Playlist
                </Text>
              </TouchableOpacity>

              <FlatList
                data={playlists}
                keyExtractor={(p) => p.id ?? p.name}
                renderItem={renderPlaylist}
                style={styles.list}
                keyboardShouldPersistTaps="handled"
              />
            </>
          ) : (
            <>
              <View style={styles.createHeader}>
                {hasPlaylists && (
                  <TouchableOpacity
                    onPress={() => setMode('list')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.backBtn}
                  >
                    <Ionicons name="chevron-back" size={24} color="#111" />
                  </TouchableOpacity>
                )}
                <Text style={styles.heading}>
                  {hasPlaylists ? 'New Playlist' : 'Create your first playlist'}
                </Text>
              </View>

              {!hasPlaylists && (
                <View style={styles.emptyArt}>
                  <Ionicons name="musical-notes" size={40} color="#33498e" />
                </View>
              )}

              <Text style={styles.createSub}>
                {hasPlaylists
                  ? 'Give it a name and this clip will be saved to it.'
                  : "You don't have any playlists yet. Name one and we'll save this clip to it."}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="e.g. Festival IDs"
                value={newName}
                onChangeText={setNewName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => trimmedName && choose(trimmedName)}
                editable={!saving}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, (!trimmedName || saving) && styles.primaryBtnDisabled]}
                disabled={!trimmedName || saving}
                onPress={() => choose(trimmedName)}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Create & Save</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {saving && mode === 'list' && (
            <View style={styles.savingOverlay}>
              <ActivityIndicator size="large" color="#33498e" />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    maxHeight: '80%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ddd',
    marginBottom: 12,
  },
  heading: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 12 },

  list: { flexGrow: 0 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  rowText: { flex: 1, marginLeft: 12 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: '#111' },
  rowSub: { fontSize: 13, color: '#666', marginTop: 2 },
  newIcon: {
    width: 52,
    height: 52,
    borderRadius: 6,
    backgroundColor: '#eef0f8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  createHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  backBtn: { marginRight: 6, marginTop: 1 },
  emptyArt: {
    alignSelf: 'center',
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: '#eef0f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  createSub: { fontSize: 14, color: '#666', marginBottom: 14 },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    marginBottom: 14,
  },
  primaryBtn: {
    backgroundColor: '#33498e',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

export default PlaylistPickerSheet;
