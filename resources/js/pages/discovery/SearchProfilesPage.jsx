import React, { useState, useEffect, useCallback } from 'react';
import { Filter, RotateCcw, Search, SlidersHorizontal, Users } from 'lucide-react';
import { searchProfiles } from '../../api/discovery';
import { getProfileOptions } from '../../api/profile';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import Alert from '../../components/ui/Alert';
import ProfileCard from '../../components/profile/ProfileCard';

// Standard fallback options matching ProfileOptions
const INITIAL_FILTERS = {
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

export default function SearchProfilesPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [activeFilters, setActiveFilters] = useState(INITIAL_FILTERS);
  const [options, setOptions] = useState({
    genders: [],
    religions: [],
    sects: [],
    cities: [],
    educations: [],
    professions: [],
    marital_statuses: [],
  });
  const [profiles, setProfiles] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 12 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Load canonical options once
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await getProfileOptions();
        if (res.data) {
          setOptions(res.data);
        }
      } catch (err) {
        // Silently use defaults if options endpoint has issues
        console.warn('Could not fetch canonical options, using defaults.', err);
      }
    };
    fetchOptions();
  }, []);

  // Fetch search results whenever activeFilters change
  const fetchProfiles = useCallback(async (searchParams) => {
    setLoading(true);
    setError(null);
    setValidationErrors({});

    try {
      // Filter out empty string parameters before sending
      const cleanParams = Object.entries(searchParams).reduce((acc, [key, val]) => {
        if (val !== '' && val !== null && val !== undefined) {
          acc[key] = val;
        }
        return acc;
      }, {});

      const res = await searchProfiles(cleanParams);
      if (res.data) {
        setProfiles(res.data);
        setMeta(res.meta || { current_page: 1, last_page: 1, total: res.data.length, per_page: 12 });
      }
    } catch (err) {
      if (err.response?.status === 422) {
        setValidationErrors(err.response.data.errors || {});
        setError('Please check the filter parameters and correct any invalid values.');
      } else if (err.response?.status === 403) {
        setError(err.response.data.message || 'Access restricted. Please verify your email.');
      } else {
        setError('Unable to load candidate profiles. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchProfiles(activeFilters);
  }, [activeFilters, fetchProfiles]);

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
    setActiveFilters(nextFilters);
    // Auto close filter panel on mobile after submitting
    setFilterPanelOpen(false);
  };

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setActiveFilters(INITIAL_FILTERS);
    setValidationErrors({});
    setError(null);
  };

  const handlePageChange = (newPage) => {
    const nextFilters = { ...activeFilters, page: newPage };
    setFilters(nextFilters);
    setActiveFilters(nextFilters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Count active non-empty filters (excluding page)
  const activeFilterCount = Object.entries(activeFilters).filter(
    ([key, val]) => key !== 'page' && val !== '' && val !== null && val !== undefined
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
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
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="danger" title="Notice">
          {error}
        </Alert>
      )}

      {/* Filter Section (Responsive: Always visible on desktop, toggleable on mobile) */}
      <Card
        className={`p-5 sm:p-6 bg-navy-800 border border-slate-750 shadow-xl rounded-2xl transition-all duration-200 ${
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

      {/* Results Header: Profiles Count */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-magenta-400" />
          <span className="text-sm font-bold text-white">
            {loading ? 'Searching...' : `${meta.total} ${meta.total === 1 ? 'profile' : 'profiles'} found`}
          </span>
        </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((candidate) => (
              <ProfileCard key={candidate.profile_code} profile={candidate} />
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
    </div>
  );
}
