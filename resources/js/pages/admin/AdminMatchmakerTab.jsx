import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Search, Filter, Download, ArrowRight, 
  Users, CheckCircle2, HeartHandshake, Eye, RotateCcw, 
  MapPin, GraduationCap, Briefcase, Ruler, Heart, MessageCircle, Send, XCircle, ShieldCheck
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AdminSocialCardModal from '../../components/admin/AdminSocialCardModal';
import AdminCommunicationModal from '../../components/admin/AdminCommunicationModal';
import AdminVerificationLinkModal from '../../components/admin/AdminVerificationLinkModal';

export default function AdminMatchmakerTab() {
  // Source candidate filters
  const [candidateType, setCandidateType] = useState('assisted'); // 'assisted' or 'registered'
  const [candidateGender, setCandidateGender] = useState('female'); // 'female' or 'male'
  const [candidateSearch, setCandidateSearch] = useState('');
  
  // Candidates list state
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Quick Preferences state
  const [preferences, setPreferences] = useState({
    preferred_gender: 'male',
    min_age: '',
    max_age: '',
    city: '',
    religion: 'Islam',
    sect: 'Sunni',
    education: '',
    marital_status: '',
    min_height: '',
    max_height: '',
  });

  // Matches state
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [cardModalCandidate, setCardModalCandidate] = useState(null);
  const [commModalCandidate, setCommModalCandidate] = useState(null);
  const [verifyModalCandidate, setVerifyModalCandidate] = useState(null);
  const [batchDownloading, setBatchDownloading] = useState(false);

  // Fetch candidates list whenever type, gender, or search changes
  useEffect(() => {
    fetchCandidates();
  }, [candidateType, candidateGender]);

  const fetchCandidates = async () => {
    setCandidatesLoading(true);
    try {
      const res = await adminApi.getMatchmakerCandidates({
        type: candidateType,
        gender: candidateGender,
        search: candidateSearch || undefined,
      });
      const list = res.candidates || [];
      setCandidates(list);
      if (list.length > 0) {
        handleSelectCandidate(list[0]);
      } else {
        setSelectedCandidate(null);
        setMatches([]);
      }
    } catch (err) {
      console.error('Failed to load candidates:', err);
      setCandidates([]);
      setSelectedCandidate(null);
      setMatches([]);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCandidates();
  };

  // Select a candidate and setup initial quick preferences
  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate);

    const targetGender = candidate.gender === 'female' ? 'male' : 'female';
    const age = candidate.age || 28;

    // Calculate smart default age range
    let defaultMinAge = candidate.gender === 'female' ? Math.max(18, age) : Math.max(18, age - 6);
    let defaultMaxAge = candidate.gender === 'female' ? age + 6 : Math.max(18, age);

    if (candidate.preferences) {
      const p = candidate.preferences;
      const initialPrefs = {
        preferred_gender: targetGender,
        min_age: p.min_age || defaultMinAge,
        max_age: p.max_age || defaultMaxAge,
        city: (Array.isArray(p.preferred_cities) && p.preferred_cities.length > 0) ? p.preferred_cities[0] : '',
        religion: p.preferred_religion || candidate.religion || 'Islam',
        sect: p.preferred_sect || '',
        education: p.preferred_education || '',
        marital_status: (Array.isArray(p.preferred_marital_status) && p.preferred_marital_status.length > 0) ? p.preferred_marital_status[0] : '',
        min_height: '',
        max_height: '',
      };
      setPreferences(initialPrefs);
      runMatching(candidate, initialPrefs);
    } else {
      // Open defaults for assisted listings or profiles without saved preferences
      const initialPrefs = {
        preferred_gender: targetGender,
        min_age: defaultMinAge,
        max_age: defaultMaxAge,
        city: '',
        religion: candidate.religion || 'Islam',
        sect: '',
        education: '',
        marital_status: '',
        min_height: '',
        max_height: '',
      };
      setPreferences(initialPrefs);
      runMatching(candidate, initialPrefs);
    }
  };

  // Reset all filters to show all available candidates of target gender
  const handleResetFilters = () => {
    if (!selectedCandidate) return;
    const targetGender = selectedCandidate.gender === 'female' ? 'male' : 'female';
    const resetPrefs = {
      preferred_gender: targetGender,
      min_age: '',
      max_age: '',
      city: '',
      religion: selectedCandidate.religion || 'Islam',
      sect: '',
      education: '',
      marital_status: '',
      min_height: '',
      max_height: '',
    };
    setPreferences(resetPrefs);
    runMatching(selectedCandidate, resetPrefs);
  };

  // Run matching algorithm
  const runMatching = async (candidate, prefsToUse) => {
    if (!candidate) return;
    setMatchesLoading(true);
    try {
      const payload = {
        preferred_gender: prefsToUse.preferred_gender,
        min_age: prefsToUse.min_age || undefined,
        max_age: prefsToUse.max_age || undefined,
        cities: prefsToUse.city ? [prefsToUse.city] : undefined,
        religion: prefsToUse.religion || undefined,
        sect: prefsToUse.religion === 'Islam' ? (prefsToUse.sect || undefined) : undefined,
        education: prefsToUse.education || undefined,
        marital_status: prefsToUse.marital_status ? [prefsToUse.marital_status] : undefined,
        exclude_profile_id: candidate.type === 'registered' ? candidate.id : undefined,
        exclude_listing_id: candidate.type === 'assisted' ? candidate.id : undefined,
      };

      const res = await adminApi.findMatchmakerMatches(payload);
      setMatches(res.matches || []);
    } catch (err) {
      console.error('Failed to find matches:', err);
    } finally {
      setMatchesLoading(false);
    }
  };

  const handlePreferenceChange = (field, val) => {
    const updated = { ...preferences, [field]: val };
    setPreferences(updated);
  };

  const handleApplyPreferences = (e) => {
    e.preventDefault();
    if (selectedCandidate) {
      runMatching(selectedCandidate, preferences);
    }
  };

  // Batch download helper
  const handleBatchDownload = () => {
    if (matches.length === 0) return;
    setBatchDownloading(true);
    // Open the first match card in modal for export
    setCardModalCandidate(matches[0]);
    setBatchDownloading(false);
  };

  // Exclude a match so it will not be suggested again
  const handleExcludeMatch = async (match) => {
    if (!selectedCandidate) return;
    const confirmMsg = `Mark ${match.code} as "Not Interested / Pass" for ${selectedCandidate.code}? It will be permanently removed from suggestions.`;
    if (window.confirm(confirmMsg)) {
      try {
        await adminApi.excludeMatch({
          source_type: selectedCandidate.type,
          source_id: selectedCandidate.id,
          target_type: match.source,
          target_id: match.id,
          reason: 'not_interested',
        });
        setMatches(prev => prev.filter(m => !(m.source === match.source && m.id === match.id)));
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to exclude match.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-navy-850 via-purple-950/40 to-navy-850 border border-magenta-500/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-magenta-500/20 border border-magenta-500/40 flex items-center justify-center text-magenta-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Matchmaker Engine <span className="text-xs px-2 py-0.5 rounded-full bg-magenta-500/20 text-magenta-300 font-normal border border-magenta-500/30">Auto Matching</span>
            </h2>
            <p className="text-xs text-slate-400">
              Select any candidate to automatically discover high-compatibility matches across registered and assisted profiles.
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {matches.length > 0 && (
            <Button
              size="sm"
              variant="primary"
              icon={Download}
              onClick={handleBatchDownload}
              disabled={batchDownloading}
              className="shadow-lg shadow-magenta-500/20 font-bold"
            >
              Export Match Card
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Column Candidates Selector | Right Column Quick Prefs & Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Candidate Selector (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-4 bg-navy-800/90 border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Select Candidate</span>
              <span className="text-xs text-slate-400">{candidates.length} Loaded</span>
            </div>

            {/* Type & Gender Toggles */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCandidateGender('female')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    candidateGender === 'female'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-navy-900/60 text-slate-400 border border-white/5 hover:text-white'
                  }`}
                >
                  👰 Brides (Female)
                </button>
                <button
                  type="button"
                  onClick={() => setCandidateGender('male')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    candidateGender === 'male'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'bg-navy-900/60 text-slate-400 border border-white/5 hover:text-white'
                  }`}
                >
                  🤵 Grooms (Male)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCandidateType('assisted')}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition text-center ${
                    candidateType === 'assisted'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-navy-900/60 text-slate-400 border border-white/5 hover:text-white'
                  }`}
                >
                  📋 Assisted Profiles
                </button>
                <button
                  type="button"
                  onClick={() => setCandidateType('registered')}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition text-center ${
                    candidateType === 'registered'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-navy-900/60 text-slate-400 border border-white/5 hover:text-white'
                  }`}
                >
                  👤 Registered Users
                </button>
              </div>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                placeholder="Search candidate by code or name..."
                className="w-full text-xs px-3 py-2 bg-navy-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-magenta-500"
              />
              <Button type="submit" size="sm" variant="secondary" className="px-3">
                <Search className="w-3.5 h-3.5" />
              </Button>
            </form>

            {/* Candidates List Scrollbox */}
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {candidatesLoading ? (
                <div className="py-8 text-center text-xs text-slate-400 animate-pulse">Loading candidates...</div>
              ) : candidates.length > 0 ? (
                candidates.map((c) => {
                  const isSelected = selectedCandidate?.id === c.id && selectedCandidate?.type === c.type;
                  return (
                    <div
                      key={`${c.type}-${c.id}`}
                      onClick={() => handleSelectCandidate(c)}
                      className={`p-3 rounded-xl cursor-pointer transition border text-left ${
                        isSelected
                          ? 'bg-gradient-to-r from-magenta-950/40 to-navy-750 border-magenta-500/60 shadow-sm'
                          : 'bg-navy-900/40 border-white/5 hover:border-white/20 hover:bg-navy-750'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white">{c.code}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {c.age} yrs • {c.city || 'N/A'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium mt-1 truncate">
                        {c.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span>{c.profession || 'Profession N/A'}</span>
                        <span>•</span>
                        <span>{c.education || 'Education N/A'}</span>
                      </div>
                      {c.last_contacted && (
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md w-fit">
                          <span>💬 Contacted {c.last_contacted.time}</span>
                          <span className="capitalize text-slate-400 font-normal">({c.last_contacted.channel})</span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">No candidates found for this filter.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Active Candidate, Quick Preferences & Matches (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedCandidate ? (
            <>
              {/* Selected Candidate Banner */}
              <Card className="p-5 bg-navy-800/90 border-slate-700/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold bg-navy-900 text-magenta-300 px-2.5 py-0.5 rounded border border-slate-700">
                        {selectedCandidate.code}
                      </span>
                      <span className="text-base font-bold text-white">
                        {selectedCandidate.name} ({selectedCandidate.gender === 'female' ? 'Bride' : 'Groom'}, {selectedCandidate.age} yrs)
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedCandidate.city} • {selectedCandidate.education} • {selectedCandidate.profession} • {selectedCandidate.religion} {selectedCandidate.sect ? `(${selectedCandidate.sect})` : ''}
                    </p>
                    {selectedCandidate.last_contacted && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mt-1.5">
                        <span>💬 Last contacted {selectedCandidate.last_contacted.time} via <strong className="capitalize">{selectedCandidate.last_contacted.channel}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setVerifyModalCandidate(selectedCandidate)}
                      className="text-xs text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10 font-bold"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      Verify Link
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      icon={MessageCircle}
                      onClick={() => setCommModalCandidate(selectedCandidate)}
                      className="text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-none text-white shadow-emerald-950/50"
                    >
                      WhatsApp / Email
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setCardModalCandidate(selectedCandidate)}
                      className="text-xs"
                    >
                      Social Card
                    </Button>
                  </div>
                </div>

                {/* Quick Preference Bar (For instant matches if preferences are missing or need adjusting) */}
                <form onSubmit={handleApplyPreferences} className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      ⚡ Quick Match Preferences
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Tweak filters on the fly to recalculate best matches
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Looking For</label>
                      <select
                        value={preferences.preferred_gender}
                        onChange={(e) => handlePreferenceChange('preferred_gender', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-navy-900 border border-slate-700 rounded-lg text-white font-bold focus:outline-none focus:border-magenta-500"
                      >
                        <option value="male">🤵 Grooms (Male)</option>
                        <option value="female">👰 Brides (Female)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Target Age</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={preferences.min_age}
                          onChange={(e) => handlePreferenceChange('min_age', e.target.value)}
                          placeholder="Min"
                          className="w-full text-xs px-2.5 py-1.5 bg-navy-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-magenta-500"
                        />
                        <span className="text-slate-500 text-xs">-</span>
                        <input
                          type="number"
                          value={preferences.max_age}
                          onChange={(e) => handlePreferenceChange('max_age', e.target.value)}
                          placeholder="Max"
                          className="w-full text-xs px-2.5 py-1.5 bg-navy-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-magenta-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">City Filter</label>
                      <input
                        type="text"
                        value={preferences.city}
                        onChange={(e) => handlePreferenceChange('city', e.target.value)}
                        placeholder="e.g. Lahore / Karachi"
                        className="w-full text-xs px-2.5 py-1.5 bg-navy-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-magenta-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Sect</label>
                      <select
                        value={preferences.sect}
                        onChange={(e) => handlePreferenceChange('sect', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-navy-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-magenta-500"
                      >
                        <option value="">Any Sect</option>
                        <option value="Sunni">Sunni</option>
                        <option value="Shia">Shia</option>
                        <option value="Wahabi / Ahle Hadees">Ahle Hadees</option>
                        <option value="Deobandi">Deobandi</option>
                        <option value="Barelvi">Barelvi</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Min Education</label>
                      <select
                        value={preferences.education}
                        onChange={(e) => handlePreferenceChange('education', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-navy-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-magenta-500"
                      >
                        <option value="">Any Education</option>
                        <option value="Matric / O-Level">Matric / O-Level</option>
                        <option value="Intermediate / A-Level">Intermediate</option>
                        <option value="Bachelor's">Bachelor's</option>
                        <option value="Master's">Master's</option>
                        <option value="MPhil">MPhil</option>
                        <option value="PhD">PhD</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Marital Status</label>
                      <select
                        value={preferences.marital_status}
                        onChange={(e) => handlePreferenceChange('marital_status', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-navy-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-magenta-500"
                      >
                        <option value="">Any Status</option>
                        <option value="never_married">Never Married</option>
                        <option value="divorced">Divorced</option>
                        <option value="separated">Separated</option>
                        <option value="widowed">Widowed</option>
                        <option value="married">Married</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <span className="text-xs text-slate-400">
                      Looking for: <strong className="text-white capitalize">{preferences.preferred_gender}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        icon={RotateCcw}
                        onClick={handleResetFilters}
                        disabled={matchesLoading}
                        className="font-semibold text-xs"
                      >
                        Reset All Filters
                      </Button>
                      <Button type="submit" size="sm" variant="primary" icon={Sparkles} isLoading={matchesLoading} className="font-bold text-xs">
                        Recalculate Matches
                      </Button>
                    </div>
                  </div>
                </form>
              </Card>

              {/* Matches Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Top Compatible Matches
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {matches.length} Found
                    </span>
                  </h3>
                  <span className="text-xs text-slate-400">Ranked by Compatibility Score</span>
                </div>

                {matchesLoading ? (
                  <div className="py-16 text-center text-slate-400 animate-pulse">Calculating best matches...</div>
                ) : matches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matches.map((m) => (
                      <Card
                        key={`${m.source}-${m.id}`}
                        className="p-4 bg-navy-800/80 border-slate-700/80 hover:border-magenta-500/40 transition flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* Match Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-bold text-white bg-navy-900 px-2 py-0.5 rounded border border-slate-700">
                                  {m.code}
                                </span>
                                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                  {m.source === 'assisted' ? 'Assisted' : 'Registered'}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-white mt-1.5">
                                {m.gender === 'male' ? 'Groom' : 'Bride'} ({m.age} yrs)
                              </h4>
                              {m.last_contacted && (
                                <div className="text-[11px] text-amber-300/90 font-medium flex items-center gap-1 mt-1">
                                  <span>💬 Contacted {m.last_contacted.time || (m.last_contacted.contacted_at ? new Date(m.last_contacted.contacted_at).toLocaleDateString() : '')}</span>
                                  <span className="capitalize text-slate-400">({m.last_contacted.channel})</span>
                                </div>
                              )}
                            </div>

                            {/* Match Score Badge */}
                            <div className="text-right">
                              <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                {m.match_score}% Match
                              </span>
                            </div>
                          </div>

                          {/* Quick details */}
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1 border-t border-white/5">
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{m.city || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{m.education || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{m.profession || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <Heart className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{m.sect || m.religion || 'N/A'}</span>
                            </div>
                          </div>

                          {/* Badges */}
                          {m.match_badges && m.match_badges.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {m.match_badges.map((b, i) => (
                                <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-magenta-500/10 text-magenta-300 border border-magenta-500/20">
                                  ✓ {b}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Card Footer Actions */}
                        <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setCardModalCandidate(m)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-magenta-400 hover:text-magenta-300 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download Card
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setVerifyModalCandidate({ ...m, type: m.source === 'assisted' ? 'assisted' : 'profile' })}
                              title="Generate Verification Link for WhatsApp"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition hover:bg-cyan-500/10 px-2 py-1 rounded"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Verify
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExcludeMatch(m)}
                              title="Mark Not Interested / Pass (permanently removes from suggestions)"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400/80 hover:text-rose-300 transition hover:bg-rose-500/10 px-2 py-1 rounded"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Pass
                            </button>
                            <button
                              type="button"
                              onClick={() => setCommModalCandidate(m)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              WhatsApp / Email
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-navy-800/40 border border-white/5 text-center text-xs text-slate-400">
                    No matching profiles found with current filters. Try relaxing the age range or city.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-navy-800/40 rounded-2xl border border-white/5">
              Please select a candidate from the left list to discover matches.
            </div>
          )}
        </div>
      </div>

      {/* Social Card Preview & Export Modal */}
      {cardModalCandidate && (
        <AdminSocialCardModal
          candidate={cardModalCandidate}
          onClose={() => setCardModalCandidate(null)}
        />
      )}

      {/* Direct Communication Modal (WhatsApp & Email) */}
      {commModalCandidate && (
        <AdminCommunicationModal
          candidate={commModalCandidate}
          initialMatches={matches}
          onClose={() => setCommModalCandidate(null)}
        />
      )}

      {/* Candidate Verification Link Modal */}
      {verifyModalCandidate && (
        <AdminVerificationLinkModal
          isOpen={!!verifyModalCandidate}
          candidate={verifyModalCandidate}
          onClose={() => setVerifyModalCandidate(null)}
        />
      )}
    </div>
  );
}
