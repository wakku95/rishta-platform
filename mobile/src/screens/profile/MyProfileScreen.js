import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../constants/colors';
import { Config } from '../../constants/config';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import GenderAvatar from '../../components/common/GenderAvatar';
import OnboardingBanner from '../../components/common/OnboardingBanner';
import SocialPublicationModal from './SocialPublicationModal';
import { useAuth } from '../../contexts/AuthContext';
import { profilesApi } from '../../api/profiles';
import { notificationsApi } from '../../api/notifications';
import { registerForPushNotificationsAsync } from '../../services/notificationService';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MyProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    user,
    logout,
    refreshUser,
    emailVerified,
    hasProfile,
    hasPreferences,
    profileStatus,
    isIdentityVerified,
    isEducationVerified,
  } = useAuth();

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  const handleTestPush = async () => {
    setTestingPush(true);
    let step = 'Step 1: Permission / Token generation';
    try {
      await registerForPushNotificationsAsync();
      step = 'Step 2: Sending test push from server';
      await notificationsApi.sendTestPush();
      Alert.alert(
        'Push Dispatched / نوٹیفکیشن بھیج دیا گیا',
        'A test push notification has been sent to your device! Check your notification bar or lock screen.'
      );
    } catch (err) {
      const status = err.response?.status ? ` (HTTP ${err.response.status})` : '';
      const url = err.config?.url ? `\nEndpoint: ${err.config.url}` : '';
      const errMsg = err.response?.data?.message || err.message || 'Unable to deliver test notification';
      Alert.alert('Push Notification Test', `${step}${status}\n${errMsg}${url}`);
    } finally {
      setTestingPush(false);
    }
  };

  const {
    data: profile,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['my_profile'],
    queryFn: async () => {
      const res = await profilesApi.getMyProfile();
      return res.data || res;
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([refreshUser(), refetch()]);
    setRefreshing(false);
  };

  const handleToggleVisibility = async () => {
    const isCurrentlyActive = profileStatus === 'active';

    if (isCurrentlyActive) {
      Alert.alert(
        'Hide Profile / پروفائل چھپائیں',
        'When your profile is hidden, other candidates cannot find or discover you in search. Existing proposals and chats remain unaffected.\n\nکیا آپ اپنا پروفائل عارضی طور پر چھپانا چاہتے ہیں؟',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Hide Profile / چھپائیں',
            style: 'destructive',
            onPress: async () => {
              setTogglingVisibility(true);
              try {
                await profilesApi.hideSelfProfile();
                await refreshUser();
                await refetch();
                Alert.alert('Profile Hidden', 'Your profile is now hidden from public discovery.');
              } catch (err) {
                Alert.alert('Error', err.response?.data?.message || 'Failed to hide profile.');
              } finally {
                setTogglingVisibility(false);
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Make Profile Discoverable / پروفائل ایکٹیو کریں',
        'Activate your matrimonial profile so matching candidates and families can discover your biodata and connect with you.\n\nکیا آپ اپنا پروفائل ایکٹیو اور پبلک کرنا چاہتے ہیں؟',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Activate Now / ایکٹیو کریں',
            onPress: async () => {
              setTogglingVisibility(true);
              try {
                await profilesApi.activateSelfProfile();
                await refreshUser();
                await refetch();
                Alert.alert('Profile Activated!', 'Your profile is now active and discoverable.');
              } catch (err) {
                Alert.alert(
                  'Activation Notice / ایکٹیویشن نوٹس',
                  err.response?.data?.message || 'Please ensure email is verified and preferences are filled before activating.'
                );
              } finally {
                setTogglingVisibility(false);
              }
            },
          },
        ]
      );
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const isProfileActive = profileStatus === 'active';
  const isProfileHidden = profileStatus === 'hidden';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[900]} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.magenta[500]}
            colors={[Colors.magenta[500]]}
          />
        }
      >
        {/* Onboarding Guidance Banner (Bilingual) */}
        <OnboardingBanner />

        {/* User Card */}
        <Card style={styles.userCard}>
          <GenderAvatar
            gender={profile?.gender || user?.gender || 'female'}
            size={76}
            photoUrl={profile?.photo_url || user?.photo_url}
            style={{ marginBottom: 12 }}
          />

          <Text style={styles.userName}>{user?.name || profile?.full_name || 'Account User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.codeAndBadgeRow}>
            {profile?.profile_code && (
              <View style={styles.codePill}>
                <Ionicons name="finger-print" size={13} color={Colors.magenta[400]} />
                <Text style={styles.codePillText}>#{profile.profile_code}</Text>
              </View>
            )}

            <View
              style={[
                styles.statusBadge,
                isProfileActive
                  ? styles.statusBadgeActive
                  : isProfileHidden
                  ? styles.statusBadgeHidden
                  : styles.statusBadgeDraft,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  isProfileActive
                    ? styles.statusDotActive
                    : isProfileHidden
                    ? styles.statusDotHidden
                    : styles.statusDotDraft,
                ]}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  isProfileActive
                    ? styles.statusBadgeTextActive
                    : isProfileHidden
                    ? styles.statusBadgeTextHidden
                    : styles.statusBadgeTextDraft,
                ]}
              >
                {isProfileActive
                  ? 'Active / تلاش میں شامل'
                  : isProfileHidden
                  ? 'Hidden / چھپی ہوئی'
                  : 'Draft / نامکمل'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Profile Visibility Switcher Card */}
        {hasProfile && (
          <Card style={styles.visibilityCard}>
            <View style={styles.visibilityLeft}>
              <View
                style={[
                  styles.visibilityIconCircle,
                  isProfileActive ? styles.visActiveCircle : styles.visHiddenCircle,
                ]}
              >
                <Ionicons
                  name={isProfileActive ? 'eye' : 'eye-off'}
                  size={20}
                  color={isProfileActive ? Colors.emerald[400] : Colors.amber[400]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.visibilityTitle}>
                  {isProfileActive ? 'Profile is Discoverable' : 'Profile is Hidden'}
                </Text>
                <Text style={styles.visibilitySubtitle}>
                  {isProfileActive
                    ? 'Other matching candidates and parents can see your biodata.'
                    : 'Your profile is temporarily invisible to candidates searching for rishta.'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.visibilityBtn,
                isProfileActive ? styles.visBtnHide : styles.visBtnShow,
              ]}
              onPress={handleToggleVisibility}
              disabled={togglingVisibility}
            >
              {togglingVisibility ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.visibilityBtnText}>
                  {isProfileActive ? 'Hide Profile' : 'Show / Activate'}
                </Text>
              )}
            </TouchableOpacity>
          </Card>
        )}

        {/* Main Profile Management Actions */}
        <Text style={styles.sectionTitle}>Profile & Preferences / ترتیبات</Text>
        <Card style={styles.menuCard}>
          {/* 1. Edit Profile */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(225, 29, 116, 0.12)' }]}>
              <Ionicons name="person-outline" size={20} color={Colors.magenta[400]} />
            </View>
            <View style={styles.actionCenter}>
              <Text style={styles.actionTitle}>Edit Matrimonial Profile</Text>
              <Text style={styles.actionSubtitle}>پروفائل کی تفصیلات، تعلیم، مذہب و شہر</Text>
            </View>
            <View style={styles.actionRight}>
              {hasProfile ? (
                <View style={styles.miniCompleteBadge}>
                  <Text style={styles.miniBadgeText}>Edit</Text>
                </View>
              ) : (
                <View style={styles.miniIncompleteBadge}>
                  <Text style={styles.miniIncompleteText}>Create</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={Colors.slate[500]} />
            </View>
          </TouchableOpacity>

          {/* 2. Partner Preferences */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('EditPreferences')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
              <Ionicons name="options-outline" size={20} color={Colors.emerald[400]} />
            </View>
            <View style={styles.actionCenter}>
              <Text style={styles.actionTitle}>Partner Preferences</Text>
              <Text style={styles.actionSubtitle}>شریک حیات کی عمر، شہر، فرقہ و تعلیم کی ترجیحات</Text>
            </View>
            <View style={styles.actionRight}>
              {hasPreferences ? (
                <View style={styles.miniCompleteBadge}>
                  <Text style={styles.miniBadgeText}>Saved</Text>
                </View>
              ) : (
                <View style={styles.miniIncompleteBadge}>
                  <Text style={styles.miniIncompleteText}>Required</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={Colors.slate[500]} />
            </View>
          </TouchableOpacity>

          {/* 3. Identity & Education Verification */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Verification')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#60A5FA" />
            </View>
            <View style={styles.actionCenter}>
              <Text style={styles.actionTitle}>Trust & Verifications</Text>
              <Text style={styles.actionSubtitle}>CNIC شناختی کارڈ اور تعلیمی ڈگری کی تصدیق</Text>
            </View>
            <View style={styles.actionRight}>
              {isIdentityVerified ? (
                <View style={styles.miniVerifiedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color={Colors.emerald[400]} />
                  <Text style={styles.miniVerifiedText}>Verified</Text>
                </View>
              ) : (
                <View style={styles.miniIncompleteBadge}>
                  <Text style={styles.miniIncompleteText}>Verify</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={Colors.slate[500]} />
            </View>
          </TouchableOpacity>

          {/* 4. Social Media Sharing Consent */}
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => setSocialModalOpen(true)}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(236, 72, 153, 0.12)' }]}>
              <Ionicons name="share-social-outline" size={20} color="#F472B6" />
            </View>
            <View style={styles.actionCenter}>
              <Text style={styles.actionTitle}>Social Media Reach</Text>
              <Text style={styles.actionSubtitle}>فیس بک اور انسٹاگرام پر گمنام کارڈ کی تشہیر</Text>
            </View>
            <View style={styles.actionRight}>
              <Ionicons name="chevron-forward" size={16} color={Colors.slate[500]} />
            </View>
          </TouchableOpacity>

          {/* 5. Public Profile Preview */}
          {hasProfile && (
            <TouchableOpacity
              style={[styles.actionRow, { borderBottomWidth: 0 }]}
              onPress={() => setPreviewModalOpen(true)}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
                <Ionicons name="eye-outline" size={20} color="#C084FC" />
              </View>
              <View style={styles.actionCenter}>
                <Text style={styles.actionTitle}>Public Profile Preview</Text>
                <Text style={styles.actionSubtitle}>دیکھیں کہ آپ کا پروفائل دوسروں کو کیسا نظر آتا ہے</Text>
              </View>
              <View style={styles.actionRight}>
                <Ionicons name="chevron-forward" size={16} color={Colors.slate[500]} />
              </View>
            </TouchableOpacity>
          )}
        </Card>

        {/* Profile Details Summary */}
        <Text style={styles.sectionTitle}>My Biodata Summary / معلومات کا خلاصہ</Text>
        <Card style={styles.detailsCard}>
          <ProfileRow icon="calendar-outline" label="Age / عمر" value={profile?.age ? `${profile.age} Years` : 'Not set'} />
          <ProfileRow icon="resize-outline" label="Height / قد" value={profile?.height ? `${Math.floor(profile.height / 30.48)}'${Math.round((profile.height % 30.48) / 2.54)}"` : 'Not set'} />
          <ProfileRow icon="location-outline" label="City / شہر" value={profile?.city || 'Not set'} />
          <ProfileRow icon="moon-outline" label="Sect / مسلک" value={profile?.sect || 'Not set'} />
          <ProfileRow icon="school-outline" label="Education / تعلیم" value={profile?.education || 'Not set'} />
          <ProfileRow icon="briefcase-outline" label="Profession / پیشہ" value={profile?.profession || 'Not set'} />
          <ProfileRow icon="heart-outline" label="Marital Status / ازدواجی حیثیت" value={profile?.marital_status ? profile.marital_status.replace('_', ' ').toUpperCase() : 'Not set'} />
          <ProfileRow icon="person-circle-outline" label="Managed By / نگراں" value={profile?.managed_by ? profile.managed_by.toUpperCase() : 'Self'} />
        </Card>

        {/* Support & Logout Section */}
        <Text style={styles.sectionTitle}>Direct Assistance & Chat / ہم سے رابطہ</Text>
        <Card style={styles.settingsCard}>
          {/* Instagram DM */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() =>
              Linking.openURL(Config.INSTAGRAM_CHAT_URL).catch(() =>
                Linking.openURL(`https://instagram.com/${Config.INSTAGRAM_HANDLE}`)
              )
            }
          >
            <View style={styles.menuLeft}>
              <Ionicons name="logo-instagram" size={18} color="#F43F8E" />
              <View style={{ marginLeft: 6 }}>
                <Text style={styles.menuLabel}>Chat on Instagram DM</Text>
                <Text style={{ fontSize: 10, color: Colors.slate[400] }}>@raabtanow • Fast Response</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={15} color={Colors.slate[500]} />
          </TouchableOpacity>

          {/* Facebook Messenger */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() =>
              Linking.openURL(Config.FACEBOOK_CHAT_URL).catch(() =>
                Linking.openURL(Config.FACEBOOK_PAGE_URL)
              )
            }
          >
            <View style={styles.menuLeft}>
              <Ionicons name="logo-facebook" size={18} color="#3B82F6" />
              <View style={{ marginLeft: 6 }}>
                <Text style={styles.menuLabel}>Message on Facebook</Text>
                <Text style={{ fontSize: 10, color: Colors.slate[400] }}>Official RaabtaNow Page</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={15} color={Colors.slate[500]} />
          </TouchableOpacity>

          {/* Email Support */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() =>
              Linking.openURL(`mailto:${Config.SUPPORT_EMAIL}?subject=RaabtaNow Support Inquiry`)
            }
          >
            <View style={styles.menuLeft}>
              <Ionicons name="mail-outline" size={18} color={Colors.cyan[400]} />
              <View style={{ marginLeft: 6 }}>
                <Text style={styles.menuLabel}>Email Support Team</Text>
                <Text style={{ fontSize: 10, color: Colors.slate[400] }}>{Config.SUPPORT_EMAIL}</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={15} color={Colors.slate[500]} />
          </TouchableOpacity>

          {/* Push Notification Test */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={handleTestPush}
            disabled={testingPush}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="notifications-active-outline" size={18} color={Colors.gold[400]} />
              <View style={{ marginLeft: 6 }}>
                <Text style={styles.menuLabel}>Test Push Notification / نوٹیفکیشن ٹیسٹ</Text>
                <Text style={{ fontSize: 10, color: Colors.slate[400] }}>
                  {testingPush ? 'Sending test signal...' : 'Tap to test device notifications & sound'}
                </Text>
              </View>
            </View>
            {testingPush ? (
              <ActivityIndicator size="small" color={Colors.gold[400]} />
            ) : (
              <Ionicons name="paper-plane-outline" size={16} color={Colors.gold[400]} />
            )}
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 0 }]} onPress={handleLogout}>
            <View style={styles.menuLeft}>
              <Ionicons name="log-out-outline" size={18} color={Colors.rose[400]} />
              <Text style={[styles.menuLabel, { color: Colors.rose[400], marginLeft: 6 }]}>
                Log Out of App / لاگ آؤٹ
              </Text>
            </View>
          </TouchableOpacity>
        </Card>

        <Text style={styles.versionText}>RaabtaNow Matrimonial • Verified Pakistani Rishtey</Text>
      </ScrollView>

      {/* Social Media Publication Modal */}
      <SocialPublicationModal
        visible={socialModalOpen}
        onClose={() => setSocialModalOpen(false)}
      />

      {/* Public Profile Preview Modal */}
      <Modal
        visible={previewModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPreviewModalOpen(false)}
      >
        <View style={styles.previewModalOverlay}>
          <View style={styles.previewModalSheet}>
            <View style={styles.previewModalHeader}>
              <View>
                <Text style={styles.previewModalTitle}>Public Biodata Preview</Text>
                <Text style={styles.previewModalSubtitle}>How other families see your profile card</Text>
              </View>
              <TouchableOpacity onPress={() => setPreviewModalOpen(false)} style={styles.previewCloseBtn}>
                <Ionicons name="close" size={22} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <View style={styles.previewHeaderCard}>
                <GenderAvatar
                  gender={profile?.gender || 'female'}
                  size={72}
                  style={{ alignSelf: 'center', marginBottom: 10 }}
                />
                <Text style={styles.previewCodeText}>Profile #{profile?.profile_code}</Text>
                <Text style={styles.previewBasicText}>
                  {profile?.age} Yrs • {profile?.city} • {profile?.religion || 'Islam'}
                </Text>
                {isIdentityVerified && (
                  <View style={styles.verifiedTrustTag}>
                    <Ionicons name="shield-checkmark" size={13} color={Colors.emerald[400]} />
                    <Text style={styles.verifiedTrustText}>Identity Verified</Text>
                  </View>
                )}
              </View>

              {/* About Public Notice */}
              <View style={styles.previewNoticeBox}>
                <Ionicons name="information-circle" size={16} color={Colors.cyan[400]} />
                <Text style={styles.previewNoticeText}>
                  Notice: Your phone number, email, and exact house address are never shown publicly. Contact details are only unlocked after mutual proposal acceptance.
                </Text>
              </View>

              <Text style={styles.previewSectionHeader}>About Candidate / تعارف</Text>
              <Card style={{ marginBottom: 12, padding: 14 }}>
                <Text style={styles.previewBioText}>
                  {profile?.about || 'No personal bio added yet.'}
                </Text>
              </Card>

              <Text style={styles.previewSectionHeader}>Family Background / خاندانی پس منظر</Text>
              <Card style={{ marginBottom: 12, padding: 14 }}>
                <Text style={styles.previewBioText}>
                  {profile?.family_background || 'No family background added yet.'}
                </Text>
              </Card>

              <Text style={styles.previewSectionHeader}>Candidate Details</Text>
              <Card style={{ marginBottom: 20 }}>
                <ProfileRow icon="school-outline" label="Education" value={profile?.education || 'N/A'} />
                <ProfileRow icon="briefcase-outline" label="Profession" value={profile?.profession || 'N/A'} />
                <ProfileRow icon="moon-outline" label="Sect" value={profile?.sect || 'N/A'} />
                <ProfileRow icon="heart-outline" label="Marital Status" value={profile?.marital_status ? profile.marital_status.replace('_', ' ').toUpperCase() : 'N/A'} />
                <ProfileRow icon="resize-outline" label="Height" value={profile?.height ? `${Math.floor(profile.height / 30.48)}'${Math.round((profile.height % 30.48) / 2.54)}"` : 'N/A'} />
                <ProfileRow icon="person-circle-outline" label="Managed By" value={profile?.managed_by ? profile.managed_by.toUpperCase() : 'Self'} />
              </Card>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ProfileRow({ icon, label, value }) {
  return (
    <View style={styles.profileRow}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={15} color={Colors.slate[400]} style={{ marginRight: 8 }} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy[900],
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  userCard: {
    alignItems: 'center',
    paddingVertical: 18,
    marginBottom: 14,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.slate[400],
    marginTop: 2,
    marginBottom: 10,
  },
  codeAndBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(225, 29, 116, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 116, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  codePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.magenta[400],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  statusBadgeHidden: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  statusBadgeDraft: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: Colors.emerald[400],
  },
  statusDotHidden: {
    backgroundColor: Colors.gold[400],
  },
  statusDotDraft: {
    backgroundColor: Colors.slate[400],
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeTextActive: {
    color: Colors.emerald[400],
  },
  statusBadgeTextHidden: {
    color: Colors.gold[400],
  },
  statusBadgeTextDraft: {
    color: Colors.slate[400],
  },
  visibilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 16,
    backgroundColor: Colors.navy[850],
    borderWidth: 1,
    borderColor: Colors.navy[750],
  },
  visibilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  visibilityIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visActiveCircle: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  visHiddenCircle: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  visibilityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  visibilitySubtitle: {
    fontSize: 11,
    color: Colors.slate[400],
    marginTop: 2,
    lineHeight: 15,
  },
  visibilityBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visBtnHide: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  visBtnShow: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  visibilityBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate[300],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  menuCard: {
    padding: 4,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
  },
  actionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionCenter: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  actionSubtitle: {
    fontSize: 11,
    color: Colors.slate[400],
    marginTop: 2,
  },
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniCompleteBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.emerald[400],
  },
  miniIncompleteBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniIncompleteText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.gold[400],
  },
  miniVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniVerifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.emerald[400],
  },
  detailsCard: {
    padding: 14,
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 12,
    color: Colors.slate[300],
  },
  rowValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  settingsCard: {
    padding: 6,
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 11,
    color: Colors.slate[500],
    textAlign: 'center',
    marginTop: 8,
  },
  // Preview Modal
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  previewModalSheet: {
    backgroundColor: Colors.navy[900],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: Colors.navy[750],
  },
  previewModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
  },
  previewModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  previewModalSubtitle: {
    fontSize: 11,
    color: Colors.slate[400],
    marginTop: 2,
  },
  previewCloseBtn: {
    padding: 4,
  },
  previewHeaderCard: {
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: Colors.navy[850],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.navy[750],
    marginBottom: 14,
  },
  previewCodeText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.magenta[400],
  },
  previewBasicText: {
    fontSize: 12,
    color: Colors.slate[300],
    marginTop: 4,
  },
  verifiedTrustTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 8,
  },
  verifiedTrustText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.emerald[400],
  },
  previewNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  previewNoticeText: {
    fontSize: 11,
    color: Colors.cyan[300],
    flex: 1,
    lineHeight: 15,
  },
  previewSectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate[400],
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 2,
  },
  previewBioText: {
    fontSize: 13,
    color: Colors.slate[200],
    lineHeight: 18,
  },
});
