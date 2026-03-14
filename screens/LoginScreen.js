import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput} from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import {themeColors} from '../theme'
import {ArrowLeftIcon} from 'react-native-heroicons/solid'
import { useNavigation } from '@react-navigation/native'
import loginIMG from '../assets/images/logIn.png'
import GoogleIMG from '../assets/images/Google_logo.png'
import AppleIMG from '../assets/images/apple_logo.png'

export default function LoginScreen() {
    const navigation = useNavigation();
    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.areaView}>
                <View>
                    <TouchableOpacity style={styles.arrowIcon}
                        onPress={()=> navigation.goBack()}
                    >
                        <ArrowLeftIcon size="30" color="black"></ArrowLeftIcon>
                    </TouchableOpacity>
                </View>
                <View style={styles.imagePlacement}>
                    <Image source={loginIMG} style={styles.loginImage}/>
                </View>
            </SafeAreaView>
            <View style={styles.textBox}>
                <View style={styles.emailBox}>
                    <Text style={styles.emailText}>Email Address</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder='Enter Email'
                    />
                    <Text style={styles.emailText}>Password</Text>
                    <TextInput
                        style={styles.textInput}
                        secureTextEntry={true}
                        placeholder='Enter Password'
                    />
                    <TouchableOpacity style={styles.forgotButton}>
                        <Text>Forgot Password?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.loginButton}>
                        <Text style={styles.loginText}>Login</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.orOption}>
                    Or
                </Text>
                <View style={styles.optionalSocials}>
                    <TouchableOpacity style={styles.iconButtons}>
                        <Image source={GoogleIMG} style={styles.googleImage} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButtons}>
                        <Image source={AppleIMG} style={styles.googleImage} />
                    </TouchableOpacity>
                </View>
                <View style={styles.noAccount}>
                    <Text style={styles.noAccountText}>Don't have an account?</Text>
                    <TouchableOpacity onPress={()=> navigation.navigate('Sign Up')}>
                        <Text style={styles.signUpButton}> Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create ({

    container: { flex: 1, backgroundColor: '#D8B4FE' },
    areaView: {flex: 1},
    arrowIcon: {backgroundColor: 'white', padding: 8, borderTopRightRadius: 16, borderBottomLeftRadius: 16, marginLeft: 16, width: 45},
    loginImage: {width: 300, height: 300},
    imagePlacement: {flexDirection: 'row', justifyContent: 'center'},
    textBox: {flex: 1, backgroundColor: 'white', paddingHorizontal: 8, paddingTop: 8, borderTopLeftRadius: 50, borderTopRightRadius: 50},
    emailBox: {marginBottom: 8, marginTop: 10},
    emailText: {color: '#374151', marginLeft: 25, paddingTop: 10, paddingBottom: 5},
    textInput: {padding: 16, backgroundColor: '#F3F4F6', color: '#374151', borderRadius: 16, marginHorizontal: 30, paddingTop: 15, marginBottom: 10},
    forgotButton: {alignItems: 'flex-end', color: '#374151', marginBottom: 5, marginRight: 35},
    loginButton: {paddingVertical: 10, backgroundColor: '#FBBF24', borderRadius: 12, marginHorizontal: 45, marginTop: 20},
    loginText: {fontWeight: 'bold', textAlign: 'center', color: '#374151'},
    orOption: {fontSize: 20, color: '#374151', fontWeight: 'bold', textAlign: 'center', paddingVertical: 10},
    googleImage: {width: 35, height: 35},
    optionalSocials: {flexDirection: 'row', justifyContent: 'center', gap: 38},
    iconButtons: {padding: 8, backgroundColor: '#F3F4F6', borderRadius: 16},
    noAccount: {flexDirection: 'row', justifyContent: 'center', marginTop: 24},
    noAccountText: {fontWeight: '600', color: '#374151'},
    signUpButton: {color: '#FBBF24'}


})