import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../../constants/colors';
import CandidateCard from '../../components/candidate/CandidateCard';
import { profilesApi } from '../../api/profiles';
import { Ionicons } from '@expo/vector-icons';
import OnboardingBanner from '../../components/common/OnboardingBanner';

async function fetchShortlistData() {
  // 1. Fetch regular shortlists from backend API
  let regularList = [];
  try {
    const res = await profilesApi.getShortlist();
    regularList = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : [];
  } catch (err) {
    console.warn('Backend shortlist sync notice:', err.message);
  }

  // 2. Load locally persisted codes (contains both regular fallback and assisted listings)
  const savedStr = await SecureStore.getItemAsync('rn_all_shortlists');
  const allSavedCodes = savedStr ? JSON.parse(savedStr) : [];

  const savedAssistedStr = await SecureStore.getItemAsync('rn_assisted_shortlist');
  const assistedCodes = savedAssistedStr ? JSON.parse(savedAssistedStr) : [];

  // Combine any codes that are assisted
  const allAssistedCodes = Array.from(
    new Set([
      ...assistedCodes,
      ...allSavedCodes.filter((c) => String(c).startsWith('AL')),
    ])
  );

  // 3. Fetch any assisted listing details
  let assistedProfiles = [];
  if (allAssistedCodes.length > 0) {
    const fetched = await Promise.allSettled(
      allAssistedCodes.map((code) => profilesApi.getAssistedDetail(code))
    );
    assistedProfiles = fetched
      .filter((f) => f.status === 'fulfilled' && f.value)
      .map((f) => {
        const data = f.value.data || f.value;
        return {
          ...data,
          is_assisted: true,
          profile_code: data.listing_code || data.profile_code,
        };
      });
  }

  // 4. Merge regular + assisted profiles seamlessly
  const seenCodes = new Set();
  const combined = [];

  for (const p of regularList) {
    const code = p.profile_code || p.listing_code;
    if (code && !seenCodes.has(code)) {
      seenCodes.add(code);
      combined.push(p);
    }
  }

  for (const p of assistedProfiles) {
    const code = p.listing_code || p.profile_code;
    if (code && !seenCodes.has(code)) {
      seenCodes.add(code);
      combined.push(p);
    }
  }

  // 5. Fallback for regular profiles if offline or backend returned empty
  if (regularList.length === 0) {
    const remainingRegularCodes = allSavedCodes.filter(
      (c) => !String(c).startsWith('AL') && !seenCodes.has(c)
    );
    if (remainingRegularCodes.length > 0) {
      const fetchedReg = await Promise.allSettled(
        remainingRegularCodes.map((c) => profilesApi.getDetail(c))
      );
      fetchedReg.forEach((f) => {
        if (f.status === 'fulfilled' && f.value) {
          const data = f.value.data || f.value;
          const code = data.profile_code;
          if (code && !seenCodes.has(code)) {
            seenCodes.add(code);
            combined.push(data);
          }
        }
      });
    }
  }

  return combined;
}

export default function ShortlistScreen({ navigation }) {
  const queryClient = useQueryClient();

  const {
    data: shortlist = [],
    isLoading: loading,
    isRefetching: refreshing,
    refetch,
  } = useQuery({
    queryKey: ['shortlists'],
    queryFn: fetchShortlistData,
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleToggleShortlist = async (profileCode, isAssisted = false) => {
    const isActuallyAssisted =
      isAssisted || String(profileCode).startsWith('AL');

    // 1. Optimistic remove immediately from the cache
    queryClient.setQueryData(['shortlists'], (prev) =>
      (prev || []).filter((p) => (p.profile_code || p.listing_code) !== profileCode)
    );

    // 2. Remove from SecureStore rn_all_shortlists
    try {
      const savedStr = await SecureStore.getItemAsync('rn_all_shortlists');
      let codes = savedStr ? JSON.parse(savedStr) : [];
      codes = codes.filter((c) => c !== profileCode);
      await SecureStore.setItemAsync('rn_all_shortlists', JSON.stringify(codes));
    } catch (e) {
      // Ignore
    }

    // 3. Remove from SecureStore rn_assisted_shortlist
    try {
      const savedAssistedStr = await SecureStore.getItemAsync('rn_assisted_shortlist');
      let assistedCodes = savedAssistedStr ? JSON.parse(savedAssistedStr) : [];
      assistedCodes = assistedCodes.filter((c) => c !== profileCode);
      await SecureStore.setItemAsync(
        'rn_assisted_shortlist',
        JSON.stringify(assistedCodes)
      );
    } catch (e) {
      // Ignore
    }

    // 4. Sync with backend API for regular profiles
    if (!isActuallyAssisted) {
      try {
        await profilesApi.removeFromShortlist(profileCode);
      } catch (e) {
        // Ignore
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[900]} />

      <View style={styles.header}>
        <Text style={styles.title}>Shortlisted Rishtay</Text>
        <Text style={styles.subtitle}>Profiles saved for family discussion</Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
        <OnboardingBanner />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.magenta[500]} />
        </View>
      ) : (
        <FlatList
          data={shortlist}
          keyExtractor={(item) =>
            item.profile_code || item.listing_code || String(item.id)
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.magenta[400]}
            />
          }
          renderItem={({ item }) => {
            const isAssisted =
              !!item.listing_code ||
              !!item.is_assisted ||
              String(item.profile_code).startsWith('AL');
            return (
              <CandidateCard
                candidate={item}
                isShortlisted={true}
                onToggleShortlist={handleToggleShortlist}
                onPress={(candidate) => {
                  if (isAssisted) {
                    navigation.navigate('AssistedDetail', {
                      listingCode:
                        candidate.listing_code || candidate.profile_code,
                    });
                  } else {
                    navigation.navigate('CandidateDetail', {
                      profileCode: candidate.profile_code,
                    });
                  }
                }}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="heart-outline" size={36} color={Colors.slate[500]} />
              </View>
              <Text style={styles.emptyTitle}>No Shortlisted Profiles Yet</Text>
              <Text style={styles.emptySubtitle}>
                Profiles you shortlist from discovery will appear here for easy comparison and discussion.
              </Text>
            </View>
          }
        />
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.slate[400],
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.navy[800],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.slate[400],
    textAlign: 'center',
    lineHeight: 18,
  },
});
