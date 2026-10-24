import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Image } from 'react-native';
import { Colors } from '../../constants/colors';
import Button from '../../components/common/Button';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[900]} />
      
      {/* Brand Header with Official Refined Logo (No Background) */}
      <View style={styles.heroSection}>
        <Image
          source={require('../../../assets/raabtanow-logo-white-transparent.png')}
          style={{ width: 280, height: 76, marginBottom: 16 }}
          resizeMode="contain"
        />

        <View style={styles.taglineCard}>
          <Text style={styles.urduTagline}>خاندانی وقار اور مکمل پردہ داری کے ساتھ بااعتماد رشتے</Text>
          <Text style={styles.enTagline}>
            Verified Pakistani families connecting with mutual respect, zero public photo scraping, and strict CNIC identity audits.
          </Text>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.emerald[400]} />
            <Text style={styles.featureText}>100% CNIC & Live Selfie Verified Accounts</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="eye-off" size={18} color={Colors.magenta[400]} />
            <Text style={styles.featureText}>Private Biodata — No Public Photos or Phones</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="people" size={18} color={Colors.gold[400]} />
            <Text style={styles.featureText}>Assisted Matchmaker for Elders & Parents</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <Button
          title="Sign In to Account"
          onPress={() => navigation.navigate('Login')}
          variant="primary"
          size="lg"
          style={styles.primaryButton}
        />
        <Button
          title="Register Free Profile"
          onPress={() => navigation.navigate('Register')}
          variant="secondary"
          size="lg"
          style={styles.secondaryButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy[900],
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 40,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: Colors.magenta[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.magenta[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
    marginBottom: 24,
  },
  taglineCard: {
    backgroundColor: Colors.navy[850],
    borderWidth: 1,
    borderColor: Colors.navy[750],
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  urduTagline: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gold[400],
    textAlign: 'center',
    marginBottom: 8,
  },
  enTagline: {
    fontSize: 12,
    color: Colors.slate[300],
    textAlign: 'center',
    lineHeight: 18,
  },
  featuresList: {
    width: '100%',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.navy[950],
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.navy[800],
  },
  featureText: {
    fontSize: 12,
    color: Colors.slate[200],
    fontWeight: '600',
  },
  actionsSection: {
    paddingBottom: 20,
    gap: 12,
  },
  primaryButton: {
    shadowColor: Colors.magenta[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.slate[700],
  },
});
