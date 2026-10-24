import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Linking,
  Image,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { requestsApi } from '../../api/requests';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Config } from '../../constants/config';

export default function ProposalsScreen({ navigation }) {
  const { isIdentityVerified, user, token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeTab, setTypeTab] = useState('received'); // 'received' | 'sent' | 'assisted'
  const [statusFilter, setStatusFilter] = useState(''); // '' (all), 'pending', 'accepted', 'declined', 'cancelled', 'expired'
  const [counts, setCounts] = useState({ received: 0, sent: 0, assisted_inquiries: 0 });
  const [copiedCode, setCopiedCode] = useState(null);

  // Accept Proposal Modal States
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [receiverAnswers, setReceiverAnswers] = useState('');
  const [receiverIntro, setReceiverIntro] = useState('');
  const [receiverQuestions, setReceiverQuestions] = useState('');
  const [acceptSubmitting, setAcceptSubmitting] = useState(false);

  // Reply Modal States (Sender answers receiver's counter questions)
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [senderAnswers, setSenderAnswers] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Edit Initial Proposal Modal States (Sender edits pending proposal upon revision request)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editSenderIntro, setEditSenderIntro] = useState('');
  const [editSenderQuestions, setEditSenderQuestions] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Contact Unlock Modal States
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactTarget, setContactTarget] = useState(null);
  const [contactData, setContactData] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [unlockStatus, setUnlockStatus] = useState(null);
  const [manualTid, setManualTid] = useState('');
  const [receiptAsset, setReceiptAsset] = useState(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [copiedTill, setCopiedTill] = useState(false);
  const [copiedIban, setCopiedIban] = useState(false);
  const [unlockPhone, setUnlockPhone] = useState('');
  const [unlockOtp, setUnlockOtp] = useState('');
  const [otpStep, setOtpStep] = useState('input_phone');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Private Photo States
  const [photoTarget, setPhotoTarget] = useState(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoModalMode, setPhotoModalMode] = useState('upload'); // 'upload' | 'fee'
  const [viewerModalOpen, setViewerModalOpen] = useState(false);
  const [isHoldingPhoto, setIsHoldingPhoto] = useState(false);
  const [uploadPhotoAsset, setUploadPhotoAsset] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoTid, setPhotoTid] = useState('');
  const [photoReceiptAsset, setPhotoReceiptAsset] = useState(null);
  const [submittingPhotoFee, setSubmittingPhotoFee] = useState(false);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await requestsApi.getRequestCounts();
      if (res?.success && res?.data) {
        setCounts(res.data);
      }
    } catch (e) {
      // quiet
    }
  }, []);

  const fetchRequests = useCallback(async (activeTab = typeTab, filter = statusFilter) => {
    try {
      let res;
      if (activeTab === 'assisted') {
        res = await requestsApi.getMyAssistedInquiries();
      } else if (activeTab === 'received') {
        const params = {};
        if (filter) params.status = filter;
        res = await requestsApi.getReceivedRequests(params);
      } else {
        const params = {};
        if (filter) params.status = filter;
        res = await requestsApi.getSentRequests(params);
      }

      const rawList = res?.data?.data || res?.data || res || [];
      const list = Array.isArray(rawList) ? rawList : [];
      setRequests(list);
    } catch (err) {
      console.warn('Failed to fetch requests:', err);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [typeTab, statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchRequests(typeTab, statusFilter);
    fetchCounts();
  }, [typeTab, statusFilter, fetchRequests, fetchCounts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests(typeTab, statusFilter);
    fetchCounts();
  }, [typeTab, statusFilter, fetchRequests, fetchCounts]);

  const handleCopyCode = async (code) => {
    if (!code) return;
    try {
      await Clipboard.setStringAsync(String(code));
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (e) {
      // Ignore
    }
  };

  // 1. Accept Proposal / Edit Response Handlers
  const handleInitiateAccept = (proposal) => {
    if (!isIdentityVerified) {
      Alert.alert(
        'Identity Verification Required / شناختی تصدیق درکار ہے',
        'Identity verification (CNIC + Live Selfie) is required before accepting a Rishta proposal. Please verify your identity first to proceed.',
        [
          { text: 'Cancel / منسوخ', style: 'cancel' },
          {
            text: 'Verify Identity Now / تصدیق کریں',
            onPress: () => navigation.navigate('Verification'),
          },
        ]
      );
      return;
    }

    setSelectedProposal(proposal);
    setReceiverAnswers(proposal.receiver_answers || '');
    setReceiverIntro(proposal.receiver_intro || '');
    setReceiverQuestions(proposal.receiver_questions || '');
    setAcceptModalOpen(true);
  };

  const handleSubmitAccept = async () => {
    if (!selectedProposal) return;
    setAcceptSubmitting(true);
    try {
      await requestsApi.respondToRequest(selectedProposal.request_code || selectedProposal.id, 'accept', {
        receiver_answers: receiverAnswers.trim() || null,
        receiver_intro: receiverIntro.trim() || null,
        receiver_questions: receiverQuestions.trim() || null,
      });

      setAcceptModalOpen(false);
      setSelectedProposal(null);
      fetchRequests(typeTab, statusFilter);
      fetchCounts();

      Alert.alert(
        'Proposal Accepted / رشتہ منظور',
        'Your response and questions have been submitted for moderation review and will be delivered to the candidate family once approved.'
      );
    } catch (err) {
      const errData = err.response?.data;
      const errCode = errData?.error_code || errData?.error;
      const isIdReq = errCode === 'IDENTITY_VERIFICATION_REQUIRED'
        || errData?.message?.toLowerCase().includes('identity verification')
        || errData?.message?.toLowerCase().includes('cnic');

      if (isIdReq) {
        setAcceptModalOpen(false);
        Alert.alert(
          'Identity Verification Required / شناختی تصدیق درکار ہے',
          'Identity verification (CNIC + Live Selfie) is required before accepting a Rishta proposal. Please complete verification first.',
          [
            { text: 'Cancel / منسوخ', style: 'cancel' },
            {
              text: 'Verify Identity Now / تصدیق کریں',
              onPress: () => navigation.navigate('Verification'),
            },
          ]
        );
      } else {
        Alert.alert('Error', errData?.message || 'Failed to submit proposal response.');
      }
    } finally {
      setAcceptSubmitting(false);
    }
  };

  // 2. Decline Proposal Handler
  const handleDeclineProposal = (requestCode) => {
    Alert.alert(
      'Decline Proposal / رشتہ مسترد کریں',
      'Are you sure you want to decline this proposal? This candidate will not be able to send re-requests.',
      [
        { text: 'Cancel / منسوخ', style: 'cancel' },
        {
          text: 'Decline / مسترد کریں',
          style: 'destructive',
          onPress: async () => {
            try {
              await requestsApi.respondToRequest(requestCode, 'decline');
              fetchRequests(typeTab, statusFilter);
              fetchCounts();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to decline proposal.');
            }
          },
        },
      ]
    );
  };

  // 3. Cancel Sent Proposal Handler
  const handleCancelProposal = (requestCode) => {
    Alert.alert(
      'Cancel Rishta Proposal / تجویز منسوخ کریں',
      'Are you sure you want to cancel this sent Rishta proposal? The candidate will no longer receive or respond to this request.',
      [
        { text: 'Review Again / واپس جائیں', style: 'cancel' },
        {
          text: 'Cancel Proposal / منسوخ کریں',
          style: 'destructive',
          onPress: async () => {
            try {
              await requestsApi.cancelRequest(requestCode);
              fetchRequests(typeTab, statusFilter);
              fetchCounts();
              Alert.alert('Cancelled / منسوخ', 'Your Rishta proposal has been cancelled successfully.');
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel proposal.');
            }
          },
        },
      ]
    );
  };

  // 4. Sender Answering Counter-Questions Handlers
  const handleOpenReplyModal = (proposal) => {
    setReplyTarget(proposal);
    setSenderAnswers(proposal.sender_answers || '');
    setReplyModalOpen(true);
  };

  const handleSubmitReply = async () => {
    if (!replyTarget) return;
    if (!senderAnswers.trim()) {
      Alert.alert('Required', 'Please write your answers before submitting.');
      return;
    }
    setReplySubmitting(true);
    try {
      await requestsApi.replyToQuestions(replyTarget.request_code || replyTarget.id, senderAnswers.trim());
      setReplyModalOpen(false);
      setReplyTarget(null);
      fetchRequests(typeTab, statusFilter);
      fetchCounts();
      Alert.alert(
        'Answers Submitted / جوابات جمع کر دیے گئے',
        'Your answers have been submitted for moderation review and will be delivered once approved.'
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit answers.');
    } finally {
      setReplySubmitting(false);
    }
  };

  // 5. Sender Editing Initial Proposal Handlers
  const handleOpenEditModal = (proposal) => {
    setEditTarget(proposal);
    setEditSenderIntro(proposal.sender_intro || '');
    setEditSenderQuestions(proposal.sender_questions || '');
    setEditModalOpen(true);
  };

  const handleSubmitEdit = async () => {
    if (!editTarget) return;
    setEditSubmitting(true);
    try {
      await requestsApi.editProposal(editTarget.request_code || editTarget.id, {
        sender_intro: editSenderIntro.trim() || null,
        sender_questions: editSenderQuestions.trim() || null,
      });
      setEditModalOpen(false);
      setEditTarget(null);
      fetchRequests(typeTab, statusFilter);
      fetchCounts();
      Alert.alert(
        'Proposal Updated / تجویز میں ترمیم ہو گئی',
        'Your proposal has been updated and resubmitted for admin review.'
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update proposal.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // 6. Photo Verification Request Handler
  const handleRequestPhoto = (proposal) => {
    Alert.alert(
      'Request Candidate Photo / تصویر کی درخواست',
      'Are you sure you want to request candidate to share their private photo for mutual evaluation?',
      [
        { text: 'Cancel / منسوخ', style: 'cancel' },
        {
          text: 'Request Photo / درخواست بھیجیں',
          onPress: async () => {
            try {
              const res = await requestsApi.requestVerification(proposal.request_code || proposal.id, 'photo');
              Alert.alert('Requested / درخواست بھیج دی گئی', res?.message || 'Photo request sent to candidate.');
              fetchRequests(typeTab, statusFilter);
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to send photo request.');
            }
          },
        },
      ]
    );
  };

  const handleOpenPhotoViewer = (proposal) => {
    setPhotoTarget(proposal);
    setIsHoldingPhoto(false);
    setViewerModalOpen(true);
  };

  const handleOpenPhotoUpload = (proposal) => {
    setPhotoTarget(proposal);
    setPhotoModalMode('upload');
    setUploadPhotoAsset(null);
    setPhotoModalOpen(true);
  };

  const handleOpenPhotoFeeModal = (proposal) => {
    setPhotoTarget(proposal);
    setPhotoModalMode('fee');
    setPhotoTid('');
    setPhotoReceiptAsset(null);
    setPhotoModalOpen(true);
  };

  const handlePickUploadPhoto = async () => {
    Alert.alert(
      'Select Photo / تصویر منتخب کریں',
      'Choose image source:',
      [
        {
          text: 'Gallery / گیلری',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Media library permission is required.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              quality: 0.8,
              allowsEditing: true,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setUploadPhotoAsset(result.assets[0]);
            }
          },
        },
        {
          text: 'Camera / کیمرہ',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Camera permission is required.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              quality: 0.8,
              allowsEditing: true,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setUploadPhotoAsset(result.assets[0]);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSubmitUploadPhoto = async () => {
    if (!photoTarget || !uploadPhotoAsset) {
      Alert.alert('Photo Required', 'Please select a photo to upload.');
      return;
    }
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: uploadPhotoAsset.uri,
        name: uploadPhotoAsset.fileName || 'proposal_photo.jpg',
        type: uploadPhotoAsset.mimeType || 'image/jpeg',
      });
      await requestsApi.uploadProposalPhoto(photoTarget.request_code || photoTarget.id, formData);
      setPhotoModalOpen(false);
      setUploadPhotoAsset(null);
      fetchRequests(typeTab, statusFilter);
      Alert.alert(
        'Photo Uploaded / تصویر جمع ہو گئی',
        'Your photo has been uploaded and submitted for administrator quality review. Once approved, candidate will be able to view it.'
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmitPhotoFee = async () => {
    if (!photoTarget) return;
    const cleanTid = photoTid.trim();
    if (cleanTid.length < 6) {
      Alert.alert('Required', 'Please enter a valid Transaction Reference / TID (minimum 6 characters).');
      return;
    }
    if (!photoReceiptAsset) {
      Alert.alert('Required', 'Please select payment screenshot or receipt.');
      return;
    }
    setSubmittingPhotoFee(true);
    try {
      const formData = new FormData();
      formData.append('transaction_reference', cleanTid);
      formData.append('receipt', {
        uri: photoReceiptAsset.uri,
        name: photoReceiptAsset.fileName || 'photo_fee_receipt.jpg',
        type: photoReceiptAsset.mimeType || 'image/jpeg',
      });
      await requestsApi.submitManualPhotoProof(photoTarget.request_code || photoTarget.id, formData);
      setPhotoModalOpen(false);
      setPhotoReceiptAsset(null);
      setPhotoTid('');
      fetchRequests(typeTab, statusFilter);
      Alert.alert(
        'Payment Proof Submitted / رسید جمع ہو گئی',
        'Photo fee proof submitted! Administrator will verify it shortly to unlock the candidate photo.'
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit payment proof.');
    } finally {
      setSubmittingPhotoFee(false);
    }
  };

  // 7. Contact Unlock & Details Modal Handlers
  const handleOpenContactModal = async (proposal) => {
    setContactTarget(proposal);
    setContactModalOpen(true);
    setManualTid('');
    setReceiptAsset(null);
    setOtpStep('input_phone');
    setUnlockOtp('');
    await loadUnlockData(proposal);
  };

  const loadUnlockData = async (proposal) => {
    setContactLoading(true);
    setContactData(null);
    setUnlockStatus(null);
    const reqCode = proposal.request_code || proposal.id;
    try {
      // 1. Check if already unlocked
      try {
        const contactRes = await requestsApi.getUnlockedContact(reqCode);
        if (contactRes?.success && contactRes?.data) {
          setContactData(contactRes.data);
          setContactLoading(false);
          return;
        }
      } catch (e) {
        // Not unlocked yet
      }

      // 2. Load unlock status
      const statusRes = await requestsApi.getUnlockStatus(reqCode);
      const data = statusRes?.data || null;
      setUnlockStatus(data);
      if (data?.is_unlocked) {
        const contactRes = await requestsApi.getUnlockedContact(reqCode);
        setContactData(contactRes?.data || null);
      } else if (data?.my_phone) {
        setUnlockPhone(data.my_phone);
      }
    } catch (err) {
      console.log('Unlock status error:', err.response?.data || err.message);
    } finally {
      setContactLoading(false);
    }
  };

  const handleCopyText = async (text, type) => {
    try {
      await Clipboard.setStringAsync(text);
      if (type === 'till') {
        setCopiedTill(true);
        setTimeout(() => setCopiedTill(false), 2000);
      } else if (type === 'iban') {
        setCopiedIban(true);
        setTimeout(() => setCopiedIban(false), 2000);
      }
      Alert.alert('Copied / کاپی ہو گیا', `${text} copied to clipboard.`);
    } catch (e) {
      // quiet
    }
  };

  const handlePickReceipt = async () => {
    Alert.alert(
      'Select Receipt / رسید منتخب کریں',
      'Choose image source for payment screenshot:',
      [
        {
          text: 'Gallery / گیلری',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Media library permission is required to select receipts.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              quality: 0.8,
              allowsEditing: true,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setReceiptAsset(result.assets[0]);
            }
          },
        },
        {
          text: 'Camera / کیمرہ',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Camera permission is required to capture receipts.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              quality: 0.8,
              allowsEditing: true,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setReceiptAsset(result.assets[0]);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSubmitPaymentProof = async () => {
    if (!contactTarget) return;
    const cleanTid = manualTid.trim();
    if (cleanTid.length < 6) {
      Alert.alert('Required', 'Please enter a valid Transaction ID / Reference (minimum 6 characters).');
      return;
    }
    if (!receiptAsset) {
      Alert.alert('Required', 'Please select or capture your payment screenshot/receipt.');
      return;
    }

    setSubmittingProof(true);
    try {
      const formData = new FormData();
      formData.append('transaction_reference', cleanTid);
      formData.append('receipt', {
        uri: receiptAsset.uri,
        name: receiptAsset.fileName || 'receipt.jpg',
        type: receiptAsset.mimeType || 'image/jpeg',
      });

      await requestsApi.submitManualPaymentProof(contactTarget.request_code || contactTarget.id, formData);
      Alert.alert(
        'Proof Submitted / رسید جمع ہو گئی',
        'Your payment proof has been submitted for admin verification. Once verified, contact details will be unlocked.'
      );
      setReceiptAsset(null);
      setManualTid('');
      loadUnlockData(contactTarget);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit payment proof.');
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleSendOtp = async () => {
    if (!unlockPhone.trim()) {
      Alert.alert('Required', 'Please enter your mobile phone number.');
      return;
    }
    setSendingOtp(true);
    try {
      const res = await requestsApi.sendUnlockOtp(contactTarget.request_code || contactTarget.id, unlockPhone.trim());
      setOtpStep('input_otp');
      Alert.alert('OTP Sent', res.message || 'A 6-digit verification code has been sent to your mobile.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!unlockOtp.trim() || unlockOtp.trim().length < 4) {
      Alert.alert('Required', 'Please enter the verification code.');
      return;
    }
    setVerifyingOtp(true);
    try {
      await requestsApi.verifyUnlockOtp(contactTarget.request_code || contactTarget.id, unlockOtp.trim());
      Alert.alert('Verified! / تصدیق مکمل', 'Mobile number verified successfully!');
      loadUnlockData(contactTarget);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to verify OTP code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Status Badge Determination
  const getBadgeInfo = (item, isSender) => {
    const status = item.status;
    const adminStatus = item.admin_status;

    if (adminStatus === 'needs_revision') {
      return {
        label: 'NEEDS REVISION / درکار ترمیم',
        variant: 'danger',
      };
    }

    switch (status) {
      case 'pending':
        if (isSender && adminStatus === 'pending_review') {
          return { label: 'UNDER REVIEW / زیرِ جائزہ', variant: 'gold' };
        }
        if (isSender && adminStatus === 'rejected') {
          return { label: 'REVIEW REJECTED', variant: 'danger' };
        }
        return { label: 'PENDING / زیرِ التواء', variant: 'gold' };

      case 'accepted':
        if (adminStatus === 'pending_review') {
          return {
            label: isSender ? 'RESPONSE UNDER REVIEW' : 'AWAITING APPROVAL',
            variant: 'gold',
          };
        }
        return { label: 'ACCEPTED / منظور', variant: 'success' };

      case 'declined':
        return { label: 'DECLINED / مسترد', variant: 'danger' };

      case 'cancelled':
        return { label: 'CANCELLED / منسوخ', variant: 'default' };

      case 'expired':
        return { label: 'EXPIRED / ختم شدہ', variant: 'default' };

      default:
        return { label: String(status || 'PENDING').toUpperCase(), variant: 'default' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[900]} />

      <View style={styles.header}>
        <Text style={styles.title}>Rishta Proposals</Text>
        <Text style={styles.subtitle}>Mutual inquiries and proposal lifecycle</Text>

        {/* Tab Switcher */}
        <View style={styles.tabPillContainer}>
          <TouchableOpacity
            style={[styles.tabPill, typeTab === 'received' && styles.tabPillActive]}
            onPress={() => { setTypeTab('received'); setStatusFilter(''); }}
          >
            <View style={styles.tabPillInner}>
              <Text style={[styles.tabPillText, typeTab === 'received' && styles.tabPillTextActive]}>
                Received
              </Text>
              {counts.received > 0 && (
                <View style={styles.tabCountBadge}>
                  <Text style={styles.tabCountText}>{counts.received}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, typeTab === 'sent' && styles.tabPillActive]}
            onPress={() => { setTypeTab('sent'); setStatusFilter(''); }}
          >
            <View style={styles.tabPillInner}>
              <Text style={[styles.tabPillText, typeTab === 'sent' && styles.tabPillTextActive]}>
                Sent
              </Text>
              {counts.sent > 0 && (
                <View style={styles.tabCountBadge}>
                  <Text style={styles.tabCountText}>{counts.sent}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, typeTab === 'assisted' && styles.tabPillActive]}
            onPress={() => { setTypeTab('assisted'); setStatusFilter(''); }}
          >
            <View style={styles.tabPillInner}>
              <Text style={[styles.tabPillText, typeTab === 'assisted' && styles.tabPillTextActive]}>
                Assisted
              </Text>
              {counts.assisted_inquiries > 0 && (
                <View style={styles.tabCountBadge}>
                  <Text style={styles.tabCountText}>{counts.assisted_inquiries}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Status Filter Chips (For Received & Sent tabs) */}
        {typeTab !== 'assisted' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipScroll}
          >
            {[
              { key: '', label: 'All Statuses' },
              { key: 'pending', label: 'Pending' },
              { key: 'accepted', label: 'Accepted' },
              { key: 'declined', label: 'Declined' },
              { key: 'cancelled', label: 'Cancelled' },
              { key: 'expired', label: 'Expired' },
            ].map((f) => {
              const active = statusFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setStatusFilter(f.key)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.magenta[500]} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.request_code || String(item.id || Math.random())}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.magenta[400]}
            />
          }
          renderItem={({ item }) => {
            // 1. Assisted Listing Inquiries
            if (typeTab === 'assisted') {
              const listing = item.listing;
              const listingCode = listing?.listing_code;
              const statusLabel = {
                new: 'UNDER REVIEW',
                contacted: 'COORDINATING',
                in_progress: 'IN PROGRESS',
                introduced: 'INTRODUCED',
                rejected: 'NOT SUITABLE',
                cancelled: 'CANCELLED',
              }[item.status] || (item.status ? item.status.toUpperCase() : 'PENDING');

              const statusVariant = {
                new: 'gold',
                contacted: 'gold',
                in_progress: 'magenta',
                introduced: 'success',
                rejected: 'danger',
                cancelled: 'default',
              }[item.status] || 'gold';

              return (
                <Card style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={styles.codeCol}>
                      <Text style={styles.candidateCode}>Inquiry #{item.id}</Text>
                      {listingCode ? (
                        <View style={styles.candidateRow}>
                          <TouchableOpacity
                            onPress={() => navigation.navigate('AssistedDetail', { listingCode })}
                          >
                            <Text style={styles.metaTextClickable}>
                              Listing: #{listingCode}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleCopyCode(listingCode)}
                            style={styles.copyPill}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons
                              name={copiedCode === listingCode ? 'checkmark-circle' : 'copy-outline'}
                              size={13}
                              color={copiedCode === listingCode ? Colors.emerald[400] : Colors.magenta[400]}
                            />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text style={styles.metaText}>Matchmaker Managed Profile</Text>
                      )}

                      {listing && (listing.city || listing.gender || listing.age) ? (
                        <Text style={styles.subMetaText}>
                          {[
                            listing.age ? `${listing.age} yrs` : null,
                            listing.gender,
                            listing.city,
                          ].filter(Boolean).join(' • ')}
                        </Text>
                      ) : null}
                    </View>

                    <Badge label={statusLabel} variant={statusVariant} />
                  </View>

                  {item.message ? (
                    <View style={styles.messageBox}>
                      <Text style={styles.messageLabel}>Your Inquiry Note:</Text>
                      <Text style={styles.messageText}>"{item.message}"</Text>
                    </View>
                  ) : null}

                  {item.admin_notes ? (
                    <View style={styles.coordinatorNoteBox}>
                      <Ionicons name="sparkles" size={14} color={Colors.gold[400]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.coordinatorNoteTitle}>
                          Matchmaker Update / کوآرڈینیٹر کا جواب:
                        </Text>
                        <Text style={styles.coordinatorNoteText}>{item.admin_notes}</Text>
                      </View>
                    </View>
                  ) : null}

                  {listingCode ? (
                    <View style={styles.profileActionRow}>
                      <Button
                        title="View Assisted Listing / مکمل تفصیل دیکھیں"
                        variant="secondary"
                        size="sm"
                        onPress={() => navigation.navigate('AssistedDetail', { listingCode })}
                        style={styles.viewProfileBtn}
                      />
                    </View>
                  ) : null}
                </Card>
              );
            }

            // 2. Standard Rishta Proposals (Received or Sent)
            const isReceived = typeTab === 'received';
            const candidate = item.candidate_profile || (isReceived ? item.sender?.profile || item.sender : item.receiver?.profile || item.receiver);
            const candCode = candidate?.profile_code;
            const isSender = item.is_sender !== undefined ? Boolean(item.is_sender) : !isReceived;
            const badgeInfo = getBadgeInfo(item, isSender);

            return (
              <Card style={styles.requestCard}>
                {/* Header: Proposal Code & Status Badge */}
                <View style={styles.requestHeader}>
                  <View style={styles.codeCol}>
                    <Text style={styles.candidateCode}>
                      Proposal #{item.request_code || item.id}
                    </Text>

                    {candCode ? (
                      <View style={styles.candidateRow}>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('CandidateDetail', { profileCode: candCode })}
                        >
                          <Text style={styles.metaTextClickable}>
                            Candidate: #{candCode}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleCopyCode(candCode)}
                          style={styles.copyPill}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name={copiedCode === candCode ? 'checkmark-circle' : 'copy-outline'}
                            size={13}
                            color={copiedCode === candCode ? Colors.emerald[400] : Colors.magenta[400]}
                          />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.metaText}>Candidate: Private / Vetted</Text>
                    )}

                    {candidate && (candidate.city || candidate.profession || candidate.age) ? (
                      <Text style={styles.subMetaText}>
                        {[
                          candidate.age ? `${candidate.age} yrs` : null,
                          candidate.gender,
                          candidate.city,
                          candidate.profession,
                        ].filter(Boolean).join(' • ')}
                      </Text>
                    ) : null}
                  </View>

                  <Badge label={badgeInfo.label} variant={badgeInfo.variant} />
                </View>

                {/* View Full Profile Button */}
                {candCode ? (
                  <TouchableOpacity
                    style={styles.viewProfileBtn}
                    onPress={() => navigation.navigate('CandidateDetail', { profileCode: candCode })}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="eye-outline" size={15} color={Colors.magenta[300]} />
                    <Text style={styles.viewProfileBtnText}>View Full Profile / مکمل پروفائل دیکھیں</Text>
                  </TouchableOpacity>
                ) : null}

                {/* Comprehensive Proposal Communication Thread (Q&A Section) */}
                {(item.sender_intro || item.sender_questions || item.receiver_intro || item.receiver_answers || item.receiver_questions || item.sender_answers || (isSender && (item.receiver_response_pending_moderation || (item.status === 'accepted' && item.admin_status !== 'approved'))) || (!isSender && (item.sender_answers_pending_moderation || (item.status === 'accepted' && item.admin_status !== 'approved' && item.has_sender_answers)))) && (
                  <View style={styles.communicationThread}>
                    <View style={styles.threadHeaderRow}>
                      <Ionicons name="chatbubbles-outline" size={14} color={Colors.magenta[400]} />
                      <Text style={styles.threadHeaderText}>Proposal Communication / رشتہ انکوائری و سوالات</Text>
                    </View>

                    {/* 1. Sender Introduction */}
                    {item.sender_intro ? (
                      <View style={styles.threadItemBox}>
                        <Text style={styles.threadItemLabel}>
                          {isSender ? 'Your Introduction / آپ کا تعارف:' : 'Candidate Introduction / امیدوار کا تعارف:'}
                        </Text>
                        <Text style={styles.threadItemText}>"{item.sender_intro}"</Text>
                      </View>
                    ) : null}

                    {/* 2. Sender Questions for Candidate */}
                    {item.sender_questions ? (
                      <View style={[styles.threadItemBox, { borderColor: 'rgba(34, 211, 238, 0.3)' }]}>
                        <Text style={[styles.threadItemLabel, { color: Colors.cyan?.[400] || '#22d3ee' }]}>
                          {isSender ? 'Your Questions for Candidate / آپ کے سوالات:' : "Candidate's Questions for You / امیدوار کے سوالات:"}
                        </Text>
                        <Text style={styles.threadItemText}>"{item.sender_questions}"</Text>
                      </View>
                    ) : null}

                    {/* Moderation Pending Review Notice for Sender */}
                    {isSender && (item.receiver_response_pending_moderation || (item.status === 'accepted' && item.admin_status !== 'approved')) ? (
                      <View style={[styles.reviewNoticeBox, item.admin_status === 'needs_revision' ? { borderColor: 'rgba(244, 63, 94, 0.4)' } : {}]}>
                        <Ionicons
                          name={item.admin_status === 'needs_revision' ? 'alert-circle-outline' : 'time-outline'}
                          size={15}
                          color={item.admin_status === 'needs_revision' ? Colors.rose[400] : Colors.gold[400]}
                        />
                        <Text style={[styles.reviewNoticeText, item.admin_status === 'needs_revision' ? { color: Colors.rose[300] } : {}]}>
                          {item.admin_status === 'needs_revision'
                            ? 'Candidate has been requested by administration to revise their response before delivery.'
                            : 'Candidate has responded to your proposal! Their answers are currently under admin review and will appear here once approved.'}
                        </Text>
                      </View>
                    ) : (
                      <>
                        {/* 3. Receiver Family Details */}
                        {item.receiver_intro ? (
                          <View style={[styles.threadItemBox, { borderColor: 'rgba(168, 85, 247, 0.3)' }]}>
                            <Text style={[styles.threadItemLabel, { color: Colors.magenta[400] }]}>
                              {isSender ? "Candidate's Family & Background / امیدوار کے خاندانی کوائف:" : 'Your Family & Background / آپ کے خاندانی کوائف:'}
                            </Text>
                            <Text style={styles.threadItemText}>"{item.receiver_intro}"</Text>
                          </View>
                        ) : null}

                        {/* 4. Receiver Answers */}
                        {item.receiver_answers ? (
                          <View style={[styles.threadItemBox, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                            <Text style={[styles.threadItemLabel, { color: Colors.emerald[400] }]}>
                              {isSender ? "Candidate's Answers / امیدوار کے جوابات:" : 'Your Answers / آپ کے جوابات:'}
                            </Text>
                            <Text style={styles.threadItemText}>"{item.receiver_answers}"</Text>
                          </View>
                        ) : null}

                        {/* 5. Receiver Counter-Questions */}
                        {item.receiver_questions ? (
                          <View style={[styles.threadItemBox, { borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                            <Text style={[styles.threadItemLabel, { color: Colors.gold[400] }]}>
                              {isSender ? "Candidate's Questions / امیدوار کے سوالات:" : 'Your Questions for Candidate / امیدوار سے آپ کے سوالات:'}
                            </Text>
                            <Text style={styles.threadItemText}>"{item.receiver_questions}"</Text>
                          </View>
                        ) : null}

                        {/* 6. Sender Answers to Counter-Questions */}
                        {!isSender && (item.sender_answers_pending_moderation || (item.status === 'accepted' && item.admin_status !== 'approved' && item.has_sender_answers)) ? (
                          <View style={[styles.reviewNoticeBox, item.admin_status === 'needs_revision' ? { borderColor: 'rgba(244, 63, 94, 0.4)' } : {}]}>
                            <Ionicons
                              name={item.admin_status === 'needs_revision' ? 'alert-circle-outline' : 'time-outline'}
                              size={15}
                              color={item.admin_status === 'needs_revision' ? Colors.rose[400] : Colors.gold[400]}
                            />
                            <Text style={[styles.reviewNoticeText, item.admin_status === 'needs_revision' ? { color: Colors.rose[300] } : {}]}>
                              {item.admin_status === 'needs_revision'
                                ? 'Sender has been requested by administration to revise their answers before delivery.'
                                : 'Sender has submitted answers to your questions! They are currently under moderation review and will appear here once approved.'}
                            </Text>
                          </View>
                        ) : item.sender_answers ? (
                          <View style={[styles.threadItemBox, { borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                            <Text style={[styles.threadItemLabel, { color: Colors.cyan?.[400] || '#38bdf8' }]}>
                              {isSender ? 'Your Answers to Questions / سوالات کے آپ کے جوابات:' : "Candidate's Answers / امیدوار کے جوابات:"}
                            </Text>
                            <Text style={styles.threadItemText}>"{item.sender_answers}"</Text>
                          </View>
                        ) : null}
                      </>
                    )}
                  </View>
                )}

                {/* Received Actions (When Pending) */}
                {isReceived && item.status === 'pending' && (
                  <View style={styles.actionRow}>
                    <Button
                      title="Decline / مسترد کریں"
                      variant="secondary"
                      size="sm"
                      onPress={() => handleDeclineProposal(item.request_code || item.id)}
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="Review & Accept / قبول کریں"
                      variant="primary"
                      size="sm"
                      onPress={() => handleInitiateAccept(item)}
                      style={{ flex: 1.3 }}
                    />
                  </View>
                )}

                {/* Sent Actions (When Pending) */}
                {isSender && item.status === 'pending' && (
                  <View style={styles.actionRow}>
                    {item.admin_status === 'needs_revision' && (
                      <Button
                        title="Edit Proposal / ترمیم کریں"
                        variant="primary"
                        size="sm"
                        onPress={() => handleOpenEditModal(item)}
                        style={{ flex: 1, backgroundColor: Colors.gold[600] }}
                      />
                    )}
                    <Button
                      title="Cancel Request / منسوخ کریں"
                      variant="secondary"
                      size="sm"
                      onPress={() => handleCancelProposal(item.request_code || item.id)}
                      style={{ flex: 1 }}
                    />
                  </View>
                )}

                {/* Accepted Proposal Actions & Lifecycle */}
                {item.status === 'accepted' && (
                  <View style={{ marginTop: 6 }}>
                    {/* Moderation Revision Case */}
                    {item.admin_status === 'needs_revision' ? (
                      <View style={{ marginTop: 4 }}>
                        <View style={styles.revisionNoticeBox}>
                          <Ionicons name="alert-circle" size={16} color={Colors.rose[400]} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.revisionNoticeTitle}>
                              {item.can_edit_response ? 'Admin Revision Request / درکار ترمیم:' : 'Moderator Update:'}
                            </Text>
                            <Text style={styles.revisionNoticeText}>
                              {item.can_edit_response
                                ? `"${item.admin_notes || 'Please revise your answers as requested by admin.'}"`
                                : 'Candidate has been requested by admin to revise their response.'}
                            </Text>
                          </View>
                        </View>

                        {item.can_edit_response && (
                          <Button
                            title="Edit & Resubmit Response / جواب میں ترمیم کریں"
                            variant="primary"
                            size="sm"
                            onPress={() => {
                              if (isSender) {
                                handleOpenReplyModal(item);
                              } else {
                                handleInitiateAccept(item);
                              }
                            }}
                            style={{ marginTop: 8, backgroundColor: Colors.gold[600] }}
                          />
                        )}
                      </View>
                    ) : item.admin_status === 'pending_review' ? (
                      <View style={styles.reviewNoticeBox}>
                        <Ionicons name="time-outline" size={15} color={Colors.gold[400]} />
                        <Text style={styles.reviewNoticeText}>
                          {item.sender_answers || item.has_sender_answers || item.sender_answers_pending_moderation
                            ? isSender
                              ? 'Your answers to candidate\'s questions have been submitted and are under admin review.'
                              : 'Candidate has submitted answers to your questions! They are currently under admin review.'
                            : isSender
                            ? 'Candidate has responded! Their answers are under admin review.'
                            : 'Your response is awaiting admin approval before delivery.'}
                        </Text>
                      </View>
                    ) : item.receiver_questions && !item.sender_answers ? (
                      isSender ? (
                        <View style={{ marginTop: 6 }}>
                          <Button
                            title="Answer Candidate's Questions / جواب دیں"
                            variant="primary"
                            size="sm"
                            onPress={() => handleOpenReplyModal(item)}
                            style={{ backgroundColor: Colors.cyan?.[600] || '#0891b2' }}
                          />
                        </View>
                      ) : (
                        <View style={styles.waitingNoticeBox}>
                          <Ionicons name="hourglass-outline" size={15} color={Colors.gold[400]} />
                          <Text style={styles.waitingNoticeText}>
                            Awaiting candidate's answers to your questions / امیدوار کے جوابات کا انتظار ہے
                          </Text>
                        </View>
                      )
                    ) : (
                      /* Phase 4.5: Mutual Q&A Completed & Mutual Trust Gate */
                      <View style={styles.mutualTrustGate}>
                        <View style={styles.mutualStageHeader}>
                          <Ionicons name="sparkles" size={16} color={Colors.magenta[400]} />
                          <Text style={styles.mutualStageTitle}>
                            Stage: Mutual Q&A Completed / سوال و جواب کا مرحلہ مکمل
                          </Text>
                        </View>
                        <Text style={styles.mutualStageSubtitle}>
                          Carefully evaluate candidate answers. You can request candidate photo and unlock verified contact details.
                        </Text>

                        <View style={styles.mutualActionsRow}>
                          {/* Photo Exchange Action */}
                          {item.candidate_photo_shared ? (
                            item.can_view_candidate_photo || (item.photo_moderation_status === 'approved' && item.photo_paid) ? (
                              <TouchableOpacity
                                style={styles.photoViewBtn}
                                onPress={() => handleOpenPhotoViewer(item)}
                              >
                                <Ionicons name="eye" size={14} color={Colors.white} />
                                <Text style={styles.photoViewBtnText}>Hold to View Photo / تصویر دیکھیں</Text>
                              </TouchableOpacity>
                            ) : item.photo_payment_pending ? (
                              <View style={styles.photoPendingBadge}>
                                <Ionicons name="time-outline" size={14} color={Colors.gold[400]} />
                                <Text style={styles.photoPendingBadgeText}>Photo Fee Under Review</Text>
                              </View>
                            ) : item.photo_moderation_status === 'approved' ? (
                              <TouchableOpacity
                                style={styles.photoPayBtn}
                                onPress={() => handleOpenPhotoFeeModal(item)}
                              >
                                <Ionicons name="card-outline" size={14} color={Colors.white} />
                                <Text style={styles.photoPayBtnText}>Unlock Photo (Rs. 300)</Text>
                              </TouchableOpacity>
                            ) : (
                              <View style={styles.photoPendingBadge}>
                                <Ionicons name="time-outline" size={14} color={Colors.gold[400]} />
                                <Text style={styles.photoPendingBadgeText}>Candidate Photo In Review</Text>
                              </View>
                            )
                          ) : item.photo_requested_by_candidate && !item.my_photo_shared ? (
                            <TouchableOpacity
                              style={styles.photoUploadReqBtn}
                              onPress={() => handleOpenPhotoUpload(item)}
                            >
                              <Ionicons name="camera" size={14} color={Colors.white} />
                              <Text style={styles.photoUploadReqBtnText}>Candidate Asked for Photo (Upload)</Text>
                            </TouchableOpacity>
                          ) : item.photo_requested_by_me ? (
                            <View style={styles.photoPendingBadge}>
                              <Ionicons name="time-outline" size={14} color={Colors.gold[400]} />
                              <Text style={styles.photoPendingBadgeText}>Photo Requested (Awaiting Candidate)</Text>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={styles.photoReqBtn}
                              onPress={() => handleRequestPhoto(item)}
                            >
                              <Ionicons name="camera-outline" size={14} color={Colors.cyan[300]} />
                              <Text style={styles.photoReqBtnText}>Request Photo</Text>
                            </TouchableOpacity>
                          )}

                          {/* My Photo Upload / Status */}
                          {!item.my_photo_shared && !item.photo_requested_by_candidate ? (
                            <TouchableOpacity
                              style={styles.photoShareBtn}
                              onPress={() => handleOpenPhotoUpload(item)}
                            >
                              <Ionicons name="cloud-upload-outline" size={13} color={Colors.magenta[300]} />
                              <Text style={styles.photoShareBtnText}>Share My Photo</Text>
                            </TouchableOpacity>
                          ) : item.my_photo_shared ? (
                            <View style={styles.photoMySharedBadge}>
                              <Ionicons name="checkmark-circle" size={13} color={Colors.emerald[400]} />
                              <Text style={styles.photoMySharedBadgeText}>
                                {item.my_photo_moderation_status === 'approved' ? 'My Photo Approved ✅' : 'My Photo In Review'}
                              </Text>
                            </View>
                          ) : null}

                          {/* CNIC Verified Status Badge */}
                          {item.candidate_nic_shared || item.candidate_is_identity_verified ? (
                            <View style={styles.cnicVerifiedBadge}>
                              <Ionicons name="shield-checkmark" size={14} color={Colors.emerald[400]} />
                              <Text style={styles.cnicVerifiedBadgeText}>CNIC Verified ✅</Text>
                            </View>
                          ) : (
                            <View style={styles.cnicPendingBadge}>
                              <Ionicons name="shield-outline" size={14} color={Colors.slate[400]} />
                              <Text style={styles.cnicPendingBadgeText}>Identity Pending</Text>
                            </View>
                          )}
                        </View>

                        {/* Unlock Contact Button */}
                        <Button
                          title="Satisfied? Unlock Contact / رابطہ انلاک کریں"
                          variant="primary"
                          size="sm"
                          onPress={() => handleOpenContactModal(item)}
                          style={{ marginTop: 10, backgroundColor: Colors.magenta[600] }}
                        />
                      </View>
                    )}
                  </View>
                )}
              </Card>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name={typeTab === 'assisted' ? 'sparkles-outline' : 'mail-open-outline'}
                size={44}
                color={Colors.slate[500]}
              />
              <Text style={styles.emptyTitle}>
                {typeTab === 'assisted'
                  ? 'No Assisted Inquiries Yet'
                  : statusFilter
                  ? `No ${statusFilter.toUpperCase()} proposals in this tab`
                  : 'No Proposals in this Tab'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {typeTab === 'assisted'
                  ? 'Inquiries you make about matchmaker-assisted profiles will appear here along with live coordinator updates.'
                  : typeTab === 'received'
                  ? 'When other candidate families send you a proposal, it will appear here.'
                  : 'Proposals you send to other candidates will appear here with live tracking.'}
              </Text>
            </View>
          }
        />
      )}

      {/* 1. Accept Proposal Modal */}
      <Modal
        visible={acceptModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setAcceptModalOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor={Colors.navy[950]} />

          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setAcceptModalOpen(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.modalTitle}>Accept Proposal & Respond</Text>
              <Text style={styles.modalUrduTitle}>رشتہ تجویز قبول اور جواب</Text>
            </View>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {selectedProposal && (() => {
                const cand = selectedProposal.candidate_profile || selectedProposal.sender?.profile || selectedProposal.sender;
                return (
                  <View style={styles.targetBanner}>
                    <View style={styles.targetIconWrap}>
                      <Ionicons name="checkmark-circle" size={22} color={Colors.emerald[400]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.targetName}>
                        Candidate #{cand?.profile_code || selectedProposal.request_code} {cand?.age ? `(${cand.age} yrs • ${cand.city || 'Pakistan'})` : ''}
                      </Text>
                      <Text style={styles.targetSubtitle}>
                        {[cand?.education, cand?.profession].filter(Boolean).join(' • ') || 'Verified Matrimonial Match'}
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {selectedProposal && (selectedProposal.sender_intro || selectedProposal.sender_questions) && (
                <View style={styles.receivedQuestionsCard}>
                  <Text style={styles.receivedQuestionsHeader}>Candidate's Proposal Message:</Text>
                  {selectedProposal.sender_intro ? (
                    <View style={styles.receivedItemBox}>
                      <Text style={styles.receivedItemLabel}>About Candidate & Family:</Text>
                      <Text style={styles.receivedItemText}>"{selectedProposal.sender_intro}"</Text>
                    </View>
                  ) : null}

                  {selectedProposal.sender_questions ? (
                    <View style={styles.receivedItemBox}>
                      <Text style={[styles.receivedItemLabel, { color: Colors.cyan?.[400] || '#22d3ee' }]}>Questions Asked by Candidate:</Text>
                      <Text style={styles.receivedItemText}>"{selectedProposal.sender_questions}"</Text>
                    </View>
                  ) : null}
                </View>
              )}

              {/* Field 1: Your answers to candidate's questions */}
              <View style={styles.fieldSection}>
                <View style={styles.fieldLabelRow}>
                  <Ionicons name="chatbubbles" size={16} color={Colors.emerald[400]} />
                  <Text style={styles.fieldLabel}>1. Your answers to candidate's questions:</Text>
                </View>
                <Text style={styles.fieldUrduLabel}>(امیدوار کے سوالات کے جوابات)</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={3}
                  value={receiverAnswers}
                  onChangeText={setReceiverAnswers}
                  placeholder="Provide answers to the questions asked above..."
                  placeholderTextColor={Colors.slate[500]}
                  textAlignVertical="top"
                />
              </View>

              {/* Field 2: What would you like to share about yourself & family? */}
              <View style={styles.fieldSection}>
                <View style={styles.fieldLabelRow}>
                  <Ionicons name="person" size={16} color={Colors.magenta[400]} />
                  <Text style={styles.fieldLabel}>2. What would you like to share about yourself & family?</Text>
                </View>
                <Text style={styles.fieldUrduLabel}>(اپنے اور فیملی کے بارے میں مزید)</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={3}
                  value={receiverIntro}
                  onChangeText={setReceiverIntro}
                  placeholder="Share details you want the candidate to know regarding your preferences or family..."
                  placeholderTextColor={Colors.slate[500]}
                  textAlignVertical="top"
                />
              </View>

              {/* Field 3: Questions for the candidate (Counter-Questions) */}
              <View style={styles.fieldSection}>
                <View style={styles.fieldLabelRow}>
                  <Ionicons name="help-circle" size={16} color={Colors.gold[400]} />
                  <Text style={styles.fieldLabel}>3. Questions for the candidate (Counter-Questions):</Text>
                </View>
                <Text style={styles.fieldUrduLabel}>(امیدوار سے آپ کیا پوچھنا چاہتے ہیں؟)</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={3}
                  value={receiverQuestions}
                  onChangeText={setReceiverQuestions}
                  placeholder="Ask questions you would like the candidate family to answer..."
                  placeholderTextColor={Colors.slate[500]}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.moderationNotice}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="shield-checkmark" size={16} color={Colors.gold[400]} />
                  <Text style={styles.moderationTitle}>Admin Review & Moderation</Text>
                </View>
                <Text style={styles.moderationText}>
                  Your answers and counter-questions will be reviewed by admin before delivery to ensure respectful and genuine communication.
                </Text>
              </View>

              <View style={styles.modalActionButtons}>
                <Button
                  title={acceptSubmitting ? 'Submitting...' : 'Accept & Submit Answers / رشتہ قبول کریں'}
                  variant="primary"
                  loading={acceptSubmitting}
                  onPress={handleSubmitAccept}
                  style={styles.submitModalBtn}
                />
                <Button
                  title="Cancel / منسوخ"
                  variant="secondary"
                  onPress={() => setAcceptModalOpen(false)}
                  style={{ marginTop: 8 }}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* 2. Reply Proposal Modal (Sender answers receiver's counter questions) */}
      <Modal
        visible={replyModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setReplyModalOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor={Colors.navy[950]} />

          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setReplyModalOpen(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.modalTitle}>Answer Candidate's Questions</Text>
              <Text style={styles.modalUrduTitle}>امیدوار کے سوالات کے جوابات</Text>
            </View>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {replyTarget && (
                <View style={styles.receivedQuestionsCard}>
                  <Text style={[styles.receivedQuestionsHeader, { color: Colors.gold[400] }]}>
                    Candidate's Questions for You:
                  </Text>
                  <Text style={styles.receivedItemText}>
                    "{replyTarget.receiver_questions || 'Please answer the candidate inquiries.'}"
                  </Text>
                </View>
              )}

              <View style={styles.fieldSection}>
                <View style={styles.fieldLabelRow}>
                  <Ionicons name="chatbubbles" size={16} color={Colors.cyan?.[400] || '#22d3ee'} />
                  <Text style={styles.fieldLabel}>Your Answers / آپ کے جوابات:</Text>
                </View>
                <TextInput
                  style={[styles.textArea, { minHeight: 120 }]}
                  multiline
                  numberOfLines={5}
                  value={senderAnswers}
                  onChangeText={setSenderAnswers}
                  placeholder="Write clear, respectful answers to the candidate's questions..."
                  placeholderTextColor={Colors.slate[500]}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalActionButtons}>
                <Button
                  title={replySubmitting ? 'Submitting...' : 'Submit Answers / جوابات جمع کریں'}
                  variant="primary"
                  loading={replySubmitting}
                  onPress={handleSubmitReply}
                  style={{ backgroundColor: Colors.cyan?.[600] || '#0891b2' }}
                />
                <Button
                  title="Cancel / منسوخ"
                  variant="secondary"
                  onPress={() => setReplyModalOpen(false)}
                  style={{ marginTop: 8 }}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* 3. Edit Proposal Modal (Sender edits pending proposal upon admin revision) */}
      <Modal
        visible={editModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setEditModalOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor={Colors.navy[950]} />

          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setEditModalOpen(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.modalTitle}>Edit Proposal / تجویز میں ترمیم</Text>
              <Text style={styles.modalUrduTitle}>ایڈمن کی درخواست پر ترمیم کریں</Text>
            </View>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {editTarget?.admin_notes && (
                <View style={styles.revisionNoticeBox}>
                  <Ionicons name="alert-circle" size={16} color={Colors.rose[400]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.revisionNoticeTitle}>Admin Requested Revision:</Text>
                    <Text style={styles.revisionNoticeText}>"{editTarget.admin_notes}"</Text>
                  </View>
                </View>
              )}

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Your Introduction / تعارف:</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={3}
                  value={editSenderIntro}
                  onChangeText={setEditSenderIntro}
                  placeholder="Briefly introduce yourself and your family..."
                  placeholderTextColor={Colors.slate[500]}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Questions for Candidate / امیدوار کے لیے سوالات:</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={3}
                  value={editSenderQuestions}
                  onChangeText={setEditSenderQuestions}
                  placeholder="Questions for candidate family..."
                  placeholderTextColor={Colors.slate[500]}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalActionButtons}>
                <Button
                  title={editSubmitting ? 'Updating...' : 'Update & Resubmit / تجویز محفوظ کریں'}
                  variant="primary"
                  loading={editSubmitting}
                  onPress={handleSubmitEdit}
                  style={{ backgroundColor: Colors.gold[600] }}
                />
                <Button
                  title="Cancel / منسوخ"
                  variant="secondary"
                  onPress={() => setEditModalOpen(false)}
                  style={{ marginTop: 8 }}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* 4. Contact Details & Unlock Modal */}
      <Modal
        visible={contactModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setContactModalOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor={Colors.navy[950]} />

          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setContactModalOpen(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.modalTitle}>Mutual Contact Unlock</Text>
              <Text style={styles.modalUrduTitle}>خاندانی رابطہ اور تصدیقی مراحل</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {contactLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.magenta[500]} />
                <Text style={{ color: Colors.slate[400], marginTop: 12, fontSize: 13 }}>
                  Checking contact unlock status...
                </Text>
              </View>
            ) : contactData?.phone || contactData?.contact?.phone ? (
              <View style={styles.contactDetailsCard}>
                <View style={styles.contactHeaderRow}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.emerald[400]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactTitle}>Direct Family Contact Information</Text>
                    <Text style={{ fontSize: 11, color: Colors.emerald[300], marginTop: 1 }}>
                      Verified via SMS OTP & Administration Audit
                    </Text>
                  </View>
                </View>

                <View style={styles.contactItemRow}>
                  <Text style={styles.contactItemLabel}>Candidate / Family Name:</Text>
                  <Text style={[styles.contactItemVal, { color: Colors.white }]}>
                    {contactData.name || contactData.guardian_name || 'Candidate Family'}
                  </Text>
                </View>

                <View style={styles.contactItemRow}>
                  <Text style={styles.contactItemLabel}>Phone Number / فون نمبر:</Text>
                  <Text style={styles.contactItemVal}>{contactData.phone || contactData.contact?.phone}</Text>
                </View>

                {(contactData.guardian_name || contactData.contact?.guardian_name) ? (
                  <View style={styles.contactItemRow}>
                    <Text style={styles.contactItemLabel}>Guardian / سرپرست:</Text>
                    <Text style={[styles.contactItemVal, { color: Colors.white }]}>
                      {contactData.guardian_name || contactData.contact?.guardian_name}
                    </Text>
                  </View>
                ) : null}

                {(contactData.email || contactData.contact?.email) ? (
                  <View style={styles.contactItemRow}>
                    <Text style={styles.contactItemLabel}>Email Address / ای میل:</Text>
                    <Text style={[styles.contactItemVal, { fontSize: 13, color: Colors.slate[200] }]}>
                      {contactData.email || contactData.contact?.email}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.contactInstructionBox}>
                  <Ionicons name="shield-checkmark" size={16} color={Colors.emerald[400]} />
                  <Text style={styles.contactInstructionText}>
                    This contact has been verified via SMS OTP and CNIC audit. Please reach out directly with mutual respect and Islamic etiquette.
                  </Text>
                </View>

                {/* Call & WhatsApp Buttons */}
                {contactData.phone ? (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <Button
                      title="Call Candidate"
                      variant="primary"
                      size="sm"
                      onPress={() => Linking.openURL(`tel:${contactData.phone}`)}
                      style={{ flex: 1, backgroundColor: Colors.emerald[600] }}
                    />
                    <Button
                      title="WhatsApp"
                      variant="primary"
                      size="sm"
                      onPress={() => {
                        const cleanPhone = String(contactData.phone).replace(/[^0-9]/g, '');
                        Linking.openURL(`https://wa.me/${cleanPhone}`);
                      }}
                      style={{ flex: 1, backgroundColor: '#25D366' }}
                    />
                  </View>
                ) : null}
              </View>
            ) : unlockStatus?.pending_payment ? (
              <View style={[styles.contactLockedCard, { borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
                <Ionicons name="time" size={36} color={Colors.gold[400]} style={{ alignSelf: 'center', marginBottom: 10 }} />
                <Text style={styles.contactLockedTitle}>Payment Proof Submitted / رسید زیرِ جائزہ</Text>
                <Text style={styles.contactLockedDesc}>
                  Your payment proof has been received and is currently pending admin verification.
                  Payments are audited within a few hours during business hours.
                </Text>

                <View style={[styles.bankDetailsCard, { width: '100%', marginTop: 12 }]}>
                  <View style={styles.bankDetailRow}>
                    <Text style={styles.bankDetailLabel}>Transaction ID / رسید نمبر:</Text>
                    <Text style={styles.bankDetailVal}>{unlockStatus.pending_payment.transaction_reference}</Text>
                  </View>
                  <View style={styles.bankDetailRow}>
                    <Text style={styles.bankDetailLabel}>Amount / رقم:</Text>
                    <Text style={[styles.bankDetailVal, { color: Colors.gold[400] }]}>
                      Rs. {unlockStatus.pending_payment.amount ? Number(unlockStatus.pending_payment.amount).toFixed(0) : '2500'} PKR
                    </Text>
                  </View>
                </View>

                <Button
                  title="Check Verification Status / اسٹیٹس ریفریش کریں"
                  variant="secondary"
                  size="sm"
                  onPress={() => loadUnlockData(contactTarget)}
                  style={{ marginTop: 14, width: '100%' }}
                />
              </View>
            ) : unlockStatus?.is_paid && !unlockStatus?.my_verified ? (
              <View style={styles.contactLockedCard}>
                <Ionicons name="phone-portrait-outline" size={36} color={Colors.magenta[400]} style={{ alignSelf: 'center', marginBottom: 10 }} />
                <Text style={[styles.contactLockedTitle, { color: Colors.white }]}>
                  Verify Mobile Number / فون نمبر کی تصدیق
                </Text>
                <Text style={styles.contactLockedDesc}>
                  Payment verified! To ensure safety and authenticity, please verify your mobile number via OTP.
                </Text>

                {otpStep === 'input_phone' ? (
                  <View style={{ width: '100%', marginTop: 12 }}>
                    <Text style={styles.fieldLabel}>Mobile Phone Number (03XX-XXXXXXX):</Text>
                    <TextInput
                      style={[styles.textArea, { minHeight: 44, marginTop: 6 }]}
                      value={unlockPhone}
                      onChangeText={setUnlockPhone}
                      placeholder="03001234567"
                      placeholderTextColor={Colors.slate[500]}
                      keyboardType="phone-pad"
                    />
                    <Button
                      title="Send OTP Code / کوڈ حاصل کریں"
                      variant="primary"
                      isLoading={sendingOtp}
                      onPress={handleSendOtp}
                      style={{ marginTop: 12, backgroundColor: Colors.magenta[600] }}
                    />
                  </View>
                ) : (
                  <View style={{ width: '100%', marginTop: 12 }}>
                    <Text style={styles.fieldLabel}>Enter 6-Digit Verification Code:</Text>
                    <TextInput
                      style={[styles.textArea, { minHeight: 44, marginTop: 6, textAlign: 'center', fontSize: 18, letterSpacing: 4 }]}
                      value={unlockOtp}
                      onChangeText={setUnlockOtp}
                      placeholder="XXXXXX"
                      placeholderTextColor={Colors.slate[500]}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                    <Button
                      title="Verify & Unlock / تصدیق کر کے رابطہ حاصل کریں"
                      variant="primary"
                      isLoading={verifyingOtp}
                      onPress={handleVerifyOtp}
                      style={{ marginTop: 12, backgroundColor: Colors.emerald[600] }}
                    />
                    <TouchableOpacity onPress={handleSendOtp} style={{ marginTop: 10, alignSelf: 'center' }}>
                      <Text style={{ fontSize: 12, color: Colors.cyan[400], fontWeight: '600' }}>
                        Resend Code / دوبارہ کوڈ بھیجیں
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (!contactTarget?.is_sender && unlockStatus?.my_role !== 'sender') ? (
              <View style={styles.contactLockedCard}>
                <Ionicons name="hourglass-outline" size={36} color={Colors.cyan[400]} style={{ alignSelf: 'center', marginBottom: 10 }} />
                <Text style={[styles.contactLockedTitle, { color: Colors.white }]}>
                  Awaiting Sender's Payment / فیس کی ادائیگی کا انتظار
                </Text>
                <Text style={styles.contactLockedDesc}>
                  The proposal sender is responsible for paying the contact unlock fee (Rs. 2,500 PKR).
                </Text>
                <View style={[styles.contactInstructionBox, { marginTop: 12, width: '100%' }]}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.emerald[400]} />
                  <Text style={styles.contactInstructionText}>
                    No Fee For You: As the proposal receiver, you do not need to pay anything. Once sender pays and admin verifies, contact details will be unlocked for both families.
                  </Text>
                </View>
                <Button
                  title="Check Status / اسٹیٹس چیک کریں"
                  variant="secondary"
                  size="sm"
                  onPress={() => loadUnlockData(contactTarget)}
                  style={{ marginTop: 14, width: '100%' }}
                />
              </View>
            ) : (
              /* SENDER PAYMENT SUBMISSION FORM */
              <View style={{ gap: 12 }}>
                {unlockStatus?.rejected_payment && (
                  <View style={[styles.revisionNoticeBox, { marginTop: 0 }]}>
                    <Ionicons name="alert-circle" size={16} color={Colors.rose[400]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.revisionNoticeTitle, { color: Colors.rose[400] }]}>
                        Previous Payment Proof Rejected:
                      </Text>
                      <Text style={styles.revisionNoticeText}>
                        {unlockStatus.rejected_payment.admin_notes || 'Transaction reference could not be verified. Please submit valid proof.'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Bank & Payment Particulars */}
                <View style={styles.bankDetailsCard}>
                  <View style={styles.bankDetailRow}>
                    <Text style={styles.bankDetailLabel}>Exact Amount / رقم:</Text>
                    <Text style={[styles.bankDetailVal, { color: Colors.gold[400], fontSize: 14 }]}>
                      Rs. 2500 PKR
                    </Text>
                  </View>
                  <View style={styles.bankDetailRow}>
                    <Text style={styles.bankDetailLabel}>Account Title / نام:</Text>
                    <Text style={styles.bankDetailVal}>muhammad shop</Text>
                  </View>
                  <View style={styles.bankDetailRow}>
                    <Text style={styles.bankDetailLabel}>Bank Name / بینک:</Text>
                    <Text style={styles.bankDetailVal}>Mobilink Microfinance Bank (JazzCash)</Text>
                  </View>

                  {/* IBAN */}
                  <View style={styles.bankDetailRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.bankDetailLabel}>IBAN (Any Bank Transfer):</Text>
                      <Text style={[styles.bankDetailVal, { fontSize: 11, color: Colors.cyan[300] }]}>
                        PK74JCMA1009921032404609
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.copyBtn, copiedIban && styles.copyBtnCopied]}
                      onPress={() => handleCopyText('PK74JCMA1009921032404609', 'iban')}
                    >
                      <Ionicons name={copiedIban ? 'checkmark' : 'copy-outline'} size={12} color={copiedIban ? Colors.emerald[400] : Colors.slate[300]} />
                      <Text style={[styles.copyBtnText, copiedIban && { color: Colors.emerald[400] }]}>
                        {copiedIban ? 'Copied' : 'Copy'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Till ID */}
                  <View style={styles.bankDetailRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.bankDetailLabel}>Till ID (JazzCash App):</Text>
                      <Text style={[styles.bankDetailVal, { fontSize: 13, color: Colors.gold[400] }]}>
                        984453113
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.copyBtn, copiedTill && styles.copyBtnCopied]}
                      onPress={() => handleCopyText('984453113', 'till')}
                    >
                      <Ionicons name={copiedTill ? 'checkmark' : 'copy-outline'} size={12} color={copiedTill ? Colors.emerald[400] : Colors.slate[300]} />
                      <Text style={[styles.copyBtnText, copiedTill && { color: Colors.emerald[400] }]}>
                        {copiedTill ? 'Copied' : 'Copy'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={{ fontSize: 10, color: Colors.slate[400], lineHeight: 14 }}>
                    💡 Send Rs. 2500 from any app (JazzCash, Easypaisa, Nayapay, SadaPay, HBL, Meezan) to IBAN or Till ID above, then submit TID and screenshot below.
                  </Text>
                </View>

                {/* Form: TID & Screenshot */}
                <View style={{ gap: 8 }}>
                  <Text style={styles.fieldLabel}>Transaction Reference / TID Number:</Text>
                  <TextInput
                    style={[styles.textArea, { minHeight: 44 }]}
                    value={manualTid}
                    onChangeText={setManualTid}
                    placeholder="e.g. 0123456789"
                    placeholderTextColor={Colors.slate[500]}
                  />

                  <Text style={[styles.fieldLabel, { marginTop: 4 }]}>Payment Screenshot / رسید کی تصویر:</Text>
                  {receiptAsset ? (
                    <View style={styles.receiptPreviewBox}>
                      <Image source={{ uri: receiptAsset.uri }} style={styles.receiptPreviewImg} />
                      <TouchableOpacity
                        style={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 12 }}
                        onPress={() => setReceiptAsset(null)}
                      >
                        <Ionicons name="close" size={16} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.receiptSelectBtn} onPress={handlePickReceipt}>
                      <Ionicons name="camera-outline" size={18} color={Colors.magenta[400]} />
                      <Text style={styles.receiptSelectText}>Upload Screenshot / رسید منتخب کریں</Text>
                    </TouchableOpacity>
                  )}

                  <Button
                    title="Submit Payment Proof / رسید جمع کریں"
                    variant="primary"
                    isLoading={submittingProof}
                    onPress={handleSubmitPaymentProof}
                    style={{ marginTop: 10, backgroundColor: Colors.magenta[600] }}
                  />
                </View>
              </View>
            )}

            <Button
              title="Close / بند کریں"
              variant="secondary"
              onPress={() => setContactModalOpen(false)}
              style={{ marginTop: 16 }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 5. Secure Photo Viewer Modal (Hold to View) */}
      <Modal
        visible={viewerModalOpen}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setViewerModalOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor={Colors.navy[950]} />
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setViewerModalOpen(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.modalTitle}>Protected Photo Viewer</Text>
              <Text style={styles.modalUrduTitle}>محفوظ تصویر • دیکھنے کے لیے انگلی دبا کر رکھیں</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.viewerScroll}>
            {/* Security Warning Notice */}
            <View style={styles.securityWarningCard}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.cyan[400]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.securityWarningTitle}>Anti-Screenshot & Watermark Active</Text>
                <Text style={styles.securityWarningText}>
                  تصویر پر آپ کی شناختی معلومات بطور واٹر مارک درج ہیں۔ سکرین شاٹ لینے یا محفوظ کرنے کی سخت ممانعت ہے۔
                </Text>
              </View>
            </View>

            {/* Hold to View Canvas Container */}
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={() => setIsHoldingPhoto(true)}
              onPressOut={() => setIsHoldingPhoto(false)}
              style={styles.photoViewerContainer}
            >
              {photoTarget && (
                <Image
                  source={{
                    uri: `${Config.API_BASE_URL}/requests/${photoTarget.request_code || photoTarget.id}/view-photo`,
                    headers: {
                      Authorization: `Bearer ${token}`,
                      Accept: 'image/*',
                    },
                  }}
                  style={[
                    styles.viewerImage,
                    isHoldingPhoto ? styles.viewerImageSharp : styles.viewerImageBlur,
                  ]}
                  blurRadius={isHoldingPhoto ? 0 : 30}
                  resizeMode="contain"
                />
              )}

              {/* Watermark Diagonal Overlay (Always visible across the image for protection) */}
              <View style={styles.watermarkOverlay} pointerEvents="none">
                {[-20, 5, 30, 55, 80].map((topPct, idx) => (
                  <Text key={idx} style={[styles.watermarkLine, { top: `${topPct}%` }]}>
                    {user?.profile?.profile_code || 'MEMBER'} • {user?.phone || 'CONFIDENTIAL'} • RISHTA PROTECTED
                  </Text>
                ))}
              </View>

              {/* Blur / Cover Overlay when NOT holding */}
              {!isHoldingPhoto && (
                <View style={styles.coverOverlay} pointerEvents="none">
                  <View style={styles.coverIconWrap}>
                    <Ionicons name="eye-outline" size={40} color={Colors.cyan[400]} />
                  </View>
                  <Text style={styles.coverTitle}>Hold to View / دیکھنے کے لیے دبا کر رکھیں</Text>
                  <Text style={styles.coverSubtitle}>
                    تصویر دیکھنے کے لیے نیچے دیئے گئے بٹن یا تصویر پر انگلی دبا کر رکھیں۔ انگلی اٹھانے پر تصویر فوری طور پر دھندلی ہو جائے گی۔
                  </Text>
                </View>
              )}

              {/* Active Viewing Top Badge */}
              {isHoldingPhoto && (
                <View style={styles.activeViewingPill} pointerEvents="none">
                  <Ionicons name="eye" size={13} color={Colors.cyan[300]} />
                  <Text style={styles.activeViewingPillText}>Viewing Active • Release to Blur</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Big Touch & Hold Action Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPressIn={() => setIsHoldingPhoto(true)}
              onPressOut={() => setIsHoldingPhoto(false)}
              style={[styles.holdButton, isHoldingPhoto && styles.holdButtonActive]}
            >
              <Ionicons
                name={isHoldingPhoto ? 'eye' : 'finger-print'}
                size={30}
                color={Colors.white}
              />
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.holdButtonTitle}>
                  {isHoldingPhoto ? 'Viewing Photo / تصویر کھل چکی ہے' : 'Press & Hold with Finger / انگلی دبا کر رکھیں'}
                </Text>
                <Text style={styles.holdButtonSubtitle}>
                  {isHoldingPhoto ? 'Release finger to blur / انگلی اٹھانے پر چھپ جائے گی' : 'Keep finger pressed down to reveal photo'}
                </Text>
              </View>
            </TouchableOpacity>

            <Button
              title="Done / بند کریں"
              variant="secondary"
              onPress={() => setViewerModalOpen(false)}
              style={{ marginTop: 16 }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 6. Photo Upload & Fee Modal */}
      <Modal
        visible={photoModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setPhotoModalOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor={Colors.navy[950]} />
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setPhotoModalOpen(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.modalTitle}>
                {photoModalMode === 'upload' ? 'Upload Proposal Photo' : 'Unlock Candidate Photo'}
              </Text>
              <Text style={styles.modalUrduTitle}>
                {photoModalMode === 'upload' ? 'تصویر برائے ایڈمن ریویو' : 'تصویر دیکھنے کی فیس (Rs. 300)'}
              </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {photoModalMode === 'upload' ? (
              <View style={{ gap: 14 }}>
                <View style={styles.securityWarningCard}>
                  <Ionicons name="shield-checkmark" size={18} color={Colors.cyan[400]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.securityWarningTitle}>100% Privacy & Admin Moderation</Text>
                    <Text style={styles.securityWarningText}>
                      تمام تصاویر پہلے ایڈمن سے منظور ہوتی ہیں اور دیکھنے والے کے شناختی واٹر مارک کے ساتھ کھلتی ہیں۔
                    </Text>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Select Clear Facial Photo / واضح تصویر منتخب کریں:</Text>
                {uploadPhotoAsset ? (
                  <View style={styles.receiptPreviewBox}>
                    <Image source={{ uri: uploadPhotoAsset.uri }} style={styles.receiptPreviewImg} />
                    <TouchableOpacity
                      style={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 12 }}
                      onPress={() => setUploadPhotoAsset(null)}
                    >
                      <Ionicons name="close" size={16} color={Colors.white} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.receiptSelectBtn} onPress={handlePickUploadPhoto}>
                    <Ionicons name="camera-outline" size={22} color={Colors.magenta[400]} />
                    <Text style={styles.receiptSelectText}>Choose Photo from Gallery / کیمرہ</Text>
                  </TouchableOpacity>
                )}

                <Button
                  title="Upload for Admin Review / جمع کروائیں"
                  variant="primary"
                  isLoading={uploadingPhoto}
                  onPress={handleSubmitUploadPhoto}
                  style={{ marginTop: 10, backgroundColor: Colors.magenta[600] }}
                />
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <View style={styles.securityWarningCard}>
                  <Ionicons name="lock-closed" size={18} color={Colors.gold[400]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.securityWarningTitle, { color: Colors.gold[400] }]}>Photo Viewing Fee (Rs. 300 PKR)</Text>
                    <Text style={styles.securityWarningText}>
                      امیدوار کی تصویر ایڈمن سے منظور شدہ ہے۔ واٹر مارک کے ساتھ محفوظ تصویر دیکھنے کے لیے Rs. 300 فیس کی رسید جمع کروائیں۔
                    </Text>
                  </View>
                </View>

                <View style={styles.bankDetailsCard}>
                  <View style={styles.bankDetailRow}>
                    <Text style={styles.bankDetailLabel}>Exact Fee / فیس:</Text>
                    <Text style={[styles.bankDetailVal, { color: Colors.gold[400], fontSize: 14 }]}>Rs. 300 PKR</Text>
                  </View>
                  <View style={styles.bankDetailRow}>
                    <Text style={styles.bankDetailLabel}>Account Title / نام:</Text>
                    <Text style={styles.bankDetailVal}>muhammad shop</Text>
                  </View>
                  <View style={styles.bankDetailRow}>
                    <Text style={styles.bankDetailLabel}>Bank / بینک:</Text>
                    <Text style={styles.bankDetailVal}>Mobilink Microfinance Bank (JazzCash)</Text>
                  </View>
                  <View style={styles.bankDetailRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bankDetailLabel}>Till ID (JazzCash App):</Text>
                      <Text style={[styles.bankDetailVal, { color: Colors.gold[400] }]}>984453113</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.copyBtn, copiedTill && styles.copyBtnCopied]}
                      onPress={() => handleCopyText('984453113', 'till')}
                    >
                      <Text style={styles.copyBtnText}>{copiedTill ? 'Copied' : 'Copy'}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.bankDetailRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bankDetailLabel}>IBAN (Any Bank):</Text>
                      <Text style={[styles.bankDetailVal, { fontSize: 11, color: Colors.cyan[300] }]}>PK74JCMA1009921032404609</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.copyBtn, copiedIban && styles.copyBtnCopied]}
                      onPress={() => handleCopyText('PK74JCMA1009921032404609', 'iban')}
                    >
                      <Text style={styles.copyBtnText}>{copiedIban ? 'Copied' : 'Copy'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Transaction Reference / TID Number:</Text>
                <TextInput
                  style={[styles.textArea, { minHeight: 44 }]}
                  value={photoTid}
                  onChangeText={setPhotoTid}
                  placeholder="e.g. 10987654321"
                  placeholderTextColor={Colors.slate[500]}
                />

                <Text style={[styles.fieldLabel, { marginTop: 4 }]}>Payment Screenshot / رسید کی تصویر:</Text>
                {photoReceiptAsset ? (
                  <View style={styles.receiptPreviewBox}>
                    <Image source={{ uri: photoReceiptAsset.uri }} style={styles.receiptPreviewImg} />
                    <TouchableOpacity
                      style={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 12 }}
                      onPress={() => setPhotoReceiptAsset(null)}
                    >
                      <Ionicons name="close" size={16} color={Colors.white} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.receiptSelectBtn}
                    onPress={async () => {
                      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (status === 'granted') {
                        const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true });
                        if (!result.canceled && result.assets && result.assets.length > 0) {
                          setPhotoReceiptAsset(result.assets[0]);
                        }
                      }
                    }}
                  >
                    <Ionicons name="camera-outline" size={20} color={Colors.magenta[400]} />
                    <Text style={styles.receiptSelectText}>Upload Screenshot / رسید منتخب کریں</Text>
                  </TouchableOpacity>
                )}

                <Button
                  title="Submit Rs. 300 Payment Proof / جمع کریں"
                  variant="primary"
                  isLoading={submittingPhotoFee}
                  onPress={handleSubmitPhotoFee}
                  style={{ marginTop: 10, backgroundColor: Colors.emerald[600] }}
                />
              </View>
            )}

            <Button
              title="Cancel / بند کریں"
              variant="secondary"
              onPress={() => setPhotoModalOpen(false)}
              style={{ marginTop: 14 }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy[900],
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 4,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.slate[400],
    marginTop: 2,
    marginBottom: 10,
  },
  tabPillContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.navy[950],
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.navy[800],
  },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  tabPillActive: {
    backgroundColor: Colors.magenta[600],
  },
  tabPillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate[400],
  },
  tabPillTextActive: {
    color: Colors.white,
  },
  tabCountBadge: {
    backgroundColor: Colors.navy[900],
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
  },
  filterChipScroll: {
    paddingTop: 8,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.navy[800],
  },
  filterChipActive: {
    backgroundColor: 'rgba(225, 29, 116, 0.2)',
    borderColor: Colors.magenta[500],
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate[400],
  },
  filterChipTextActive: {
    color: Colors.magenta[300],
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  listContent: {
    padding: 14,
    paddingBottom: 30,
    gap: 12,
  },
  requestCard: {
    backgroundColor: Colors.navy[850],
    borderWidth: 1,
    borderColor: Colors.navy[750],
    borderRadius: 16,
    padding: 14,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  codeCol: {
    flex: 1,
  },
  candidateCode: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate[400],
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 2,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaTextClickable: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
  },
  copyPill: {
    backgroundColor: Colors.navy[900],
    padding: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.navy[700],
  },
  metaText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  subMetaText: {
    fontSize: 11,
    color: Colors.slate[400],
    marginTop: 2,
  },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(225, 29, 116, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 116, 0.3)',
    marginTop: 10,
  },
  viewProfileBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.magenta[300],
  },
  communicationThread: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.navy[750],
    gap: 8,
  },
  threadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  threadHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.magenta[400],
    textTransform: 'uppercase',
  },
  threadItemBox: {
    backgroundColor: Colors.navy[950],
    borderRadius: 10,
    padding: 9,
    borderWidth: 1,
    borderColor: Colors.navy[750],
  },
  threadItemLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate[400],
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  threadItemText: {
    fontSize: 12,
    color: Colors.slate[200],
    lineHeight: 17,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  revisionNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  revisionNoticeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.rose[400],
    marginBottom: 2,
  },
  revisionNoticeText: {
    fontSize: 11,
    color: Colors.slate[200],
    lineHeight: 16,
  },
  reviewNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginTop: 6,
  },
  reviewNoticeText: {
    flex: 1,
    fontSize: 11,
    color: Colors.gold[400],
    lineHeight: 16,
    fontWeight: '600',
  },
  waitingNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    marginTop: 6,
  },
  waitingNoticeText: {
    flex: 1,
    fontSize: 11,
    color: Colors.gold[400],
    lineHeight: 16,
    fontWeight: '600',
  },
  mutualTrustGate: {
    marginTop: 8,
    padding: 12,
    backgroundColor: Colors.navy[900],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 116, 0.35)',
    gap: 6,
  },
  mutualStageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mutualStageTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.white,
  },
  mutualStageSubtitle: {
    fontSize: 11,
    color: Colors.slate[400],
    lineHeight: 15,
  },
  mutualActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  photoSharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  photoSharedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.cyan[300],
  },
  photoPendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  photoPendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gold[400],
  },
  photoReqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.navy[800],
    borderWidth: 1,
    borderColor: Colors.cyan[500],
  },
  photoReqBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.cyan[300],
  },
  cnicVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  cnicVerifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.emerald[400],
  },
  cnicPendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.navy[750],
  },
  cnicPendingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate[400],
  },
  acceptedActionWrap: {
    marginTop: 6,
  },
  unlockedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  unlockedText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.emerald[400],
  },
  messageBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: Colors.navy[900],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.navy[750],
  },
  messageLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate[400],
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 12,
    color: Colors.slate[200],
    lineHeight: 17,
    fontStyle: 'italic',
  },
  coordinatorNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    padding: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  coordinatorNoteTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.gold[400],
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  coordinatorNoteText: {
    fontSize: 12,
    color: Colors.slate[200],
    lineHeight: 16,
  },
  profileActionRow: {
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.slate[400],
    textAlign: 'center',
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.navy[900],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
    backgroundColor: Colors.navy[950],
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.navy[800],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  modalUrduTitle: {
    fontSize: 11,
    color: Colors.magenta[400],
    fontWeight: '600',
    marginTop: 1,
  },
  modalScroll: {
    padding: 16,
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
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 16,
  },
  targetIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
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
  receivedQuestionsCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.navy[750],
    marginBottom: 16,
  },
  receivedQuestionsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.magenta[400],
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  receivedItemBox: {
    marginBottom: 8,
  },
  receivedItemLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate[400],
    marginBottom: 2,
  },
  receivedItemText: {
    fontSize: 12,
    color: Colors.slate[200],
    fontStyle: 'italic',
    lineHeight: 18,
    backgroundColor: Colors.navy[900],
    padding: 8,
    borderRadius: 8,
  },
  fieldSection: {
    marginBottom: 16,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  fieldUrduLabel: {
    fontSize: 11,
    color: Colors.slate[400],
    marginBottom: 6,
  },
  textArea: {
    backgroundColor: Colors.navy[950],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.navy[750],
    padding: 12,
    color: Colors.white,
    fontSize: 13,
    minHeight: 70,
    lineHeight: 18,
  },
  moderationNotice: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    marginBottom: 16,
    gap: 4,
  },
  moderationTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gold[400],
  },
  moderationText: {
    fontSize: 11,
    color: Colors.slate[300],
    lineHeight: 16,
  },
  modalActionButtons: {
    marginTop: 8,
  },
  submitModalBtn: {
    backgroundColor: Colors.emerald[600],
  },
  contactDetailsCard: {
    backgroundColor: Colors.navy[950],
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 12,
  },
  contactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
  },
  contactItemRow: {
    gap: 2,
  },
  contactItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate[400],
  },
  contactItemVal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.emerald[400],
  },
  contactInstructionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  contactInstructionText: {
    flex: 1,
    fontSize: 11,
    color: Colors.slate[200],
    lineHeight: 16,
  },
  contactLockedCard: {
    backgroundColor: Colors.navy[950],
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLockedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.gold[400],
    marginBottom: 6,
  },
  contactLockedDesc: {
    fontSize: 12,
    color: Colors.slate[300],
    textAlign: 'center',
    lineHeight: 18,
  },
  bankDetailsCard: {
    backgroundColor: Colors.navy[950],
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.navy[750],
    gap: 10,
    marginTop: 8,
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[850],
  },
  bankDetailLabel: {
    fontSize: 11,
    color: Colors.slate[400],
    fontWeight: '600',
  },
  bankDetailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.navy[800],
    borderWidth: 1,
    borderColor: Colors.slate[600],
  },
  copyBtnCopied: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: Colors.emerald[500],
  },
  copyBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate[200],
  },
  receiptPreviewBox: {
    height: 120,
    borderRadius: 10,
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.navy[750],
    overflow: 'hidden',
    marginTop: 6,
  },
  receiptPreviewImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  receiptSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.magenta[500],
    marginTop: 6,
  },
  receiptSelectText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.magenta[400],
  },
  photoViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.cyan[600],
    borderWidth: 1,
    borderColor: Colors.cyan[400],
    shadowColor: Colors.cyan[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  photoViewBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.white,
  },
  photoPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.emerald[600],
    borderWidth: 1,
    borderColor: Colors.emerald[400],
  },
  photoPayBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  photoUploadReqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.magenta[600],
    borderWidth: 1,
    borderColor: Colors.magenta[400],
  },
  photoUploadReqBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  photoShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(225, 29, 116, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 116, 0.35)',
  },
  photoShareBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.magenta[300],
  },
  photoMySharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  photoMySharedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.emerald[400],
  },
  viewerScroll: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  securityWarningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  securityWarningTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.cyan[300],
    marginBottom: 2,
  },
  securityWarningText: {
    fontSize: 11,
    color: Colors.slate[300],
    lineHeight: 16,
  },
  photoViewerContainer: {
    position: 'relative',
    width: '100%',
    height: 380,
    borderRadius: 16,
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.navy[750],
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  viewerImageSharp: {
    opacity: 1,
  },
  viewerImageBlur: {
    opacity: 0.15,
  },
  watermarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  watermarkLine: {
    position: 'absolute',
    left: -60,
    right: -60,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.28)',
    transform: [{ rotate: '-25deg' }],
    letterSpacing: 2,
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 15, 30, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  coverIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 2,
    borderColor: Colors.cyan[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  coverTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 11,
    color: Colors.cyan[200],
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 260,
  },
  activeViewingPill: {
    position: 'absolute',
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 15, 30, 0.85)',
    borderWidth: 1,
    borderColor: Colors.cyan[400],
  },
  activeViewingPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.cyan[300],
  },
  holdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: Colors.cyan[600],
    borderWidth: 2,
    borderColor: Colors.cyan[400],
    shadowColor: Colors.cyan[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    marginTop: 4,
  },
  holdButtonActive: {
    backgroundColor: Colors.emerald[600],
    borderColor: Colors.emerald[400],
    shadowColor: Colors.emerald[500],
  },
  holdButtonTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
  },
  holdButtonSubtitle: {
    fontSize: 11,
    color: Colors.slate[200],
    marginTop: 2,
  },
});
