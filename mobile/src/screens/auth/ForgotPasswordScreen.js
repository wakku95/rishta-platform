import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../../constants/colors';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { authApi } from '../../api/auth';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await authApi.forgotPassword(email.trim());
      setMessage(res.message || 'Password reset instructions sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[900]} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.slate[300]} />
          <Text style={styles.backText}>Back to Sign In</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.logoPill}>
            <Ionicons name="key" size={20} color={Colors.magenta[400]} />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your registered email and we'll send you recovery instructions.
          </Text>
        </View>

        {message ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.emerald[400]} />
            <Text style={styles.successText}>{message}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={Colors.rose[400]} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Input
            label="Registered Email / رجسٹرڈ ای میل"
            placeholder="name@domain.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Button
            title="Send Recovery Link"
            onPress={handleReset}
            variant="primary"
            size="lg"
            loading={loading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy[900],
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  backText: {
    color: Colors.slate[300],
    fontSize: 13,
    fontWeight: '600',
  },
  header: {
    marginBottom: 24,
  },
  logoPill: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(225, 29, 116, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 116, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.slate[400],
    marginTop: 4,
    lineHeight: 18,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: Colors.emerald[300],
    fontSize: 12,
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.22)',
    borderWidth: 1,
    borderColor: Colors.rose[400],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FFE4E6',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  form: {
    backgroundColor: Colors.navy[850],
    borderWidth: 1,
    borderColor: Colors.navy[750],
    borderRadius: 18,
    padding: 20,
  },
});
