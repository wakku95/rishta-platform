import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Config } from '../../constants/config';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import GenderAvatar from '../../components/common/GenderAvatar';
import { useAuth } from '../../contexts/AuthContext';
import { profilesApi } from '../../api/profiles';
import { Ionicons } from '@expo/vector-icons';

export default function MyProfileScreen({ navigation }) {
  const { user, logout, isIdentityVerified } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await profilesApi.getMyProfile();
        setProfile(res.data || res);
      } catch (err) {
        console.warn('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[900]} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <Card style={styles.userCard}>
          <GenderAvatar
            gender={profile?.gender || user?.gender || 'female'}
            size={72}
            photoUrl={profile?.photo_url || user?.photo_url}
            style={{ marginBottom: 12 }}
          />

          <Text style={styles.userName}>{user?.name || 'Account User'}</Text>
          <Text style={styles.userPhone}>{user?.phone || user?.email}</Text>

          {profile?.profile_code && (
            <Text style={styles.profileCodePill}>Code: #{profile.profile_code}</Text>
          )}
        </Card>

        {/* Verification Status Card */}
        <Card
          style={[
            styles.trustCard,
            isIdentityVerified ? styles.trustVerified : styles.trustUnverified,
          ]}
        >
          <View style={styles.trustHeader}>
            <Ionicons
              name={isIdentityVerified ? 'shield-checkmark' : 'shield-outline'}
              size={24}
              color={isIdentityVerified ? Colors.emerald[400] : Colors.amber[400]}
            />
            <View style={styles.trustInfo}>
              <Text style={styles.trustTitle}>
                {isIdentityVerified
                  ? 'Identity Verified Account'
                  : 'Identity Verification Required'}
              </Text>
              <Text style={styles.trustSubtitle}>
                {isIdentityVerified
                  ? 'Your CNIC and live selfie have been audited by admin.'
                  : 'Verify CNIC & Live Selfie to unlock sending proposals.'}
              </Text>
            </View>
          </View>

          {!isIdentityVerified && (
            <Button
              title="Verify Identity Now"
              variant="gold"
              size="sm"
              onPress={() => navigation.navigate('Verification')}
              style={{ marginTop: 12 }}
            />
          )}
        </Card>

        {/* Profile Details Summary */}
        <Text style={styles.sectionTitle}>My Biodata Summary</Text>
        <Card style={styles.detailsCard}>
          <ProfileRow icon="calendar-outline" label="Age" value={profile?.age ? `${profile.age} Years` : 'Not set'} />
          <ProfileRow icon="location-outline" label="City" value={profile?.city || 'Not set'} />
          <ProfileRow icon="moon-outline" label="Sect" value={profile?.sect || 'Not set'} />
          <ProfileRow icon="school-outline" label="Education" value={profile?.education || 'Not set'} />
          <ProfileRow icon="briefcase-outline" label="Profession" value={profile?.profession || 'Not set'} />
          <ProfileRow icon="heart-outline" label="Marital Status" value={profile?.marital_status ? profile.marital_status.replace('_', ' ').toUpperCase() : 'Not set'} />
        </Card>

        {/* Support & Logout Section */}
        <Text style={styles.sectionTitle}>Account & Assistance / مدد اور اکاؤنٹ</Text>
        <Card style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('Verification')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="document-text-outline" size={18} color={Colors.slate[300]} />
              <Text style={styles.menuLabel}>Document Verification</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.slate[500]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Linking.openURL(Config.INSTAGRAM_CHAT_URL).catch(() => Linking.openURL(`https://instagram.com/${Config.INSTAGRAM_HANDLE}`))}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="logo-instagram" size={18} color="#F43F8E" />
              <View style={{ marginLeft: 4 }}>
                <Text style={styles.menuLabel}>Chat on Instagram</Text>
                <Text style={{ fontSize: 10, color: Colors.slate[400] }}>@raabtanow • Direct Message</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={15} color={Colors.slate[500]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Linking.openURL(Config.FACEBOOK_CHAT_URL).catch(() => Linking.openURL(Config.FACEBOOK_PAGE_URL))}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="logo-facebook" size={18} color="#3B82F6" />
              <View style={{ marginLeft: 4 }}>
                <Text style={styles.menuLabel}>Message on Facebook</Text>
                <Text style={{ fontSize: 10, color: Colors.slate[400] }}>Official RaabtaNow Page</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={15} color={Colors.slate[500]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Linking.openURL(`mailto:${Config.SUPPORT_EMAIL}?subject=RaabtaNow Support Inquiry`)}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="mail-outline" size={18} color={Colors.cyan[400]} />
              <View style={{ marginLeft: 4 }}>
                <Text style={styles.menuLabel}>Email Support</Text>
                <Text style={{ fontSize: 10, color: Colors.slate[400] }}>{Config.SUPPORT_EMAIL}</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={15} color={Colors.slate[500]} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 0 }]} onPress={handleLogout}>
            <View style={styles.menuLeft}>
              <Ionicons name="log-out-outline" size={18} color={Colors.rose[400]} />
              <Text style={[styles.menuLabel, { color: Colors.rose[400] }]}>Log Out of App</Text>
            </View>
          </TouchableOpacity>
        </Card>

        <Text style={styles.versionText}>RaabtaNow Mobile App • v1.0.0</Text>
      </ScrollView>
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
    paddingVertical: 20,
    marginBottom: 16,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(225, 29, 116, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 116, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
  },
  userPhone: {
    fontSize: 12,
    color: Colors.slate[400],
    marginTop: 2,
  },
  profileCodePill: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gold[400],
    backgroundColor: Colors.navy[950],
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  trustCard: {
    marginBottom: 20,
    borderWidth: 1,
  },
  trustVerified: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  trustUnverified: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trustInfo: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
  },
  trustSubtitle: {
    fontSize: 11,
    color: Colors.slate[300],
    marginTop: 2,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate[300],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  detailsCard: {
    marginBottom: 20,
    paddingVertical: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 12,
    color: Colors.slate[400],
  },
  rowValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  settingsCard: {
    marginBottom: 20,
    paddingVertical: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate[200],
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.slate[500],
    marginTop: 8,
  },
});
