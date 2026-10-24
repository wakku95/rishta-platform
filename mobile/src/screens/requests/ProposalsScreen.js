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
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../../constants/colors';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { requestsApi } from '../../api/requests';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function ProposalsScreen({ navigation }) {
  const { isIdentityVerified } = useAuth();
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

  // 6. Contact Unlock & Details Modal Handlers
  const handleOpenContactModal = async (proposal) => {
    setContactTarget(proposal);
    setContactModalOpen(true);
    setContactLoading(true);
    setContactData(null);
    try {
      const res = await requestsApi.getUnlockedContact(proposal.request_code || proposal.id);
      if (res?.success && res?.data) {
        setContactData(res.data);
      }
    } catch (err) {
      // If contact not unlocked yet, get unlock status
      try {
        const statusRes = await requestsApi.getUnlockStatus(proposal.request_code || proposal.id);
        setContactData(statusRes?.data || null);
      } catch (e) {
        // quiet
      }
    } finally {
      setContactLoading(false);
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
            const isSender = !isReceived;
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
                {(item.sender_intro || item.sender_questions || item.receiver_intro || item.receiver_answers || item.receiver_questions || item.sender_answers || (isSender && (item.receiver_response_pending_moderation || (item.status === 'accepted' && item.admin_status !== 'approved' && !item.sender_answers))) || (!isSender && (item.sender_answers_pending_moderation || (item.status === 'accepted' && item.admin_status !== 'approved' && item.has_sender_answers)))) && (
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
                    {isSender && (item.receiver_response_pending_moderation || (item.status === 'accepted' && item.admin_status !== 'approved' && !item.sender_answers)) ? (
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
                          {isSender
                            ? 'Candidate has responded! Their answers are under admin review.'
                            : 'Your response is awaiting admin approval before delivery.'}
                        </Text>
                      </View>
                    ) : isSender && item.receiver_questions && !item.sender_answers ? (
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
                      <View style={styles.acceptedActionWrap}>
                        <View style={styles.unlockedBox}>
                          <Ionicons name="checkmark-circle" size={16} color={Colors.emerald[400]} />
                          <Text style={styles.unlockedText}>
                            Proposal Accepted! Both parties are mutually interested.
                          </Text>
                        </View>
                        <Button
                          title="View Verified Contact / رابطہ دیکھیں"
                          variant="primary"
                          size="sm"
                          onPress={() => handleOpenContactModal(item)}
                          style={{ marginTop: 8 }}
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
              <Text style={styles.modalTitle}>Verified Contact Details</Text>
              <Text style={styles.modalUrduTitle}>تصدیق شدہ خاندانی رابطہ نمبر</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {contactLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.magenta[500]} />
                <Text style={{ color: Colors.slate[400], marginTop: 12, fontSize: 13 }}>
                  Fetching contact details...
                </Text>
              </View>
            ) : contactData?.contact || contactData?.phone ? (
              <View style={styles.contactDetailsCard}>
                <View style={styles.contactHeaderRow}>
                  <Ionicons name="call" size={20} color={Colors.emerald[400]} />
                  <Text style={styles.contactTitle}>Direct Family Contact Information</Text>
                </View>

                <View style={styles.contactItemRow}>
                  <Text style={styles.contactItemLabel}>Phone Number / فون نمبر:</Text>
                  <Text style={styles.contactItemVal}>{contactData.phone || contactData.contact?.phone || 'Provided via Matchmaker'}</Text>
                </View>

                {(contactData.guardian_name || contactData.contact?.guardian_name) ? (
                  <View style={styles.contactItemRow}>
                    <Text style={styles.contactItemLabel}>Guardian / سرپرست:</Text>
                    <Text style={styles.contactItemVal}>{contactData.guardian_name || contactData.contact?.guardian_name}</Text>
                  </View>
                ) : null}

                {(contactData.email || contactData.contact?.email) ? (
                  <View style={styles.contactItemRow}>
                    <Text style={styles.contactItemLabel}>Email Address / ای میل:</Text>
                    <Text style={styles.contactItemVal}>{contactData.email || contactData.contact?.email}</Text>
                  </View>
                ) : null}

                <View style={styles.contactInstructionBox}>
                  <Ionicons name="shield-checkmark" size={16} color={Colors.emerald[400]} />
                  <Text style={styles.contactInstructionText}>
                    This contact has been verified via SMS OTP and CNIC audit. Please reach out with mutual respect and Islamic etiquette.
                  </Text>
                </View>

                {contactData.phone ? (
                  <Button
                    title={`Call Candidate: ${contactData.phone}`}
                    variant="primary"
                    onPress={() => Linking.openURL(`tel:${contactData.phone}`)}
                    style={{ marginTop: 12, backgroundColor: Colors.emerald[600] }}
                  />
                ) : null}
              </View>
            ) : (
              <View style={styles.contactLockedCard}>
                <Ionicons name="lock-closed" size={36} color={Colors.gold[400]} style={{ alignSelf: 'center', marginBottom: 10 }} />
                <Text style={styles.contactLockedTitle}>Mutual Contact Unlock</Text>
                <Text style={styles.contactLockedDesc}>
                  Both candidate families have accepted this Rishta proposal! Contact details require mutual phone OTP verification to maintain verified safety.
                </Text>
                <Text style={[styles.contactLockedDesc, { marginTop: 8 }]}>
                  Please complete the Contact Unlock steps in the web portal or verify your mobile number.
                </Text>
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
});
