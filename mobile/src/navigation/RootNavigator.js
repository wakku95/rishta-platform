import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/colors';
import AuthStack from './AuthStack';
import AppStack from './AppStack';

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
    <NavigationContainer>
      {authenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.navy[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
