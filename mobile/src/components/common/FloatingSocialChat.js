import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Config } from '../../constants/config';
import { Colors } from '../../constants/colors';
import LiveChatModal from './LiveChatModal';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Global listener so any screen (e.g., MyProfileScreen) can open the same persistent Live Chat modal
let globalOpenLiveChatRef = null;
export function openGlobalLiveChat() {
  if (typeof globalOpenLiveChatRef === 'function') {
    globalOpenLiveChatRef();
  }
}

/**
 * Global Floating Social & Live Chat component for Mobile.
 * Renders compact Instagram DM, Facebook Messenger, & Live Chat floating icons at bottom-right.
 * Displays an unread numeric badge ("1", "2", etc.) on the Live Chat button when a support reply arrives.
 */
export default function FloatingSocialChat() {
  const insets = useSafeAreaInsets();
  const [liveChatOpen, setLiveChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const flipAnim1 = useRef(new Animated.Value(0)).current;
  const flipAnim2 = useRef(new Animated.Value(0)).current;
  const flipAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    globalOpenLiveChatRef = () => {
      setUnreadCount(0);
      setLiveChatOpen(true);
    };
    return () => {
      globalOpenLiveChatRef = null;
    };
  }, []);

  useEffect(() => {
    const animationLoop = Animated.loop(
      Animated.sequence([
        // 1. Icon 1 (Instagram) flips in 650ms
        Animated.timing(flipAnim1, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        // 2. 350ms delay so Icon 2 starts 1.0s after Icon 1
        Animated.delay(350),
        // 3. Icon 2 (Facebook) flips in 650ms
        Animated.timing(flipAnim2, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        // 4. 350ms delay so Icon 3 (Live Chat) starts 1.0s after Icon 2
        Animated.delay(350),
        // 5. Icon 3 (Live Chat) flips in 650ms
        Animated.timing(flipAnim3, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        // 6. Rest period before repeating
        Animated.delay(3500),
        // 7. Instantly reset all values back to 0
        Animated.parallel([
          Animated.timing(flipAnim1, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(flipAnim2, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(flipAnim3, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    animationLoop.start();
    return () => animationLoop.stop();
  }, [flipAnim1, flipAnim2, flipAnim3]);

  const rotateY1 = flipAnim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '360deg'],
  });
  const scale1 = flipAnim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.15, 1],
  });

  const rotateY2 = flipAnim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '360deg'],
  });
  const scale2 = flipAnim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.15, 1],
  });

  const rotateY3 = flipAnim3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '360deg'],
  });
  const scale3 = flipAnim3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.15, 1],
  });

  const handleOpenInstagram = () => {
    const appUrl = `instagram://user?username=${Config.INSTAGRAM_HANDLE}`;
    const webUrl = `https://www.instagram.com/${Config.INSTAGRAM_HANDLE}`;
    Linking.openURL(appUrl).catch(() => {
      Linking.openURL(webUrl).catch(() => {
        Linking.openURL(Config.INSTAGRAM_CHAT_URL);
      });
    });
  };

  const handleOpenFacebook = () => {
    Linking.openURL(Config.FACEBOOK_CHAT_URL).catch(() => {
      Linking.openURL(Config.FACEBOOK_PAGE_URL);
    });
  };

  const handleOpenLiveChat = () => {
    setUnreadCount(0);
    setLiveChatOpen(true);
  };

  const bottomPosition = 68 + Math.max(insets.bottom, 12);

  return (
    <>
      <View pointerEvents="box-none" style={[styles.floatingContainer, { bottom: bottomPosition }]}>
        {/* 1. Instagram DM floating button */}
        <AnimatedTouchable
          activeOpacity={0.82}
          style={[
            styles.floatingBtn,
            {
              transform: [{ rotateY: rotateY1 }, { scale: scale1 }],
            },
          ]}
          onPress={handleOpenInstagram}
          accessibilityLabel="Chat on Instagram DM"
          accessibilityRole="button"
        >
          <LinearGradient
            colors={['#F59E0B', '#F43F5E', '#C026D3', '#7C3AED']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientFill}
          >
            <Ionicons name="logo-instagram" size={20} color={Colors.white} />
          </LinearGradient>
        </AnimatedTouchable>

        {/* 2. Facebook Messenger floating button */}
        <AnimatedTouchable
          activeOpacity={0.82}
          style={[
            styles.floatingBtn,
            styles.messengerBtn,
            {
              transform: [{ rotateY: rotateY2 }, { scale: scale2 }],
            },
          ]}
          onPress={handleOpenFacebook}
          accessibilityLabel="Chat on Facebook Messenger"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="facebook-messenger" size={20} color={Colors.white} />
        </AnimatedTouchable>

        {/* 3. Live Chat Support floating button with Unread Count Badge */}
        <View style={styles.liveChatBtnWrapper}>
          <AnimatedTouchable
            activeOpacity={0.82}
            style={[
              styles.floatingBtn,
              {
                transform: [{ rotateY: rotateY3 }, { scale: scale3 }],
              },
            ]}
            onPress={handleOpenLiveChat}
            accessibilityLabel="Live Chat Support"
            accessibilityRole="button"
          >
            <LinearGradient
              colors={['#E11D48', '#DB2777', '#F43F5E']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientFill}
            >
              <Ionicons name="chatbubble-ellipses" size={19} color={Colors.white} />
            </LinearGradient>
          </AnimatedTouchable>

          {unreadCount > 0 && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleOpenLiveChat}
              style={styles.unreadBadge}
            >
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 9 ? '9+' : String(unreadCount)}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Persistent In-App Tawk.to Live Chat Overlay */}
      <LiveChatModal
        visible={liveChatOpen}
        onClose={() => setLiveChatOpen(false)}
        onUnreadMessage={() => setUnreadCount((prev) => prev + 1)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    right: 14,
    bottom: Platform.OS === 'ios' ? 96 : 76,
    zIndex: 9999,
    alignItems: 'center',
    gap: 8,
  },
  liveChatBtnWrapper: {
    position: 'relative',
  },
  floatingBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  gradientFill: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messengerBtn: {
    backgroundColor: '#0084FF',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: Colors.navy[950],
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 8,
  },
  unreadBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
});
