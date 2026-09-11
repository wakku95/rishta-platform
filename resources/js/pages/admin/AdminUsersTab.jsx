import React, { useEffect, useState } from 'react';
import { 
  Search, Shield, ShieldAlert, UserX, UserCheck, 
  Trash2, AlertTriangle, RefreshCw, Eye
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import Button from '../../components/ui/Button';

export default function AdminUsersTab() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers({
        page,
        search: search || undefined,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
      });
      setUsers(data.data || []);
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
    fetchUsers(1);
  }, [statusFilter, roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleToggleSuspend = async (user) => {
    setActionLoadingId(user.id);
    setMessage(null);
    try {
      if (user.status === 'suspended') {
        const res = await adminApi.activateUser(user.id);
        setMessage({ type: 'success', text: res.message });
      } else {
        const res = await adminApi.suspendUser(user.id);
        setMessage({ type: 'success', text: res.message });
      }
      fetchUsers(pagination.current_page);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Action failed.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setActionLoadingId(user.id);
    setMessage(null);
    try {
      const res = await adminApi.updateUserRole(user.id, newRole);
      setMessage({ type: 'success', text: res.message });
      fetchUsers(pagination.current_page);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Role update failed.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    setActionLoadingId(confirmDeleteUser.id);
    setMessage(null);
    try {
      const res = await adminApi.deleteUser(confirmDeleteUser.id);
      setMessage({ type: 'success', text: res.message });
      setConfirmDeleteUser(null);
      fetchUsers(pagination.current_page);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Delete failed.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleViewDetail = async (id) => {
    setDetailLoading(true);
    try {
      const data = await adminApi.getUser(id);
      setSelectedUserDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-navy-800/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-magenta-500"
            />
          </div>
          <Button type="submit" size="sm" variant="primary">Search</Button>
        </form>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-navy-800/90 border border-slate-700/80 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-magenta-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-navy-800/90 border border-slate-700/80 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-magenta-500"
          >
            <option value="">All Roles</option>
            <option value="user">Standard Users</option>
            <option value="admin">Administrators</option>
          </select>

          <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => fetchUsers(pagination.current_page)} isLoading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Notification Toast */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between ${
          message.type === 'success' 
            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs underline hover:opacity-80">Dismiss</button>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-navy-800/60 shadow-sm">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-navy-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10">
            <tr>
              <th className="px-5 py-3.5">User</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Profile</th>
              <th className="px-5 py-3.5">Joined</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.length > 0 ? (
              users.map((u) => {
                const isWorking = actionLoadingId === u.id;
                return (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{u.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                        u.role === 'admin' 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                          : 'bg-slate-700/50 text-slate-300'
                      }`}>
                        {u.role === 'admin' && <Shield className="w-3 h-3 text-amber-400" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                        u.status === 'active' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {u.status === 'active' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {u.profile ? (
                        <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
                          {u.profile.profile_code} ({u.profile.gender})
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 italic">No Profile</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View User Detail */}
                        <button
                          onClick={() => handleViewDetail(u.id)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-700 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Suspend / Activate Toggle */}
                        <button
                          onClick={() => handleToggleSuspend(u)}
                          disabled={isWorking}
                          title={u.status === 'suspended' ? 'Activate User' : 'Suspend User'}
                          className={`p-1.5 rounded-lg transition ${
                            u.status === 'suspended' 
                              ? 'text-emerald-400 hover:bg-emerald-500/20' 
                              : 'text-amber-400 hover:bg-amber-500/20'
                          }`}
                        >
                          {u.status === 'suspended' ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                        </button>

                        {/* Toggle Role */}
                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={isWorking}
                          title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                          className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-500/20 transition"
                        >
                          <Shield className="w-4 h-4" />
                        </button>

                        {/* Delete User Modal trigger */}
                        <button
                          onClick={() => setConfirmDeleteUser(u)}
                          disabled={isWorking}
                          title="Permanently Delete Account"
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-5 py-8 text-center text-slate-500 text-sm">
                  {loading ? 'Loading users...' : 'No users match the search criteria.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Showing page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={pagination.current_page <= 1}
              onClick={() => fetchUsers(pagination.current_page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pagination.current_page >= pagination.last_page}
              onClick={() => fetchUsers(pagination.current_page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete User Account</h3>
            </div>
            <p className="text-sm text-slate-300">
              Are you sure you want to permanently delete <strong className="text-white">[{confirmDeleteUser.name}]</strong> ({confirmDeleteUser.email})?
            </p>
            <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              This will permanently delete their profile, sent/received requests, and shortlists. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteUser(null)}>
                Cancel
              </Button>
              <Button size="sm" variant="danger" onClick={handleDeleteUser} isLoading={actionLoadingId === confirmDeleteUser.id}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-white/15 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedUserDetail.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedUserDetail.email}</p>
              </div>
              <button 
                onClick={() => setSelectedUserDetail(null)}
                className="text-slate-400 hover:text-white text-sm px-2.5 py-1 rounded-lg bg-navy-800"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-navy-800/80 rounded-xl border border-white/5">
                <span className="text-slate-400 block mb-1">Status & Role</span>
                <span className="font-semibold text-white capitalize">{selectedUserDetail.status} • {selectedUserDetail.role}</span>
              </div>
              <div className="p-3 bg-navy-800/80 rounded-xl border border-white/5">
                <span className="text-slate-400 block mb-1">Email Verified</span>
                <span className="font-semibold text-white">
                  {selectedUserDetail.email_verified_at ? 'Yes (Verified)' : 'No (Unverified)'}
                </span>
              </div>
            </div>

            {selectedUserDetail.profile ? (
              <div className="p-4 bg-navy-800/60 rounded-xl border border-white/5 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">Associated Candidate Profile</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-300">
                  <div>Code: <strong className="text-white font-mono">{selectedUserDetail.profile.profile_code}</strong></div>
                  <div>Gender: <strong className="text-white capitalize">{selectedUserDetail.profile.gender}</strong></div>
                  <div>City: <strong className="text-white capitalize">{selectedUserDetail.profile.city || 'N/A'}</strong></div>
                  <div>Profession: <strong className="text-white">{selectedUserDetail.profile.profession || 'N/A'}</strong></div>
                  <div>Status: <strong className="text-emerald-400 capitalize">{selectedUserDetail.profile.profile_status}</strong></div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-3 bg-navy-800/40 rounded-xl">No candidate profile created yet.</div>
            )}

            <div className="text-xs space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-slate-400">Activity Summary</h4>
              <div className="flex gap-4">
                <span className="text-slate-300">Sent Requests: <strong className="text-white">{selectedUserDetail.sent_requests?.length || 0}</strong></span>
                <span className="text-slate-300">Received Requests: <strong className="text-white">{selectedUserDetail.received_requests?.length || 0}</strong></span>
                <span className="text-slate-300">Payments: <strong className="text-white">{selectedUserDetail.payments?.length || 0}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
