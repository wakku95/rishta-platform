import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/colors';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import FloatingSocialChat from '../components/common/FloatingSocialChat';
import * as SplashScreen from 'expo-splash-screen';
import {
  registerForPushNotificationsAsync,
  setupNotificationListeners,
} from '../services/notificationService';

export default function RootNavigator() {
  const { user, authenticated, loading } = useAuth();
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loading]);

  useEffect(() => {
    if (authenticated) {
      registerForPushNotificationsAsync();
      const unsubscribe = setupNotificationListeners(navigationRef);
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [authenticated]);

  if (loading) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require('../../assets/splash-logo-square.png')}
          style={styles.splashLogo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={Colors.magenta[500]} />
      </View>
    );
  }

  // Keying the NavigationContainer by user ID guarantees that on logout or switching accounts,
  // the entire navigation stack is completely destroyed and recreated from scratch at the default route.
  const navKey = user?.id ? `user-session-${user.id}` : 'guest-session';

  return (
    <View style={styles.rootContainer}>
      <NavigationContainer ref={navigationRef} key={navKey}>
        {authenticated ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
      <FloatingSocialChat />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: Colors.navy[950],
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 240,
    height: 240,
    marginBottom: 8,
  },
});
