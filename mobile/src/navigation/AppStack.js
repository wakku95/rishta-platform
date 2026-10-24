import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppTabs from './AppTabs';
import CandidateDetailScreen from '../screens/discovery/CandidateDetailScreen';
import AssistedDetailScreen from '../screens/discovery/AssistedDetailScreen';
import VerificationScreen from '../screens/profile/VerificationScreen';
import ProposalsScreen from '../screens/requests/ProposalsScreen';

const Stack = createNativeStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={AppTabs} />
      <Stack.Screen name="CandidateDetail" component={CandidateDetailScreen} />
      <Stack.Screen name="AssistedDetail" component={AssistedDetailScreen} />
      <Stack.Screen name="Verification" component={VerificationScreen} />
      <Stack.Screen name="Proposals" component={ProposalsScreen} />
    </Stack.Navigator>
  );
}
