import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../../constants/colors';
import Card from '../common/Card';
import Badge from '../common/Badge';
import GenderAvatar from '../common/GenderAvatar';
import { Ionicons } from '@expo/vector-icons';

export default function CandidateCard({
  candidate,
  onPress,
  onToggleShortlist,
  onIgnore,
  isShortlisted = false,
}) {
  const displayCode =
    candidate.listing_code ||
    candidate.profile_code ||
    (candidate.id ? `RN-${candidate.id}` : 'RN');

  const age = candidate.age ? `${candidate.age} yrs` : null;
  const isAssisted = !!candidate.listing_code || !!candidate.is_assisted;
  const isIdentityVerified =
    !!candidate.is_identity_verified ||
    !!candidate.verifications?.identity_verified;

  const targetCode = candidate.profile_code || candidate.listing_code;
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(String(displayCode));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
  };

  return (
    <Card style={styles.card}>
      {/* Top Header: Candidate Avatar + Code + Badges + Bookmark */}
      <View style={styles.headerRow}>
        <GenderAvatar
          gender={candidate.gender}
          size={48}
          photoUrl={candidate.photo_url || candidate.avatar}
          style={{ marginRight: 12 }}
        />

        <View style={styles.headerInfo}>
          <View style={styles.codeRow}>
            <Text style={styles.profileCode}>#{displayCode}</Text>
            <TouchableOpacity
              onPress={handleCopyCode}
              style={styles.copyButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={14}
                color={copied ? Colors.emerald[400] : Colors.slate[400]}
              />
            </TouchableOpacity>
            {isIdentityVerified && (
              <Badge label="Verified" variant="success" size="sm" />
            )}
            {isAssisted && (
              <Badge label="Assisted" variant="gold" size="sm" />
            )}
          </View>

          <Text style={styles.managedByText}>
            Managed by {candidate.managed_by || (isAssisted ? 'Matchmaker' : 'Family')}
          </Text>
        </View>

        {/* Shortlist bookmark heart button */}
        {onToggleShortlist && (
          <TouchableOpacity
            onPress={() => onToggleShortlist(targetCode, isAssisted)}
            style={styles.bookmarkButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isShortlisted ? 'heart' : 'heart-outline'}
              size={24}
              color={isShortlisted ? Colors.rose[500] : Colors.slate[400]}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Details Grid Pills */}
      <View style={styles.pillsContainer}>
        {age && (
          <View style={styles.pill}>
            <Ionicons name="calendar-outline" size={12} color={Colors.slate[400]} />
            <Text style={styles.pillText}>{age}</Text>
          </View>
        )}

        {candidate.city && (
          <View style={styles.pill}>
            <Ionicons name="location-outline" size={12} color={Colors.slate[400]} />
            <Text style={styles.pillText}>{candidate.city}</Text>
          </View>
        )}

        {candidate.sect && (
          <View style={styles.pill}>
            <Ionicons name="moon-outline" size={12} color={Colors.gold[400]} />
            <Text style={styles.pillText}>{candidate.sect}</Text>
          </View>
        )}

        {candidate.education && (
          <View style={styles.pill}>
            <Ionicons name="school-outline" size={12} color={Colors.slate[400]} />
            <Text style={styles.pillText}>{candidate.education}</Text>
          </View>
        )}

        {candidate.profession && (
          <View style={styles.pill}>
            <Ionicons name="briefcase-outline" size={12} color={Colors.slate[400]} />
            <Text style={styles.pillText}>{candidate.profession}</Text>
          </View>
        )}
      </View>

      {/* Footer Actions: Ignore / Not Interested + View Biodata */}
      <View style={styles.footerRow}>
        {onIgnore && (
          <TouchableOpacity
            style={styles.ignoreButton}
            onPress={() => onIgnore(candidate)}
            activeOpacity={0.7}
          >
            <Ionicons name="eye-off-outline" size={15} color={Colors.slate[400]} />
            <Text style={styles.ignoreButtonText}>Ignore</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => onPress && onPress(candidate)}
          activeOpacity={0.8}
        >
          <Text style={styles.viewButtonText}>View Complete Biodata</Text>
          <Ionicons name="chevron-forward" size={15} color={Colors.magenta[400]} />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileCode: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  copyButton: {
    padding: 3,
  },
  managedByText: {
    fontSize: 11,
    color: Colors.slate[400],
    marginTop: 2,
  },
  bookmarkButton: {
    padding: 6,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.navy[950],
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.navy[750],
  },
  pillText: {
    fontSize: 11,
    color: Colors.slate[300],
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.navy[750],
    gap: 12,
  },
  ignoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.navy[750],
  },
  ignoreButtonText: {
    fontSize: 11,
    color: Colors.slate[400],
    fontWeight: '600',
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingVertical: 6,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.magenta[400],
  },
});
