import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

export default function Badge({
  label,
  variant = 'default', // 'success', 'gold', 'magenta', 'danger', 'default'
  size = 'sm',
  icon: Icon = null,
  style,
}) {
  const getBadgeColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.4)',
          text: Colors.emerald[400],
        };
      case 'gold':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.4)',
          text: Colors.gold[400],
        };
      case 'magenta':
        return {
          bg: 'rgba(225, 29, 116, 0.15)',
          border: 'rgba(225, 29, 116, 0.4)',
          text: Colors.magenta[400],
        };
      case 'danger':
        return {
          bg: 'rgba(244, 63, 94, 0.15)',
          border: 'rgba(244, 63, 94, 0.4)',
          text: Colors.rose[400],
        };
      default:
        return {
          bg: Colors.navy[800],
          border: Colors.slate[700],
          text: Colors.slate[300],
        };
    }
  };

  const colors = getBadgeColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          paddingVertical: size === 'sm' ? 2 : 4,
          paddingHorizontal: size === 'sm' ? 8 : 10,
        },
        style,
      ]}
    >
      {Icon && <Icon style={{ marginRight: 4 }} />}
      <Text style={[styles.text, { color: colors.text, fontSize: size === 'sm' ? 10 : 12 }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
