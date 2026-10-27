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
  KeyboardAvoidingView,
} from 'react-native';
import { Colors } from '../../constants/colors';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { profilesApi } from '../../api/profiles';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
  'Peshawar', 'Quetta', 'Hyderabad', 'Gujranwala', 'Sialkot', 'Other'
];

const SECTS = ['Sunni', 'Shia', 'Ahle-Hadith', 'Any'];

const MARITAL_STATUSES = [
  { value: 'never_married', label: 'Never Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'separated', label: 'Separated' },
  { value: 'married', label: 'Married' },
];

const EDUCATIONS = [
  'Any', 'Matric / O-Level', 'Intermediate / A-Level', 'Diploma',
  "Bachelor's", "Master's", 'MPhil', 'PhD'
];

export default function EditPreferencesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [preferredGender, setPreferredGender] = useState('female');
  const [minAge, setMinAge] = useState('20');
  const [maxAge, setMaxAge] = useState('32');
  const [minHeight, setMinHeight] = useState('152'); // 5'0"
  const [maxHeight, setMaxHeight] = useState('188'); // 6'2"
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedMarital, setSelectedMarital] = useState(['never_married']);
  const [selectedSect, setSelectedSect] = useState('Any');
  const [minEducation, setMinEducation] = useState('Any');

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const [profRes, prefRes] = await Promise.allSettled([
          profilesApi.getMyProfile(),
          profilesApi.getPreferences(),
        ]);

        let candidateGender = 'male';
        if (profRes.status === 'fulfilled' && profRes.value?.data) {
          candidateGender = profRes.value.data.gender || 'male';
        }

        if (prefRes.status === 'fulfilled' && prefRes.value?.data) {
          const p = prefRes.value.data;
          setPreferredGender(p.preferred_gender || (candidateGender === 'male' ? 'female' : 'male'));
          setMinAge(p.min_age ? String(p.min_age) : '20');
          setMaxAge(p.max_age ? String(p.max_age) : '32');
          setMinHeight(p.min_height ? String(p.min_height) : '150');
          setMaxHeight(p.max_height ? String(p.max_height) : '190');
          setSelectedCities(Array.isArray(p.preferred_cities) ? p.preferred_cities : []);
          setSelectedMarital(Array.isArray(p.preferred_marital_statuses) ? p.preferred_marital_statuses : ['never_married']);
          setSelectedSect(p.preferred_sect || 'Any');
          setMinEducation(p.preferred_education || 'Any');
        } else {
          setPreferredGender(candidateGender === 'male' ? 'female' : 'male');
        }
      } catch (err) {
        // quiet ignore
      } finally {
        setLoading(false);
      }
    };

    fetchPrefs();
  }, []);

  const toggleCity = (city) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const toggleMarital = (val) => {
    setSelectedMarital((prev) =>
      prev.includes(val) ? prev.filter((m) => m !== val) : [...prev, val]
    );
  };

  const handleSubmit = async () => {
    const minA = parseInt(minAge, 10);
    const maxA = parseInt(maxAge, 10);

    if (isNaN(minA) || isNaN(maxA) || minA < 18 || maxA > 80 || minA > maxA) {
      Alert.alert('Invalid Age Range', 'Please enter a valid age range between 18 and 80 years.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        preferred_gender: preferredGender,
        min_age: minA,
        max_age: maxA,
        min_height: parseInt(minHeight, 10) || 150,
        max_height: parseInt(maxHeight, 10) || 190,
        preferred_cities: selectedCities.length > 0 ? selectedCities : null,
        preferred_marital_statuses: selectedMarital.length > 0 ? selectedMarital : null,
        preferred_sect: selectedSect === 'Any' ? null : selectedSect,
        preferred_education: minEducation === 'Any' ? null : minEducation,
      };

      await profilesApi.updatePreferences(payload);
      try {
        await profilesApi.activateSelfProfile();
      } catch (actErr) {
        // quiet ignore if already active or draft auto-activated
      }
      const updatedUser = await refreshUser();
      
      Alert.alert(
        'Preferences Saved / ترجیحات محفوظ ہوگئیں',
        updatedUser?.profile_status === 'active'
          ? 'Your preferences have been saved and your profile is now active and discoverable! / آپ کی ترجیحات محفوظ ہوگئیں اور پروفائل ایکٹیویٹ ہو گیا ہے۔'
          : 'Your partner preferences have been saved successfully. / آپ کی ترجیحات کامیابی سے محفوظ کرلی گئی ہیں۔',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save preferences.');
    } finally {
      setSubmitting(false);
    }
  };

  const screenTopPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 6 : 12);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: screenTopPadding }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.magenta[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: screenTopPadding }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[900]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Partner Preferences / ترجیحات</Text>
          <Text style={styles.headerSubtitle}>What you are looking for in a prospective match</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
          keyboardShouldPersistTaps="handled"
        >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="sparkles" size={18} color={Colors.gold[400]} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoBannerTitle}>Automatic Compatibility Matching:</Text>
            <Text style={styles.infoBannerText}>
              These preferences power our matchmaking discovery algorithm. Setting preferences will automatically activate your profile for matching families.
            </Text>
          </View>
        </View>

        {/* 1. Preferred Gender */}
        <Text style={styles.sectionHeader}>Looking For / مطلوب جنس</Text>
        <Card style={styles.card}>
          <View style={styles.genderOptions}>
            {[
              { val: 'female', label: 'Bride / دلہن (Female)' },
              { val: 'male', label: 'Groom / دولہا (Male)' },
            ].map((g) => {
              const selected = preferredGender === g.val;
              return (
                <TouchableOpacity
                  key={g.val}
                  onPress={() => setPreferredGender(g.val)}
                  style={[styles.genderChip, selected && styles.genderChipSelected]}
                >
                  <Text style={[styles.genderChipText, selected && styles.genderChipTextSelected]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* 2. Age Range */}
        <Text style={styles.sectionHeader}>Desired Age Range / عمر کی حد (سال)</Text>
        <Card style={styles.card}>
          <View style={styles.rowTwoCols}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Minimum Age / کم از کم عمر</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={minAge}
                onChangeText={setMinAge}
                maxLength={2}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Maximum Age / زیادہ سے زیادہ عمر</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={maxAge}
                onChangeText={setMaxAge}
                maxLength={2}
              />
            </View>
          </View>
        </Card>

        {/* 3. Marital Statuses */}
        <Text style={styles.sectionHeader}>Acceptable Marital Status / ازدواجی حیثیت</Text>
        <Card style={styles.card}>
          <View style={styles.chipsContainer}>
            {MARITAL_STATUSES.map((m) => {
              const selected = selectedMarital.includes(m.value);
              return (
                <TouchableOpacity
                  key={m.value}
                  onPress={() => toggleMarital(m.value)}
                  style={[styles.multiChip, selected && styles.multiChipSelected]}
                >
                  <Ionicons
                    name={selected ? 'checkbox' : 'square-outline'}
                    size={15}
                    color={selected ? Colors.white : Colors.slate[400]}
                  />
                  <Text style={[styles.multiChipText, selected && styles.multiChipTextSelected]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* 4. Preferred Cities */}
        <Text style={styles.sectionHeader}>Preferred Cities / مطلوبہ شہر</Text>
        <Card style={styles.card}>
          <Text style={styles.helperText}>Select cities you are open to, or leave empty for all Pakistan:</Text>
          <View style={styles.chipsContainer}>
            {CITIES.map((c) => {
              const selected = selectedCities.includes(c);
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => toggleCity(c)}
                  style={[styles.multiChip, selected && styles.multiChipSelected]}
                >
                  <Text style={[styles.multiChipText, selected && styles.multiChipTextSelected]}>
                    {c}
                  </Text>
                  {selected && <Ionicons name="close" size={13} color={Colors.white} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* 5. Sect & Education */}
        <Text style={styles.sectionHeader}>Faith & Education / مسلک و تعلیم</Text>
        <Card style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Preferred Sect / مسلک</Text>
            <View style={styles.chipsContainer}>
              {SECTS.map((s) => {
                const selected = selectedSect === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSelectedSect(s)}
                    style={[styles.singleChip, selected && styles.singleChipSelected]}
                  >
                    <Text style={[styles.singleChipText, selected && styles.singleChipTextSelected]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.fieldRow, { marginTop: 10 }]}>
            <Text style={styles.fieldLabel}>Minimum Education / کم از کم تعلیم</Text>
            <View style={styles.chipsContainer}>
              {EDUCATIONS.map((e) => {
                const selected = minEducation === e;
                return (
                  <TouchableOpacity
                    key={e}
                    onPress={() => setMinEducation(e)}
                    style={[styles.singleChip, selected && styles.singleChipSelected]}
                  >
                    <Text style={[styles.singleChipText, selected && styles.singleChipTextSelected]}>
                      {e}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Card>

        {/* Action Button */}
        <Button
          title={submitting ? 'Saving...' : 'Save & Activate Profile / محفوظ کریں'}
          variant="primary"
          loading={submitting}
          onPress={handleSubmit}
          style={styles.submitButton}
        />
        </ScrollView>
      </KeyboardAvoidingView>
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  infoBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.gold[300],
  },
  infoBannerText: {
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
    gap: 12,
    marginBottom: 8,
  },
  fieldRow: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate[200],
    marginBottom: 4,
  },
  helperText: {
    fontSize: 11,
    color: Colors.slate[400],
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.slate[700],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  genderChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.slate[700],
  },
  genderChipSelected: {
    backgroundColor: Colors.magenta[600],
    borderColor: Colors.magenta[500],
  },
  genderChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate[300],
  },
  genderChipTextSelected: {
    color: Colors.white,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  multiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.slate[700],
  },
  multiChipSelected: {
    backgroundColor: Colors.magenta[600],
    borderColor: Colors.magenta[500],
  },
  multiChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate[300],
  },
  multiChipTextSelected: {
    color: Colors.white,
  },
  singleChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.slate[700],
  },
  singleChipSelected: {
    backgroundColor: Colors.cyan[600],
    borderColor: Colors.cyan[500],
  },
  singleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate[300],
  },
  singleChipTextSelected: {
    color: Colors.white,
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 20,
  },
});
