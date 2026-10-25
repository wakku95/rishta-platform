import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/colors';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import FloatingSocialChat from '../components/common/FloatingSocialChat';

export default function RootNavigator() {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color={Colors.magenta[500]} />
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <NavigationContainer>
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
