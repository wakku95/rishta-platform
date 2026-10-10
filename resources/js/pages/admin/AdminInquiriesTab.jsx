import React, { useState, useEffect } from 'react';
import { 
  Search, MessageSquare, Phone, ExternalLink, Trash2, 
  Save, RefreshCw, CheckCircle, Clock, User, HelpCircle, FileText
} from 'lucide-react';
import { adminApi } from '../../api/admin';

export default function AdminInquiriesTab() {
  const [inquiries, setInquiries] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState(null);

  // Notes editing state
  const [notesState, setNotesState] = useState({});

  const fetchInquiries = async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminApi.getInquiries({
        page,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setInquiries(data.data || []);
      setPagination({
        current_page: data.current_page || 1,
        last_page: data.last_page || 1,
        total: data.total || 0,
      });

      // Initialize notes state
      const initialNotes = {};
      (data.data || []).forEach(inq => {
        initialNotes[inq.id] = inq.admin_notes || '';
      });
      setNotesState(initialNotes);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to fetch candidate inquiries.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInquiries(1);
  };

  const handleStatusChange = async (inquiryId, newStatus) => {
    setActionLoadingId(inquiryId);
    setMessage(null);
    try {
      await adminApi.updateInquiryStatus(inquiryId, newStatus);
      setInquiries(prev => prev.map(inq => inq.id === inquiryId ? { ...inq, status: newStatus } : inq));
      setMessage({ type: 'success', text: `Inquiry status updated to [${newStatus}].` });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update status.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveNotes = async (inquiryId) => {
    setActionLoadingId(inquiryId);
    setMessage(null);
    try {
      const currentNotes = notesState[inquiryId] || '';
      await adminApi.updateInquiryNotes(inquiryId, currentNotes);
      setInquiries(prev => prev.map(inq => inq.id === inquiryId ? { ...inq, admin_notes: currentNotes } : inq));
      setMessage({ type: 'success', text: 'Agent notes saved successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save notes.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (inquiryId) => {
    if (!window.confirm('Are you sure you want to delete this candidate inquiry?')) return;
    setActionLoadingId(inquiryId);
    setMessage(null);
    try {
      await adminApi.deleteInquiry(inquiryId);
      setMessage({ type: 'success', text: 'Inquiry deleted successfully.' });
      fetchInquiries(pagination.current_page);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete inquiry.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">New Inquiry</span>;
      case 'contacted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">Contacted</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">In Progress</span>;
      case 'settled':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Settled / Fees Paid</span>;
      case 'rejected':
      case 'closed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-700 text-slate-300 border border-slate-600">Closed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 capitalize">{status}</span>;
    }
  };

  const formatWhatsAppLink = (contact) => {
    if (!contact) return '#';
    const clean = contact.replace(/[^0-9]/g, '');
    return `https://wa.me/${clean}`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            Candidate Direct Inquiries (ایجنٹ انکوائریز)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Direct requests from users wanting matchmaker mediation, family questions, and WhatsApp coordination.
          </p>
        </div>
        <button
          onClick={() => fetchInquiries(pagination.current_page)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-navy-800 border border-white/10 text-slate-300 hover:text-white transition w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Alert Notification */}
      {message && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
          message.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="p-4 bg-navy-850 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candidate code, submitter name, phone, or email..."
            className="w-full bg-navy-900 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-navy-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">All Statuses</option>
            <option value="new">New Inquiries</option>
            <option value="contacted">Contacted</option>
            <option value="in_progress">In Progress</option>
            <option value="settled">Settled / Fees Paid</option>
            <option value="closed">Closed / Rejected</option>
          </select>
        </div>
      </div>

      {/* Inquiries List */}
      {loading && inquiries.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
          Loading candidate inquiries...
        </div>
      ) : inquiries.length === 0 ? (
        <div className="p-12 text-center bg-navy-850 rounded-2xl border border-white/10 text-slate-400 text-xs">
          No inquiries found matching your filters.
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className="p-5 bg-navy-850 rounded-2xl border border-white/10 space-y-4 hover:border-white/20 transition shadow-sm"
            >
              {/* Top Row: Meta info & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/5">
                <div className="flex flex-wrap items-center gap-2.5">
                  {getStatusBadge(inq.status)}
                  <span className="text-xs text-slate-400 font-mono">
                    Received: {inq.created_at ? new Date(inq.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                    Target: #{inq.profile_code}
                  </span>
                  {inq.candidate_city && (
                    <span className="text-xs text-slate-400 capitalize">
                      ({inq.candidate_gender}, {inq.candidate_age} yrs, {inq.candidate_city})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/profiles/${inq.profile_code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg transition"
                  >
                    <ExternalLink className="w-3 h-3" /> View Candidate
                  </a>
                  <button
                    onClick={() => handleDelete(inq.id)}
                    disabled={actionLoadingId === inq.id}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                    title="Delete Inquiry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Submitter & WhatsApp Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Left: Contact Info */}
                <div className="p-3.5 bg-navy-900 rounded-xl border border-white/5 space-y-2">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-magenta-400" />
                      {inq.submitter_name}
                    </span>
                    {inq.user_id && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        Registered User #{inq.user_id}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="font-mono text-emerald-300 font-bold text-sm">
                      {inq.submitter_contact}
                    </span>
                    <a
                      href={formatWhatsAppLink(inq.submitter_contact)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Chat on WhatsApp
                    </a>
                  </div>

                  {inq.submitter_email && (
                    <div className="text-slate-400 text-[11px]">
                      Email: {inq.submitter_email}
                    </div>
                  )}
                </div>

                {/* Right: Status Change */}
                <div className="p-3.5 bg-navy-900 rounded-xl border border-white/5 flex flex-col justify-between gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Update Matchmaker Progress / اسٹیٹس تبدیل کریں:
                    </label>
                    <select
                      value={inq.status}
                      disabled={actionLoadingId === inq.id}
                      onChange={(e) => handleStatusChange(inq.id, e.target.value)}
                      className="w-full bg-navy-950 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-amber-500"
                    >
                      <option value="new">New (نئی انکوائری)</option>
                      <option value="contacted">Contacted (رابطہ کرلیا)</option>
                      <option value="in_progress">In Progress (بات چیت جاری)</option>
                      <option value="settled">Settled / Fees Received (کامیاب - فیس موصول)</option>
                      <option value="rejected">Rejected / Closed (ختم شدہ)</option>
                    </select>
                  </div>

                  {inq.reviewed_at && (
                    <div className="text-[10px] text-slate-500">
                      Last reviewed: {new Date(inq.reviewed_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Inquirer Details & Questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {inq.family_details && (
                  <div className="p-3 bg-navy-900/60 rounded-xl border border-white/5 space-y-1">
                    <span className="font-semibold text-slate-400 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      About Submitter & Family (خاندان کا تعارف):
                    </span>
                    <p className="text-slate-200 leading-relaxed whitespace-pre-line pl-4">
                      {inq.family_details}
                    </p>
                  </div>
                )}

                {inq.questions && (
                  <div className="p-3 bg-navy-900/60 rounded-xl border border-white/5 space-y-1">
                    <span className="font-semibold text-slate-400 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                      Questions for Candidate (امیدوار سے سوالات):
                    </span>
                    <p className="text-slate-200 leading-relaxed whitespace-pre-line pl-4">
                      {inq.questions}
                    </p>
                  </div>
                )}
              </div>

              {/* Admin / Agent Internal Notes */}
              <div className="pt-2 border-t border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">
                    Agent Coordination Notes & Fee Record (اندرونی نوٹس اور فیس کی تفصیل):
                  </span>
                  <button
                    onClick={() => handleSaveNotes(inq.id)}
                    disabled={actionLoadingId === inq.id}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition"
                  >
                    <Save className="w-3 h-3" />
                    Save Notes
                  </button>
                </div>
                <textarea
                  rows="2"
                  value={notesState[inq.id] || ''}
                  onChange={(e) => setNotesState(prev => ({ ...prev, [inq.id]: e.target.value }))}
                  placeholder="Record call discussion, fee amount agreed, mutual feedback..."
                  className="w-full bg-navy-950 border border-slate-700/80 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {pagination.last_page > 1 && (
            <div className="flex items-center justify-between p-4 bg-navy-850 rounded-xl border border-white/10 text-xs">
              <span className="text-slate-400">
                Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total inquiries)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.current_page <= 1}
                  onClick={() => fetchInquiries(pagination.current_page - 1)}
                  className="px-3 py-1.5 rounded-lg bg-navy-900 border border-white/10 text-white disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.current_page >= pagination.last_page}
                  onClick={() => fetchInquiries(pagination.current_page + 1)}
                  className="px-3 py-1.5 rounded-lg bg-navy-900 border border-white/10 text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
