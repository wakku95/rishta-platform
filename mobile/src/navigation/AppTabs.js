import React, { useState, useEffect, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors } from '../constants/colors';
import MatchesScreen from '../screens/discovery/MatchesScreen';
import ShortlistScreen from '../screens/shortlist/ShortlistScreen';
import ProposalsScreen from '../screens/requests/ProposalsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import MyProfileScreen from '../screens/profile/MyProfileScreen';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { requestsApi } from '../api/requests';
import { notificationsApi } from '../api/notifications';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  const [pendingProposalsCount, setPendingProposalsCount] = useState(0);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  const fetchBadgeCounts = useCallback(async () => {
    try {
      const [countsRes, notifsRes] = await Promise.allSettled([
        requestsApi.getRequestCounts(),
        notificationsApi.getNotifications(),
      ]);

      if (countsRes.status === 'fulfilled' && countsRes.value?.success) {
        setPendingProposalsCount(countsRes.value?.data?.pending_received || 0);
      }

      if (notifsRes.status === 'fulfilled') {
        const unread = notifsRes.value?.unread_count || 0;
        setUnreadAlertsCount(unread);
      }
    } catch (e) {
      // quiet fail
    }
  }, []);

  useEffect(() => {
    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 45000);
    return () => clearInterval(interval);
  }, [fetchBadgeCounts]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.navy[950],
          borderTopColor: Colors.navy[800],
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 86 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.magenta[400],
        tabBarInactiveTintColor: Colors.slate[500],
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Matches') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Shortlist') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Proposals') {
            iconName = focused ? 'mail' : 'mail-outline';
          } else if (route.name === 'Alerts') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Matches" component={MatchesScreen} options={{ tabBarLabel: 'Matches' }} />
      <Tab.Screen name="Shortlist" component={ShortlistScreen} options={{ tabBarLabel: 'Shortlist' }} />
      <Tab.Screen
        name="Proposals"
        component={ProposalsScreen}
        options={{
          tabBarLabel: 'Proposals',
          tabBarBadge: pendingProposalsCount > 0 ? (pendingProposalsCount > 99 ? '99+' : pendingProposalsCount) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.magenta[500],
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 'bold',
          },
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarBadge: unreadAlertsCount > 0 ? (unreadAlertsCount > 99 ? '99+' : unreadAlertsCount) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.magenta[500],
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 'bold',
          },
        }}
      />
      <Tab.Screen name="Profile" component={MyProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}
