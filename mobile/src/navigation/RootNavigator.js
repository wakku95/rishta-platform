import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/colors';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import FloatingSocialChat from '../components/common/FloatingSocialChat';
import {
  registerForPushNotificationsAsync,
  setupNotificationListeners,
} from '../services/notificationService';

export default function RootNavigator() {
  const { authenticated, loading } = useAuth();
  const navigationRef = useNavigationContainerRef();

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
        <ActivityIndicator size="large" color={Colors.magenta[500]} />
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <NavigationContainer ref={navigationRef}>
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
    backgroundColor: Colors.navy[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
