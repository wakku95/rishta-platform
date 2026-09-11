import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, XCircle, ArrowRight } from 'lucide-react';
import { adminApi } from '../../api/admin';
import Button from '../../components/ui/Button';

export default function AdminRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchRequests = async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminApi.getRequests({
        page,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setRequests(data.data || []);
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
    fetchRequests(1);
  }, [statusFilter]);

  const handleCancelRequest = async (id) => {
    if (!window.confirm('Are you sure you want to administratively cancel this rishta request?')) return;
    setActionLoadingId(id);
    setMessage(null);
    try {
      const res = await adminApi.cancelRequest(id);
      setMessage({ type: 'success', text: res.message });
      fetchRequests(pagination.current_page);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Cancellation failed.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      accepted: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      declined: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      cancelled: 'bg-slate-700/50 text-slate-400 border-slate-600',
      expired: 'bg-slate-800 text-slate-500 border-slate-700',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase border ${map[status] || map.pending}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <form onSubmit={(e) => { e.preventDefault(); fetchRequests(1); }} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by request code or user name..."
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
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>

          <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => fetchRequests(pagination.current_page)} isLoading={loading}>
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

      {/* Requests Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-navy-800/60 shadow-sm">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-navy-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10">
            <tr>
              <th className="px-5 py-3.5">Code</th>
              <th className="px-5 py-3.5">Sender</th>
              <th className="px-5 py-3.5">Receiver</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Created Date</th>
              <th className="px-5 py-3.5 text-right">Intervention</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {requests.length > 0 ? (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 font-mono font-bold text-white">{r.request_code}</td>
                  <td className="px-5 py-3.5">
                    <div className="text-white font-medium">{r.sender?.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{r.sender?.email}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-white font-medium">{r.receiver?.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{r.receiver?.email}</div>
                  </td>
                  <td className="px-5 py-3.5">{getStatusBadge(r.status)}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {r.status === 'pending' || r.status === 'accepted' ? (
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={actionLoadingId === r.id}
                        onClick={() => handleCancelRequest(r.id)}
                        icon={XCircle}
                      >
                        Cancel
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-500 italic">None</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-5 py-8 text-center text-slate-500 text-sm">
                  {loading ? 'Loading requests...' : 'No rishta requests found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination.last_page > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Showing page {pagination.current_page} of {pagination.last_page}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={pagination.current_page <= 1}
              onClick={() => fetchRequests(pagination.current_page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pagination.current_page >= pagination.last_page}
              onClick={() => fetchRequests(pagination.current_page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
