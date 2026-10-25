import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { notificationsApi } from '../api/notifications';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Configure Android notification channels
 */
export async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#e11d48',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('proposals', {
      name: 'Proposals & Matches',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#9333ea',
      sound: 'default',
    });
  }
}

/**
 * Register device for Expo Push Notifications and sync token with backend.
 */
export async function registerForPushNotificationsAsync() {
  let token = null;

  try {
    if (Platform.OS === 'android') {
      await setupNotificationChannels();
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Push] Notification permission not granted');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      token = tokenData.data;

      if (token) {
        console.log('[Push] Expo push token obtained:', token);
        await notificationsApi.updatePushToken(token);
      }
    } else {
      console.log('[Push] Push notifications require a physical device');
    }
  } catch (error) {
    console.warn('[Push] Error registering push notifications:', error);
  }

  return token;
}

/**
 * Navigate to target screen based on notification payload action.
 */
export function handleNotificationNavigation(navigationRef, response) {
  try {
    const data = response?.notification?.request?.content?.data || {};
    const action = data.action;

    if (!navigationRef?.isReady?.()) {
      return;
    }

    switch (action) {
      case 'new_proposal':
        navigationRef.navigate('MainTabs', {
          screen: 'Proposals',
          params: { tab: 'received' },
        });
        break;

      case 'proposal_accepted':
        navigationRef.navigate('MainTabs', {
          screen: 'Proposals',
          params: { tab: 'accepted' },
        });
        break;

      case 'photo_request':
        navigationRef.navigate('MainTabs', {
          screen: 'Proposals',
          params: {
            tab: 'received',
            requestCode: data.params?.request_code,
          },
        });
        break;

      case 'photo_approved':
        navigationRef.navigate('MainTabs', {
          screen: 'Proposals',
          params: {
            requestCode: data.params?.request_code,
          },
        });
        break;

      case 'cnic_verified':
      case 'cnic_rejected':
        navigationRef.navigate('Verification');
        break;

      default:
        if (data.screen) {
          navigationRef.navigate(data.screen, data.params || {});
        } else {
          navigationRef.navigate('MainTabs', { screen: 'Notifications' });
        }
        break;
    }
  } catch (err) {
    console.warn('[Push] Error handling notification navigation:', err);
  }
}

/**
 * Setup listeners for foreground notification reception and user interaction/taps.
 */
export function setupNotificationListeners(navigationRef) {
  const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
    // Notification received while app is in foreground
    console.log('[Push] Foreground notification received:', notification.request.content.title);
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    // User tapped notification
    console.log('[Push] User tapped notification response');
    handleNotificationNavigation(navigationRef, response);
  });

  // Check if app was launched via a notification tap
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      handleNotificationNavigation(navigationRef, response);
    }
  });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}
