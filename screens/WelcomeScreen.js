import { View, Text, Image, StyleSheet, TouchableOpacity} from 'react-native'
import React from 'react' 
import { SafeAreaView } from 'react-native-safe-area-context'
import {themeColors} from '../theme'
import turnTableIMG from '../assets/images/turntable.png'

export default function WelcomeScreen() {
    return (
        <SafeAreaView style={[styles.container]}>
            <View style={styles.mainView}>
                <Text 
                    style={styles.text}>
                    Let's Get Started!
                </Text>
            <View style={styles.imagePlacement}>
                <Image source={turnTableIMG} style={styles.image} />
            </View>
            <View className="space-y-4" />
            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>
                    Sign Up
                </Text>
            </TouchableOpacity>
            <View style={styles.logInLine}>
                <Text style={styles.logText}>Already have an account?</Text>
                <TouchableOpacity>
                    <Text style={styles.loginButton}> Log In </Text>
                </TouchableOpacity>
            </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create ({

    container: { flex: 1, backgroundColor: themeColors.bg },
    text: {color: 'white', fontSize: 36, fontWeight: 'bold', textAlign: 'center'},
    imagePlacement: {flexDirection: 'row', justifyContent: 'center'},
    image: {width: 250, height: 250},
    mainView: { flex: 1, justifyContent: 'space-around', marginVertical: 16,},
    button: {backgroundColor: 'gold', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 25, alignItems: 'center', marginHorizontal: 20},
    buttonText: {color: 'black', fontSize: 25, fontWeight: 'bold'},
    logInLine: {flexDirection: 'row', justifyContent: 'center'},
    logText: {color: 'white', fontWeight: 'bold'},
    loginButton: {color: 'gold', fontWeight: 'bold'}

})