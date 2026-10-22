import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

/**
 * Gender-based Avatar component for RaabtaNow candidate profiles.
 * Seamlessly matches the official web platform avatars with graceful fallbacks.
 */
export default function GenderAvatar({
  gender = 'female',
  size = 48,
  photoUrl = null,
  style,
}) {
  const isMale = String(gender).toLowerCase() === 'male';

  const defaultAvatar = isMale
    ? require('../../../assets/male_avatar.png')
    : require('../../../assets/female_avatar.png');

  const borderRadius = Math.round(size * 0.28);

  return (
    <View
      style={[
        styles.avatarContainer,
        {
          width: size,
          height: size,
          borderRadius,
          borderColor: isMale ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)',
          backgroundColor: isMale ? 'rgba(6, 78, 59, 0.25)' : 'rgba(136, 19, 55, 0.25)',
        },
        style,
      ]}
    >
      <Image
        source={photoUrl ? { uri: photoUrl } : defaultAvatar}
        style={{
          width: size - 4,
          height: size - 4,
          borderRadius: borderRadius - 2,
        }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
