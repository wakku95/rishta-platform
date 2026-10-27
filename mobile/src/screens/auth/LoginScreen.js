import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Colors } from '../../constants/colors';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    const emailTrimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login({
        email: emailTrimmed,
        login: emailTrimmed,
        password: password,
      });
      // Navigation to AppTabs is automatically handled by AuthContext state
    } catch (err) {
      console.warn('Login error:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        (err.code === 'ECONNABORTED' ? 'Connection timed out. Please try again.' : null) ||
        (err.message?.includes('Network Error') ? 'Network connection failed. Please check your internet.' : null) ||
        err.message ||
        'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const screenTopPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 6 : 12);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: screenTopPadding }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[900]} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 40, 60) }]} keyboardShouldPersistTaps="handled">
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.slate[300]} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          {/* Heading with Crisp HD Emblem + Native Typography */}
          <View style={styles.header}>
            <View style={styles.brandHero}>
              <Image
                source={require('../../../assets/raabtanow-icon.png')}
                style={styles.brandEmblem}
                resizeMode="contain"
              />
              <Text style={styles.brandTitle}>
                Raabta<Text style={styles.brandTitleAccent}>Now</Text>
              </Text>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in with your email address</Text>
          </View>

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.rose[400]} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Input Form */}
          <View style={styles.form}>
            <Input
              label="Email Address / ای میل ایڈریس"
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Input
              label="Password / پاس ورڈ"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotText}>Forgot Password? / پاس ورڈ بھول گئے؟</Text>
            </TouchableOpacity>

            <Button
              title="Sign In to Account"
              onPress={handleLogin}
              variant="primary"
              size="lg"
              loading={loading}
              style={{ marginTop: 8 }}
            />
          </View>

          {/* Footer Register Redirect */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account yet?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Register Free Profile</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy[900],
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
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
  brandHero: {
    alignItems: 'center',
    marginBottom: 16,
  },
  brandEmblem: {
    width: 52,
    height: 52,
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  brandTitleAccent: {
    color: Colors.magenta[500],
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
    marginBottom: 24,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotText: {
    fontSize: 12,
    color: Colors.magenta[400],
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    color: Colors.slate[400],
    fontSize: 13,
  },
  registerLink: {
    color: Colors.gold[400],
    fontSize: 13,
    fontWeight: '700',
  },
});
