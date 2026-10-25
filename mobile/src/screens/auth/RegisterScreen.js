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
  Image,
} from 'react-native';
import { Colors } from '../../constants/colors';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const validateEmail = (rawEmail) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  const trimmed = rawEmail.trim().toLowerCase();

  if (!emailRegex.test(trimmed)) {
    return 'Please enter a valid email address (e.g. name@domain.com).';
  }

  const parts = trimmed.split('@');
  if (parts.length === 2) {
    const domain = parts[1];
    const typoMap = {
      'gmail.co': 'gmail.com',
      'yahoo.co': 'yahoo.com',
      'hotmail.co': 'hotmail.com',
      'outlook.co': 'outlook.com',
      'icloud.co': 'icloud.com',
      'gamil.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'gmial.com': 'gmail.com',
      'gmaill.com': 'gmail.com',
      'yaho.com': 'yahoo.com',
      'yaho.co': 'yahoo.com',
      'hotmial.com': 'hotmail.com',
      'hotmaill.com': 'hotmail.com',
      'outlok.com': 'outlook.com',
    };

    if (typoMap[domain]) {
      return `Did you mean @${typoMap[domain]}? Please check your email address.`;
    }
  }

  return null;
};

const validatePassword = (pwd) => {
  if (pwd.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  const hasLetter = /[a-zA-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  if (!hasLetter || !hasNumber) {
    return 'Password must contain both letters and numbers.';
  }
  return null;
};

const validatePhone = (rawPhone) => {
  const trimmed = rawPhone.trim();
  if (!trimmed) return null; // Optional
  const phoneRegex = /^[0-9+\-\s()]{7,25}$/;
  if (!phoneRegex.test(trimmed)) {
    return 'Please enter a valid phone number (digits and optional country code).';
  }
  return null;
};

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (name.trim().length < 3) {
      setError('Full name must be at least 3 characters long.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      setError(phoneErr);
      return;
    }

    if (!password) {
      setError('Please enter a password.');
      return;
    }
    const pwdErr = validatePassword(password);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }

    if (password !== passwordConfirmation) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register({
        name: name.trim(),
        phone: phone.trim() ? phone.trim() : null,
        email: email.trim().toLowerCase(),
        password: password,
        password_confirmation: passwordConfirmation,
      });
      // Navigation is handled automatically by AuthContext
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : 'Registration failed. Please check your details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[900]} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Free Registration • 100% Privacy Protected</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.rose[400]} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Input
              label="Full Name / پورا نام *"
              placeholder="e.g. Muhammad Usman"
              value={name}
              onChangeText={setName}
            />

            <Input
              label="Phone Number / فون نمبر (Optional / اختیاری)"
              placeholder="+923XXXXXXXXX ya international"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Input
              label="Email Address / ای میل *"
              placeholder="name@domain.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Password / پاس ورڈ *"
              placeholder="Minimum 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Input
              label="Confirm Password / پاس ورڈ کی تصدیق *"
              placeholder="Re-enter password"
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              secureTextEntry
            />

            <Button
              title="Register Free Profile"
              onPress={handleRegister}
              variant="gold"
              size="lg"
              loading={loading}
              style={{ marginTop: 8 }}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In Here</Text>
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
    marginBottom: 20,
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
  loginLink: {
    color: Colors.magenta[400],
    fontSize: 13,
    fontWeight: '700',
  },
});
