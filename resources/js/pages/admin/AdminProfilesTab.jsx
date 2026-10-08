import React, { useEffect, useState } from 'react';
import { Search, Eye, Trash2, ShieldAlert, RefreshCw, CheckCircle, Clock, Sparkles, MessageCircle } from 'lucide-react';
import { adminApi } from '../../api/admin';
import Button from '../../components/ui/Button';
import AdminSocialCardModal from '../../components/admin/AdminSocialCardModal';
import AdminCommunicationModal from '../../components/admin/AdminCommunicationModal';
import useAuth from '../../hooks/useAuth';

export default function AdminProfilesTab() {
  const { user: currentAdmin } = useAuth();
  const isSuperAdmin = currentAdmin?.role === 'admin';

  const [profiles, setProfiles] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [aboutFilter, setAboutFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [cardCandidate, setCardCandidate] = useState(null);
  const [commCandidate, setCommCandidate] = useState(null);
  const [message, setMessage] = useState(null);
  const [editingDob, setEditingDob] = useState(false);
  const [dobInput, setDobInput] = useState('');
  const [dobSaving, setDobSaving] = useState(false);

  const fetchProfiles = async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminApi.getProfiles({
        page,
        search: search || undefined,
        gender: genderFilter || undefined,
        status: statusFilter || undefined,
        about_status: aboutFilter || undefined,
      });
      setProfiles(data.data || []);
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles(1);
  }, [genderFilter, statusFilter, aboutFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProfiles(1);
  };

  const handleStatusChange = async (profileId, newStatus) => {
    setActionLoadingId(profileId);
    setMessage(null);
    try {
      const res = await adminApi.updateProfileStatus(profileId, newStatus);
      setMessage({ type: 'success', text: res.message });
      fetchProfiles(pagination.current_page);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (!window.confirm('Are you sure you want to permanently delete this candidate profile?')) return;
    setActionLoadingId(profileId);
    setMessage(null);
    try {
      const res = await adminApi.deleteProfile(profileId);
      setMessage({ type: 'success', text: res.message });
      fetchProfiles(pagination.current_page);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Delete failed.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const [inspectingId, setInspectingId] = useState(null);

  const handleInspect = async (id) => {
    setInspectingId(id);
    setMessage(null);
    setEditingDob(false);
    try {
      const data = await adminApi.getProfile(id);
      setSelectedProfile(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load profile details.' });
    } finally {
      setInspectingId(null);
    }
  };

  const handleSaveDob = async () => {
    if (!dobInput) {
      alert('Please select a valid date of birth.');
      return;
    }
    if (!window.confirm(`Are you sure you want to administratively update Date of Birth to ${dobInput}? This will recalculate the candidate's age and match brackets.`)) {
      return;
    }
    setDobSaving(true);
    try {
      const res = await adminApi.updateProfileField(selectedProfile.id, 'date_of_birth', dobInput);
      const updatedDob = res.data?.date_of_birth || dobInput;
      const updatedAge = res.data?.age;
      setSelectedProfile(prev => ({
        ...prev,
        date_of_birth: updatedDob,
        age: updatedAge !== undefined ? updatedAge : prev.age,
      }));
      setEditingDob(false);
      setMessage({ type: 'success', text: `Date of birth successfully updated to ${updatedDob}.` });
      fetchProfiles(pagination.current_page);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.errors?.value?.[0] || 'Failed to update date of birth.');
    } finally {
      setDobSaving(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by profile code, city, user name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-navy-800/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-magenta-500"
            />
          </div>
          <Button type="submit" size="sm" variant="primary">Search</Button>
        </form>

        <div className="flex items-center gap-3">
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-3 py-2 bg-navy-800/90 border border-slate-700/80 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-magenta-500"
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-navy-800/90 border border-slate-700/80 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-magenta-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={aboutFilter}
            onChange={(e) => setAboutFilter(e.target.value)}
            className="px-3 py-2 bg-navy-800/90 border border-slate-700/80 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-magenta-500"
          >
            <option value="">All Bios</option>
            <option value="pending">⏳ Bio Pending Review</option>
            <option value="approved">✓ Bio Approved</option>
            <option value="no_bio">No Bio</option>
          </select>

          <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => fetchProfiles(pagination.current_page)} isLoading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          message.type === 'success' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profiles Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-navy-800/60 shadow-sm">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-navy-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10">
            <tr>
              <th className="px-5 py-3.5">Code & Gender</th>
              <th className="px-5 py-3.5">User Account</th>
              <th className="px-5 py-3.5">City</th>
              <th className="px-5 py-3.5">Profession</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Bio Review</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {profiles.length > 0 ? (
              profiles.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-bold text-white block">{p.profile_code}</span>
                    <span className="text-xs text-slate-400 capitalize">{p.gender} • {p.marital_status || 'Single'}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-white font-medium">{p.user?.name || 'Unknown'}</div>
                    <div className="text-xs text-slate-400 font-mono">{p.user?.email}</div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-300 capitalize">{p.city || 'N/A'}</td>
                  <td className="px-5 py-3.5 text-slate-300">{p.profession || 'N/A'}</td>
                  <td className="px-5 py-3.5">
                    <select
                      value={p.profile_status}
                      disabled={actionLoadingId === p.id}
                      onChange={(e) => handleStatusChange(p.id, e.target.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        p.profile_status === 'active' 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                          : p.profile_status === 'suspended'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-slate-700/50 text-slate-300 border-slate-600'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    {p.about ? (
                      p.about_approved_at ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          Approved
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleInspect(p.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-colors cursor-pointer"
                          title="Click to inspect and review candidate bio"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          Needs Review
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-slate-500 italic">No Bio</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setCommCandidate({
                          ...p,
                          name: p.user?.name || 'Candidate',
                          code: p.profile_code,
                          type: 'registered',
                        })}
                        title="Send WhatsApp or Email Message"
                        className="p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-500/20 transition cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCardCandidate(p)}
                        title="Generate 1080x1080 Social Media Card"
                        className="p-1.5 rounded-lg text-magenta-400 hover:text-white hover:bg-magenta-500/20 transition cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleInspect(p.id)}
                        disabled={inspectingId === p.id}
                        title="View Full Profile Details"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-700 transition disabled:opacity-50"
                      >
                        {inspectingId === p.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-magenta-400" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleDeleteProfile(p.id)}
                          title="Permanently Delete Profile"
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-5 py-8 text-center text-slate-500 text-sm">
                  {loading ? 'Loading profiles...' : 'No candidate profiles found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Showing page {pagination.current_page} of {pagination.last_page}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={pagination.current_page <= 1}
              onClick={() => fetchProfiles(pagination.current_page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pagination.current_page >= pagination.last_page}
              onClick={() => fetchProfiles(pagination.current_page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Inspect Profile Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 pt-20 sm:pt-24 pb-8 overflow-y-auto">
          <div className="bg-navy-900 border border-white/15 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedProfile.profile_code}</h3>
                <p className="text-xs text-slate-400">Created by {selectedProfile.user?.name} ({selectedProfile.user?.email})</p>
              </div>
              <button 
                onClick={() => { setSelectedProfile(null); setEditingDob(false); }}
                className="text-slate-400 hover:text-white text-sm px-2.5 py-1 rounded-lg bg-navy-800"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-navy-800/80 rounded-xl border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 block">Gender & Age</span>
                  {!editingDob ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDob(true);
                        setDobInput(selectedProfile.date_of_birth ? String(selectedProfile.date_of_birth).substring(0, 10) : '');
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold underline"
                    >
                      Edit DOB
                    </button>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedProfile.gender}
                    onChange={async (e) => {
                      const newG = e.target.value;
                      if (window.confirm(`Are you sure you want to administratively change gender to ${newG}?`)) {
                        try {
                          await adminApi.updateProfileGender(selectedProfile.id, newG);
                          setSelectedProfile(prev => ({ ...prev, gender: newG }));
                          setMessage({ type: 'success', text: `Profile gender updated to ${newG}.` });
                          fetchProfiles(pagination.current_page);
                        } catch (err) {
                          alert(err.response?.data?.message || 'Failed to update gender.');
                        }
                      }
                    }}
                    className="bg-navy-900 border border-slate-700 text-white rounded px-2 py-1 text-xs font-semibold capitalize focus:outline-none focus:ring-1 focus:ring-magenta-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <span className="text-slate-300 font-semibold">{selectedProfile.age ? `• ${selectedProfile.age} yrs` : ''}</span>
                </div>
                {editingDob ? (
                  <div className="pt-1.5 border-t border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 block">Date of Birth (18–80 yrs):</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        value={dobInput}
                        onChange={(e) => setDobInput(e.target.value)}
                        className="bg-navy-900 border border-slate-700 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500 w-full"
                      />
                      <button
                        type="button"
                        disabled={dobSaving}
                        onClick={handleSaveDob}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition disabled:opacity-50 shrink-0"
                      >
                        {dobSaving ? '...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        disabled={dobSaving}
                        onClick={() => setEditingDob(false)}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs transition shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 font-mono">
                    DOB: <span className="text-slate-300">{selectedProfile.date_of_birth ? String(selectedProfile.date_of_birth).substring(0, 10) : 'N/A'}</span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-navy-800/80 rounded-xl border border-white/5">
                <span className="text-slate-400 block mb-1">City</span>
                <span className="font-semibold text-white capitalize">{selectedProfile.city || 'N/A'}</span>
              </div>
              <div className="p-3 bg-navy-800/80 rounded-xl border border-white/5">
                <span className="text-slate-400 block mb-1">Religion & Sect</span>
                <span className="font-semibold text-white capitalize">{selectedProfile.religion || 'Islam'} • {selectedProfile.sect || 'N/A'}</span>
              </div>
              <div className="p-3 bg-navy-800/80 rounded-xl border border-white/5">
                <span className="text-slate-400 block mb-1">Education</span>
                <span className="font-semibold text-white">{selectedProfile.education || 'N/A'}</span>
              </div>
              <div className="p-3 bg-navy-800/80 rounded-xl border border-white/5">
                <span className="text-slate-400 block mb-1">Profession</span>
                <span className="font-semibold text-white">{selectedProfile.profession || 'N/A'}</span>
              </div>
              <div className="p-3 bg-navy-800/80 rounded-xl border border-white/5">
                <span className="text-slate-400 block mb-1">Status</span>
                <span className="font-semibold text-emerald-400 capitalize">{selectedProfile.profile_status}</span>
              </div>
            </div>

            {selectedProfile.about && (
              <div className="p-4 bg-navy-800/50 rounded-xl border border-white/5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 uppercase tracking-wider">About (Candidate Statement)</span>
                  <div className="flex items-center gap-2">
                    {selectedProfile.about_approved_at ? (
                      <span className="text-emerald-400 text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        Approved ✓
                      </span>
                    ) : (
                      <span className="text-amber-400 text-[11px] font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        Pending Review
                      </span>
                    )}
                    <button
                      onClick={async () => {
                        const newApproved = !selectedProfile.about_approved_at;
                        try {
                          await adminApi.updateAboutApproval(selectedProfile.id, newApproved);
                          setSelectedProfile(prev => ({
                            ...prev,
                            about_approved_at: newApproved ? new Date().toISOString() : null,
                          }));
                          setMessage({ type: 'success', text: newApproved ? 'Candidate bio approved!' : 'Bio approval revoked.' });
                          fetchProfiles(pagination.current_page);
                        } catch (err) {
                          alert(err.response?.data?.message || 'Failed to update bio approval.');
                        }
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                        selectedProfile.about_approved_at 
                          ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30' 
                          : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
                      }`}
                    >
                      {selectedProfile.about_approved_at ? 'Revoke Approval' : 'Approve Bio'}
                    </button>
                  </div>
                </div>
                <p className="text-slate-200 leading-relaxed whitespace-pre-line">{selectedProfile.about}</p>
              </div>
            )}

            {selectedProfile.family_background && (
              <div className="p-4 bg-navy-800/50 rounded-xl border border-white/5 space-y-1 text-xs">
                <span className="font-bold text-slate-300 block uppercase tracking-wider">Family Background</span>
                <p className="text-slate-200 leading-relaxed">{selectedProfile.family_background}</p>
              </div>
            )}

            {selectedProfile.preferences && (
              <div className="p-4 bg-navy-800/50 rounded-xl border border-white/5 space-y-2 text-xs">
                <span className="font-bold text-purple-400 block uppercase tracking-wider">Partner Preferences</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-300">
                  <div>Age Range: <strong className="text-white">{selectedProfile.preferences.min_age || 'Any'} - {selectedProfile.preferences.max_age || 'Any'} yrs</strong></div>
                  <div>Preferred Cities: <strong className="text-white capitalize">{Array.isArray(selectedProfile.preferences.preferred_cities) && selectedProfile.preferences.preferred_cities.length > 0 ? selectedProfile.preferences.preferred_cities.join(', ') : 'Any'}</strong></div>
                  <div>Preferred Religion: <strong className="text-white capitalize">{selectedProfile.preferences.preferred_religion || 'Any'}</strong></div>
                  <div>Preferred Marital: <strong className="text-white capitalize">{Array.isArray(selectedProfile.preferences.preferred_marital_status) && selectedProfile.preferences.preferred_marital_status.length > 0 ? selectedProfile.preferences.preferred_marital_status.map(s => String(s).replace('_', ' ')).join(', ') : (selectedProfile.preferences.preferred_marital_status || 'Any')}</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Social Card Generator Modal */}
      {cardCandidate && (
        <AdminSocialCardModal
          candidate={cardCandidate}
          onClose={() => setCardCandidate(null)}
        />
      )}

      {/* Direct Communication Modal (WhatsApp & Email) */}
      {commCandidate && (
        <AdminCommunicationModal
          candidate={commCandidate}
          onClose={() => setCommCandidate(null)}
        />
      )}
    </div>
  );
}
