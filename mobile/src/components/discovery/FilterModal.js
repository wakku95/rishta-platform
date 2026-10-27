import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { Colors } from '../../constants/colors';
import Button from '../common/Button';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CITIES = [
  'All',
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Gujranwala',
  'Sialkot',
  'Hyderabad',
  'Quetta',
  'Overseas',
];

const SECTS = ['All', 'Sunni', 'Shia', 'Ahle Hadith', 'Other'];

const MARITAL_STATUSES = [
  { label: 'All', value: '' },
  { label: 'Never Married (غیر شادی شدہ)', value: 'never_married' },
  { label: 'Divorced (طلاق یافتہ)', value: 'divorced' },
  { label: 'Widowed (بیوہ / رنڈوا)', value: 'widowed' },
];

export default function FilterModal({
  visible,
  onClose,
  initialFilters = {},
  onApply,
  onReset,
}) {
  const insets = useSafeAreaInsets();
  const [profileCode, setProfileCode] = useState(initialFilters.profile_code || '');
  const [gender, setGender] = useState(initialFilters.gender || '');
  const [city, setCity] = useState(initialFilters.city || 'All');
  const [sect, setSect] = useState(initialFilters.sect || 'All');
  const [maritalStatus, setMaritalStatus] = useState(initialFilters.marital_status || '');
  const [minAge, setMinAge] = useState(initialFilters.min_age ? String(initialFilters.min_age) : '');
  const [maxAge, setMaxAge] = useState(initialFilters.max_age ? String(initialFilters.max_age) : '');

  const handleApply = () => {
    const filters = {};
    if (profileCode.trim()) filters.profile_code = profileCode.trim();
    if (gender) filters.gender = gender;
    if (city && city !== 'All') filters.city = city;
    if (sect && sect !== 'All') filters.sect = sect;
    if (maritalStatus) filters.marital_status = maritalStatus;
    if (minAge.trim()) filters.min_age = minAge.trim();
    if (maxAge.trim()) filters.max_age = maxAge.trim();

    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setProfileCode('');
    setGender('');
    setCity('All');
    setSect('All');
    setMaritalStatus('');
    setMinAge('');
    setMaxAge('');
    if (onReset) onReset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.navy[950]} />

        {/* Modal Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filter Profiles / فلٹرز</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Reset All</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={[styles.scrollBody, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
            keyboardShouldPersistTaps="handled"
          >
          {/* Search by Profile Code */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Search Profile Code / نمبر سے تلاش</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="search-outline" size={18} color={Colors.slate[400]} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="e.g. RN-1045 or Code"
                placeholderTextColor={Colors.slate[500]}
                value={profileCode}
                onChangeText={setProfileCode}
                autoCapitalize="characters"
              />
              {profileCode ? (
                <TouchableOpacity onPress={() => setProfileCode('')}>
                  <Ionicons name="close-circle" size={18} color={Colors.slate[400]} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Looking For Gender */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Looking For / رشتہ کی تلاش</Text>
            <View style={styles.pillRow}>
              {[
                { label: 'All Rishtay', value: '' },
                { label: 'Bride (دلہن / Female)', value: 'female' },
                { label: 'Groom (دلہا / Male)', value: 'male' },
              ].map((item) => {
                const active = gender === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setGender(item.value)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Age Range */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Age Range / عمر کی حد (Years)</Text>
            <View style={styles.ageRow}>
              <View style={styles.ageInputBox}>
                <Text style={styles.ageLabel}>Min Age</Text>
                <TextInput
                  style={styles.ageInput}
                  placeholder="20"
                  placeholderTextColor={Colors.slate[500]}
                  keyboardType="numeric"
                  maxLength={2}
                  value={minAge}
                  onChangeText={setMinAge}
                />
              </View>
              <Text style={styles.ageDivider}>to</Text>
              <View style={styles.ageInputBox}>
                <Text style={styles.ageLabel}>Max Age</Text>
                <TextInput
                  style={styles.ageInput}
                  placeholder="45"
                  placeholderTextColor={Colors.slate[500]}
                  keyboardType="numeric"
                  maxLength={2}
                  value={maxAge}
                  onChangeText={setMaxAge}
                />
              </View>
            </View>
          </View>

          {/* City / Location */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>City / شہر</Text>
            <View style={styles.pillWrap}>
              {CITIES.map((c) => {
                const active = (city === c) || (!city && c === 'All');
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.smallChip, active && styles.smallChipActive]}
                    onPress={() => setCity(c)}
                  >
                    <Text style={[styles.smallChipText, active && styles.smallChipTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sect / Religion */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Sect / مسلک</Text>
            <View style={styles.pillWrap}>
              {SECTS.map((s) => {
                const active = (sect === s) || (!sect && s === 'All');
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.smallChip, active && styles.smallChipActive]}
                    onPress={() => setSect(s)}
                  >
                    <Text style={[styles.smallChipText, active && styles.smallChipTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Marital Status */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Marital Status / ازدواجی حیثیت</Text>
            <View style={styles.pillWrap}>
              {MARITAL_STATUSES.map((m) => {
                const active = maritalStatus === m.value;
                return (
                  <TouchableOpacity
                    key={m.value}
                    style={[styles.smallChip, active && styles.smallChipActive]}
                    onPress={() => setMaritalStatus(m.value)}
                  >
                    <Text style={[styles.smallChipText, active && styles.smallChipTextActive]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>

        {/* Modal Bottom Sticky CTA */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button
            title="Apply Filters / فلٹرز لاگو کریں"
            variant="primary"
            size="lg"
            onPress={handleApply}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy[900],
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
  resetText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.rose[400],
  },
  scrollBody: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 22,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate[200],
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.navy[750],
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: 14,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.navy[950],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.navy[750],
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: Colors.magenta[600],
    borderColor: Colors.magenta[400],
  },
  chipText: {
    fontSize: 12,
    color: Colors.slate[300],
    fontWeight: '600',
    textAlign: 'center',
  },
  chipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ageInputBox: {
    flex: 1,
    backgroundColor: Colors.navy[950],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.navy[750],
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ageLabel: {
    fontSize: 10,
    color: Colors.slate[400],
    marginBottom: 4,
    fontWeight: '600',
  },
  ageInput: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    padding: 0,
  },
  ageDivider: {
    color: Colors.slate[400],
    fontSize: 13,
    fontWeight: '600',
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  smallChip: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    backgroundColor: Colors.navy[950],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.navy[750],
  },
  smallChipActive: {
    backgroundColor: Colors.magenta[600],
    borderColor: Colors.magenta[400],
  },
  smallChipText: {
    fontSize: 12,
    color: Colors.slate[300],
    fontWeight: '500',
  },
  smallChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  bottomBar: {
    padding: 16,
    backgroundColor: Colors.navy[950],
    borderTopWidth: 1,
    borderTopColor: Colors.navy[800],
  },
});
