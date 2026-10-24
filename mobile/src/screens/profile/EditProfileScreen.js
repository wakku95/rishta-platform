import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Colors } from '../../constants/colors';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { profilesApi } from '../../api/profiles';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

// Canonical fallback options matching website
const CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
  'Peshawar', 'Quetta', 'Hyderabad', 'Gujranwala', 'Sialkot', 'Bahawalpur',
  'Sargodha', 'Abbottabad', 'Sukkur', 'Other'
];

const EDUCATIONS = [
  'Matric / O-Level', 'Intermediate / A-Level', 'Diploma',
  "Bachelor's", "Master's", 'MPhil', 'PhD', 'Other'
];

const PROFESSIONS = [
  'Software / IT', 'Engineering', 'Medical / Healthcare', 'Education',
  'Business', 'Finance / Banking', 'Government', 'Law', 'Marketing / Sales',
  'Freelance / Self-employed', 'Skilled Professional', 'Student', 'Homemaker', 'Other'
];

const SECTS = ['Sunni', 'Shia', 'Ahle-Hadith', 'Other', 'Prefer not to say'];

const MARITAL_STATUSES = [
  { value: 'never_married', label: 'Never Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'separated', label: 'Separated' },
  { value: 'married', label: 'Married (2nd / 3rd Marriage)' },
];

const MANAGED_BY = [
  { value: 'myself', label: 'Myself (Candidate)' },
  { value: 'parent', label: 'Parent (Father / Mother)' },
  { value: 'sibling', label: 'Brother / Sister' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'family', label: 'Other Family Member' },
];

// Generates height options from 120 cm (3'11") to 220 cm (7'3")
const HEIGHT_OPTIONS = Array.from({ length: 101 }, (_, i) => {
  const cm = 120 + i;
  const totalInches = Math.round(cm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return { value: cm, label: `${feet}'${inches}" (${cm} cm)` };
});

export default function EditProfileScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [isExistingProfile, setIsExistingProfile] = useState(false);
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [isEducationVerified, setIsEducationVerified] = useState(false);

  // Form State
  const [gender, setGender] = useState('male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [city, setCity] = useState('Lahore');
  const [height, setHeight] = useState(175);
  const [education, setEducation] = useState("Bachelor's");
  const [profession, setProfession] = useState('Software / IT');
  const [religion, setReligion] = useState('Islam');
  const [sect, setSect] = useState('Sunni');
  const [maritalStatus, setMaritalStatus] = useState('never_married');
  const [managedBy, setManagedBy] = useState('myself');
  const [about, setAbout] = useState('');
  const [familyBackground, setFamilyBackground] = useState('');

  // Dropdown modal state for selectors
  const [pickerModal, setPickerModal] = useState({
    visible: false,
    title: '',
    options: [],
    selected: '',
    onSelect: null,
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const res = await profilesApi.getMyProfile();
        const d = res.data || res;
        if (d && (d.id || d.profile_code)) {
          setIsExistingProfile(true);
          setIsIdentityVerified(Boolean(d.verifications?.identity_verified || d.identity_verified || user?.is_identity_verified));
          setIsEducationVerified(Boolean(d.verifications?.education_verified || d.education_verified));

          setGender(d.gender || 'male');
          setDateOfBirth(d.date_of_birth || '');
          setCity(d.city || 'Lahore');
          setHeight(d.height || 175);
          setEducation(d.education || "Bachelor's");
          setProfession(d.profession || 'Software / IT');
          setReligion(d.religion || 'Islam');
          setSect(d.sect || 'Sunni');
          setMaritalStatus(d.marital_status || 'never_married');
          setManagedBy(d.managed_by || 'myself');
          setAbout(d.about || '');
          setFamilyBackground(d.family_background || '');
        }
      } catch (err) {
        // If 404, it's a new profile
        setIsExistingProfile(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const openPicker = (title, options, selected, onSelect) => {
    setPickerModal({
      visible: true,
      title,
      options,
      selected,
      onSelect: (val) => {
        onSelect(val);
        setPickerModal((prev) => ({ ...prev, visible: false }));
      },
    });
  };

  const handleSubmit = async () => {
    if (!dateOfBirth) {
      Alert.alert('Required Field', 'Please enter your Date of Birth (YYYY-MM-DD).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        gender,
        date_of_birth: dateOfBirth,
        city,
        height: parseInt(height, 10),
        education,
        profession,
        religion,
        sect: religion === 'Islam' ? sect : null,
        marital_status: maritalStatus,
        managed_by: managedBy,
        about: about.trim(),
        family_background: familyBackground.trim(),
      };

      await profilesApi.saveProfile(payload);
      await refreshUser();
      Alert.alert('Profile Saved', 'Your matrimonial profile has been updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save profile.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.magenta[500]} />
        </View>
      </SafeAreaView>
    );
  }

  const heightLabel = HEIGHT_OPTIONS.find((h) => h.value === height)?.label || `${height} cm`;
  const maritalLabel = MARITAL_STATUSES.find((m) => m.value === maritalStatus)?.label || maritalStatus;
  const managedLabel = MANAGED_BY.find((m) => m.value === managedBy)?.label || managedBy;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[900]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>
            {isExistingProfile ? 'Edit Profile / معلومات تبدیل کریں' : 'Create Profile / نیا بائیوڈیٹا'}
          </Text>
          <Text style={styles.headerSubtitle}>Structured matrimonial details</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Strict Privacy Notice */}
        <View style={styles.privacyBanner}>
          <Ionicons name="shield-checkmark" size={18} color={Colors.cyan[400]} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.privacyBannerTitle}>Strict Matrimonial Privacy Rules:</Text>
            <Text style={styles.privacyBannerText}>
              RaabtaNow never shows your house address, phone number, or photo publicly. Structured fields (age, height, city, education) are visible to prospective proposals.
            </Text>
          </View>
        </View>

        {/* 1. Basic Demographics */}
        <Text style={styles.sectionHeader}>1. Basic Demographics / بنیادی معلومات</Text>
        <Card style={styles.card}>
          {/* Gender (Locked if profile exists) */}
          <View style={styles.fieldRow}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Gender / جنس</Text>
              {isExistingProfile && <Text style={styles.lockedBadge}>🔒 Locked</Text>}
            </View>
            <View style={styles.genderOptions}>
              {['male', 'female'].map((g) => {
                const selected = gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    disabled={isExistingProfile}
                    onPress={() => setGender(g)}
                    style={[
                      styles.genderChip,
                      selected && styles.genderChipSelected,
                      isExistingProfile && styles.disabledChip,
                    ]}
                  >
                    <Ionicons
                      name={g === 'male' ? 'male' : 'female'}
                      size={14}
                      color={selected ? Colors.white : Colors.slate[400]}
                    />
                    <Text style={[styles.genderChipText, selected && styles.genderChipTextSelected]}>
                      {g === 'male' ? 'Male / مرد' : 'Female / خاتون'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {isExistingProfile && (
              <Text style={styles.helperText}>Gender cannot be changed once profile is created.</Text>
            )}
          </View>

          {/* Date of Birth (Locked if Identity is verified) */}
          <View style={styles.fieldRow}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Date of Birth (YYYY-MM-DD)</Text>
              {isIdentityVerified && <Text style={styles.lockedBadge}>🔒 CNIC Verified</Text>}
            </View>
            <TextInput
              style={[styles.input, isIdentityVerified && styles.disabledInput]}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="e.g. 1996-05-15"
              placeholderTextColor={Colors.slate[500]}
              editable={!isIdentityVerified}
            />
            <Text style={styles.helperText}>
              {isIdentityVerified
                ? 'Date of birth is verified and locked via CNIC identity document.'
                : 'Must be 18 to 80 years old. DOB is strictly private; only calculated age is shown.'}
            </Text>
          </View>

          {/* Height */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Height / قد</Text>
            <TouchableOpacity
              style={styles.pickerTrigger}
              onPress={() =>
                openPicker(
                  'Select Height / قد منتخب کریں',
                  HEIGHT_OPTIONS.map((h) => ({ key: h.value, label: h.label })),
                  height,
                  (val) => setHeight(val)
                )
              }
            >
              <Text style={styles.pickerTriggerText}>{heightLabel}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.slate[400]} />
            </TouchableOpacity>
          </View>

          {/* Marital Status (Locked if Identity verified) */}
          <View style={styles.fieldRow}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Marital Status / ازدواجی حیثیت</Text>
              {isIdentityVerified && <Text style={styles.lockedBadge}>🔒 CNIC Verified</Text>}
            </View>
            <TouchableOpacity
              disabled={isIdentityVerified}
              style={[styles.pickerTrigger, isIdentityVerified && styles.disabledInput]}
              onPress={() =>
                openPicker(
                  'Marital Status',
                  MARITAL_STATUSES.map((m) => ({ key: m.value, label: m.label })),
                  maritalStatus,
                  (val) => setMaritalStatus(val)
                )
              }
            >
              <Text style={styles.pickerTriggerText}>{maritalLabel}</Text>
              {!isIdentityVerified && <Ionicons name="chevron-down" size={16} color={Colors.slate[400]} />}
            </TouchableOpacity>
          </View>
        </Card>

        {/* 2. Location & Faith */}
        <Text style={styles.sectionHeader}>2. Location & Faith / شہر و مذہب</Text>
        <Card style={styles.card}>
          {/* City */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Current City / رہائشی شہر</Text>
            <TouchableOpacity
              style={styles.pickerTrigger}
              onPress={() =>
                openPicker(
                  'Select City / شہر منتخب کریں',
                  CITIES.map((c) => ({ key: c, label: c })),
                  city,
                  (val) => setCity(val)
                )
              }
            >
              <Text style={styles.pickerTriggerText}>{city}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.slate[400]} />
            </TouchableOpacity>
          </View>

          {/* Sect */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Sect / مسلک</Text>
            <TouchableOpacity
              style={styles.pickerTrigger}
              onPress={() =>
                openPicker(
                  'Select Sect / مسلک',
                  SECTS.map((s) => ({ key: s, label: s })),
                  sect,
                  (val) => setSect(val)
                )
              }
            >
              <Text style={styles.pickerTriggerText}>{sect}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.slate[400]} />
            </TouchableOpacity>
          </View>

          {/* Managed By */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Profile Managed By / پروفائل کون چلا رہا ہے</Text>
            <TouchableOpacity
              style={styles.pickerTrigger}
              onPress={() =>
                openPicker(
                  'Profile Managed By',
                  MANAGED_BY.map((m) => ({ key: m.value, label: m.label })),
                  managedBy,
                  (val) => setManagedBy(val)
                )
              }
            >
              <Text style={styles.pickerTriggerText}>{managedLabel}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.slate[400]} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* 3. Education & Career */}
        <Text style={styles.sectionHeader}>3. Education & Career / تعلیم و پیشہ</Text>
        <Card style={styles.card}>
          {/* Education (Locked if degree verified) */}
          <View style={styles.fieldRow}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Highest Qualification / تعلیم</Text>
              {isEducationVerified && <Text style={styles.lockedBadge}>🔒 Degree Verified</Text>}
            </View>
            <TouchableOpacity
              disabled={isEducationVerified}
              style={[styles.pickerTrigger, isEducationVerified && styles.disabledInput]}
              onPress={() =>
                openPicker(
                  'Highest Education',
                  EDUCATIONS.map((e) => ({ key: e, label: e })),
                  education,
                  (val) => setEducation(val)
                )
              }
            >
              <Text style={styles.pickerTriggerText}>{education}</Text>
              {!isEducationVerified && <Ionicons name="chevron-down" size={16} color={Colors.slate[400]} />}
            </TouchableOpacity>
          </View>

          {/* Profession */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Profession / پیشہ</Text>
            <TouchableOpacity
              style={styles.pickerTrigger}
              onPress={() =>
                openPicker(
                  'Profession',
                  PROFESSIONS.map((p) => ({ key: p, label: p })),
                  profession,
                  (val) => setProfession(val)
                )
              }
            >
              <Text style={styles.pickerTriggerText}>{profession}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.slate[400]} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* 4. Bio & Family Background */}
        <Text style={styles.sectionHeader}>4. About & Family / تعارف و خاندانی پس منظر</Text>
        <Card style={styles.card}>
          {/* Strict Warning Box */}
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle" size={16} color="#fb7185" />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningBoxTitle}>
                ⚠️ Strict Privacy Rule / ضروری رازداری اصول:
              </Text>
              <Text style={styles.warningBoxText}>
                Do NOT write phone numbers, email addresses, social media links, or exact house numbers. About Candidate is displayed publicly to matches.
              </Text>
              <Text style={styles.warningBoxUrdu} dir="rtl">
                فون نمبر، سوشل میڈیا آئی ڈی یا گھر کا پتہ یہاں مت لکھیں۔ تعارف کا یہ حصہ رشتہ تلاش کرنے والوں کو عوامی طور پر دکھایا جاتا ہے۔
              </Text>
            </View>
          </View>

          {/* About Candidate */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>About Candidate / اپنے بارے میں تعارف</Text>
            <TextInput
              style={[styles.textArea, { minHeight: 90 }]}
              multiline
              numberOfLines={4}
              value={about}
              onChangeText={setAbout}
              placeholder="Describe personality, values, outlook, and religious practice..."
              placeholderTextColor={Colors.slate[500]}
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.charCount}>{about.length} / 2000</Text>
          </View>

          {/* Family Background */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Family Background / خاندانی پس منظر</Text>
            <TextInput
              style={[styles.textArea, { minHeight: 90 }]}
              multiline
              numberOfLines={4}
              value={familyBackground}
              onChangeText={setFamilyBackground}
              placeholder="Describe parents, siblings, family values, and native origin..."
              placeholderTextColor={Colors.slate[500]}
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.charCount}>{familyBackground.length} / 2000</Text>
            <Text style={styles.helperText}>
              Strictly confidential. Released ONLY after mutual rishta acceptance and contact unlock.
            </Text>
          </View>
        </Card>

        {/* Action Button */}
        <Button
          title={submitting ? 'Saving Profile...' : 'Save Profile / محفوظ کریں'}
          variant="primary"
          loading={submitting}
          onPress={handleSubmit}
          style={styles.submitButton}
        />
      </ScrollView>

      {/* Simple Options Modal */}
      {pickerModal.visible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pickerModal.title}</Text>
              <TouchableOpacity onPress={() => setPickerModal((p) => ({ ...p, visible: false }))}>
                <Ionicons name="close" size={22} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }}>
              {pickerModal.options.map((opt) => {
                const isSelected = opt.key === pickerModal.selected;
                return (
                  <TouchableOpacity
                    key={String(opt.key)}
                    style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                    onPress={() => pickerModal.onSelect(opt.key)}
                  >
                    <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                      {opt.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={18} color={Colors.magenta[400]} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy[900],
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 4,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.slate[400],
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  privacyBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.cyan[300],
  },
  privacyBannerText: {
    fontSize: 11,
    color: Colors.slate[300],
    lineHeight: 16,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.3,
    marginBottom: 8,
    marginTop: 12,
  },
  card: {
    backgroundColor: Colors.navy[850],
    borderColor: Colors.navy[750],
    borderRadius: 14,
    padding: 14,
    gap: 14,
    marginBottom: 12,
  },
  fieldRow: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate[200],
  },
  lockedBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fbbf24',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  input: {
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.slate[700],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.white,
    fontSize: 13,
  },
  disabledInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderColor: Colors.slate[800],
    color: Colors.slate[400],
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.slate[700],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  pickerTriggerText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 10,
    color: Colors.slate[400],
    lineHeight: 14,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  genderChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.slate[700],
  },
  genderChipSelected: {
    backgroundColor: Colors.magenta[600],
    borderColor: Colors.magenta[500],
  },
  disabledChip: {
    opacity: 0.6,
  },
  genderChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate[300],
  },
  genderChipTextSelected: {
    color: Colors.white,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderColor: 'rgba(225, 29, 72, 0.35)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  warningBoxTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fda4af',
  },
  warningBoxText: {
    fontSize: 10,
    color: Colors.slate[300],
    lineHeight: 15,
    marginTop: 2,
  },
  warningBoxUrdu: {
    fontSize: 11,
    color: '#fecdd3',
    lineHeight: 16,
    textAlign: 'right',
    marginTop: 4,
  },
  textArea: {
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.slate[700],
    borderRadius: 10,
    padding: 12,
    color: Colors.white,
    fontSize: 13,
  },
  charCount: {
    fontSize: 10,
    color: Colors.slate[400],
    textAlign: 'right',
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: Colors.navy[900],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.slate[750] || '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalOptionSelected: {
    backgroundColor: 'rgba(225, 29, 116, 0.1)',
    borderRadius: 8,
  },
  modalOptionText: {
    fontSize: 13,
    color: Colors.slate[300],
  },
  modalOptionTextSelected: {
    color: Colors.magenta[400],
    fontWeight: '800',
  },
});
