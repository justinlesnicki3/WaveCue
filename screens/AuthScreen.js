// import React, { useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
// import { signInWithEmail, signUpWithEmail } from '../services/auth'; // import authentication functions from auth.js

// function AuthScreen({ navigation }) { //main authentication component to navigate between screens
  
//   const [email, setEmail] = useState('');   //initialize state variables with useState
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const handleSignUp = async () => {    //function to handle sign ups for new members
//     setError('');
//     try {
//       setLoading(true);
//       await signUpWithEmail(email.trim(), password);
//       Alert.alert('Success', 'Check your email for the confirmation link!');
//     } catch (err) {
//       setError(err?.message ?? 'Sign up failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSignIn = async () => { //function to authenticate returning user
//     setError('');
//     try {
//       setLoading(true);
//       await signInWithEmail(email.trim(), password);
//       navigation.navigate('Home');
//     } catch (err) {
//       setError(err?.message ?? 'Sign in failed');
//     } finally {
//       setLoading(false);
//     }
//   };
//             // UI Components
//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Welcome to DJ Set Tracker</Text>

//       {error ? <Text style={styles.error}>{error}</Text> : null}

//       <TextInput    //Email input
//         style={styles.input}
//         placeholder="Email"
//         placeholderTextColor="#999"
//         onChangeText={setEmail}
//         autoCapitalize="none"
//         value={email}
//       />

//       <TextInput    //Password Input
//         style={styles.input}
//         placeholder="Password"
//         placeholderTextColor="#999"
//         secureTextEntry
//         onChangeText={setPassword}
//         value={password}
//       />

//       <TouchableOpacity   //Sign in button
//         style={[styles.button, { backgroundColor: '#33498e', opacity: loading ? 0.7 : 1 }]}
//         onPress={handleSignIn}
//         disabled={loading}
//       >
//         <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Sign In'}</Text>
//       </TouchableOpacity>

//       <TouchableOpacity   //Sign up button
//         style={[styles.button, { backgroundColor: '#555', opacity: loading ? 0.7 : 1 }]}
//         onPress={handleSignUp}
//         disabled={loading}
//       >
//         <Text style={styles.buttonText}>Sign Up</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }
//     // Stylesheet

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
//   title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
//   input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 12, color: '#000' },
//   button: { paddingVertical: 14, borderRadius: 8, marginVertical: 8, alignItems: 'center' },
//   buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
//   error: { color: 'red', marginBottom: 10, textAlign: 'center' },
// });

// export default AuthScreen;
