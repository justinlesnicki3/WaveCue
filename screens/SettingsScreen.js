// screens/SettingsScreen.js
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getUser, signOut } from '../services/authService';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await getUser();
        if (mounted) setEmail(user?.email ?? '');
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (e) {
            Alert.alert('Logout failed', e?.message ?? 'Unknown error');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-down" size={26} color="#111" />
        </TouchableOpacity>
        <Text style={styles.header}>Settings</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.value}>{email || '—'}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  header: { fontSize: 24, fontWeight: 'bold' },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fafafa',
    marginBottom: 18,
  },
  label: { color: '#666', marginBottom: 6, fontWeight: '600' },
  value: { fontSize: 16, fontWeight: '700', color: '#111' },
  logoutBtn: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
