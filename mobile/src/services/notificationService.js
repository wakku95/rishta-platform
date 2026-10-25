import { Platform } from 'react-native';
import { notificationsApi } from '../api/notifications';

// Safely resolve Expo native modules without breaking Expo Go if a native module is missing
let Notifications = null;
let Device = null;

try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.warn('[Push] expo-notifications module could not be initialized:', e.message);
}

try {
  Device = require('expo-device');
} catch (e) {
  console.warn('[Push] expo-device module could not be initialized:', e.message);
}

// Configure foreground notification behavior if module is present
if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (err) {
    console.warn('[Push] setNotificationHandler notice:', err);
  }
}

/**
 * Configure Android notification channels
 */
export async function setupNotificationChannels() {
  if (Platform.OS === 'android' && Notifications && typeof Notifications.setNotificationChannelAsync === 'function') {
    try {
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
    } catch (e) {
      console.warn('[Push] setupNotificationChannels notice:', e);
    }
  }
}

/**
 * Register device for Expo Push Notifications and sync token with backend.
 */
export async function registerForPushNotificationsAsync() {
  if (!Notifications || !Device) {
    console.log('[Push] Push notifications module not active in this runtime');
    return null;
  }

  let token = null;

  try {
    if (Platform.OS === 'android') {
      await setupNotificationChannels();
    }

    if (Device.isDevice) {
      if (typeof Notifications.getPermissionsAsync !== 'function') {
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted' && typeof Notifications.requestPermissionsAsync === 'function') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Push] Notification permission not granted');
        return null;
      }

      if (typeof Notifications.getExpoPushTokenAsync === 'function') {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        token = tokenData?.data;

        if (token) {
          console.log('[Push] Expo push token obtained:', token);
          await notificationsApi.updatePushToken(token);
        }
      }
    } else {
      console.log('[Push] Push notifications require a physical device');
    }
  } catch (error) {
    console.warn('[Push] Error registering push notifications:', error?.message || error);
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
  if (!Notifications || typeof Notifications.addNotificationReceivedListener !== 'function') {
    return () => {};
  }

  let notificationListener = null;
  let responseListener = null;

  try {
    notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Push] Foreground notification received:', notification.request.content.title);
    });

    responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[Push] User tapped notification response');
      handleNotificationNavigation(navigationRef, response);
    });

    if (typeof Notifications.getLastNotificationResponseAsync === 'function') {
      Notifications.getLastNotificationResponseAsync().then((response) => {
        if (response) {
          handleNotificationNavigation(navigationRef, response);
        }
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('[Push] Error setting up notification listeners:', err);
  }

  return () => {
    try {
      if (notificationListener) {
        Notifications.removeNotificationSubscription(notificationListener);
      }
      if (responseListener) {
        Notifications.removeNotificationSubscription(responseListener);
      }
    } catch (e) {
      // quiet cleanup
    }
  };
}
