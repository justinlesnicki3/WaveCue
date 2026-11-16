import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

import NightSky from '../components/welcome/NightSky'
import Island, { ISLAND_VIEW_W, ISLAND_VIEW_H } from '../components/welcome/Island'
import LakeWaves from '../components/welcome/LakeWaves'

const WATERLINE = 0.66 // fraction of screen height where the sea starts
const ISLAND_SINK = 10 // px of the island's base hidden under the water so it sits in the sea

export default function WelcomeScreen() {
    const navigation = useNavigation()
    const insets = useSafeAreaInsets()
    const { width, height } = useWindowDimensions()

    // ---------- layout ----------
    const waterTop = height * WATERLINE
    const islandW = Math.min(width * 0.92, 420)
    const islandH = (islandW / ISLAND_VIEW_W) * ISLAND_VIEW_H

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <NightSky width={width} height={waterTop} />

            {/* island on the horizon; the sea is drawn after it so the waves cover its base */}
            <View
                style={[
                    styles.island,
                    { left: (width - islandW) / 2, top: waterTop - islandH + ISLAND_SINK },
                ]}
                pointerEvents="none"
            >
                <Island width={islandW} />
            </View>

            <View style={[styles.lake, { top: waterTop }]}>
                <LakeWaves width={width} height={height - waterTop} />
            </View>

            {/* ---------- title (logo goes here later) ---------- */}
            <View style={[styles.titleWrap, { top: insets.top + 28 }]} pointerEvents="none">
                <Text style={styles.title}>WaveCue</Text>
            </View>

            {/* ---------- actions ---------- */}
            <View style={[styles.actions, { bottom: insets.bottom + 36 }]}>
                <TouchableOpacity
                    style={styles.startButton}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('Sign Up')}
                >
                    <Text style={styles.startText}>Start Cueing</Text>
                    <Ionicons name="arrow-forward" size={26} color="#0b1d3a" style={{ marginLeft: 10 }} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation.navigate('Log In')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text style={styles.loginText}>
                        Already have an account? <Text style={styles.loginLink}>Log In</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        overflow: 'hidden',
    },
    island: {
        position: 'absolute',
    },
    lake: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
    titleWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    title: {
        fontSize: 44,
        fontWeight: '900',
        color: '#4db8ff',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(77, 184, 255, 0.85)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 18,
    },
    actions: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        gap: 16,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#5ec2ff',
        paddingVertical: 15,
        paddingHorizontal: 34,
        borderRadius: 32,
        borderWidth: 2.5,
        borderColor: '#0b1d3a',
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    startText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0b1d3a',
    },
    loginText: {
        color: '#eaf6ff',
        fontSize: 14,
        textShadowColor: 'rgba(0, 0, 0, 0.45)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    loginLink: {
        fontWeight: '800',
        textDecorationLine: 'underline',
    },
})
