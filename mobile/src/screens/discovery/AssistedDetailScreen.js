import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  BackHandler,
  KeyboardAvoidingView,
} from 'react-native';
import { Colors } from '../../constants/colors';
import Card from '../../components/common/Card';
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import GenderAvatar from '../../components/common/GenderAvatar';
import { profilesApi } from '../../api/profiles';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function AssistedDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { listingCode } = route.params;
  const { authenticated, isIdentityVerified, user, refreshUser } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [contactNumber, setContactNumber] = useState(user?.phone || '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(String(listingCode));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
  };

  useEffect(() => {
    const checkShortlist = async () => {
      try {
        const savedStr = await SecureStore.getItemAsync('rn_all_shortlists');
        const list = savedStr ? JSON.parse(savedStr) : [];
        if (list.includes(listingCode)) {
          setIsShortlisted(true);
        }
      } catch (e) {
        // Ignore
      }
    };
    checkShortlist();
  }, [listingCode]);

  const handleToggleShortlist = async () => {
    if (!authenticated) {
      Alert.alert(
        'Account Required / اکاؤنٹ درکار ہے',
        'Please register or sign in to save profiles to your shortlist for family discussion.\n\nرشتے شارٹ لسٹ کرنے کے لیے اپنا اکاؤنٹ بنائیں یا لاگ ان کریں۔',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In / لاگ ان', onPress: () => navigation.navigate('Login') },
          { text: 'Register Free / رجسٹریشن', onPress: () => navigation.navigate('Register') },
        ]
      );
      return;
    }

    const nextState = !isShortlisted;
    setIsShortlisted(nextState);

    try {
      // 1. rn_all_shortlists
      const savedStr = await SecureStore.getItemAsync('rn_all_shortlists');
      let list = savedStr ? JSON.parse(savedStr) : [];
      if (nextState) {
        if (!list.includes(listingCode)) list.push(listingCode);
      } else {
        list = list.filter((c) => c !== listingCode);
      }
      await SecureStore.setItemAsync('rn_all_shortlists', JSON.stringify(list));

      // 2. rn_assisted_shortlist
      const savedAssistedStr = await SecureStore.getItemAsync('rn_assisted_shortlist');
      let assistedList = savedAssistedStr ? JSON.parse(savedAssistedStr) : [];
      if (nextState) {
        if (!assistedList.includes(listingCode)) assistedList.push(listingCode);
      } else {
        assistedList = assistedList.filter((c) => c !== listingCode);
      }
      await SecureStore.setItemAsync('rn_assisted_shortlist', JSON.stringify(assistedList));
    } catch (e) {
      console.warn('Assisted shortlist toggle notice:', e.message);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs', { screen: 'Matches' });
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [navigation]);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await profilesApi.getAssistedDetail(listingCode);
        setListing(res.data || res);
      } catch (err) {
        Alert.alert('Error', 'Failed to load assisted listing.');
        handleBack();
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingCode]);

  const handleOpenInquiry = () => {
    if (!authenticated) {
      Alert.alert(
        'Account Required / اکاؤنٹ درکار ہے',
        'Register a free profile or sign in to inquire about assisted rishta listings.\n\nرشتے کے بارے میں تفصیلات اور رابطے کے لیے اپنا اکاؤنٹ بنائیں یا لاگ ان کریں۔',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In / لاگ ان', onPress: () => navigation.navigate('Login') },
          { text: 'Register Free / رجسٹریشن', onPress: () => navigation.navigate('Register') },
        ]
      );
      return;
    }
    setInterestModalOpen(true);
  };

  const handleSubmitInterest = async () => {
    // 1. Mandatory Identity Verification Gate (Matches our Backend & Web implementation)
    let verified = isIdentityVerified;
    if (!verified && refreshUser) {
      const fresh = await refreshUser();
      if (fresh?.is_identity_verified) {
        verified = true;
      }
    }

    if (!verified) {
      Alert.alert(
        'CNIC Verification Required / شناختی تصدیق ضروری ہے',
        'To safeguard candidate family dignity, matchmaker introductions are exclusive to candidates with verified CNIC & Live Selfie.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Verify Identity Now', onPress: () => navigation.navigate('Verification') },
        ]
      );
      return;
    }

    if (!contactNumber.trim()) {
      Alert.alert('Required', 'Please provide an active contact number.');
      return;
    }

    setSubmitting(true);
    try {
      await profilesApi.submitAssistedInterest(listingCode, {
        submitter_name: user?.name,
        submitter_contact: contactNumber.trim(),
        message: message.trim(),
      });
      setInterestModalOpen(false);
      Alert.alert(
        'Inquiry Submitted / درخواست موصول ہوگئی',
        'Thank you! Our personal matchmaker will review your verified profile and contact both families directly.'
      );
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit interest.';
      Alert.alert('Notice', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleIgnoreListing = () => {
    const code = listing?.listing_code || listingCode;
    Alert.alert(
      'Ignore Listing / نظر انداز کریں',
      `Hide Assisted Listing #${code} from your discovery results? You will not see this biodata again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ignore / Hide',
          style: 'destructive',
          onPress: async () => {
            try {
              await profilesApi.hideProfile(code);
              Alert.alert('Notice', `Listing #${code} has been hidden.`);
              handleBack();
            } catch (err) {
              Alert.alert('Notice', 'Unable to hide listing right now.');
            }
          },
        },
      ]
    );
  };

  if (loading || !listing) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.gold[500]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[900]} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.topBarTitleRow}>
          <Text style={styles.topBarTitle}>Assisted Listing #{listing.listing_code || listingCode}</Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopyCode}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={15}
              color={copied ? Colors.emerald[400] : Colors.slate[400]}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={styles.actionIconButton}
            onPress={handleToggleShortlist}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isShortlisted ? 'heart' : 'heart-outline'}
              size={22}
              color={isShortlisted ? Colors.rose[500] : Colors.slate[400]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionIconButton}
            onPress={handleIgnoreListing}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="eye-off-outline" size={20} color={Colors.slate[400]} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 100, 120) }]}>
        {/* Banner */}
        <View style={styles.assistedBanner}>
          <Ionicons name="people" size={20} color={Colors.navy[950]} />
          <Text style={styles.assistedBannerText}>
            Personal Matchmaker Facilitated • برائے والدین و خاندان
          </Text>
        </View>

        {/* Profile Card Header */}
        <Card style={styles.profileHeaderCard}>
          <GenderAvatar
            gender={listing.gender}
            size={80}
            style={{ alignSelf: 'center', marginBottom: 12 }}
          />

          <View style={styles.profileTitleRow}>
            <Text style={styles.profileTitle}>Assisted Candidate #{listing.listing_code || listing.profile_code || listingCode}</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyCode}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={18}
                color={copied ? Colors.emerald[400] : Colors.slate[400]}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileSubtitle}>Managed by RaabtaNow Dedicated Matchmaker</Text>

          <View style={styles.badgesRow}>
            <Badge label="100% Verified Family" variant="gold" />
            <Badge label="Exclusive" variant="magenta" />
          </View>
        </Card>

        {/* Details Section */}
        <Text style={styles.sectionTitle}>Profile Overview</Text>
        <Card style={styles.detailsCard}>
          <DetailRow icon="calendar-outline" label="Age" value={listing.age ? `${listing.age} Years` : 'Not specified'} />
          <DetailRow icon="location-outline" label="Location" value={listing.city || 'Pakistan'} />
          <DetailRow icon="moon-outline" label="Sect" value={listing.sect || 'Sunni'} />
          <DetailRow icon="school-outline" label="Education" value={listing.education || 'Graduate'} />
          <DetailRow icon="briefcase-outline" label="Profession" value={listing.profession || 'Professional'} />
          <DetailRow icon="heart-outline" label="Marital Status" value={listing.marital_status ? listing.marital_status.replace('_', ' ').toUpperCase() : 'Never Married'} />
        </Card>

        {/* Description / Family Preferences */}
        {listing.description && (
          <>
            <Text style={styles.sectionTitle}>Matchmaker Assessment & Preferences</Text>
            <Card style={styles.detailsCard}>
              <Text style={styles.aboutText}>{listing.description}</Text>
            </Card>
          </>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          title="Inquire via Matchmaker (ایجنٹ رابطہ)"
          onPress={handleOpenInquiry}
          variant="gold"
          size="lg"
          icon={() => <Ionicons name="chatbubbles" size={18} color={Colors.navy[950]} />}
          style={styles.inquireButton}
        />
      </View>

      {/* Modal */}
      {interestModalOpen && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Inquire via Matchmaker</Text>
                <TouchableOpacity onPress={() => setInterestModalOpen(false)}>
                  <Ionicons name="close" size={22} color={Colors.slate[400]} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Our matchmaker coordinates directly between both families. Ensure your contact details are accurate.
              </Text>

              <Input
                label="Contact Phone Number / رابطہ نمبر *"
                placeholder="+923XXXXXXXXX"
                value={contactNumber}
                onChangeText={setContactNumber}
                keyboardType="phone-pad"
              />

              <Input
                label="Questions or Family Notes (Optional)"
                placeholder="e.g. Inquiring on behalf of family for candidate..."
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setInterestModalOpen(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Submit Inquiry"
                  variant="gold"
                  onPress={handleSubmitInterest}
                  loading={submitting}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon} size={16} color={Colors.slate[400]} style={{ marginRight: 8 }} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy[900],
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
  },
  backButton: {
    padding: 6,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconButton: {
    padding: 6,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  topBarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 4,
  },
  copyButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  assistedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.gold[400],
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  assistedBannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.navy[950],
  },
  profileHeaderCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  profileTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.white,
  },
  profileSubtitle: {
    fontSize: 12,
    color: Colors.slate[400],
    marginTop: 2,
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate[300],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 4,
  },
  detailsCard: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.slate[400],
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  aboutText: {
    fontSize: 13,
    color: Colors.slate[300],
    lineHeight: 20,
    paddingVertical: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.navy[900],
    borderTopWidth: 1,
    borderTopColor: Colors.navy[800],
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inquireButton: {
    shadowColor: Colors.gold[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.navy[850],
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.navy[750],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.slate[400],
    lineHeight: 18,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
});
