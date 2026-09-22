import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { DJ_DATABASE } from '../djData'

const HOLD_MS = 1400;        // how long the name stays fully visible
const BREATHE_OUT_MS = 700;  // fade + shrink away
const BREATHE_IN_MS = 700;   // fade + grow in

export default function WelcomeScreen() {
    const navigation = useNavigation();
    const [nameIndex, setNameIndex] = useState(0);
    const breatheAnim = useRef(new Animated.Value(0)).current; // 0 = invisible, 1 = fully visible

    const djNames = DJ_DATABASE.map((dj) => dj.name);
    const currentName = djNames[nameIndex] ?? '';

    useEffect(() => {
        if (djNames.length === 0) return;
        let cancelled = false;

        const cycle = () => {
            Animated.timing(breatheAnim, {
                toValue: 1,
                duration: BREATHE_IN_MS,
                useNativeDriver: true,
            }).start(() => {
                if (cancelled) return;

                setTimeout(() => {
                    if (cancelled) return;

                    Animated.timing(breatheAnim, {
                        toValue: 0,
                        duration: BREATHE_OUT_MS,
                        useNativeDriver: true,
                    }).start(() => {
                        if (cancelled) return;

                        setNameIndex((prev) => (prev + 1) % djNames.length);
                        cycle();
                    });
                }, HOLD_MS);
            });
        };

        cycle();

        return () => {
            cancelled = true;
        };
    }, [djNames.length]);

    const scale = breatheAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.85, 1],
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topSection}>
                <Text style={styles.logo}>WaveCue</Text>
            </View>

            <View style={styles.middleSection}>
                <Text style={styles.headlineStatic}>New Set from</Text>
                <Animated.Text
                    style={[
                        styles.djName,
                        {
                            opacity: breatheAnim,
                            transform: [{ scale }],
                        },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.5}
                >
                    {currentName}
                </Animated.Text>
            </View>

            <View style={styles.bottomSection}>
                <TouchableOpacity
                    style={styles.logInButton}
                    onPress={() => navigation.navigate('Log In')}
                >
                    <Text style={styles.logInButtonText}>Log In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.signUpButton}
                    onPress={() => navigation.navigate('Sign Up')}
                >
                    <Text style={styles.signUpButtonText}>Sign Up</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d0d0f',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    topSection: {
        alignItems: 'center',
        paddingTop: 20,
    },
    logo: {
        fontSize: 30,
        fontStyle: 'italic',
        fontWeight: '700',
        color: '#4db8ff',
    },
    middleSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    headlineStatic: {
        fontSize: 30,
        fontStyle: 'italic',
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },
    djName: {
        fontSize: 30,
        fontStyle: 'italic',
        fontWeight: '700',
        color: '#4db8ff',
        textAlign: 'center',
        width: '100%',
        textShadowColor: 'rgba(77, 184, 255, 0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 16,
    },
    bottomSection: {
        gap: 12,
    },
    logInButton: {
        backgroundColor: '#4db8ff',
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: 'center',
    },
    logInButtonText: {
        color: '#111',
        fontSize: 16,
        fontWeight: '700',
    },
    signUpButton: {
        backgroundColor: 'transparent',
        paddingVertical: 15,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#4db8ff',
        alignItems: 'center',
    },
    signUpButtonText: {
        color: '#4db8ff',
        fontSize: 16,
        fontWeight: '700',
    },
})