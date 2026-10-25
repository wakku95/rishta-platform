import React from 'react';
import { View, Text, StyleSheet, StatusBar, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import Button from '../../components/common/Button';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[900]} />
      
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingTop: Math.max(insets.top, 16) + 12,
            paddingBottom: Math.max(insets.bottom, 16) + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Brand Header with Crisp HD Emblem + Native Typography */}
        <View style={styles.heroSection}>
          <View style={styles.brandHero}>
            <Image
              source={require('../../../assets/raabtanow-icon.png')}
              style={styles.brandEmblem}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle}>
              Raabta<Text style={styles.brandTitleAccent}>Now</Text>
            </Text>
            <Text style={styles.brandSubtitle}>Privacy-First Pakistani Matrimonial</Text>
          </View>

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
          <TouchableOpacity
            style={styles.exploreGuestButton}
            onPress={() => navigation.navigate('GuestMatches')}
            activeOpacity={0.8}
          >
            <Ionicons name="search-outline" size={16} color={Colors.cyan[400]} />
            <Text style={styles.exploreGuestText}>
              Browse Rishta Profiles / رشتے دیکھیں
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy[900],
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 40,
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: 16,
  },
  brandEmblem: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  brandTitleAccent: {
    color: Colors.magenta[500],
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
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
  exploreGuestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    marginTop: 2,
  },
  exploreGuestText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.cyan[300],
  },
});
