import React from 'react';
import { Text, StyleSheet, FlatList, TouchableOpacity, ImageBackground, View,} from 'react-native';
import { useAppContext } from '../AppContext';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileButton from '../components/ProfileButton';

import { getDjImage, buildDjDetailNavParams, formatSubscribeDate, keyForDj, } from '../services/myDjsService';

function MyDJsScreen() {
  const { trackedDJs } = useAppContext();
  const navigation = useNavigation();

  const renderDJ = ({ item }) => {
    const image = getDjImage(item.name);

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('DJDetail', buildDjDetailNavParams(item.name))}
      >
        <ImageBackground
          source={image}
          style={styles.djItem}
          imageStyle={{ borderRadius: 10 }}
        >
          <View style={styles.overlay}>
            <Text style={styles.djName}>{item.name}</Text>
            <Text style={styles.djDate}>
              Subscribed: {formatSubscribeDate(item.subscribeDate)}
            </Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>My DJs</Text>
        <ProfileButton />
      </View>
      <FlatList
        data={trackedDJs}
        keyExtractor={keyForDj}
        renderItem={renderDJ}
        ListEmptyComponent={
          <Text style={styles.empty}>You are not subscribed to any DJs yet.</Text>
        }
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
  djItem: { height: 150, marginBottom: 15, justifyContent: 'flex-end' },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  djName: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  djDate: { fontSize: 14, color: '#ddd', marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 50, color: '#888' },
});

export default MyDJsScreen;
