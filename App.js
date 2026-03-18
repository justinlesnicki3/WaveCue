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

  const icons = {
    Search: ['search', 'search-outline'],
    'My DJs': ['heart', 'heart-outline'],
    'New Sets': ['musical-notes', 'musical-notes-outline'],
    'My Clips': ['albums', 'albums-outline'],
    Library: ['library', 'library-outline'],
    Settings: ['settings', 'settings-outline'],

  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const [activeIcon, inactiveIcon] = icons[route.name] ?? ['help-circle-outline', 'help-circle-outline'];
          return <Ionicons name={focused ? activeIcon : inactiveIcon} size={size} color={color} />;
        },

        tabBarActiveTintColor: '#33498e',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,

        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          borderRadius: 20,
          height: 60,
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.3,
          shadowRadius: 8,

        },

        

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