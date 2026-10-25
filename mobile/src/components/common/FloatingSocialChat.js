import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Config } from '../../constants/config';
import { Colors } from '../../constants/colors';

/**
 * Global Floating Social Chat component for Mobile.
 * Renders compact Instagram DM & Facebook Messenger quick-chat floating icons at bottom-right.
 */
export default function FloatingSocialChat() {
  const handleOpenInstagram = () => {
    Linking.openURL(Config.INSTAGRAM_CHAT_URL).catch(() => {
      Linking.openURL(`https://instagram.com/${Config.INSTAGRAM_HANDLE}`);
    });
  };

  const handleOpenFacebook = () => {
    Linking.openURL(Config.FACEBOOK_CHAT_URL).catch(() => {
      Linking.openURL(Config.FACEBOOK_PAGE_URL);
    });
  };

  return (
    <View pointerEvents="box-none" style={styles.floatingContainer}>
      {/* Instagram DM floating button */}
      <TouchableOpacity
        activeOpacity={0.82}
        style={[styles.floatingBtn, styles.instagramBtn]}
        onPress={handleOpenInstagram}
        accessibilityLabel="Chat on Instagram DM"
        accessibilityRole="button"
      >
        <Ionicons name="logo-instagram" size={19} color={Colors.white} />
      </TouchableOpacity>

      {/* Facebook Messenger floating button */}
      <TouchableOpacity
        activeOpacity={0.82}
        style={[styles.floatingBtn, styles.facebookBtn]}
        onPress={handleOpenFacebook}
        accessibilityLabel="Chat on Facebook Messenger"
        accessibilityRole="button"
      >
        <Ionicons name="logo-facebook" size={19} color={Colors.white} />
      </TouchableOpacity>
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
  instagramBtn: {
    backgroundColor: '#E1306C',
  },
  facebookBtn: {
    backgroundColor: '#1877F2',
  },
});
