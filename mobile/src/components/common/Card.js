import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

export default function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.navy[850],
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.navy[750],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
});
