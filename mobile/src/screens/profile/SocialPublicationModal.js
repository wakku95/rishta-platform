import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors } from '../../constants/colors';
import Button from '../../components/common/Button';
import { socialApi } from '../../api/social';
import { Ionicons } from '@expo/vector-icons';

export default function SocialPublicationModal({ visible, onClose }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [latestRequest, setLatestRequest] = useState(null);
  const [platforms, setPlatforms] = useState(['facebook', 'instagram']);
  const [consentGiven, setConsentGiven] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await socialApi.getLatestRequest();
      setLatestRequest(data);
      if (data?.requested_platforms) {
        setPlatforms(data.requested_platforms);
        setConsentGiven(Boolean(data.consent_given));
      }
    } catch (err) {
      // quiet ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchStatus();
    }
  }, [visible]);

  const togglePlatform = (p) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleSubmit = async () => {
    if (platforms.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one platform (Facebook or Instagram).');
      return;
    }
    if (!consentGiven) {
      Alert.alert('Consent Required', 'Please check the consent box acknowledging that your anonymous proposal card may be shared.');
      return;
    }

    setSubmitting(true);
    try {
      await socialApi.submitRequest(platforms, consentGiven);
      Alert.alert('Request Submitted', 'Your social media publication consent request has been submitted to admin.');
      await fetchStatus();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!latestRequest?.id) return;
    setSubmitting(true);
    try {
      await socialApi.removeRequest(latestRequest.id);
      Alert.alert('Consent Withdrawn', 'Your social media publication request has been removed.');
      await fetchStatus();
    } catch (err) {
      Alert.alert('Error', 'Failed to remove request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Social Media Reach / سوشل میڈیا تشہیر</Text>
              <Text style={styles.subtitle}>Facebook & Instagram Matrimonial Sharing</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.magenta[500]} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.content}>
              {/* Existing Status Badge */}
              {latestRequest && (
                <View style={styles.statusBox}>
                  <Ionicons name="information-circle" size={16} color={Colors.cyan[400]} />
                  <Text style={styles.statusText}>
                    Status: <Text style={{ fontWeight: '800', color: Colors.white }}>{String(latestRequest.status).toUpperCase()}</Text>
                  </Text>
                </View>
              )}

              {/* Explanatory Box */}
              <View style={styles.infoBox}>
                <Ionicons name="megaphone-outline" size={20} color={Colors.magenta[400]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoTitle}>Expand Your Proposal Reach:</Text>
                  <Text style={styles.infoDesc}>
                    RaabtaNow can share a dignified, anonymous rishta card (showing Age, City, Education, and Profession only) on our official Facebook and Instagram pages.
                  </Text>
                  <Text style={styles.infoPrivacy}>
                    🔒 Your name, phone number, and private contact info are NEVER published on social media.
                  </Text>
                </View>
              </View>

              {/* Platform Checkboxes */}
              <Text style={styles.label}>Select Platforms / پلیٹ فارم منتخب کریں:</Text>
              <View style={styles.platformRow}>
                <TouchableOpacity
                  onPress={() => togglePlatform('facebook')}
                  style={[styles.platformChip, platforms.includes('facebook') && styles.platformChipSelected]}
                >
                  <Ionicons
                    name={platforms.includes('facebook') ? 'checkbox' : 'square-outline'}
                    size={18}
                    color={platforms.includes('facebook') ? '#3B82F6' : Colors.slate[400]}
                  />
                  <Text style={[styles.platformText, platforms.includes('facebook') && { color: Colors.white }]}>
                    Facebook Page
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => togglePlatform('instagram')}
                  style={[styles.platformChip, platforms.includes('instagram') && styles.platformChipSelected]}
                >
                  <Ionicons
                    name={platforms.includes('instagram') ? 'checkbox' : 'square-outline'}
                    size={18}
                    color={platforms.includes('instagram') ? '#F43F8E' : Colors.slate[400]}
                  />
                  <Text style={[styles.platformText, platforms.includes('instagram') && { color: Colors.white }]}>
                    Instagram Page
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Consent Checkbox */}
              <TouchableOpacity
                style={styles.consentRow}
                onPress={() => setConsentGiven(!consentGiven)}
              >
                <Ionicons
                  name={consentGiven ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={consentGiven ? Colors.magenta[400] : Colors.slate[400]}
                />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.consentText}>
                    I voluntarily consent to have my anonymous proposal card shared on RaabtaNow's official social media pages.
                  </Text>
                  <Text style={styles.consentUrdu} dir="rtl">
                    میں اپنی رضامندی سے درخواست کرتا/کرتی ہوں کہ میرا گمنام رشتہ کارڈ سوشل میڈیا پر شیئر کیا جا سکتا ہے۔
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Action Buttons */}
              <Button
                title={submitting ? 'Submitting...' : 'Submit Request / درخواست جمع کروائیں'}
                variant="primary"
                loading={submitting}
                onPress={handleSubmit}
                style={{ marginTop: 16 }}
              />

              {latestRequest?.status === 'approved' || latestRequest?.status === 'pending' ? (
                <Button
                  title="Withdraw / Remove Consent"
                  variant="secondary"
                  onPress={handleWithdraw}
                  style={{ marginTop: 8 }}
                />
              ) : null}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.navy[900],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.slate[750] || '#334155',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.slate[400],
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  center: {
    padding: 40,
    alignItems: 'center',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    padding: 10,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    color: Colors.cyan[300],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(225, 29, 116, 0.1)',
    borderColor: 'rgba(225, 29, 116, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.magenta[300],
  },
  infoDesc: {
    fontSize: 11,
    color: Colors.slate[300],
    lineHeight: 16,
    marginTop: 2,
  },
  infoPrivacy: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a7f3d0',
    marginTop: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 4,
  },
  platformRow: {
    flexDirection: 'row',
    gap: 10,
  },
  platformChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.slate[700],
  },
  platformChipSelected: {
    borderColor: Colors.magenta[500],
    backgroundColor: 'rgba(225, 29, 116, 0.12)',
  },
  platformText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate[300],
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.navy[950],
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.slate[750] || '#334155',
    marginTop: 6,
  },
  consentText: {
    fontSize: 11,
    color: Colors.slate[300],
    lineHeight: 16,
  },
  consentUrdu: {
    fontSize: 11,
    color: Colors.slate[400],
    lineHeight: 16,
    marginTop: 4,
    textAlign: 'right',
  },
});
