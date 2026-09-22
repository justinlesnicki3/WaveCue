import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon } from 'react-native-heroicons/solid'
import { signUpWithEmail } from '../services/authService'

export default function SignUpScreen() {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!email.trim() || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill out all fields');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await signUpWithEmail(email.trim(), password);
            Alert.alert('Success', 'Check your email to confirm your account!');
        } catch (err) {
            Alert.alert('Error', err?.message ?? 'Sign up failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <ArrowLeftIcon size={22} color="#fff" />
            </TouchableOpacity>

            <View style={styles.topSpacer} />

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>to get started now!</Text>

            <View style={styles.card}>
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#ccc"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <View style={styles.passwordRow}>
                    <TextInput
                        style={styles.passwordInput}
                        placeholder="Password"
                        placeholderTextColor="#ccc"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword((prev) => !prev)}
                        style={styles.eyeButton}
                    >
                        {showPassword ? (
                            <EyeSlashIcon size={20} color="#ccc" />
                        ) : (
                            <EyeIcon size={20} color="#ccc" />
                        )}
                    </TouchableOpacity>
                </View>

                <TextInput
                    style={[styles.input, { marginBottom: 18 }]}
                    placeholder="Confirm Password"
                    placeholderTextColor="#ccc"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                />

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleSignUp}
                    disabled={loading}
                >
                    <Text style={styles.primaryButtonText}>
                        {loading ? 'Loading...' : 'Sign Up'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.bottomSpacer} />

            <View style={styles.noAccount}>
                <Text style={styles.noAccountText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Log In')}>
                    <Text style={styles.link}>Login Now</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d0d0f', paddingHorizontal: 24 },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    topSpacer: { flex: 1 },
    title: { color: '#4db8ff', fontSize: 24, fontWeight: '700', textAlign: 'center' },
    subtitle: { color: '#4db8ff', fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 24 },
    card: {
        backgroundColor: '#3a3a3d',
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#fff',
        padding: 20,
    },
    input: {
        backgroundColor: '#555558',
        borderWidth: 1,
        borderColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: '#fff',
        marginBottom: 14,
    },
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#555558',
        borderWidth: 1,
        borderColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 16,
        marginBottom: 14,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 12,
        color: '#fff',
    },
    eyeButton: { paddingLeft: 8 },
    primaryButton: {
        backgroundColor: '#4db8ff',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
    },
    primaryButtonText: { color: '#111', fontSize: 17, fontWeight: '700' },
    bottomSpacer: { flex: 1 },
    noAccount: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingBottom: 24,
    },
    noAccountText: { color: '#eee', fontSize: 14 },
    link: { color: '#4db8ff', fontSize: 14, fontWeight: '700' },
})