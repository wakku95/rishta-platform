import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { Colors } from '../../constants/colors';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { verificationApi } from '../../api/verification';
import { useAuth } from '../../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function VerificationScreen({ navigation }) {
  const { refreshUser, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Selected files
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await verificationApi.getStatus();
      setData(res.data || res);
      setSessionExpired(false);
    } catch (err) {
      console.warn('Failed to fetch status:', err);
      if (
        err.response?.status === 401 ||
        err.message?.includes('401') ||
        err.message?.toLowerCase().includes('unauthenticated')
      ) {
        setSessionExpired(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const pickImage = async (setter, title = 'CNIC Document') => {
    Alert.alert(
      `Upload ${title}`,
      'Choose a clear photo from your gallery or take a new photo with camera:',
      [
        {
          text: 'Choose from Gallery / گیلری',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Media library permission is required to select document photos.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              quality: 0.7,
              allowsEditing: true,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setter(result.assets[0]);
            }
          },
        },
        {
          text: 'Take Photo with Camera / کیمرہ',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              cameraType: ImagePicker.CameraType?.back || 'back',
              quality: 0.7,
              allowsEditing: true,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setter(result.assets[0]);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Directly launches the camera with front-facing selfie mode (no gallery option allowed)
  const takeLiveSelfie = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required / کیمرہ کی اجازت درکار ہے',
          'Live selfie verification requires direct camera access to verify real presence. Please grant camera permission in your settings.'
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType?.front || 'front',
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelfieImage(result.assets[0]);
      }
    } catch (err) {
      console.warn('Live selfie camera error:', err);
      Alert.alert('Camera Error', 'Unable to launch camera. Please check device camera permissions.');
    }
  };

  const handleSubmit = async () => {
    if (!selfieImage) {
      Alert.alert('Photo Required', 'Please capture your live selfie or select a recent face photo to complete identity verification.');
      return;
    }
    if (!frontImage || !backImage) {
      Alert.alert('Incomplete Documents', 'Please select both Front and Back photos of your CNIC.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();

      const appendFile = (form, key, asset, defaultFileName) => {
        let uri = asset.uri;
        let name = asset.fileName || defaultFileName;
        if (!name.match(/\.(jpe?g|png|webp|pdf)$/i)) {
          name = `${name}.jpg`;
        }
        let type = asset.mimeType || 'image/jpeg';
        if (type.startsWith('image/') && !type.includes('jpeg') && !type.includes('png') && !type.includes('webp')) {
          type = 'image/jpeg';
        }

        form.append(key, {
          uri,
          name,
          type,
        });
      };

      appendFile(formData, 'front', frontImage, 'front.jpg');
      appendFile(formData, 'back', backImage, 'back.jpg');
      appendFile(formData, 'live_selfie', selfieImage, 'live_selfie.jpg');

      await verificationApi.submitIdentity(formData);
      await refreshUser();
      Alert.alert(
        'Submission Received / دستاویزات موصول ہوگئیں',
        'Your identity documents have been submitted and are in the admin audit queue. Once approved, the Green Verified Trust Badge will be active on your account.'
      );
      setFrontImage(null);
      setBackImage(null);
      setSelfieImage(null);
      fetchStatus();
    } catch (err) {
      console.warn('Upload error details:', err.response?.data || err.message);
      const isUnauth =
        err.response?.status === 401 ||
        err.message?.includes('401') ||
        err.message?.toLowerCase().includes('unauthenticated') ||
        err.response?.data?.error_code === 'UNAUTHENTICATED';

      if (isUnauth) {
        setSessionExpired(true);
        Alert.alert(
          'Session Expired / سیشن ختم ہوگیا',
          'Your login session is expired or invalid. Please sign in with your email and password to upload your verification documents.',
          [
            {
              text: 'Sign In Again / دوبارہ لاگ ان کریں',
              onPress: async () => {
                await logout();
                navigation.navigate('Login');
              },
            },
          ]
        );
        return;
      }

      const errors = err.response?.data?.errors;
      const firstError = errors ? Object.values(errors).flat()[0] : null;
      const msg =
        firstError ||
        err.response?.data?.message ||
        err.message ||
        'Failed to upload verification documents.';
      Alert.alert('Upload Error / اپ لوڈ خرابی', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.magenta[500]} />
      </SafeAreaView>
    );
  }

  const identity = data?.identity;
  const isApproved = identity?.status === 'approved';
  const isPending = identity?.status === 'pending';
  const isRejected = identity?.status === 'rejected';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[900]} />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Identity Verification</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={isApproved ? 'shield-checkmark' : isPending ? 'time' : 'shield-outline'}
                size={26}
                color={isApproved ? Colors.emerald[400] : isPending ? Colors.gold[400] : Colors.magenta[400]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>
                {isApproved
                  ? 'Identity Verified Account'
                  : isPending
                  ? 'Verification Under Review'
                  : isRejected
                  ? 'Verification Needs Re-submission'
                  : 'Submit CNIC & Live Selfie'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {isApproved
                  ? 'Your account holds the Green Trust Badge.'
                  : isPending
                  ? 'Admin is auditing your documents (usually 2-24 hours).'
                  : isRejected
                  ? `Reason: ${identity?.rejection_reason || 'Document unclear'}. Please re-upload.`
                  : 'Required before sending proposals or inquiring on assisted rishtay.'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Session Expired Re-auth Prompt */}
        {sessionExpired && (
          <Card style={styles.sessionExpiredCard}>
            <View style={styles.sessionExpiredHeader}>
              <Ionicons name="log-in-outline" size={24} color={Colors.rose[400]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionExpiredTitle}>Session Expired / سیشن ختم ہوگیا</Text>
                <Text style={styles.sessionExpiredSubtitle}>
                  Your authentication session has expired. Please sign in again with your email and password to submit verification documents.
                </Text>
              </View>
            </View>
            <Button
              title="Sign In Again / دوبارہ لاگ ان کریں"
              variant="magenta"
              size="md"
              onPress={async () => {
                await logout();
                navigation.navigate('Login');
              }}
              style={{ marginTop: 12 }}
            />
          </Card>
        )}

        {/* If not approved or rejected, show upload form */}
        {(!isApproved && !isPending) || isRejected ? (
          <View style={styles.uploadSection}>
            <Text style={styles.sectionTitle}>Document Uploads / دستاویزات</Text>

            {/* 1. CNIC Front */}
            <DocumentUploadBox
              label="1. CNIC Front / شناختی کارڈ کا سامنے کا رخ *"
              hint="Select a clear photo from gallery or camera"
              icon="card-outline"
              buttonText="Select CNIC Front (Gallery / Camera)"
              image={frontImage}
              onPress={() => pickImage(setFrontImage, 'CNIC Front')}
              onRemove={() => setFrontImage(null)}
            />

            {/* 2. CNIC Back */}
            <DocumentUploadBox
              label="2. CNIC Back / شناختی کارڈ کی پشت *"
              hint="Select a clear photo from gallery or camera"
              icon="card-outline"
              buttonText="Select CNIC Back (Gallery / Camera)"
              image={backImage}
              onPress={() => pickImage(setBackImage, 'CNIC Back')}
              onRemove={() => setBackImage(null)}
            />

            {/* 3. Live Selfie */}
            <DocumentUploadBox
              label="3. Live Selfie / لائیو سیلفی (Clear Face) *"
              hint="Direct camera capture only. Gallery selection is disabled to ensure identity authenticity."
              icon="camera"
              buttonText="Open Camera & Take Live Selfie"
              isLiveCamera
              image={selfieImage}
              onPress={takeLiveSelfie}
              onRemove={() => setSelfieImage(null)}
            />

            <Button
              title="Submit Documents for Audit"
              variant="gold"
              size="lg"
              loading={submitting}
              onPress={handleSubmit}
              style={{ marginTop: 16 }}
            />
          </View>
        ) : null}

        {/* Privacy Assurance */}
        <View style={styles.privacyNote}>
          <Ionicons name="lock-closed" size={16} color={Colors.slate[400]} />
          <Text style={styles.privacyText}>
            Privacy Guaranteed: Your CNIC and selfies are strictly accessible only to vetted administration for identity authentication. They are never shared publicly or displayed to other users.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DocumentUploadBox({
  label,
  hint,
  icon = 'camera-outline',
  buttonText = 'Tap to Capture or Select Photo',
  isLiveCamera = false,
  image,
  onPress,
  onRemove,
}) {
  return (
    <Card style={styles.docBox}>
      <View style={styles.docHeaderRow}>
        <Text style={styles.docLabel}>{label}</Text>
        {isLiveCamera && (
          <View style={styles.liveCameraBadge}>
            <Ionicons name="videocam" size={12} color={Colors.emerald[400]} />
            <Text style={styles.liveCameraBadgeText}>Live Camera Only</Text>
          </View>
        )}
      </View>
      {hint ? <Text style={styles.docHint}>{hint}</Text> : null}

      {image ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image.uri }} style={styles.previewImage} />
          <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
            <Ionicons name="close-circle" size={26} color={Colors.rose[400]} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.uploadPlaceholder,
            isLiveCamera && styles.uploadPlaceholderLive,
          ]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.cameraIconContainer,
              isLiveCamera && styles.cameraIconContainerLive,
            ]}
          >
            <Ionicons
              name={icon}
              size={24}
              color={isLiveCamera ? Colors.emerald[300] : Colors.magenta[400]}
            />
          </View>
          <Text
            style={[
              styles.uploadPlaceholderText,
              isLiveCamera && styles.uploadPlaceholderTextLive,
            ]}
          >
            {buttonText}
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy[900],
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 4,
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
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusCard: {
    marginBottom: 20,
  },
  sessionExpiredCard: {
    marginBottom: 20,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  sessionExpiredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionExpiredTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.rose[400],
  },
  sessionExpiredSubtitle: {
    fontSize: 12,
    color: Colors.slate[300],
    marginTop: 2,
    lineHeight: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.navy[950],
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
  },
  statusSubtitle: {
    fontSize: 12,
    color: Colors.slate[300],
    marginTop: 2,
    lineHeight: 16,
  },
  uploadSection: {
    marginBottom: 20,
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
  docBox: {
    marginBottom: 14,
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  docLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate[200],
    flex: 1,
  },
  docHint: {
    fontSize: 11,
    color: Colors.slate[400],
    marginBottom: 10,
    lineHeight: 15,
  },
  liveCameraBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  liveCameraBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.emerald[400],
    textTransform: 'uppercase',
  },
  uploadPlaceholder: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.navy[750],
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.navy[950],
    gap: 8,
  },
  uploadPlaceholderLive: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  cameraIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.navy[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconContainerLive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  uploadPlaceholderText: {
    fontSize: 12,
    color: Colors.slate[300],
    fontWeight: '600',
  },
  uploadPlaceholderTextLive: {
    color: Colors.emerald[400],
    fontWeight: '700',
  },
  previewContainer: {
    position: 'relative',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.navy[950],
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.navy[800],
  },
  privacyText: {
    fontSize: 11,
    color: Colors.slate[400],
    lineHeight: 16,
    flex: 1,
  },
});
