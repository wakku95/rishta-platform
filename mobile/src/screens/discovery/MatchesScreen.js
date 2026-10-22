import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../../constants/colors';
import CandidateCard from '../../components/candidate/CandidateCard';
import FilterModal from '../../components/discovery/FilterModal';
import HiddenProfilesModal from '../../components/discovery/HiddenProfilesModal';
import { profilesApi } from '../../api/profiles';
import { Ionicons } from '@expo/vector-icons';

export default function MatchesScreen({ navigation }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'assisted'
  const [shortlistedCodes, setShortlistedCodes] = useState(new Set());

  // Pagination & Filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({});

  // Hidden Profiles Management state
  const [hiddenModalVisible, setHiddenModalVisible] = useState(false);
  const [hiddenList, setHiddenList] = useState([]);
  const [hiddenLoading, setHiddenLoading] = useState(false);

  const activeFilterCount = Object.keys(filters).filter((k) => !!filters[k]).length;

  // Sync shortlists and hidden profile state whenever the screen gains focus
  const syncStorageState = useCallback(async () => {
    try {
      // 1. Load shortlists from server + local storage
      let combinedShortlists = [];
      try {
        const res = await profilesApi.getShortlist();
        const regularList = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        combinedShortlists = regularList.map((p) => p.profile_code).filter(Boolean);
      } catch (e) {
        // Ignore
      }

      const savedAllShortlists = await SecureStore.getItemAsync('rn_all_shortlists');
      const localShortlists = savedAllShortlists ? JSON.parse(savedAllShortlists) : [];
      const savedAssistedStr = await SecureStore.getItemAsync('rn_assisted_shortlist');
      const assistedShortlists = savedAssistedStr ? JSON.parse(savedAssistedStr) : [];

      setShortlistedCodes(
        new Set([...combinedShortlists, ...localShortlists, ...assistedShortlists])
      );

      // 2. Load hidden profiles
      const savedHiddenStr = await SecureStore.getItemAsync('rn_local_hidden_profiles');
      const localHidden = savedHiddenStr ? JSON.parse(savedHiddenStr) : [];
      setHiddenList(localHidden);
    } catch (e) {
      console.warn('Storage sync notice:', e.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      syncStorageState();
    }, [syncStorageState])
  );

  const fetchMatches = async (pageToFetch = 1, shouldAppend = false) => {
    try {
      const params = {
        page: pageToFetch,
        per_page: 20,
        ...filters,
      };

      let res;
      if (activeTab === 'assisted') {
        res = await profilesApi.getAssistedListings(params);
      } else {
        res = await profilesApi.search(params);
      }

      // Handle Laravel paginated collection formats: { data: [...], meta: { ... } }
      const items = Array.isArray(res.data)
        ? res.data
        : (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));

      const meta = res.meta || res.data?.meta || null;
      if (meta) {
        setTotalCount(meta.total);
        setHasMore(meta.current_page < meta.last_page);
        setCurrentPage(meta.current_page);
      } else {
        // Fallback for non-paginated arrays
        setHasMore(items.length >= 20);
        setCurrentPage(pageToFetch);
      }

      if (shouldAppend) {
        setCandidates((prev) => [...prev, ...items]);
      } else {
        setCandidates(items);
      }
    } catch (err) {
      console.warn('Failed to fetch candidates:', err);
      if (!shouldAppend) setCandidates([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Re-fetch when tab or applied filters change
  useEffect(() => {
    setLoading(true);
    setCurrentPage(1);
    setHasMore(true);
    fetchMatches(1, false);
  }, [activeTab, filters]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchMatches(1, false);
  }, [activeTab, filters]);

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      setLoadingMore(true);
      fetchMatches(currentPage + 1, true);
    }
  };

  const handleToggleShortlist = async (targetCode, isAssisted = false) => {
    if (!targetCode) return;
    const isCurrentlyShortlisted = shortlistedCodes.has(targetCode);
    const isActuallyAssisted =
      isAssisted || String(targetCode).startsWith('AL');

    // 1. Instant optimistic UI state update
    const updated = new Set(shortlistedCodes);
    if (isCurrentlyShortlisted) {
      updated.delete(targetCode);
    } else {
      updated.add(targetCode);
    }
    setShortlistedCodes(updated);

    // 2. Persist in rn_all_shortlists immediately
    try {
      await SecureStore.setItemAsync(
        'rn_all_shortlists',
        JSON.stringify(Array.from(updated))
      );
    } catch (e) {
      // Ignore
    }

    // 3. Sync with backend API or assisted local storage
    try {
      if (isActuallyAssisted) {
        const savedAssistedStr = await SecureStore.getItemAsync('rn_assisted_shortlist');
        let list = savedAssistedStr ? JSON.parse(savedAssistedStr) : [];
        if (isCurrentlyShortlisted) {
          list = list.filter((c) => c !== targetCode);
        } else {
          if (!list.includes(targetCode)) {
            list.push(targetCode);
          }
        }
        await SecureStore.setItemAsync('rn_assisted_shortlist', JSON.stringify(list));
      } else {
        if (isCurrentlyShortlisted) {
          await profilesApi.removeFromShortlist(targetCode);
        } else {
          await profilesApi.addToShortlist(targetCode);
        }
      }
    } catch (err) {
      // If server returns 401 (e.g. backend zip not yet updated on live server),
      // we gracefully keep it in local storage without disturbing the user
      if (err.response?.status === 401) {
        console.log('Shortlist saved locally in secure storage.');
      } else if (err.response?.data?.error_code === 'CANNOT_SHORTLIST_SELF') {
        // Revert only if attempting to shortlist own profile
        setShortlistedCodes(shortlistedCodes);
        Alert.alert('Notice', 'You cannot shortlist your own profile.');
      } else {
        console.warn('Shortlist sync notice:', err.message);
      }
    }
  };

  const handleIgnore = (candidate) => {
    const code = candidate.profile_code || candidate.listing_code;
    if (!code) return;

    Alert.alert(
      'Ignore Candidate / نظر انداز کریں',
      `Do you want to hide candidate #${code} from your discovery results? You can restore them anytime from the Hidden profiles button.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ignore / Hide',
          style: 'destructive',
          onPress: async () => {
            // 1. Optimistic removal from feed
            setCandidates((prev) =>
              prev.filter((c) => (c.profile_code || c.listing_code) !== code)
            );
            setTotalCount((prev) => (prev ? prev - 1 : prev));

            // 2. Save in local hidden profiles for instant restoration
            const hiddenItem = {
              code,
              type: candidate.listing_code ? 'assisted' : 'registered',
              gender: candidate.gender,
              age: candidate.age,
              city: candidate.city,
              profession: candidate.profession,
              photo_url: candidate.photo_url,
              candidateData: candidate,
              hidden_at: new Date().toISOString(),
            };

            try {
              const savedHiddenStr = await SecureStore.getItemAsync('rn_local_hidden_profiles');
              let currentHidden = savedHiddenStr ? JSON.parse(savedHiddenStr) : [];
              currentHidden = [hiddenItem, ...currentHidden.filter((h) => h.code !== code)];
              await SecureStore.setItemAsync('rn_local_hidden_profiles', JSON.stringify(currentHidden));
              setHiddenList(currentHidden);
            } catch (e) {
              // Ignore
            }

            // 3. Persist exclusion to backend
            try {
              await profilesApi.hideProfile(code);
            } catch (err) {
              console.warn('Hide profile server sync notice:', err.message);
            }
          },
        },
      ]
    );
  };

  const handleOpenHiddenModal = async () => {
    setHiddenModalVisible(true);
    setHiddenLoading(true);

    try {
      // Read local hidden profiles
      const savedHiddenStr = await SecureStore.getItemAsync('rn_local_hidden_profiles');
      let combined = savedHiddenStr ? JSON.parse(savedHiddenStr) : [];

      // Also merge any server-side exclusions
      try {
        const res = await profilesApi.getHiddenProfiles();
        const serverHidden = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        for (const s of serverHidden) {
          if (!combined.some((c) => c.code === s.code)) {
            combined.push(s);
          }
        }
      } catch (e) {
        // Ignore backend 401
      }

      setHiddenList(combined);
    } catch (e) {
      console.warn('Failed to load hidden candidates:', e);
    } finally {
      setHiddenLoading(false);
    }
  };

  const handleUnhideCandidate = async (item) => {
    const code = item.code;
    if (!code) return;

    // 1. Remove from local hidden state & storage
    const updatedHidden = hiddenList.filter((h) => h.code !== code);
    setHiddenList(updatedHidden);
    try {
      await SecureStore.setItemAsync('rn_local_hidden_profiles', JSON.stringify(updatedHidden));
    } catch (e) {
      // Ignore
    }

    // 2. Unhide on backend
    try {
      await profilesApi.unhideProfile(code);
    } catch (e) {
      console.warn('Unhide server sync notice:', e.message);
    }

    // 3. Restore to feed and notify
    fetchMatches(1, false);
    Alert.alert(
      'Restored / بحال کر دیا گیا',
      `Candidate #${code} has been restored to your discovery feed.`
    );
  };

  const removeFilterKey = (key) => {
    setFilters((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[900]} />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Image
              source={require('../../../assets/raabtanow-icon.png')}
              style={{ width: 38, height: 38, borderRadius: 10 }}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.brandTitle}>
                Raabta<Text style={{ color: Colors.magenta[400] }}>Now</Text>
              </Text>
              <Text style={styles.headerSubtitle}>
                {totalCount !== null ? `${totalCount} Verified Candidates` : 'Discover Compatible Rishtas'}
              </Text>
            </View>
          </View>

          {/* Action Buttons: Hidden & Filters */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={[styles.hiddenButton, hiddenList.length > 0 && styles.hiddenButtonActive]}
              onPress={handleOpenHiddenModal}
              activeOpacity={0.8}
            >
              <Ionicons
                name="eye-off-outline"
                size={16}
                color={hiddenList.length > 0 ? Colors.white : Colors.slate[400]}
              />
              <Text style={[styles.hiddenButtonText, hiddenList.length > 0 && styles.hiddenButtonTextActive]}>
                Hidden {hiddenList.length > 0 ? `(${hiddenList.length})` : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
              onPress={() => setFilterModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={activeFilterCount > 0 ? 'options' : 'options-outline'}
                size={16}
                color={activeFilterCount > 0 ? Colors.white : Colors.slate[300]}
              />
              <Text style={[styles.filterButtonText, activeFilterCount > 0 && styles.filterButtonTextActive]}>
                Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Switcher: Verified vs Assisted */}
        <View style={styles.tabPillContainer}>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'all' && styles.tabPillActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabPillText, activeTab === 'all' && styles.tabPillTextActive]}>
              All Rishtay
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'assisted' && styles.tabPillActive]}
            onPress={() => setActiveTab('assisted')}
          >
            <Text style={[styles.tabPillText, activeTab === 'assisted' && styles.tabPillTextActive]}>
              Assisted (اسسٹڈ)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active Filter Chips Bar */}
        {activeFilterCount > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            {filters.profile_code && (
              <TouchableOpacity
                style={styles.filterChip}
                onPress={() => removeFilterKey('profile_code')}
              >
                <Text style={styles.filterChipText}>#{filters.profile_code} ✕</Text>
              </TouchableOpacity>
            )}
            {filters.gender && (
              <TouchableOpacity
                style={styles.filterChip}
                onPress={() => removeFilterKey('gender')}
              >
                <Text style={styles.filterChipText}>
                  {filters.gender === 'female' ? 'Bride (دلہن)' : 'Groom (دلہا)'} ✕
                </Text>
              </TouchableOpacity>
            )}
            {filters.city && (
              <TouchableOpacity
                style={styles.filterChip}
                onPress={() => removeFilterKey('city')}
              >
                <Text style={styles.filterChipText}>{filters.city} ✕</Text>
              </TouchableOpacity>
            )}
            {filters.sect && (
              <TouchableOpacity
                style={styles.filterChip}
                onPress={() => removeFilterKey('sect')}
              >
                <Text style={styles.filterChipText}>{filters.sect} ✕</Text>
              </TouchableOpacity>
            )}
            {filters.min_age && (
              <TouchableOpacity
                style={styles.filterChip}
                onPress={() => removeFilterKey('min_age')}
              >
                <Text style={styles.filterChipText}>Age: {filters.min_age}+ ✕</Text>
              </TouchableOpacity>
            )}
            {filters.max_age && (
              <TouchableOpacity
                style={styles.filterChip}
                onPress={() => removeFilterKey('max_age')}
              >
                <Text style={styles.filterChipText}>Under {filters.max_age} ✕</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.clearAllChip} onPress={clearAllFilters}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Candidate Feed */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.magenta[500]} />
          <Text style={styles.loadingText}>Loading verified profiles...</Text>
        </View>
      ) : (
        <FlatList
          data={candidates}
          keyExtractor={(item, index) => item.listing_code || item.profile_code || String(index)}
          renderItem={({ item }) => (
            <CandidateCard
              candidate={item}
              isShortlisted={shortlistedCodes.has(item.profile_code || item.listing_code)}
              onToggleShortlist={handleToggleShortlist}
              onIgnore={handleIgnore}
              onPress={(candidate) => {
                if (activeTab === 'assisted') {
                  navigation.navigate('AssistedDetail', {
                    listingCode: candidate.listing_code || candidate.profile_code,
                  });
                } else {
                  navigation.navigate('CandidateDetail', {
                    profileCode: candidate.profile_code,
                  });
                }
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={Colors.magenta[400]} />
                <Text style={styles.footerLoaderText}>Loading more profiles...</Text>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.magenta[400]}
              colors={[Colors.magenta[500]]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={Colors.slate[500]} />
              <Text style={styles.emptyTitle}>
                {activeFilterCount > 0 ? 'No Matches for Selected Filters' : 'No Profiles Found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeFilterCount > 0
                  ? 'Try relaxing your filter parameters to view more compatible profiles.'
                  : 'Check back soon as new verified candidates register daily.'}
              </Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity style={styles.resetButton} onPress={clearAllFilters}>
                  <Text style={styles.resetButtonText}>Reset All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        initialFilters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
        onReset={clearAllFilters}
      />

      {/* Hidden Profiles Management Modal */}
      <HiddenProfilesModal
        visible={hiddenModalVisible}
        onClose={() => setHiddenModalVisible(false)}
        hiddenList={hiddenList}
        loading={hiddenLoading}
        onUnhide={handleUnhideCandidate}
      />
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
    backgroundColor: Colors.navy[900],
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.slate[400],
    marginTop: 1,
  },
  hiddenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.navy[750],
  },
  hiddenButtonActive: {
    backgroundColor: Colors.navy[800],
    borderColor: Colors.slate[600],
  },
  hiddenButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate[400],
  },
  hiddenButtonTextActive: {
    color: Colors.slate[200],
    fontWeight: '700',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.navy[950],
    borderWidth: 1,
    borderColor: Colors.navy[750],
  },
  filterButtonActive: {
    backgroundColor: Colors.magenta[600],
    borderColor: Colors.magenta[400],
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate[300],
  },
  filterButtonTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  tabPillContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.navy[950],
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.navy[750],
  },
  tabPill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabPillActive: {
    backgroundColor: Colors.navy[800],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate[400],
  },
  tabPillTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  chipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingBottom: 2,
  },
  filterChip: {
    backgroundColor: Colors.magenta[900] || '#4c0519',
    borderColor: Colors.magenta[500],
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  filterChipText: {
    color: Colors.magenta[100] || '#ffe4e6',
    fontSize: 11,
    fontWeight: '600',
  },
  clearAllChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearAllText: {
    color: Colors.rose[400],
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.slate[400],
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: Colors.slate[400],
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  resetButton: {
    marginTop: 8,
    backgroundColor: Colors.navy[800],
    borderColor: Colors.magenta[500],
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  resetButtonText: {
    color: Colors.magenta[400],
    fontSize: 13,
    fontWeight: '700',
  },
  footerLoader: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 12,
    color: Colors.slate[400],
  },
});
