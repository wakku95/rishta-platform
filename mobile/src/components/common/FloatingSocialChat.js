import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Platform, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Config } from '../../constants/config';
import { Colors } from '../../constants/colors';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * Global Floating Social Chat component for Mobile.
 * Renders compact Instagram DM & Facebook Messenger quick-chat floating icons at bottom-right.
 * Uses official Instagram gradient and authentic Facebook Messenger logo & brand color.
 * Features a staggered 3D flip animation (every ~5.5 seconds with 1 second stagger).
 */
export default function FloatingSocialChat() {
  const flipAnim1 = useRef(new Animated.Value(0)).current;
  const flipAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animationLoop = Animated.loop(
      Animated.sequence([
        // 1. Icon 1 (Instagram) flips in 650ms
        Animated.timing(flipAnim1, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        // 2. 350ms delay so Icon 2 starts exactly 1.0s after Icon 1 starts (650ms + 350ms = 1000ms)
        Animated.delay(350),
        // 3. Icon 2 (Facebook) flips in 650ms
        Animated.timing(flipAnim2, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        // 4. Rest period of 4 seconds before repeating
        Animated.delay(4000),
        // 5. Instantly reset both values back to 0
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
        ]),
      ])
    );

    animationLoop.start();
    return () => animationLoop.stop();
  }, [flipAnim1, flipAnim2]);

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

  return (
    <View pointerEvents="box-none" style={styles.floatingContainer}>
      {/* Instagram DM floating button (Authentic Gradient Background) */}
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

      {/* Facebook Messenger floating button (Official Messenger Icon & Blue) */}
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
    </View>
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
});
