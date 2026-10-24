import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Filter, RotateCcw, Search, SlidersHorizontal, Users, Sparkles, EyeOff, X } from 'lucide-react';
import { searchProfiles, hideProfile, unhideProfile, getHiddenProfiles } from '../../api/discovery';
import { getProfileOptions, getProfile } from '../../api/profile';
import { searchAssistedListings } from '../../api/listings';
import { AuthContext } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import ProfileCard from '../../components/profile/ProfileCard';
import AssistedListingCard from '../../components/profile/AssistedListingCard';

// Standard fallback options matching ProfileOptions
const INITIAL_FILTERS = {
  profile_code: '',
  gender: '',
  min_age: '',
  max_age: '',
  city: '',
  religion: '',
  sect: '',
  education: '',
  profession: '',
  marital_status: '',
  min_height: '',
  max_height: '',
  page: 1,
};

const parseFiltersFromSearchParams = (searchParams) => {
  const parsed = { ...INITIAL_FILTERS };
  for (const key of Object.keys(INITIAL_FILTERS)) {
    const val = searchParams.get(key);
    if (val !== null && val !== '') {
      parsed[key] = key === 'page' ? (parseInt(val, 10) || 1) : val;
    }
  }
  return parsed;
};

export default function SearchProfilesPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => parseFiltersFromSearchParams(searchParams));
  const [activeFilters, setActiveFilters] = useState(() => parseFiltersFromSearchParams(searchParams));
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [undoToast, setUndoToast] = useState(null);
  const [hiddenModalOpen, setHiddenModalOpen] = useState(false);
  const [hiddenList, setHiddenList] = useState([]);
  const [hiddenLoading, setHiddenLoading] = useState(false);

  // Registered User Auto Match state
  const { user } = useContext(AuthContext);
  const [isAutoMatchActive, setIsAutoMatchActive] = useState(() => searchParams.get('auto_match') === '1');

  // TanStack Query for Canonical Options (Cached for entire session)
  const { data: profileOptionsData } = useQuery({
    queryKey: ['profileOptions'],
    queryFn: async () => {
      const res = await getProfileOptions();
      return res.data || null;
    },
    staleTime: Infinity,
  });

  const options = profileOptionsData || {
    genders: [],
    religions: [],
    sects: [],
    cities: [],
    educations: [],
    professions: [],
    marital_statuses: [],
  };

  // TanStack Query for User Profile (Shares cache with ProfilePage)
  const { data: userProfileData } = useQuery({
    queryKey: ['myProfile'],
    queryFn: async () => {
      try {
        const res = await getProfile();
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: !!user,
  });

  const userProfile = userProfileData || null;

  // TanStack Query for Discovery Candidate Feed
  const {
    data: discoveryData,
    isLoading: loading,
    error: queryErrorObj,
  } = useQuery({
    queryKey: ['discoveryProfiles', activeFilters],
    queryFn: async () => {
      const cleanParams = Object.entries(activeFilters).reduce((acc, [key, val]) => {
        if (val !== '' && val !== null && val !== undefined) {
          acc[key] = val;
        }
        return acc;
      }, {});

      const [resProfiles, resListings] = await Promise.all([
        searchProfiles(cleanParams),
        searchAssistedListings(cleanParams).catch(() => ({ data: [] })),
      ]);

      const regularData = resProfiles.data || [];
      const listingsWithTag = (resListings?.data || []).map((l) => ({ ...l, is_assisted_listing: true }));
      const combined = [...regularData, ...listingsWithTag];

      const regularTotal = resProfiles.meta?.total ?? regularData.length;
      const assistedTotal = resListings?.meta?.total ?? listingsWithTag.length;
      const combinedTotal = regularTotal + assistedTotal;

      return {
        profiles: combined,
        meta: {
          current_page: resProfiles.meta?.current_page || 1,
          last_page: resProfiles.meta?.last_page || 1,
          per_page: resProfiles.meta?.per_page || 12,
          total: combinedTotal,
        },
      };
    },
  });

  const profiles = discoveryData?.profiles || [];
  const meta = discoveryData?.meta || { current_page: 1, last_page: 1, total: 0, per_page: 12 };

  const error = queryErrorObj
    ? (queryErrorObj.response?.status === 403
        ? (queryErrorObj.response.data?.message || 'Access restricted. Please verify your email.')
        : (queryErrorObj.response?.data?.message || 'Unable to load candidate profiles.'))
    : null;

  const validationErrors = queryErrorObj?.response?.status === 422
    ? (queryErrorObj.response.data.errors || {})
    : {};

  const handleApplyAutoMatch = () => {
    if (!userProfile?.preferences) return;
    const p = userProfile.preferences;

    const autoFilters = {
      ...INITIAL_FILTERS,
      gender: p.preferred_gender || '',
      min_age: p.min_age ? String(p.min_age) : '',
      max_age: p.max_age ? String(p.max_age) : '',
      city: (Array.isArray(p.preferred_cities) && p.preferred_cities.length > 0) ? p.preferred_cities[0] : '',
      religion: p.preferred_religion || '',
      sect: p.preferred_sect || '',
      education: p.preferred_education || '',
      marital_status: (Array.isArray(p.preferred_marital_status) && p.preferred_marital_status.length > 0) ? p.preferred_marital_status[0] : '',
      min_height: p.min_height ? String(p.min_height) : '',
      max_height: p.max_height ? String(p.max_height) : '',
      page: 1,
    };

    setFilters(autoFilters);
    setIsAutoMatchActive(true);

    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(autoFilters)) {
      if (val !== '' && val !== null && val !== undefined && key !== 'page') {
        params.set(key, val);
      }
    }
    params.set('auto_match', '1');
    setSearchParams(params);
  };

  // Synchronize filters whenever URL search parameters change (e.g. from Home page or browser back/forward)
  useEffect(() => {
    const urlFilters = parseFiltersFromSearchParams(searchParams);
    setFilters(urlFilters);
    setActiveFilters(urlFilters);
  }, [searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => {
      const next = { ...prev, [name]: value };
      // Clear sect if religion is changed to non-Islam
      if (name === 'religion' && value !== 'Islam') {
        next.sect = '';
      }
      return next;
    });

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const nextFilters = { ...filters, page: 1 };

    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, val]) => {
      if (val !== '' && val !== null && val !== undefined && !(key === 'page' && val === 1)) {
        params.set(key, val);
      }
    });

    if (params.toString() === searchParams.toString()) {
      queryClient.invalidateQueries({ queryKey: ['discoveryProfiles', nextFilters] });
    } else {
      setSearchParams(params);
    }
    // Auto close filter panel on mobile after submitting
    setFilterPanelOpen(false);
  };

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setActiveFilters(INITIAL_FILTERS);
    setIsAutoMatchActive(false);
    if (searchParams.toString() !== '') {
      setSearchParams({});
    } else {
      queryClient.invalidateQueries({ queryKey: ['discoveryProfiles', INITIAL_FILTERS] });
    }
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    if (newPage > 1) {
      params.set('page', newPage);
    } else {
      params.delete('page');
    }
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHideProfile = async (profileCode, candidateObj) => {
    try {
      await hideProfile(profileCode);
      queryClient.setQueryData(['discoveryProfiles', activeFilters], (old) => {
        if (!old) return old;
        return {
          ...old,
          profiles: (old.profiles || []).filter((p) => (p.profile_code || p.listing_code) !== profileCode),
        };
      });

      if (undoToast?.timerId) {
        clearTimeout(undoToast.timerId);
      }

      const timerId = setTimeout(() => {
        setUndoToast(null);
      }, 8000);

      setUndoToast({
        code: profileCode,
        item: candidateObj,
        timerId,
      });
    } catch (err) {
      console.error('Failed to hide profile:', err);
    }
  };

  const handleUndoHide = async () => {
    if (!undoToast) return;
    const { code, item, timerId } = undoToast;
    if (timerId) clearTimeout(timerId);

    try {
      await unhideProfile(code);
      if (item) {
        queryClient.setQueryData(['discoveryProfiles', activeFilters], (old) => {
          if (!old) return old;
          return {
            ...old,
            profiles: [item, ...(old.profiles || [])],
          };
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['discoveryProfiles', activeFilters] });
      }
      setUndoToast(null);
    } catch (err) {
      console.error('Failed to undo hide:', err);
    }
  };

  const handleOpenHiddenModal = async () => {
    setHiddenModalOpen(true);
    setHiddenLoading(true);
    try {
      const res = await getHiddenProfiles();
      setHiddenList(res.data || []);
    } catch (err) {
      console.error('Failed to load hidden profiles:', err);
    } finally {
      setHiddenLoading(false);
    }
  };

  const handleUnhideFromModal = async (code) => {
    try {
      await unhideProfile(code);
      setHiddenList((prev) => prev.filter((item) => item.code !== code));
      queryClient.invalidateQueries({ queryKey: ['discoveryProfiles'] });
    } catch (err) {
      console.error('Failed to unhide profile:', err);
    }
  };

  // Count active non-empty filters (excluding page)
  const activeFilterCount = Object.entries(activeFilters).filter(
    ([key, val]) => key !== 'page' && val !== '' && val !== null && val !== undefined
  ).length;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-magenta-400 uppercase tracking-widest block">
              Discover Matrimonial Matches
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Search Candidate Profiles
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Browse verified, active matrimonial biodatas based on standardized criteria.
          </p>
        </div>

        {/* Mobile Filter Toggle Button */}
        <div className="flex items-center gap-2 sm:hidden">
          <Button
            variant="secondary"
            size="sm"
            icon={SlidersHorizontal}
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            className="w-full justify-center font-bold"
          >
            {filterPanelOpen ? 'Hide Filters' : `Filters ${activeFilterCount > 0 ? `(${activeFilterCount})` : ''}`}
          </Button>
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={handleClearFilters}
              title="Clear Filters"
              className="shrink-0 text-slate-400 hover:text-white"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Auto Match Feature Bar for Registered Users */}
      {user ? (
        userProfile?.preferences ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-navy-800 via-purple-950/40 to-navy-800 border border-magenta-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md shadow-magenta-500/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-magenta-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-magenta-500/20 shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">1-Click Auto Match</h3>
                  {isAutoMatchActive && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300">
                  {isAutoMatchActive
                    ? `Showing matches tailored for your profile (${userProfile.profile_code || 'My Profile'})`
                    : 'Instantly filter candidates based on your saved partner preferences.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isAutoMatchActive ? (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={RotateCcw}
                  onClick={handleClearFilters}
                  className="text-xs font-bold text-slate-300 hover:text-white"
                >
                  Show All Candidates
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  icon={Sparkles}
                  onClick={handleApplyAutoMatch}
                  className="text-xs font-bold shadow-md shadow-magenta-500/20"
                >
                  Apply My Preferences
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-navy-800/80 border border-slate-700/80 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Configure your <strong>Partner Preferences</strong> to unlock 1-click Auto Match.</span>
            </div>
            <Link to="/profile/preferences" className="font-bold text-magenta-400 hover:underline">
              Set Preferences →
            </Link>
          </div>
        )
      ) : (
        <div className="p-3 rounded-xl bg-navy-800/50 border border-white/5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-magenta-400" />
            <span>Looking for personalized rishtas? Registered members get instant <strong>Auto Match</strong> based on preferences.</span>
          </div>
          <Link to="/login" className="font-bold text-magenta-400 hover:underline shrink-0">
            Sign In →
          </Link>
        </div>
      )}

      {error && (
        <Alert variant="danger" title="Notice">
          {error}
        </Alert>
      )}

      {/* Filter Section (Responsive: Always visible on desktop, toggleable on mobile) */}
      <Card
        className={`p-4 sm:p-6 bg-navy-800 border border-slate-750 shadow-xl rounded-2xl transition-all duration-200 ${
          filterPanelOpen ? 'block' : 'hidden sm:block'
        }`}
      >
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-750/80">
            <span className="font-serif text-sm font-bold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-magenta-400" />
              Filter Candidates
            </span>
            {activeFilterCount > 0 && (
              <span className="text-xs font-semibold text-magenta-300 bg-magenta-500/15 px-2.5 py-0.5 rounded-full border border-magenta-500/30">
                {activeFilterCount} active {activeFilterCount === 1 ? 'filter' : 'filters'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Profile ID / Code */}
            <Input
              label="Profile ID / Code"
              name="profile_code"
              placeholder="e.g. RN-1001 or AP-1001"
              value={filters.profile_code}
              onChange={handleInputChange}
              error={validationErrors.profile_code?.[0]}
            />

            {/* Gender */}
            <Select
              label="Gender"
              name="gender"
              value={filters.gender}
              onChange={handleInputChange}
              error={validationErrors.gender?.[0]}
              options={[
                { value: '', label: 'All Genders' },
                ...(options.genders || []),
              ]}
            />

            {/* Age Range */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-200">Age Range</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  name="min_age"
                  type="number"
                  placeholder="Min (18)"
                  min="18"
                  max="80"
                  value={filters.min_age}
                  onChange={handleInputChange}
                  error={validationErrors.min_age?.[0]}
                />
                <Input
                  name="max_age"
                  type="number"
                  placeholder="Max (80)"
                  min="18"
                  max="80"
                  value={filters.max_age}
                  onChange={handleInputChange}
                  error={validationErrors.max_age?.[0]}
                />
              </div>
            </div>

            {/* City */}
            <Select
              label="City"
              name="city"
              value={filters.city}
              onChange={handleInputChange}
              error={validationErrors.city?.[0]}
              options={[
                { value: '', label: 'Any City' },
                ...(options.cities || []),
              ]}
            />

            {/* Religion */}
            <Select
              label="Religion"
              name="religion"
              value={filters.religion}
              onChange={handleInputChange}
              error={validationErrors.religion?.[0]}
              options={[
                { value: '', label: 'Any Religion' },
                ...(options.religions || []),
              ]}
            />

            {/* Sect (Conditionally shown when religion is Islam) */}
            {(!filters.religion || filters.religion === 'Islam') && (
              <Select
                label="Sect / Branch"
                name="sect"
                value={filters.sect}
                onChange={handleInputChange}
                error={validationErrors.sect?.[0]}
                options={[
                  { value: '', label: 'Any Sect / Branch' },
                  ...(options.sects || []),
                ]}
              />
            )}

            {/* Education */}
            <Select
              label="Minimum Education"
              name="education"
              value={filters.education}
              onChange={handleInputChange}
              error={validationErrors.education?.[0]}
              options={[
                { value: '', label: 'Any Education' },
                ...(options.educations || []),
              ]}
            />

            {/* Profession */}
            <Select
              label="Profession"
              name="profession"
              value={filters.profession}
              onChange={handleInputChange}
              error={validationErrors.profession?.[0]}
              options={[
                { value: '', label: 'Any Profession' },
                ...(options.professions || []),
              ]}
            />

            {/* Marital Status */}
            <Select
              label="Marital Status"
              name="marital_status"
              value={filters.marital_status}
              onChange={handleInputChange}
              error={validationErrors.marital_status?.[0]}
              options={[
                { value: '', label: 'Any Marital Status' },
                ...(options.marital_statuses || []),
              ]}
            />

            {/* Height Range (cm) */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
              <label className="block text-sm font-semibold text-slate-200">Height Range (cm)</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  name="min_height"
                  type="number"
                  placeholder="Min cm (e.g. 155)"
                  min="120"
                  max="230"
                  value={filters.min_height}
                  onChange={handleInputChange}
                  error={validationErrors.min_height?.[0]}
                />
                <Input
                  name="max_height"
                  type="number"
                  placeholder="Max cm (e.g. 185)"
                  min="120"
                  max="230"
                  value={filters.max_height}
                  onChange={handleInputChange}
                  error={validationErrors.max_height?.[0]}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              onClick={handleClearFilters}
              className="text-stone-600 hover:text-stone-900"
            >
              Clear Filters
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Search}
              className="px-6 font-bold shadow-xs"
            >
              Search Profiles
            </Button>
          </div>
        </form>
      </Card>

      {/* Results Header: Candidate Matches & Hidden Profiles */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-magenta-400" />
          <span className="text-sm font-bold text-white">
            {loading ? 'Searching profiles...' : 'Available Candidate Profiles / دستیاب رشتے'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <button
              type="button"
              onClick={handleOpenHiddenModal}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition px-2.5 py-1 rounded-lg bg-navy-800 border border-white/5 hover:border-white/10"
              title="View and unhide candidates you marked as Not Interested"
            >
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              <span>Hidden Profiles</span>
            </button>
          )}

          {activeFilterCount > 0 && !loading && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-semibold text-magenta-400 hover:text-magenta-300 underline cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Main Results Content */}
      {loading ? (
        <div className="py-16">
          <LoadingState text="Finding suitable matrimonial matches..." />
        </div>
      ) : profiles.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No profiles found"
          description="Try removing or adjusting some of your search filters to view more suitable candidate profiles."
          actionText="Clear All Filters"
          onAction={handleClearFilters}
          className="bg-navy-800 border border-slate-750"
        />
      ) : (
        <div className="space-y-6">
          {/* Candidates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {profiles.map((candidate) => (
              candidate.is_assisted_listing ? (
                <AssistedListingCard 
                  key={`listing-${candidate.listing_code}`} 
                  listing={candidate} 
                  onHide={handleHideProfile}
                />
              ) : (
                <ProfileCard 
                  key={`profile-${candidate.profile_code}`} 
                  profile={candidate} 
                  onHide={handleHideProfile}
                />
              )
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={meta.current_page}
            lastPage={meta.last_page}
            total={meta.total}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Undo Floating Toast */}
      {undoToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-navy-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-magenta-500/40 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-sm">
          <div className="flex-1 text-xs">
            <span className="font-semibold text-slate-200">
              #{undoToast.code} marked as Not Interested.
            </span>
          </div>
          <button
            type="button"
            onClick={handleUndoHide}
            className="inline-flex items-center gap-1 text-xs font-bold text-magenta-400 hover:text-magenta-300 px-2.5 py-1 rounded-lg bg-magenta-500/10 hover:bg-magenta-500/20 border border-magenta-500/30 transition shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Show Back
          </button>
          <button
            type="button"
            onClick={() => {
              if (undoToast.timerId) clearTimeout(undoToast.timerId);
              setUndoToast(null);
            }}
            className="text-slate-500 hover:text-white transition p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hidden Profiles Management Modal */}
      <Modal
        isOpen={hiddenModalOpen}
        onClose={() => setHiddenModalOpen(false)}
        title="Hidden Candidates & Listings"
        subtitle="Profiles you previously marked as Not Interested. Click Show Back to restore them to your discovery feed."
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          {hiddenLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Loading hidden candidates...
            </div>
          ) : hiddenList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              You haven&apos;t hidden any candidates yet.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {hiddenList.map((item) => (
                <div
                  key={item.code}
                  className="flex items-center justify-between p-3 rounded-xl bg-navy-800/80 border border-white/5 hover:border-white/10 transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">
                        #{item.code}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        item.type === 'assisted' 
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' 
                          : 'bg-magenta-500/10 text-magenta-300 border border-magenta-500/20'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 capitalize">
                      {item.gender} • {item.age} yrs • {item.city || 'N/A'} • {item.profession || 'N/A'}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnhideFromModal(item.code)}
                    className="text-xs text-magenta-400 hover:text-magenta-300 border-magenta-500/30 shrink-0"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Show Back
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
