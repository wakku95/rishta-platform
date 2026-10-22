import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/colors';

export default function Button({
  title,
  onPress,
  variant = 'primary', // 'primary', 'gold', 'secondary', 'ghost', 'danger'
  size = 'md',        // 'sm', 'md', 'lg'
  disabled = false,
  loading = false,
  icon: Icon = null,
  style,
  textStyle,
}) {
  const getBackgroundColor = () => {
    if (disabled) return Colors.navy[750];
    switch (variant) {
      case 'primary':
        return Colors.magenta[500];
      case 'gold':
        return Colors.gold[500];
      case 'secondary':
        return Colors.navy[800];
      case 'danger':
        return Colors.rose[600];
      case 'ghost':
        return 'transparent';
      default:
        return Colors.magenta[500];
    }
  };

  const getTextColor = () => {
    if (disabled) return Colors.slate[500];
    switch (variant) {
      case 'gold':
        return Colors.navy[950];
      case 'secondary':
      case 'ghost':
        return Colors.slate[200];
      case 'primary':
      case 'danger':
      default:
        return Colors.white;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 12 };
      case 'lg':
        return { paddingVertical: 14, paddingHorizontal: 20 };
      case 'md':
      default:
        return { paddingVertical: 12, paddingHorizontal: 16 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 12;
      case 'lg':
        return 16;
      case 'md':
      default:
        return 14;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'secondary' ? Colors.slate[700] : 'transparent',
          borderWidth: variant === 'secondary' ? 1 : 0,
          ...getPadding(),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {Icon && <Icon style={{ marginRight: 6 }} />}
          <Text style={[styles.text, { color: getTextColor(), fontSize: getFontSize() }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
