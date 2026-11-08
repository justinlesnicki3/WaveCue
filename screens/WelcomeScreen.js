import React, { useCallback, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useFonts, Shrikhand_400Regular } from '@expo-google-fonts/shrikhand'
import { DJ_DATABASE } from '../djData'

import NightSky from '../components/welcome/NightSky'
import ChicagoSkyline, {
    SKYLINE_VIEW_W,
    SKYLINE_VIEW_H,
    SPOTLIGHT_ANCHORS,
} from '../components/welcome/ChicagoSkyline'
import Spotlight from '../components/welcome/Spotlight'
import LakeWaves from '../components/welcome/LakeWaves'

const WATERLINE = 0.66 // fraction of screen height where the lake starts

export default function WelcomeScreen() {
    const navigation = useNavigation()
    const insets = useSafeAreaInsets()
    const { width, height } = useWindowDimensions()
    // retro lettering for the DJ names in the spotlights (falls back to a system font until loaded)
    const [badgeFontLoaded] = useFonts({ Shrikhand_400Regular })
    const badgeFont = badgeFontLoaded ? 'Shrikhand_400Regular' : undefined

    // ---------- layout ----------
    const waterTop = height * WATERLINE
    const scale = width / SKYLINE_VIEW_W
    const skylineTop = waterTop - SKYLINE_VIEW_H * scale
    const anchor = (a) => ({ x: a.x * scale, y: skylineTop + a.y * scale })
    const willis = anchor(SPOTLIGHT_ANCHORS.willis)
    const hancock = anchor(SPOTLIGHT_ANCHORS.hancock)
    // beams reach up to just below the title
    const beamLength = Math.max(160, Math.min(willis.y, hancock.y) - insets.top - 95)

    // ---------- DJ names in the spotlights (never the same name in both) ----------
    const djNames = DJ_DATABASE.map((dj) => dj.name)
    const shownNames = useRef({})
    const pickName = useCallback((beamId) => {
        const taken = Object.entries(shownNames.current)
            .filter(([id]) => id !== beamId)
            .map(([, n]) => n)
        const choices = djNames.filter((n) => n !== shownNames.current[beamId] && !taken.includes(n))
        const pool = choices.length ? choices : djNames
        const next = pool[Math.floor(Math.random() * pool.length)] ?? ''
        shownNames.current[beamId] = next
        return next
    }, [])

    // where each beam's glow currently points, so the two never land on the same spot
    const sharedSpots = useRef({}).current

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <NightSky width={width} height={waterTop} />

            {/* beams sit behind the skyline so they rise out of the rooftops */}
            <Spotlight
                id="willis"
                originX={willis.x}
                originY={willis.y + 4}
                length={beamLength}
                screenWidth={width}
                sharedSpots={sharedSpots}
                minDeg={-40}
                maxDeg={15}
                colorOffset={0}
                fontFamily={badgeFont}
                pickName={pickName}
            />
            <Spotlight
                id="hancock"
                originX={hancock.x}
                originY={hancock.y + 4}
                length={beamLength}
                screenWidth={width}
                sharedSpots={sharedSpots}
                minDeg={-15}
                maxDeg={40}
                colorOffset={3}
                startDelay={2500}
                fontFamily={badgeFont}
                pickName={pickName}
            />

            <View style={[styles.skyline, { top: skylineTop }]} pointerEvents="none">
                <ChicagoSkyline width={width} />
            </View>

            {/* lamp glow on each rooftop */}
            {[willis, hancock].map((p, i) => (
                <View key={i} style={[styles.lamp, { left: p.x - 6, top: p.y - 2 }]} pointerEvents="none" />
            ))}

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
    skyline: {
        position: 'absolute',
        left: 0,
    },
    lamp: {
        position: 'absolute',
        width: 12,
        height: 6,
        borderRadius: 4,
        backgroundColor: '#fff8d6',
        shadowColor: '#fff8d6',
        shadowOpacity: 1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 0 },
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
