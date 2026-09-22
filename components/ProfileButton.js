import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Circular profile icon shown top-right on every main screen, Apple Music
// style. Tapping it opens Settings. Swap the Ionicon for a real avatar Image
// once user profile pictures exist.
export default function ProfileButton({ size = 34, color = '#33498e' }) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => navigation.navigate('Settings')}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="person-circle" size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    overflow: 'hidden',
  },
});
