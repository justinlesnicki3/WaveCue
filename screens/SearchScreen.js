import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SubscribeButton from '../components/SubscribeButton';
import ProfileButton from '../components/ProfileButton';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../AppContext';
import { DJ_DATABASE, EDM_GENRES, GENRE_IMAGES } from '../djData';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';

import {
  filterDJs,
  buildDjDetailNavParams,
  subscribeFlow,
  unsubscribeFlow,
} from '../services/searchService';

// Fine-tune vertical crop per genre. Negative = shift image up (reveals more
// of the top/face). Positive = shift down. Adjust per-image as needed.
const GENRE_IMAGE_OFFSETS = {
    'Tech House': -10,
    'Bass House': 0,
    'Melodic House': -25,
    'Progressive House': -20,
    'Deep House': -20,
    'Techno': -55,
    'UK Garage': 0,
    'Trap': 0,
    'Jersey Club': 0,
};

function SearchScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(null);
  const navigation = useNavigation();
  const { addTrackedDJ, trackedDJs, loading, removeTrackedDJ } = useAppContext();

  const resultsOpacity = useRef(new Animated.Value(0)).current;
  const resultsTranslate = useRef(new Animated.Value(12)).current;

  const isBrowsing = searchTerm.trim().length === 0 && !selectedGenre;

  useEffect(() => {
    if (isBrowsing) return;

    resultsOpacity.setValue(0);
    resultsTranslate.setValue(12);

    Animated.parallel([
      Animated.timing(resultsOpacity, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(resultsTranslate, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [searchTerm, selectedGenre, isBrowsing, resultsOpacity, resultsTranslate]);

  const filteredDJs = filterDJs(DJ_DATABASE, searchTerm, selectedGenre || 'All');

  const handleViewDJ = (djName) => {
    navigation.navigate('DJDetail', buildDjDetailNavParams(djName));
  };

  const handleSelectGenre = (genre) => {
    setSelectedGenre((prev) => (prev === genre ? null : genre));
  };

  const handleBackToBrowse = () => {
    setSelectedGenre(null);
    setSearchTerm('');
    Keyboard.dismiss();
  };

  const renderDJItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handleViewDJ(item.name)}
      style={styles.card}
    >
      <Image source={item.image} style={styles.thumbnail} />

      <View style={{ flex: 1 }}>
        <Text style={styles.djName}>{item.name}</Text>

        <SubscribeButton
          djName={item.name}
          style={styles.subscribePill}
          onSubbed={() =>
            subscribeFlow({
              database: DJ_DATABASE,
              djName: item.name,
              addTrackedDJ,
            })
          }
          onUnsubbed={() =>
            unsubscribeFlow({
              djName: item.name,
              removeTrackedDJ,
            })
          }
        />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#33498e" />
        <Text style={{ marginTop: 10, color: '#333' }}>Loading DJ data...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.screenWrapper}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Search DJs</Text>
            <ProfileButton />
          </View>

          <View style={styles.searchBarShadowWrapper}>
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', 'rgba(240,240,240,0.95)']}
              style={styles.searchBar}
            >
              <TextInput
                placeholder="Type DJ name..."
                placeholderTextColor="#555"
                style={styles.input}
                value={searchTerm}
                onChangeText={setSearchTerm}
                returnKeyType="search"
              />
            </LinearGradient>
          </View>
        </View>

        {isBrowsing ? (
          // -------------------- BROWSE MODE: big genre cards --------------------
          <ScrollView
            contentContainerStyle={styles.browseContent}
            showsVerticalScrollIndicator={false}
          >
            {EDM_GENRES.map((genre) => {
              const active = selectedGenre === genre;
              return (
                <TouchableOpacity
                  key={genre}
                  activeOpacity={0.85}
                  onPress={() => handleSelectGenre(genre)}
                  style={[styles.genreCardWrap, active && styles.genreCardWrapActive]}
                >
                  <View style={styles.genreCard}>
                    <Image
                      source={GENRE_IMAGES[genre] || GENRE_IMAGES['Tech House']}
                      style={[
                        styles.genreCardImage,
                        { transform: [{ translateY: GENRE_IMAGE_OFFSETS[genre] ?? 0 }] },
                      ]}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.75)']}
                      locations={[0.3, 1]}
                      style={styles.genreCardOverlay}
                    >
                      <Text style={styles.genreCardText}>{genre}</Text>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          // -------------------- RESULTS MODE: chip row + list --------------------
          <>
            <View style={styles.resultsHeaderRow}>
              <TouchableOpacity onPress={handleBackToBrowse} style={styles.backButton}>
                <Text style={styles.backButtonText}>‹ Genres</Text>
              </TouchableOpacity>
            </View>

            <Animated.FlatList
              data={filteredDJs}
              keyExtractor={(item) => item.id}
              renderItem={renderDJItem}
              contentContainerStyle={{ padding: 20, paddingTop: 10 }}
              ListEmptyComponent={<Text style={styles.emptyText}>No DJs found</Text>}
              style={{
                flex: 1,
                opacity: resultsOpacity,
                transform: [{ translateY: resultsTranslate }],
              }}
              keyboardShouldPersistTaps="handled"
            />
          </>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: '#f5f6fa' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#222' },
  searchBarShadowWrapper: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderRadius: 25,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 16, color: '#222' },

  // Browse mode (big cards)
  browseContent: { paddingHorizontal: 20, paddingBottom: 30 },
  genreCardWrap: {
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  genreCardWrapActive: {
    borderColor: '#8B5CF6',
  },
  genreCard: {
    height: 130,
    borderRadius: 21,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  genreCardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 260,
  },
  genreCardOverlay: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  genreCardText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  // Results mode (chip row)
  resultsHeaderRow: { paddingHorizontal: 20 },
  backButton: { paddingVertical: 6 },
  backButtonText: { color: '#33498e', fontSize: 15, fontWeight: '600' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  thumbnail: { width: 72, height: 72, borderRadius: 36, marginRight: 14 },
  djName: { fontSize: 17, fontWeight: '600', color: '#222' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#777', fontSize: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  subscribePill: { marginTop: 6, alignSelf: 'flex-start' },
});

export default SearchScreen;