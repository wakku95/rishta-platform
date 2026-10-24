import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/colors';
import { profilesApi } from '../../api/profiles';
import { authApi } from '../../api/auth';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingBanner() {
  const navigation = useNavigation();
  const {
    authenticated,
    emailVerified,
    hasProfile,
    hasPreferences,
    profileStatus,
    refreshUser,
    resendVerification,
  } = useAuth();

  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isResending, setIsResending] = useState(false);

  if (!authenticated) return null;

  // If profile is active, onboarding is complete — hide banner
  if (profileStatus === 'active') return null;

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      if (resendVerification) {
        await resendVerification();
      } else {
        await authApi.resendEmailVerification();
      }
      Alert.alert(
        'Verification Email Sent / تصدیقی ای میل بھیج دی گئی',
        'A fresh verification link has been sent to your email address. Please check your inbox and spam folder.\n\nنیا تصدیقی لنک آپ کے ای میل پر بھیج دیا گیا ہے۔ اپنا ان باکس اور سپیم فولڈر چیک کریں۔'
      );
    } catch (err) {
      if (err.response?.status === 429) {
        Alert.alert(
          'Please Wait / انتظار فرمائیں',
          'Too many requests. Please wait a few minutes before requesting another verification email.\n\nسیکیورٹی وجوہات کی بنا پر چند منٹ بعد دوبارہ کوشش کریں۔'
        );
      } else if (err.response?.status === 400 && err.response?.data?.message?.includes('already verified')) {
        await refreshUser();
        Alert.alert(
          'Email Verified! / ای میل تصدیق شدہ',
          'Your email is already verified. You can now complete your matrimonial profile.'
        );
      } else {
        Alert.alert(
          'Notice / نوٹس',
          err.response?.data?.message || 'Could not send verification email. Please check your connection and try again.'
        );
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckStatus = async () => {
    if (isCheckingStatus) return;
    setIsCheckingStatus(true);
    try {
      const u = await refreshUser();
      if (u?.email_verified) {
        Alert.alert(
          'Email Verified! / ای میل تصدیق شدہ',
          'Your email has been verified. You can now complete your matrimonial profile.\n\nآپ کا ای میل تصدیق ہوچکا ہے۔ اب آپ اپنا رشتہ پروفائل مکمل کر سکتے ہیں۔'
        );
      } else {
        Alert.alert(
          'Verification Required / تصدیق درکار ہے',
          'We sent a verification link to your email address. Please check your email inbox.\n\nاگر آپ کو ای میل موصول نہیں ہوئی تو "Resend Email" پر ٹیپ کریں۔',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Resend Email / دوبارہ بھیجیں',
              onPress: handleResend,
            },
          ]
        );
      }
    } catch (e) {
      Alert.alert('Notice', 'Unable to check verification status right now.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  let config = null;

  if (!emailVerified) {
    config = {
      isEmailStep: true,
      step: 'Step 1 of 3: Email Verification',
      titleEng: 'Verify your email to continue.',
      titleUrdu: 'اپنا ای میل تصدیق کریں تاکہ آپ آگے بڑھ سکیں۔',
      descEng: 'Please check your email inbox for the verification link.',
      descUrdu: 'براہ کرم تصدیقی لنک کے لیے اپنا ان باکس چیک کریں۔',
      icon: 'mail-outline',
      iconColor: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.12)',
      borderColor: 'rgba(245, 158, 11, 0.35)',
      badgeBg: 'rgba(245, 158, 11, 0.2)',
      badgeColor: '#FBBF24',
    };
  } else if (!hasProfile) {
    config = {
      step: 'Step 2 of 3: Create Profile',
      titleEng: 'Complete Your Matrimonial Profile.',
      titleUrdu: 'اپنا رشتہ پروفائل مکمل کریں۔',
      descEng: 'Add your basic details to start finding suitable proposals.',
      descUrdu: 'مناسب رشتے تلاش کرنے کے لیے اپنی بنیادی معلومات مکمل کریں۔',
      icon: 'person-add-outline',
      iconColor: Colors.magenta[400],
      buttonText: 'Create Profile',
      onPress: () => navigation.navigate('EditProfile'),
      bgColor: 'rgba(225, 29, 116, 0.12)',
      borderColor: 'rgba(225, 29, 116, 0.35)',
      badgeBg: 'rgba(225, 29, 116, 0.2)',
      badgeColor: Colors.magenta[300],
    };
  } else if (!hasPreferences) {
    config = {
      step: 'Step 3 of 3: Partner Preferences',
      titleEng: 'Set Partner Preferences.',
      titleUrdu: 'شریک حیات کی ترجیحات سیٹ کریں۔',
      descEng: 'Tell us your preferred partner age, city, and education.',
      descUrdu: 'ہمیں بتائیں کہ آپ شریک حیات میں کیا خصوصیات تلاش کر رہے ہیں۔',
      icon: 'options-outline',
      iconColor: Colors.emerald[400],
      buttonText: 'Set Preferences',
      onPress: () => navigation.navigate('EditPreferences'),
      bgColor: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
      badgeBg: 'rgba(16, 185, 129, 0.2)',
      badgeColor: Colors.emerald[300],
    };
  } else if (profileStatus !== 'active') {
    config = {
      step: 'Final Step: Activation',
      titleEng: 'Activate Your Profile.',
      titleUrdu: 'اپنا پروفائل ایکٹیویٹ کریں۔',
      descEng: 'Activate your profile to become discoverable to matching families.',
      descUrdu: 'اپنا پروفائل ایکٹیویٹ کریں تاکہ دوسرے آپ کو دیکھ سکیں۔',
      icon: 'shield-checkmark-outline',
      iconColor: Colors.cyan[400],
      buttonText: 'Activate Now',
      onPress: async () => {
        try {
          await profilesApi.activateSelfProfile();
          await refreshUser();
          Alert.alert('Profile Activated!', 'Your matrimonial profile is now active and visible to suitable families.');
        } catch (e) {
          Alert.alert('Activation Notice', e?.response?.data?.message || 'Could not activate profile.');
        }
      },
      bgColor: 'rgba(6, 182, 212, 0.12)',
      borderColor: 'rgba(6, 182, 212, 0.35)',
      badgeBg: 'rgba(6, 182, 212, 0.2)',
      badgeColor: Colors.cyan[300],
    };
  }

  if (!config) return null;

  return (
    <View style={[styles.bannerContainer, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
      <View style={styles.topRow}>
        <View style={[styles.stepBadge, { backgroundColor: config.badgeBg }]}>
          <Ionicons name={config.icon} size={13} color={config.iconColor} />
          <Text style={[styles.stepText, { color: config.badgeColor }]}>{config.step}</Text>
        </View>
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.titleEng}>{config.titleEng}</Text>
        <Text style={styles.titleUrdu} dir="rtl">{config.titleUrdu}</Text>
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.descEng}>{config.descEng}</Text>
        <Text style={styles.descUrdu} dir="rtl">{config.descUrdu}</Text>
      </View>

      {config.isEmailStep ? (
        <View style={styles.btnRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.actionBtnHalf, { borderColor: config.borderColor }]}
            onPress={handleCheckStatus}
            disabled={isCheckingStatus || isResending}
          >
            {isCheckingStatus ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={14} color={Colors.white} />
                <Text style={styles.actionBtnText}>Check Status</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.actionBtnHalf, styles.resendBtn]}
            onPress={handleResend}
            disabled={isCheckingStatus || isResending}
          >
            {isResending ? (
              <ActivityIndicator size="small" color="#FBBF24" />
            ) : (
              <>
                <Ionicons name="mail-unread-outline" size={14} color="#FBBF24" />
                <Text style={[styles.actionBtnText, { color: '#FBBF24' }]}>Resend Email</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.actionBtn, { borderColor: config.borderColor }]}
          onPress={config.onPress}
        >
          <Text style={styles.actionBtnText}>{config.buttonText}</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  textBlock: {
    gap: 2,
  },
  titleEng: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
  },
  titleUrdu: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate[200],
    textAlign: 'right',
  },
  descEng: {
    fontSize: 11,
    color: Colors.slate[300],
    lineHeight: 16,
  },
  descUrdu: {
    fontSize: 11,
    color: Colors.slate[400],
    textAlign: 'right',
    lineHeight: 16,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  actionBtnHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 6,
  },
  resendBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    marginTop: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.white,
  },
});
