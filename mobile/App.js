import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import * as ScreenCapture from 'expo-screen-capture';

export default function App() {
  useEffect(() => {
    // Strictly restrict screenshots and screen recordings across all app windows to preserve member privacy
    ScreenCapture.preventScreenCaptureAsync().catch((err) => {
      console.warn('Screenshot prevention notice:', err);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
