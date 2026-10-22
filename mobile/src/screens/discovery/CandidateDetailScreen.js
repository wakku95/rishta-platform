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
  Modal,
  KeyboardAvoidingView,
  TextInput,
} from 'react-native';
import { Colors } from '../../constants/colors';
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import GenderAvatar from '../../components/common/GenderAvatar';
import { profilesApi } from '../../api/profiles';
import { requestsApi } from '../../api/requests';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function CandidateDetailScreen({ route, navigation }) {
  const { profileCode } = route.params;
  const { isIdentityVerified } = useAuth();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [senderIntro, setSenderIntro] = useState('');
  const [senderQuestions, setSenderQuestions] = useState('');
  const [sendingProposal, setSendingProposal] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(String(profileCode));
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
        if (list.includes(profileCode)) {
          setIsShortlisted(true);
        }
      } catch (e) {
        // Ignore
      }
    };
    checkShortlist();
  }, [profileCode]);

  const handleToggleShortlist = async () => {
    const nextState = !isShortlisted;
    setIsShortlisted(nextState);

    try {
      const savedStr = await SecureStore.getItemAsync('rn_all_shortlists');
      let list = savedStr ? JSON.parse(savedStr) : [];
      if (nextState) {
        if (!list.includes(profileCode)) list.push(profileCode);
        await SecureStore.setItemAsync('rn_all_shortlists', JSON.stringify(list));
        await profilesApi.addToShortlist(profileCode);
      } else {
        list = list.filter((c) => c !== profileCode);
        await SecureStore.setItemAsync('rn_all_shortlists', JSON.stringify(list));
        await profilesApi.removeFromShortlist(profileCode);
      }
    } catch (e) {
      console.warn('Detail shortlist toggle notice:', e.message);
    }
  };

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const res = await profilesApi.getDetail(profileCode);
        setCandidate(res.data || res);
      } catch (err) {
        Alert.alert('Error', 'Failed to load candidate biodata.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [profileCode]);

  const handleIgnoreProfile = () => {
    Alert.alert(
      'Ignore Candidate / نظر انداز کریں',
      `Hide Candidate #${profileCode} from your discovery results? You will not see this biodata again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ignore / Hide',
          style: 'destructive',
          onPress: async () => {
            try {
              await profilesApi.hideProfile(profileCode);
              Alert.alert('Notice', `Candidate #${profileCode} has been hidden.`);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Notice', 'Unable to hide candidate right now.');
            }
          },
        },
      ]
    );
  };

  const handleOpenProposalModal = () => {
    if (!isIdentityVerified) {
      Alert.alert(
        'CNIC Verification Required / شناختی کارڈ کی تصدیق لازمی ہے',
        'To maintain a safe, family-vetted environment and protect candidate privacy, your CNIC (front & back) and live selfie must be verified before you can send a formal Rishta proposal.',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Verify CNIC Now / تصدیق کریں',
            style: 'default',
            onPress: () => navigation.navigate('Verification'),
          },
        ]
      );
      return;
    }
    setProposalModalOpen(true);
  };

  const handleSendProposal = async () => {
    if (!isIdentityVerified) {
      setProposalModalOpen(false);
      Alert.alert(
        'Identity Verification Required',
        'Your CNIC and live selfie must be verified before you can send a formal Rishta proposal.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Verify Identity Now', onPress: () => navigation.navigate('Verification') },
        ]
      );
      return;
    }

    setSendingProposal(true);
    try {
      await requestsApi.sendRequest({
        profile_code: profileCode,
        sender_intro: senderIntro.trim(),
        sender_questions: senderQuestions.trim(),
      });
      setProposalModalOpen(false);
      setSenderIntro('');
      setSenderQuestions('');
      Alert.alert(
        'Proposal Submitted / رشتہ تجویز موصول ہوگئی',
        'Your proposal and questions have been submitted for admin review and will be delivered respectfully to the candidate family once approved.'
      );
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send proposal. Please try again.';
      if (msg.toLowerCase().includes('identity') || msg.toLowerCase().includes('cnic')) {
        setProposalModalOpen(false);
        Alert.alert(
          'CNIC Verification Required',
          msg,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Verify CNIC Now', onPress: () => navigation.navigate('Verification') },
          ]
        );
      } else {
        Alert.alert('Unable to Send', msg);
      }
    } finally {
      setSendingProposal(false);
    }
  };

  if (loading || !candidate) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.magenta[500]} />
      </SafeAreaView>
    );
  }

  const isMale = candidate.gender === 'male';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[900]} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.topBarTitleRow}>
          <Text style={styles.topBarTitle}>Biodata #{candidate.profile_code}</Text>
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
            onPress={handleIgnoreProfile}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="eye-off-outline" size={20} color={Colors.slate[400]} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Header */}
        <Card style={styles.profileHeaderCard}>
          <GenderAvatar
            gender={candidate.gender}
            size={80}
            photoUrl={candidate.photo_url || candidate.avatar}
            style={{ alignSelf: 'center', marginBottom: 12 }}
          />

          <View style={styles.profileTitleRow}>
            <Text style={styles.profileTitle}>Candidate #{candidate.profile_code}</Text>
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
          <Text style={styles.profileSubtitle}>Managed by {candidate.managed_by || 'Family'}</Text>

          <View style={styles.badgesRow}>
            {candidate.is_identity_verified && (
              <Badge label="CNIC Verified" variant="success" />
            )}
            <Badge label="Privacy Protected" variant="default" />
          </View>
        </Card>

        {/* Basic Details Section */}
        <Text style={styles.sectionTitle}>Demographic & Personal Profile</Text>
        <Card style={styles.detailsCard}>
          <DetailRow icon="calendar-outline" label="Age" value={candidate.age ? `${candidate.age} Years` : 'Not specified'} />
          <DetailRow icon="resize-outline" label="Height" value={candidate.height ? `${candidate.height} cm` : 'Not specified'} />
          <DetailRow icon="location-outline" label="City / Region" value={candidate.city || 'Not specified'} />
          <DetailRow icon="moon-outline" label="Religion & Sect" value={`${candidate.religion || 'Islam'} • ${candidate.sect || 'Sunni'}`} />
          <DetailRow icon="heart-outline" label="Marital Status" value={candidate.marital_status ? candidate.marital_status.replace('_', ' ').toUpperCase() : 'Never Married'} />
        </Card>

        {/* Education & Career Section */}
        <Text style={styles.sectionTitle}>Education & Profession</Text>
        <Card style={styles.detailsCard}>
          <DetailRow icon="school-outline" label="Education" value={candidate.education || 'Not specified'} />
          <DetailRow icon="briefcase-outline" label="Profession" value={candidate.profession || 'Not specified'} />
          {candidate.income_range && (
            <DetailRow icon="cash-outline" label="Income Bracket" value={candidate.income_range} />
          )}
        </Card>

        {/* About / Bio Statement */}
        {candidate.about && (
          <>
            <Text style={styles.sectionTitle}>About Candidate / تعارف</Text>
            <Card style={styles.detailsCard}>
              <Text style={styles.aboutText}>{candidate.about}</Text>
            </Card>
          </>
        )}

        {/* Family Background */}
        {candidate.family_background && (
          <>
            <Text style={styles.sectionTitle}>Family Background / خاندانی پس منظر</Text>
            <Card style={styles.detailsCard}>
              <Text style={styles.aboutText}>{candidate.family_background}</Text>
            </Card>
          </>
        )}
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <Button
          title="Send Formal Rishta Proposal"
          onPress={handleOpenProposalModal}
          variant="primary"
          size="lg"
          icon={() => <Ionicons name="heart" size={18} color={Colors.white} />}
          style={styles.proposalButton}
        />
      </View>

      {/* Comprehensive Proposal Modal with Both Question Fields */}
      <Modal
        visible={proposalModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setProposalModalOpen(false)}
      >
        <SafeAreaView style={styles.proposalModalContainer}>
          <StatusBar barStyle="light-content" backgroundColor={Colors.navy[950]} />

          {/* Modal Header */}
          <View style={styles.proposalModalHeader}>
            <TouchableOpacity
              onPress={() => setProposalModalOpen(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.proposalModalTitle}>Send Formal Proposal</Text>
              <Text style={styles.proposalModalUrduTitle}>رشتہ تجویز اور سوالات بھیجیں</Text>
            </View>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={styles.proposalModalScroll}>
              {/* Target Candidate Summary Banner */}
              <View style={styles.targetBanner}>
                <View style={styles.targetIconWrap}>
                  <Ionicons name="heart" size={20} color={Colors.magenta[400]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.targetName}>
                    Candidate #{candidate.profile_code} ({candidate.age} yrs • {candidate.city || 'Pakistan'})
                  </Text>
                  <Text style={styles.targetSubtitle}>
                    {candidate.education || 'Graduate'} • {candidate.profession || 'Professional'}
                  </Text>
                </View>
              </View>

              {/* Admin Moderation Notice */}
              <View style={styles.moderationNotice}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="shield-checkmark" size={16} color={Colors.gold[400]} />
                  <Text style={styles.moderationTitle}>Admin Review & Privacy Assurance</Text>
                </View>
                <Text style={styles.moderationText}>
                  Your proposal details and questions will be reviewed by the RaabtaNow administration team before being delivered to ensure respectful communication and privacy.
                </Text>
                <Text style={styles.moderationUrduText}>
                  آپ کے سوالات اور تفصیلات ایڈمن کے جائزے کے بعد امیدوار کو پہنچائی جائیں گی تاکہ شائستگی اور پرائیویسی برقرار رہے۔
                </Text>
              </View>

              {/* CNIC Verification Alert if unverified */}
              {!isIdentityVerified && (
                <View style={styles.unverifiedBanner}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Ionicons name="alert-circle" size={18} color={Colors.rose[400]} />
                    <Text style={styles.unverifiedText}>
                      CNIC & Live Selfie verification is required to deliver proposals.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.verifyNowBtn}
                    onPress={() => {
                      setProposalModalOpen(false);
                      navigation.navigate('Verification');
                    }}
                  >
                    <Text style={styles.verifyNowBtnText}>Verify Now</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Field 1: Tell about yourself & family */}
              <View style={styles.fieldSection}>
                <View style={styles.fieldLabelRow}>
                  <Ionicons name="person-outline" size={16} color={Colors.magenta[400]} />
                  <Text style={styles.fieldLabel}>
                    1. Share about yourself & family
                  </Text>
                  <Text style={styles.fieldUrduLabel}>(اپنے اور فیملی کے بارے میں)</Text>
                </View>
                <TextInput
                  style={styles.textArea}
                  placeholder="Share details about your education, job/profession, family background, lifestyle, or partner preferences..."
                  placeholderTextColor={Colors.slate[500]}
                  multiline
                  numberOfLines={4}
                  maxLength={2500}
                  value={senderIntro}
                  onChangeText={setSenderIntro}
                  textAlignVertical="top"
                />
                <View style={styles.counterRow}>
                  <Text style={styles.counterHint}>Optional but recommended to increase response rate</Text>
                  <Text style={styles.counterText}>{senderIntro.length}/2500</Text>
                </View>
              </View>

              {/* Field 2: Questions to ask from candidate */}
              <View style={styles.fieldSection}>
                <View style={styles.fieldLabelRow}>
                  <Ionicons name="help-circle-outline" size={17} color={Colors.cyan ? Colors.cyan[400] : '#38bdf8'} />
                  <Text style={styles.fieldLabel}>
                    2. Questions to ask from the candidate
                  </Text>
                  <Text style={styles.fieldUrduLabel}>(امیدوار سے آپ کیا پوچھنا چاہتے ہیں؟)</Text>
                </View>
                <TextInput
                  style={[styles.textArea, { borderColor: 'rgba(56, 189, 248, 0.4)' }]}
                  placeholder="Ask specific questions regarding career aspirations, city relocation, religious practice, family values..."
                  placeholderTextColor={Colors.slate[500]}
                  multiline
                  numberOfLines={4}
                  maxLength={2500}
                  value={senderQuestions}
                  onChangeText={setSenderQuestions}
                  textAlignVertical="top"
                />
                <View style={styles.counterRow}>
                  <Text style={styles.counterHint}>Specific, respectful questions receive faster replies</Text>
                  <Text style={styles.counterText}>{senderQuestions.length}/2500</Text>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Sticky Bottom Actions */}
          <View style={styles.proposalModalActions}>
            <Button
              title="Cancel / منسوخ"
              variant="secondary"
              onPress={() => setProposalModalOpen(false)}
              style={{ flex: 1 }}
            />
            <Button
              title="Submit Proposal / تجویز بھیجیں"
              variant="primary"
              onPress={handleSendProposal}
              loading={sendingProposal}
              icon={() => <Ionicons name="send" size={15} color={Colors.white} />}
              style={{ flex: 1.5 }}
            />
          </View>
        </SafeAreaView>
      </Modal>
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
  profileHeaderCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.navy[750],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileTitle: {
    fontSize: 20,
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
  proposalButton: {
    shadowColor: Colors.magenta[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  proposalModalContainer: {
    flex: 1,
    backgroundColor: Colors.navy[900],
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  proposalModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
    backgroundColor: Colors.navy[950],
  },
  modalCloseBtn: {
    padding: 4,
  },
  proposalModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  proposalModalUrduTitle: {
    fontSize: 11,
    color: Colors.magenta[400],
    fontWeight: '600',
    marginTop: 1,
  },
  proposalModalScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  targetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
    marginBottom: 16,
  },
  targetIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  targetSubtitle: {
    fontSize: 11,
    color: Colors.slate[400],
    marginTop: 2,
  },
  moderationNotice: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    marginBottom: 16,
    gap: 6,
  },
  moderationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gold[400],
  },
  moderationText: {
    fontSize: 11,
    color: Colors.slate[300],
    lineHeight: 16,
  },
  moderationUrduText: {
    fontSize: 11,
    color: Colors.gold[300],
    textAlign: 'right',
    lineHeight: 18,
  },
  unverifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    marginBottom: 16,
    gap: 10,
  },
  unverifiedText: {
    fontSize: 11,
    color: Colors.rose[300],
    fontWeight: '600',
    lineHeight: 16,
    flex: 1,
  },
  verifyNowBtn: {
    backgroundColor: Colors.rose[600],
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  verifyNowBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  fieldSection: {
    marginBottom: 18,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  fieldUrduLabel: {
    fontSize: 11,
    color: Colors.slate[400],
  },
  textArea: {
    backgroundColor: Colors.navy[950],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.navy[750],
    padding: 12,
    color: Colors.white,
    fontSize: 13,
    minHeight: 90,
    lineHeight: 18,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  counterHint: {
    fontSize: 10,
    color: Colors.slate[500],
    flex: 1,
  },
  counterText: {
    fontSize: 10,
    color: Colors.slate[500],
  },
  proposalModalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.navy[950],
    borderTopWidth: 1,
    borderTopColor: Colors.navy[800],
  },
});
