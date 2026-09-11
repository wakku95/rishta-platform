import React, { useEffect, useState } from 'react';
import { Search, Eye, Trash2, ShieldAlert, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { adminApi } from '../../api/admin';
import Button from '../../components/ui/Button';

export default function AdminProfilesTab() {
  const [profiles, setProfiles] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchProfiles = async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminApi.getProfiles({
        page,
        search: search || undefined,
        gender: genderFilter || undefined,
        status: statusFilter || undefined,
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
  }, [genderFilter, statusFilter]);

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
    try {
      const data = await adminApi.getProfile(id);
      setSelectedProfile(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load profile details.' });
    } finally {
      setInspectingId(null);
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
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
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
                      <button
                        onClick={() => handleDeleteProfile(p.id)}
                        title="Permanently Delete Profile"
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-white/15 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedProfile.profile_code}</h3>
                <p className="text-xs text-slate-400">Created by {selectedProfile.user?.name} ({selectedProfile.user?.email})</p>
              </div>
              <button 
                onClick={() => setSelectedProfile(null)}
                className="text-slate-400 hover:text-white text-sm px-2.5 py-1 rounded-lg bg-navy-800"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-navy-800/80 rounded-xl border border-white/5">
                <span className="text-slate-400 block mb-1">Gender & Age</span>
                <span className="font-semibold text-white capitalize">{selectedProfile.gender}</span>
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
              <div className="p-4 bg-navy-800/50 rounded-xl border border-white/5 space-y-1 text-xs">
                <span className="font-bold text-slate-300 block uppercase tracking-wider">About</span>
                <p className="text-slate-200 leading-relaxed">{selectedProfile.about}</p>
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
                  <div>Preferred City: <strong className="text-white capitalize">{selectedProfile.preferences.preferred_city || 'Any'}</strong></div>
                  <div>Preferred Religion: <strong className="text-white capitalize">{selectedProfile.preferences.preferred_religion || 'Any'}</strong></div>
                  <div>Preferred Marital: <strong className="text-white capitalize">{selectedProfile.preferences.preferred_marital_status || 'Any'}</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
