import { View, Text, Image, StyleSheet, TouchableOpacity} from 'react-native'
import React from 'react'
import {themeColors} from '../theme'

export default function SignUpScreen() {
    return (
        <View style={styles.container}>
            <Text>Sign Up Screen</Text>
        </View>
    )
}

const styles = StyleSheet.create ({

    container: { flex: 1, backgroundColor: themeColors.bg }


})