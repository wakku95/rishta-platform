import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../../constants/colors';
import CandidateCard from '../../components/candidate/CandidateCard';
import FilterModal from '../../components/discovery/FilterModal';
import HiddenProfilesModal from '../../components/discovery/HiddenProfilesModal';
import { profilesApi } from '../../api/profiles';
import { Ionicons } from '@expo/vector-icons';
import OnboardingBanner from '../../components/common/OnboardingBanner';
import { useAuth } from '../../contexts/AuthContext';

export default function MatchesScreen({ navigation }) {
  const { authenticated } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'assisted'
  const [shortlistedCodes, setShortlistedCodes] = useState(new Set());

  // Filtering state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({});

  // Hidden Profiles Management state
  const [hiddenModalVisible, setHiddenModalVisible] = useState(false);
  const [hiddenList, setHiddenList] = useState([]);
  const [hiddenLoading, setHiddenLoading] = useState(false);

  const activeFilterCount = Object.keys(filters).filter((k) => !!filters[k]).length;

  const getCacheKey = useCallback((tab, appliedFilters) => {
    return ['matches_feed', tab, JSON.stringify(appliedFilters || {})];
  }, []);

  // Dual-tab cached state: preserves loaded profiles, pagination, and status per tab
  const [tabData, setTabData] = useState(() => {
    const initialAll = queryClient.getQueryData(getCacheKey('all', {}));
    const initialAssisted = queryClient.getQueryData(getCacheKey('assisted', {}));

    return {
      all: initialAll || {
        candidates: [],
        currentPage: 1,
        hasMore: true,
        totalCount: null,
        loaded: false,
        loading: true,
        loadingMore: false,
        refreshing: false,
      },
      assisted: initialAssisted || {
        candidates: [],
        currentPage: 1,
        hasMore: true,
        totalCount: null,
        loaded: false,
        loading: false,
        loadingMore: false,
        refreshing: false,
      },
    };
  });

  // Sync shortlists and hidden profile state whenever the screen gains focus
  const syncStorageState = useCallback(async () => {
    try {
      let combinedShortlists = [];
      if (authenticated) {
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
  }, [authenticated]);

  useFocusEffect(
    useCallback(() => {
      syncStorageState();
    }, [syncStorageState])
  );

  const fetchMatchesForTab = useCallback(
    async (tab, pageToFetch = 1, shouldAppend = false, isPullRefresh = false) => {
      setTabData((prev) => ({
        ...prev,
        [tab]: {
          ...(prev[tab] || {}),
          loading: !shouldAppend && !isPullRefresh,
          loadingMore: shouldAppend,
          refreshing: isPullRefresh,
        },
      }));

      try {
        const params = {
          page: pageToFetch,
          per_page: 20,
          ...filters,
        };

        let res;
        if (tab === 'assisted') {
          res = await profilesApi.getAssistedListings(params);
        } else {
          res = await profilesApi.search(params);
        }

        const items = Array.isArray(res.data)
          ? res.data
          : (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));

        const meta = res.meta || res.data?.meta || null;
        let newTotalCount = null;
        let newHasMore = false;
        let newPage = pageToFetch;

        if (meta) {
          newTotalCount = meta.total;
          newHasMore = meta.current_page < meta.last_page;
          newPage = meta.current_page;
        } else {
          newHasMore = items.length >= 20;
          newPage = pageToFetch;
        }

        setTabData((prev) => {
          const prevTab = prev[tab] || {};
          const updatedCandidates = shouldAppend ? [...(prevTab.candidates || []), ...items] : items;
          const updatedState = {
            candidates: updatedCandidates,
            currentPage: newPage,
            hasMore: newHasMore,
            totalCount: newTotalCount ?? prevTab.totalCount,
            loaded: true,
            loading: false,
            loadingMore: false,
            refreshing: false,
          };

          // Cache in TanStack Query client for instant re-use across navigation
          queryClient.setQueryData(getCacheKey(tab, filters), updatedState);

          return {
            ...prev,
            [tab]: updatedState,
          };
        });
      } catch (err) {
        console.warn(`Failed to fetch ${tab} candidates:`, err);
        setTabData((prev) => {
          const prevTab = prev[tab] || {};
          return {
            ...prev,
            [tab]: {
              ...prevTab,
              loading: false,
              loadingMore: false,
              refreshing: false,
              loaded: true,
              candidates: shouldAppend ? prevTab.candidates || [] : [],
            },
          };
        });
      }
    },
    [filters, getCacheKey, queryClient]
  );

  // Keep a ref to latest tabData to inspect loaded state without triggering re-render loops
  const tabDataRef = useRef(tabData);
  useEffect(() => {
    tabDataRef.current = tabData;
  }, [tabData]);

  // Unified effect: Handles filter changes and tab switches safely without re-render loop
  const prevFiltersJson = useRef(JSON.stringify(filters));
  useEffect(() => {
    const filtersJson = JSON.stringify(filters);
    const filtersChanged = prevFiltersJson.current !== filtersJson;

    if (filtersChanged) {
      prevFiltersJson.current = filtersJson;
      // Reset tab data for new filter criteria
      setTabData({
        all: {
          candidates: [],
          currentPage: 1,
          hasMore: true,
          totalCount: null,
          loaded: false,
          loading: activeTab === 'all',
          loadingMore: false,
          refreshing: false,
        },
        assisted: {
          candidates: [],
          currentPage: 1,
          hasMore: true,
          totalCount: null,
          loaded: false,
          loading: activeTab === 'assisted',
          loadingMore: false,
          refreshing: false,
        },
      });
      fetchMatchesForTab(activeTab, 1, false);
      return;
    }

    // Check if this tab is already loaded with current filters
    const currentTabState = tabDataRef.current[activeTab];
    if (currentTabState?.loaded) {
      return;
    }

    // Check if TanStack Query already has it cached
    const cached = queryClient.getQueryData(getCacheKey(activeTab, filters));
    if (cached && cached.loaded) {
      setTabData((prev) => ({
        ...prev,
        [activeTab]: cached,
      }));
      return;
    }

    // Otherwise, fetch initial page for this tab
    fetchMatchesForTab(activeTab, 1, false);
  }, [activeTab, filters, getCacheKey, queryClient, fetchMatchesForTab]);

  const onRefresh = useCallback(() => {
    setTabData((prev) => ({
      ...prev,
      [activeTab]: { ...(prev[activeTab] || {}), refreshing: true },
    }));
    fetchMatchesForTab(activeTab, 1, false, true);
  }, [activeTab, fetchMatchesForTab]);

  const handleLoadMore = () => {
    const currentTabState = tabData[activeTab];
    if (
      currentTabState &&
      !currentTabState.loading &&
      !currentTabState.loadingMore &&
      currentTabState.hasMore
    ) {
      setTabData((prev) => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], loadingMore: true },
      }));
      fetchMatchesForTab(activeTab, currentTabState.currentPage + 1, true);
    }
  };

  const handleToggleShortlist = async (targetCode, isAssisted = false) => {
    if (!targetCode) return;

    if (!authenticated) {
      Alert.alert(
        'Account Required / اکاؤنٹ درکار ہے',
        'Please register or sign in to save profiles to your shortlist for family discussion.\n\nرشتے شارٹ لسٹ کرنے کے لیے اپنا اکاؤنٹ بنائیں یا لاگ ان کریں۔',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In / لاگ ان', onPress: () => navigation.navigate('Login') },
          { text: 'Register Free / رجسٹریشن', onPress: () => navigation.navigate('Register') },
        ]
      );
      return;
    }

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
      if (err.response?.status === 401) {
        console.log('Shortlist saved locally in secure storage.');
      } else if (err.response?.data?.error_code === 'CANNOT_SHORTLIST_SELF') {
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

    if (!authenticated) {
      Alert.alert(
        'Account Required / اکاؤنٹ درکار ہے',
        'Please register or sign in to customize and hide profiles in your feed.\n\nرشتے اگنور کرنے کے لیے لاگ ان یا رجسٹریشن درکار ہے۔',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In / لاگ ان', onPress: () => navigation.navigate('Login') },
          { text: 'Register Free / رجسٹریشن', onPress: () => navigation.navigate('Register') },
        ]
      );
      return;
    }

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
            setTabData((prev) => {
              const prevTab = prev[activeTab] || {};
              const updatedCandidates = (prevTab.candidates || []).filter(
                (c) => (c.profile_code || c.listing_code) !== code
              );
              const updatedTab = {
                ...prevTab,
                candidates: updatedCandidates,
                totalCount: prevTab.totalCount ? prevTab.totalCount - 1 : prevTab.totalCount,
              };
              queryClient.setQueryData(getCacheKey(activeTab, filters), updatedTab);
              return {
                ...prev,
                [activeTab]: updatedTab,
              };
            });

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
      const savedHiddenStr = await SecureStore.getItemAsync('rn_local_hidden_profiles');
      let combined = savedHiddenStr ? JSON.parse(savedHiddenStr) : [];

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

    // 3. Refresh active tab and notify
    fetchMatchesForTab(activeTab, 1, false);
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

  // Derive current tab's active values
  const currentTabState = tabData[activeTab] || {
    candidates: [],
    currentPage: 1,
    hasMore: true,
    totalCount: null,
    loaded: false,
    loading: true,
    loadingMore: false,
    refreshing: false,
  };
  const { candidates, loading, loadingMore, refreshing, totalCount } = currentTabState;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[900]} />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerBrandContainer}>
            {navigation.canGoBack() && (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="arrow-back" size={22} color={Colors.white} />
              </TouchableOpacity>
            )}
            <Image
              source={require('../../../assets/raabtanow-icon.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <View style={styles.brandTitleContainer}>
              <Text style={styles.brandTitle}>
                Raabta<Text style={{ color: Colors.magenta[400] }}>Now</Text>
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {!authenticated ? 'Guest Discovery' : 'Privacy Protected'}
              </Text>
            </View>
          </View>

          {/* Action Buttons: Hidden (if authenticated) & Filters */}
          <View style={styles.headerActionsContainer}>
            {authenticated && (
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
            )}

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
            activeOpacity={0.8}
          >
            <Ionicons
              name="shield-checkmark"
              size={13}
              color={activeTab === 'all' ? Colors.white : Colors.slate[400]}
            />
            <Text style={[styles.tabPillText, activeTab === 'all' && styles.tabPillTextActive]}>
              All Rishtay / تمام رشتے
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'assisted' && styles.tabPillActive]}
            onPress={() => setActiveTab('assisted')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="people"
              size={13}
              color={activeTab === 'assisted' ? Colors.white : Colors.slate[400]}
            />
            <Text style={[styles.tabPillText, activeTab === 'assisted' && styles.tabPillTextActive]}>
              Assisted / اسسٹڈ رشتے
            </Text>
          </TouchableOpacity>
        </View>

        {/* Count Bar */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {loading ? (
              'Searching profiles...'
            ) : totalCount !== null ? (
              `${totalCount} verified ${activeTab === 'assisted' ? 'assisted listings' : 'profiles'} available`
            ) : (
              `${candidates.length} profiles available`
            )}
          </Text>
        </View>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterChipsRow}
            contentContainerStyle={styles.filterChipsContent}
          >
            {Object.keys(filters).map((key) => {
              const val = filters[key];
              if (!val) return null;
              return (
                <View key={key} style={styles.filterChip}>
                  <Text style={styles.filterChipText}>
                    {key}: {String(val)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeFilterKey(key)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={14} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              );
            })}
            <TouchableOpacity style={styles.clearAllChip} onPress={clearAllFilters}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Candidate Feed / Guest Banner */}
      <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
        {!authenticated ? (
          <View style={styles.guestBanner}>
            <View style={styles.guestBannerTextWrap}>
              <Ionicons name="sparkles" size={15} color={Colors.cyan[400]} />
              <Text style={styles.guestBannerText} numberOfLines={1}>
                Browsing verified profiles as Guest.
              </Text>
            </View>
            <View style={styles.guestBannerButtons}>
              <TouchableOpacity
                style={styles.guestBannerSignIn}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.8}
              >
                <Ionicons name="log-in-outline" size={13} color={Colors.white} />
                <Text style={styles.guestBannerSignInText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.guestBannerAction}
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.8}
              >
                <Text style={styles.guestBannerActionText}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <OnboardingBanner />
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.magenta[500]} />
          <Text style={styles.loadingText}>
            {activeTab === 'assisted' ? 'Loading assisted profiles...' : 'Loading verified profiles...'}
          </Text>
        </View>
      ) : (
        <FlatList
          key={activeTab}
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
              <View style={styles.emptyIconCircle}>
                <Ionicons name="search-outline" size={40} color={Colors.slate[500]} />
              </View>
              <Text style={styles.emptyTitle}>No Matching Profiles</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilterCount > 0
                  ? 'No profiles match your current search criteria. Try removing or adjusting filters.'
                  : activeTab === 'assisted'
                  ? 'There are currently no active assisted matchmaking listings.'
                  : 'There are currently no verified profiles to display.'}
              </Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity style={styles.resetFiltersBtn} onPress={clearAllFilters}>
                  <Text style={styles.resetFiltersBtnText}>Clear All Filters</Text>
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
    backgroundColor: Colors.navy[950],
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navy[800],
    backgroundColor: Colors.navy[900],
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerBrandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 2,
  },
  brandLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  brandTitleContainer: {
    justifyContent: 'center',
  },
  headerActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    backgroundColor: Colors.navy[800],
    borderWidth: 1,
    borderColor: Colors.navy[700],
  },
  hiddenButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  hiddenButtonText: {
    color: Colors.slate[400],
    fontSize: 12,
    fontWeight: '600',
  },
  hiddenButtonTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.navy[800],
    borderWidth: 1,
    borderColor: Colors.navy[700],
  },
  filterButtonActive: {
    backgroundColor: Colors.magenta[600],
    borderColor: Colors.magenta[500],
  },
  filterButtonText: {
    color: Colors.slate[300],
    fontSize: 12,
    fontWeight: '700',
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  tabPillContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.navy[800],
    padding: 3,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.navy[700],
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 8,
  },
  tabPillActive: {
    backgroundColor: Colors.magenta[600],
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate[400],
  },
  tabPillTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countText: {
    fontSize: 12,
    color: Colors.slate[400],
    fontWeight: '500',
  },
  filterChipsRow: {
    marginTop: 8,
  },
  filterChipsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(225, 29, 116, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 116, 0.4)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  filterChipText: {
    fontSize: 11,
    color: Colors.magenta[200],
    fontWeight: '600',
  },
  clearAllChip: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  clearAllText: {
    fontSize: 11,
    color: Colors.magenta[400],
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    color: Colors.slate[400],
    fontSize: 13,
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.navy[800],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
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
  resetFiltersBtn: {
    marginTop: 8,
    backgroundColor: Colors.navy[800],
    borderColor: Colors.magenta[500],
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  resetFiltersBtnText: {
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
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  guestBannerTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  guestBannerText: {
    fontSize: 11,
    color: Colors.cyan[200],
    fontWeight: '600',
  },
  guestBannerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guestBannerSignIn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  guestBannerSignInText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  guestBannerAction: {
    backgroundColor: Colors.cyan[500],
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  guestBannerActionText: {
    color: Colors.navy[950],
    fontSize: 11,
    fontWeight: '800',
  },
});
