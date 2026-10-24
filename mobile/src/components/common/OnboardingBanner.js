import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/colors';
import { profilesApi } from '../../api/profiles';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingBanner() {
  const navigation = useNavigation();
  const { authenticated, emailVerified, hasProfile, hasPreferences, profileStatus, refreshUser } = useAuth();

  if (!authenticated) return null;

  // If profile is active, onboarding is complete — hide banner
  if (profileStatus === 'active') return null;

  let config = null;

  if (!emailVerified) {
    config = {
      step: 'Step 1 of 3: Email Verification',
      titleEng: 'Verify your email to continue.',
      titleUrdu: 'اپنا ای میل تصدیق کریں تاکہ آپ آگے بڑھ سکیں۔',
      descEng: 'Please check your email inbox for the verification link.',
      descUrdu: 'براہ کرم تصدیقی لنک کے لیے اپنا ان باکس چیک کریں۔',
      icon: 'mail-outline',
      iconColor: '#F59E0B',
      buttonText: 'Check Status',
      onPress: async () => {
        const u = await refreshUser();
        if (u?.email_verified) {
          Alert.alert('Email Verified! / ای میل تصدیق شدہ', 'Your email has been verified. You can now complete your matrimonial profile.');
        } else {
          Alert.alert(
            'Verification Required / تصدیق درکار ہے',
            'We sent a verification link to your email address. Please click the link in your email and tap Check Status here.'
          );
        }
      },
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

      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.actionBtn, { borderColor: config.borderColor }]}
        onPress={config.onPress}
      >
        <Text style={styles.actionBtnText}>{config.buttonText}</Text>
        <Ionicons name="arrow-forward" size={14} color={Colors.white} />
      </TouchableOpacity>
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
