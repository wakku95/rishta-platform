import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error = null,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
}) {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.slate[500]}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[
          styles.input,
          multiline && { height: 24 * numberOfLines, textAlignVertical: 'top' },
          error && styles.inputError,
          inputStyle,
        ]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate[300],
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.slate[700],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.white,
    fontSize: 14,
  },
  inputError: {
    borderColor: Colors.rose[400],
  },
  errorText: {
    color: '#FDA4AF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
