import React, { useState, useRef } from 'react';
import { KeyboardAvoidingView, ScrollView } from 'react-native';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Animated, Easing, Image, Platform, ActionSheetIOS,} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../AppContext';
import { Picker } from '@react-native-picker/picker';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'

import {
  validateClipInputs,
  buildLeak,
  resolvePlaylistName,
  saveLeakFlow,
} from '../services/clipService'; // services for clip creation

//navigation hooks

function ClipScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { title, videoId } = route.params; //extract dj set info passed from search results

  const { addLeak, playlists, addPlaylist, addClipToPlaylist } = useAppContext(); //gloabal state access, allow updating playlists across entrie app

  // local state form inputs for creating a clip from this dj set
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [clipTitle, setClipTitle] = useState('');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [showForm, setShowForm] = useState(false);

  //control smooth fade in/fade out animations
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslate = useRef(new Animated.Value(-20)).current;


  //animation function that smoothly reveals the clip creation form
  const animateFormIn = () => {
    setShowForm(true);
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(formTranslate, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateFormOut = () => {
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(formTranslate, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowForm(false);
      setStart('');
      setEnd('');
      setClipTitle('');
      setNewPlaylistName('');
      setSelectedPlaylist('');
    });
  };

  //save handler: validates inputs and saves the clip to a playlist

 const handleSaveLeak = async () => {
  const validation = validateClipInputs({ start, end, clipTitle });
  if (!validation.ok) {
    Alert.alert('Error', validation.message);
    return;
  }

  const leak = buildLeak({
    videoId,
    start,
    end,
    clipTitle,
    djSetTitle: title,
  });

  const playlistName = resolvePlaylistName({ newPlaylistName, selectedPlaylist });

  try {
    const result = await saveLeakFlow({
      leak,
      playlistName,
      addLeak,
      addClipToPlaylist,
    });

    Alert.alert(
      'Saved',
      `Clip saved${result.playlistName ? ` to "${result.playlistName}"` : ''}`
    );
    navigation.goBack();
  } catch (e) {
    Alert.alert('Error', e?.message ?? 'Failed to save clip');
  }
};



  //Main render, build UI
  return (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
  <SafeAreaView style={{ flex: 1 }} edges={['top']}>
    <View style={styles.headerRow}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-back" size={26} color="#111" />
      </TouchableOpacity>
    </View>
    {/*Prevents keyboard from covering input fields */}
    <KeyboardAvoidingView
      style={{ flex: 1 }}

      //checks what kind of platform we are using because ios uses "Padding" as android uses "height"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // tweak if needed
    >
      {/*Allows scrolling when content exceeds height*/}
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
      >
        {/*Display name of the dj set*/}
        <Text style={styles.title}>{title}</Text>

        {/*preview image of the dj set video, using YouTube thumbnail API*/}
        <Image
          source={{ uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
          style={styles.thumbnail}
        />

        {/*create make clip button when form is hidden*/}
        {!showForm && (
          <TouchableOpacity style={styles.makeClipButton} onPress={animateFormIn}>
            <Text style={styles.makeClipText}>+ Make Clip</Text>
          </TouchableOpacity>
        )}
        
        {/*show animated form*/}
        {showForm && (
          <Animated.View
            style={{
              opacity: formOpacity,
              transform: [{ translateY: formTranslate }],
            }}
          >
            {/*clip title input section*/}
            <Text style={styles.label}>Clip Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter song or clip name"
              value={clipTitle}
              onChangeText={setClipTitle}
              returnKeyType="next"
              blurOnSubmit={false}
            />
            
            {/*start time input section*/}
            <Text style={styles.label}>Start Time</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 3:24"
              value={start}
              onChangeText={setStart}
              returnKeyType="next"
              blurOnSubmit={false}
            />

            {/*end time input section*/}
            <Text style={styles.label}>End Time</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5:36"
              value={end}
              onChangeText={setEnd}
              returnKeyType="done"
              blurOnSubmit={true}
            />

            {/*new playlist input section*/}
            <Text style={styles.label}>New Playlist Name (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. My Favorites"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              returnKeyType="done"
              blurOnSubmit={true}
            />


            {/*conditional render, only shows playlist selector if a playlist already exists*/}
            {playlists.length > 0 && (
              <>
                <Text style={styles.or}>or select existing playlist</Text>

                {/*check platform once again to determine whether or not to use action sheet for ios
                if Android then use Picker*/}
                {Platform.OS === 'ios' ? (
                  <TouchableOpacity
                    style={styles.compactSelect}
                    onPress={() => {
                      const names = playlists.map((p) => p.name);
                      ActionSheetIOS.showActionSheetWithOptions(
                        {
                          title: 'Select a playlist',
                          options: [...names, 'Cancel'],
                          cancelButtonIndex: names.length,
                        },
                        (buttonIndex) => {
                          if (buttonIndex < names.length) {
                            setSelectedPlaylist(names[buttonIndex]);
                            setNewPlaylistName('');
                          }
                        }
                      );
                    }}
                  >
                    <Text style={styles.compactSelectText}>
                      {selectedPlaylist || 'Select a playlist...'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ marginBottom: 20 }}>
                    <Picker
                      selectedValue={selectedPlaylist}
                      onValueChange={(v) => {
                        setSelectedPlaylist(v);
                        setNewPlaylistName('');
                      }}
                      mode="dropdown"
                      style={styles.androidPicker}
                      dropdownIconColor="#555"
                    >
                      <Picker.Item label="Select a playlist..." value="" />
                      {playlists.map((p) => (
                        <Picker.Item key={p.name} label={p.name} value={p.name} />
                      ))}
                    </Picker>
                  </View>
                )}
              </>
            )}
            {/*Trigger save process*/}
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveLeak}>
              <Text style={styles.saveButtonText}>Save Clip</Text>
            </TouchableOpacity>


            {/*cancel button to trigger animations out and reset all form fields*/}
            <TouchableOpacity style={styles.cancelButton} onPress={animateFormOut}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  </TouchableWithoutFeedback>
);
}

const styles = StyleSheet.create({
  headerRow: { paddingHorizontal: 20, paddingTop: 10 },
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  thumbnail: { width: '100%', height: 200, borderRadius: 12, marginBottom: 20 },
  makeClipButton: {
    backgroundColor: '#33498e',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  makeClipText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '600', marginTop: 10, marginBottom: 4, color: '#333' },
  input: { borderColor: '#ccc', borderWidth: 1, borderRadius: 6, padding: 10, marginBottom: 10 },
  or: { textAlign: 'center', marginVertical: 10, color: '#888' },
  saveButton: { backgroundColor: '#33498e', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelButton: { paddingVertical: 10, alignItems: 'center', marginTop: 10 },
  cancelText: { color: '#888', fontSize: 15 },
  compactSelect: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingVertical: 12, paddingHorizontal: 12, justifyContent: 'center', marginBottom: 20 },
  compactSelectText: { fontSize: 16, color: '#333' },
  androidPicker: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginBottom: 20, height: 44 },
});

export default ClipScreen;
