// App.js
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import React, {useState, useEffect} from 'react';
import { supabase } from './lib/supabase';

import { AppProvider } from './AppContext';
import SearchScreen from './screens/SearchScreen';
import MyDJsScreen from './screens/MyDJsScreen';
import NewSetsScreen from './screens/NewSetsScreen';
import DJDetailScreen from './screens/DJDetailScreen';
import DJLibraryScreen from './screens/DJLibraryScreen';
import MyLeaksScreen from './screens/MyLeaksScreen';
import ClipScreen from './screens/ClipScreen';
import ClipPlayerScreen from './screens/ClipPlayerScreen';
import PlaylistDetailScreen from './screens/PlaylistDetailScreen';
import SettingsScreen from './screens/SettingsScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import LogIn from './screens/LoginScreen';
import SignUp from './screens/SignUpScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'My DJs':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            case 'New Sets':
              iconName = focused ? 'musical-notes' : 'musical-notes-outline';
              break;
            case 'My Clips':
              iconName = focused ? 'albums' : 'albums-outline';
              break;
            case 'Library':
              iconName = focused ? 'library' : 'library-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#33498e',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="My DJs" component={MyDJsScreen} />
      <Tab.Screen name="New Sets" component={NewSetsScreen} />
      <Tab.Screen name="My Clips" component={MyLeaksScreen} />
      <Tab.Screen name="Library" component={DJLibraryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {

      const [session, setSession] = useState(null);

      useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
        supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    }, []);

  return (
  <GestureHandlerRootView style={{ flex: 1}}>
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          {session ? (
          <>
            <Stack.Screen name="Home" component={MainTabs} />
            <Stack.Screen name="DJDetail" component={DJDetailScreen} />
            <Stack.Screen name="Clip" component={ClipScreen} />
            <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
            <Stack.Screen name="ClipPlayer" component={ClipPlayerScreen} />
          </>
          ) : (
            <>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Log In" component={LogIn} /> 
              <Stack.Screen name="Sign Up" component={SignUp} /> 
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  </GestureHandlerRootView>
  );
}