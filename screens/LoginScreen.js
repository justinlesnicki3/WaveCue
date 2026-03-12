import { View, Text, Image, StyleSheet, TouchableOpacity} from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import {themeColors} from '../theme'
import {ArrowLeftIcon} from 'react-native-heroicons/solid'
import { useNavigation } from '@react-navigation/native'

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
                <View>
                    
                </View>
            </SafeAreaView>
        </View>
    )
}

const styles = StyleSheet.create ({

    container: { flex: 1, backgroundColor: themeColors.bg },
    areaView: {flex: 1},
    arrowIcon: {backgroundColor: 'white', padding: 8, borderTopRightRadius: 16, borderBottomLeftRadius: 16, marginLeft: 16, width: 45},



})