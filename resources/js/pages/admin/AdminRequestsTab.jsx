import React, { useEffect, useState } from 'react';
import { 
  Search, RefreshCw, XCircle, CheckCircle, Eye, MessageSquare, 
  Phone, ArrowRight, ShieldCheck, AlertCircle, HelpCircle, User, Sparkles,
  Camera, Copy, Check
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import AdminPhotoWatermarkModal from '../../components/admin/AdminPhotoWatermarkModal';

export default function AdminRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('');
  const [photoStatusFilter, setPhotoStatusFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [counts, setCounts] = useState({
    all: 0,
    pending_proposals: 0,
    pending_photos: 0,
    needs_revision: 0,
    all_pending: 0,
  });
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState(null);

  // Modals
  const [viewProposal, setViewProposal] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({ isOpen: false, requestId: null, reason: '' });
  const [revisionDialog, setRevisionDialog] = useState({ isOpen: false, requestId: null, requestCode: '', notes: '' });
  const [watermarkStudioOpen, setWatermarkStudioOpen] = useState(false);
  const [photoAuditDialog, setPhotoAuditDialog] = useState({
    isOpen: false,
    request: null,
    blobUrl: null,
    loading: false,
    rejectReason: '',
    showRejectForm: false,
    copiedWhatsApp: false,
    watermarkLevel: 'medium',
  });

  const fetchRequests = async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminApi.getRequests({
        page,
        search: search || undefined,
        status: statusFilter || undefined,
        admin_status: adminStatusFilter || undefined,
        photo_status: photoStatusFilter || undefined,
        quick_filter: quickFilter !== 'all' ? quickFilter : undefined,
      });
      setRequests(data.data || []);
      setPagination({
        current_page: data.current_page || 1,
        last_page: data.last_page || 1,
        total: data.total || 0,
      });
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to fetch rishta requests.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(1);
  }, [statusFilter, adminStatusFilter, photoStatusFilter, quickFilter]);

  const handleApprove = async (id, requestCode) => {
    setActionLoadingId(id);
    setMessage(null);
    try {
      await adminApi.approveProposal(id);
      setMessage({ 
        type: 'success', 
        text: `Proposal [${requestCode}] approved and delivered to candidate successfully.` 
      });
      fetchRequests(pagination.current_page);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to approve proposal.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectDialog.requestId) return;

    setActionLoadingId(rejectDialog.requestId);
    setMessage(null);
    try {
      await adminApi.rejectProposal(rejectDialog.requestId, rejectDialog.reason);
      setMessage({ 
        type: 'info', 
        text: `Proposal rejected with notification.` 
      });
      setRejectDialog({ isOpen: false, requestId: null, reason: '' });
      fetchRequests(pagination.current_page);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reject proposal.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmRevision = async (e) => {
    e.preventDefault();
    if (!revisionDialog.requestId) return;

    setActionLoadingId(revisionDialog.requestId);
    setMessage(null);
    try {
      await adminApi.requestRevision(revisionDialog.requestId, revisionDialog.notes);
      setMessage({ 
        type: 'success', 
        text: `Correction request sent for proposal [${revisionDialog.requestCode}]. User can now revise answers without proposal rejection.` 
      });
      setRevisionDialog({ isOpen: false, requestId: null, requestCode: '', notes: '' });
      fetchRequests(pagination.current_page);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to request revision.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelRequest = async (id, requestCode) => {
    if (!window.confirm(`Are you sure you want to administratively cancel proposal [${requestCode}]?`)) return;
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

  const handleClosePhotoAudit = () => {
    if (photoAuditDialog.blobUrl) {
      try { URL.revokeObjectURL(photoAuditDialog.blobUrl); } catch (_) {}
    }
    setPhotoAuditDialog({
      isOpen: false,
      request: null,
      blobUrl: null,
      loading: false,
      rejectReason: '',
      showRejectForm: false,
      copiedWhatsApp: false,
      watermarkText: '',
    });
  };

  const handleOpenPhotoAudit = async (req, targetSide = null) => {
    if (photoAuditDialog.blobUrl) {
      try { URL.revokeObjectURL(photoAuditDialog.blobUrl); } catch (_) {}
    }

    const side = targetSide || (
      req.receiver_photo_moderation_status === 'pending_review'
        ? 'receiver'
        : (req.sender_photo_moderation_status === 'pending_review' ? 'sender' : (req.receiver_photo_path ? 'receiver' : 'sender'))
    );

    const initialLevel = (side === 'sender' ? req.sender_photo_watermark_level : req.receiver_photo_watermark_level)
      || req.photo_watermark_level
      || 'medium';

    const recipientName = side === 'sender' ? (req.receiver?.name || 'Receiver') : (req.sender?.name || 'Sender');
    const initialText = (side === 'sender' ? req.sender_photo_watermark_text : req.receiver_photo_watermark_text)
      || req.photo_watermark_text
      || `RaabtaNow • For: ${recipientName} • Confidential`;

    setPhotoAuditDialog({
      isOpen: true,
      request: req,
      side: side,
      blobUrl: null,
      loading: true,
      rejectReason: '',
      showRejectForm: false,
      copiedWhatsApp: false,
      watermarkLevel: initialLevel,
      watermarkText: initialText,
    });

    try {
      const res = await adminApi.getCandidatePhotoBlob(req.id, side);
      let blob = res;
      if (!(blob instanceof Blob)) {
        if (blob?.data instanceof Blob) {
          blob = blob.data;
        } else if (blob?.data) {
          blob = new Blob([blob.data], { type: blob?.headers?.['content-type'] || 'image/jpeg' });
        } else if (blob) {
          blob = new Blob([blob], { type: 'image/jpeg' });
        }
      }
      if (!blob || blob.size === 0) {
        throw new Error('Empty blob returned');
      }
      const url = URL.createObjectURL(blob);
      setPhotoAuditDialog(prev => ({ ...prev, blobUrl: url, loading: false }));
    } catch (err) {
      console.error('Failed to load candidate photo:', err);
      setMessage({ type: 'error', text: 'No photo file available or failed to load.' });
      setPhotoAuditDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleApprovePhoto = async (reqId) => {
    setActionLoadingId(reqId);
    try {
      const level = photoAuditDialog.watermarkLevel || 'medium';
      const text = photoAuditDialog.watermarkText?.trim() || null;
      await adminApi.approvePhoto(reqId, level, photoAuditDialog.side, text);
      setMessage({ type: 'success', text: `Photo (${photoAuditDialog.side || 'candidate'}) approved with [${level.toUpperCase()}] watermark intensity and custom text!` });
      handleClosePhotoAudit();
      fetchRequests(pagination.current_page);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to approve photo.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectPhoto = async (e) => {
    e.preventDefault();
    const reqId = photoAuditDialog.request?.id;
    if (!reqId || !photoAuditDialog.rejectReason.trim()) return;

    setActionLoadingId(reqId);
    try {
      await adminApi.rejectPhoto(reqId, photoAuditDialog.rejectReason.trim(), photoAuditDialog.side);
      setMessage({ type: 'info', text: `Photo (${photoAuditDialog.side || 'candidate'}) rejected with feedback. Candidate has been prompted to upload a clearer photo.` });
      handleClosePhotoAudit();
      fetchRequests(pagination.current_page);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reject photo.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyWhatsApp = (r) => {
    const text = `Assalam-o-Alaikum! Regarding your matrimonial proposal [${r.request_code}], a verified candidate photo is available. You can view it securely inside your RaabtaNow dashboard.`;
    navigator.clipboard.writeText(text);
    setPhotoAuditDialog(prev => ({ ...prev, copiedWhatsApp: true }));
    setTimeout(() => {
      setPhotoAuditDialog(prev => ({ ...prev, copiedWhatsApp: false }));
    }, 3000);
  };

  const getAdminStatusBadge = (adminStatus, item) => {
    switch (adminStatus) {
      case 'pending_review': {
        let label = 'Proposal Review';
        if (item?.sender_answers) {
          label = 'Sender Answers Review';
        } else if (item?.receiver_answers || item?.receiver_questions) {
          label = 'Receiver Response Review';
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            ⚡ {label}
          </span>
        );
      }
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case 'needs_revision':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertCircle className="w-3 h-3 text-amber-400" /> Needs Revision
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-700 text-slate-300">
            {adminStatus || 'Approved'}
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      accepted: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      declined: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      cancelled: 'bg-slate-700/50 text-slate-400 border-slate-600',
      expired: 'bg-slate-800 text-slate-500 border-slate-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${map[status] || map.pending}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Quick Pending Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <button
          type="button"
          onClick={() => { setQuickFilter('all'); setAdminStatusFilter(''); setPhotoStatusFilter(''); }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            quickFilter === 'all' && !adminStatusFilter && !photoStatusFilter
              ? 'bg-magenta-600 text-white shadow-lg shadow-magenta-600/30 ring-1 ring-magenta-400'
              : 'bg-navy-800/80 text-slate-300 hover:bg-navy-700/80 hover:text-white border border-white/5'
          }`}
        >
          <span>All Proposals</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-white/20 text-white">
            {counts.all || pagination.total || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setQuickFilter('pending_proposals'); setAdminStatusFilter(''); setPhotoStatusFilter(''); }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            quickFilter === 'pending_proposals'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-1 ring-amber-400'
              : 'bg-navy-800/80 text-slate-300 hover:bg-navy-700/80 hover:text-white border border-white/5'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className={counts.pending_proposals > 0 ? "animate-pulse" : ""}>⚡</span>
            Pending Proposal Review
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            counts.pending_proposals > 0 ? 'bg-amber-400 text-amber-950 font-black' : 'bg-white/10 text-slate-400'
          }`}>
            {counts.pending_proposals || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setQuickFilter('pending_photos'); setAdminStatusFilter(''); setPhotoStatusFilter(''); }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            quickFilter === 'pending_photos'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 ring-1 ring-cyan-400'
              : 'bg-navy-800/80 text-slate-300 hover:bg-navy-700/80 hover:text-white border border-white/5'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-cyan-300" />
            Pending Photo Audit
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            counts.pending_photos > 0 ? 'bg-cyan-400 text-cyan-950 font-black animate-pulse' : 'bg-white/10 text-slate-400'
          }`}>
            {counts.pending_photos || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setQuickFilter('needs_revision'); setAdminStatusFilter(''); setPhotoStatusFilter(''); }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            quickFilter === 'needs_revision'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 ring-1 ring-orange-400'
              : 'bg-navy-800/80 text-slate-300 hover:bg-navy-700/80 hover:text-white border border-white/5'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-orange-300" />
            Needs Revision
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            counts.needs_revision > 0 ? 'bg-orange-400 text-orange-950 font-black' : 'bg-white/10 text-slate-400'
          }`}>
            {counts.needs_revision || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setQuickFilter('all_pending'); setAdminStatusFilter(''); setPhotoStatusFilter(''); }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ml-auto ${
            quickFilter === 'all_pending'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-1 ring-rose-400'
              : 'bg-navy-800/80 text-rose-300 hover:bg-navy-700/80 hover:text-rose-200 border border-rose-500/30'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span>🚨</span>
            All Actions Needed
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            counts.all_pending > 0 ? 'bg-rose-400 text-rose-950 font-black' : 'bg-white/10 text-slate-400'
          }`}>
            {counts.all_pending || 0}
          </span>
        </button>
      </div>

      {/* Search & Filter Header */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <form onSubmit={(e) => { e.preventDefault(); fetchRequests(1); }} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code, user name, phone, email, or questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-navy-800/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-magenta-500"
            />
          </div>
          <Button type="submit" size="sm" variant="primary">Search</Button>
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Moderation Status Filter */}
          <select
            value={adminStatusFilter}
            onChange={(e) => {
              setAdminStatusFilter(e.target.value);
              setQuickFilter('all');
            }}
            className="px-3 py-2 bg-navy-800/90 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-magenta-500"
          >
            <option value="">All Moderation Status</option>
            <option value="pending_review">⚡ Pending Approval (Action Needed)</option>
            <option value="needs_revision">Needs Revision / Correction</option>
            <option value="approved">Approved Proposals</option>
            <option value="rejected">Rejected Proposals</option>
          </select>

          {/* Photo Moderation Filter */}
          <select
            value={photoStatusFilter}
            onChange={(e) => {
              setPhotoStatusFilter(e.target.value);
              setQuickFilter('all');
            }}
            className="px-3 py-2 bg-navy-800/90 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-magenta-500"
          >
            <option value="">All Photo Statuses</option>
            <option value="pending_review">📸 Photo Pending Audit ({counts.pending_photos || 0})</option>
            <option value="approved">✅ Photo Approved</option>
            <option value="rejected">❌ Photo Rejected</option>
            <option value="none">∅ No Photo Uploaded</option>
          </select>

          {/* Connection Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setQuickFilter('all');
            }}
            className="px-3 py-2 bg-navy-800/90 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-magenta-500"
          >
            <option value="">All Match Statuses</option>
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
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between ${
          message.type === 'success' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* Requests Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-navy-800/60 shadow-sm">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-navy-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10">
            <tr>
              <th className="px-4 py-3.5">Code & Moderation</th>
              <th className="px-4 py-3.5">Sender (Who)</th>
              <th className="px-4 py-3.5">Receiver (Whom)</th>
              <th className="px-4 py-3.5">Proposal Message & Questions</th>
              <th className="px-4 py-3.5">Match State</th>
              <th className="px-4 py-3.5 text-right">Moderation Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {requests.length > 0 ? (
              requests.map((r) => {
                const senderProfile = r.sender?.profile;
                const receiverProfile = r.receiver?.profile;
                const hasInquiryContent = r.sender_intro || r.sender_questions || r.receiver_intro || r.receiver_answers || r.receiver_questions || r.sender_answers;

                return (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Code & Moderation */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-mono font-bold text-white text-xs mb-1.5">{r.request_code}</div>
                      <div>{getAdminStatusBadge(r.admin_status, r)}</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Sender */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="text-white font-semibold text-xs">{r.sender?.name}</div>
                      {senderProfile && (
                        <div className="text-[11px] text-magenta-300 font-mono">
                          #{senderProfile.profile_code} ({senderProfile.gender}, {senderProfile.city})
                        </div>
                      )}
                      {r.sender?.phone ? (
                        <a 
                          href={`https://wa.me/${r.sender.phone.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline mt-0.5 font-mono"
                        >
                          <Phone className="w-3 h-3" /> {r.sender.phone}
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-500 block">No phone</span>
                      )}
                    </td>

                    {/* Receiver */}
                    <td className="px-4 py-3.5 align-top">
                      <div className="text-white font-semibold text-xs">{r.receiver?.name}</div>
                      {receiverProfile && (
                        <div className="text-[11px] text-cyan-300 font-mono">
                          #{receiverProfile.profile_code} ({receiverProfile.gender}, {receiverProfile.city})
                        </div>
                      )}
                      {r.receiver?.phone ? (
                        <a 
                          href={`https://wa.me/${r.receiver.phone.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline mt-0.5 font-mono"
                        >
                          <Phone className="w-3 h-3" /> {r.receiver.phone}
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-500 block">No phone</span>
                      )}
                    </td>

                    {/* Proposal Q&A Preview */}
                    <td className="px-4 py-3.5 align-top max-w-xs">
                      {hasInquiryContent ? (
                        <div className="space-y-1">
                          {r.sender_intro && (
                            <p className="text-xs text-slate-200 line-clamp-1 italic">
                              <strong className="text-slate-400 font-semibold not-italic">Intro:</strong> "{r.sender_intro}"
                            </p>
                          )}
                          {r.sender_questions && (
                            <p className="text-xs text-cyan-300 line-clamp-1 italic">
                              <strong className="text-slate-400 font-semibold not-italic">Q:</strong> "{r.sender_questions}"
                            </p>
                          )}
                          {r.receiver_intro && (
                            <p className="text-xs text-purple-300 line-clamp-1 italic">
                              <strong className="text-slate-400 font-semibold not-italic">Family:</strong> "{r.receiver_intro}"
                            </p>
                          )}
                          {r.receiver_answers && (
                            <p className="text-xs text-emerald-300 line-clamp-1 italic">
                              <strong className="text-slate-400 font-semibold not-italic">Ans:</strong> "{r.receiver_answers}"
                            </p>
                          )}
                          {r.receiver_questions && (
                            <p className="text-xs text-amber-300 line-clamp-1 italic">
                              <strong className="text-slate-400 font-semibold not-italic">Counter-Q:</strong> "{r.receiver_questions}"
                            </p>
                          )}
                          {r.sender_answers && (
                            <p className="text-xs text-teal-300 line-clamp-1 italic">
                              <strong className="text-slate-400 font-semibold not-italic">Sender Ans:</strong> "{r.sender_answers}"
                            </p>
                          )}
                          <button
                            onClick={() => setViewProposal(r)}
                            className="inline-flex items-center gap-1 text-[11px] text-magenta-400 hover:text-magenta-300 font-bold mt-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            View Full Questions & Answers
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Direct proposal (No questions attached)</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 align-top">
                      <div>{getStatusBadge(r.status)}</div>
                      {(r.photo_moderation_status === 'pending_review' || r.sender_photo_moderation_status === 'pending_review' || r.receiver_photo_moderation_status === 'pending_review') ? (
                        <div className="mt-2 flex flex-col gap-1 items-start">
                          {r.sender_photo_moderation_status === 'pending_review' && (
                            <button
                              onClick={() => handleOpenPhotoAudit(r, 'sender')}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 animate-pulse transition shadow-sm"
                            >
                              <Camera className="w-3.5 h-3.5 text-amber-400" />
                              Audit Sender Photo (Pending)
                            </button>
                          )}
                          {r.receiver_photo_moderation_status === 'pending_review' && (
                            <button
                              onClick={() => handleOpenPhotoAudit(r, 'receiver')}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 animate-pulse transition shadow-sm"
                            >
                              <Camera className="w-3.5 h-3.5 text-amber-400" />
                              Audit Receiver Photo (Pending)
                            </button>
                          )}
                          {r.photo_moderation_status === 'pending_review' && !r.sender_photo_moderation_status && !r.receiver_photo_moderation_status && (
                            <button
                              onClick={() => handleOpenPhotoAudit(r)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 animate-pulse transition shadow-sm"
                            >
                              <Camera className="w-3.5 h-3.5 text-amber-400" />
                              Audit Photo (Pending)
                            </button>
                          )}
                        </div>
                      ) : (r.sender_photo_path || r.receiver_photo_path) ? (
                        <div className="mt-2 flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3 text-emerald-400" /> Photo Approved
                          </span>
                          <button
                            onClick={() => handleOpenPhotoAudit(r)}
                            className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                          >
                            <Camera className="w-3 h-3" /> View Photo
                          </button>
                        </div>
                      ) : null}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 align-top text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        {r.admin_status === 'pending_review' ? (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="success"
                              icon={CheckCircle}
                              disabled={actionLoadingId === r.id}
                              onClick={() => handleApprove(r.id, r.request_code)}
                              className="font-bold text-xs"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={AlertCircle}
                              disabled={actionLoadingId === r.id}
                              onClick={() => setRevisionDialog({ isOpen: true, requestId: r.id, requestCode: r.request_code, notes: '' })}
                              className="font-bold text-xs text-amber-300 hover:text-amber-200 border-amber-500/40"
                            >
                              Revise
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              icon={XCircle}
                              disabled={actionLoadingId === r.id}
                              onClick={() => setRejectDialog({ isOpen: true, requestId: r.id, reason: '' })}
                              className="font-bold text-xs"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          (r.status === 'pending' || r.status === 'accepted') && (
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={actionLoadingId === r.id}
                              onClick={() => handleCancelRequest(r.id, r.request_code)}
                              icon={XCircle}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
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
          <span>Showing page {pagination.current_page} of {pagination.last_page} (Total: {pagination.total})</span>
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

      {/* Modal: View Full Proposal Q&A */}
      {viewProposal && (
        <Modal
          isOpen={Boolean(viewProposal)}
          onClose={() => setViewProposal(null)}
          title={`Proposal Details • ${viewProposal.request_code}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 bg-navy-950/80 rounded-xl border border-slate-750 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Sender</span>
                <span className="text-white font-bold block">{viewProposal.sender?.name}</span>
                <span className="text-slate-400 font-mono text-[11px] block">{viewProposal.sender?.email}</span>
                {viewProposal.sender?.phone && (
                  <span className="text-emerald-400 font-mono text-[11px] block">{viewProposal.sender?.phone}</span>
                )}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Receiver</span>
                <span className="text-white font-bold block">{viewProposal.receiver?.name}</span>
                <span className="text-slate-400 font-mono text-[11px] block">{viewProposal.receiver?.email}</span>
                {viewProposal.receiver?.phone && (
                  <span className="text-emerald-400 font-mono text-[11px] block">{viewProposal.receiver?.phone}</span>
                )}
              </div>
            </div>

            {/* Sender Intro */}
            {viewProposal.sender_intro && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-magenta-300 block">
                  Sender's Introduction & Family Details:
                </label>
                <div className="p-3 bg-navy-900 border border-slate-750 rounded-xl text-xs text-slate-200 leading-relaxed italic">
                  "{viewProposal.sender_intro}"
                </div>
              </div>
            )}

            {/* Sender Questions */}
            {viewProposal.sender_questions && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-cyan-300 block">
                  Questions Asked by Sender:
                </label>
                <div className="p-3 bg-navy-900 border border-cyan-500/20 rounded-xl text-xs text-slate-200 leading-relaxed italic">
                  "{viewProposal.sender_questions}"
                </div>
              </div>
            )}

            {/* Receiver Intro */}
            {viewProposal.receiver_intro && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-300 block">
                  Receiver's Family & Background Details:
                </label>
                <div className="p-3 bg-navy-900 border border-purple-500/20 rounded-xl text-xs text-slate-200 leading-relaxed italic">
                  "{viewProposal.receiver_intro}"
                </div>
              </div>
            )}

            {/* Receiver Answers */}
            {viewProposal.receiver_answers && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-300 block">
                  Receiver's Answers:
                </label>
                <div className="p-3 bg-navy-900 border border-emerald-500/20 rounded-xl text-xs text-slate-200 leading-relaxed italic">
                  "{viewProposal.receiver_answers}"
                </div>
              </div>
            )}

            {/* Receiver Questions */}
            {viewProposal.receiver_questions && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-300 block">
                  Receiver's Counter-Questions:
                </label>
                <div className="p-3 bg-navy-900 border border-amber-500/20 rounded-xl text-xs text-slate-200 leading-relaxed italic">
                  "{viewProposal.receiver_questions}"
                </div>
              </div>
            )}

            {/* Sender Answers */}
            {viewProposal.sender_answers && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-teal-300 block">
                  Sender's Answers to Counter-Questions:
                </label>
                <div className="p-3 bg-navy-900 border border-teal-500/20 rounded-xl text-xs text-slate-200 leading-relaxed italic">
                  "{viewProposal.sender_answers}"
                </div>
              </div>
            )}

            {/* Existing Admin Notes */}
            {viewProposal.admin_notes && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1">
                <span className="font-bold block uppercase text-[10px] text-amber-400">Admin Feedback / Correction Notes:</span>
                <p>"{viewProposal.admin_notes}"</p>
              </div>
            )}

            {/* Photo & CNIC Verification Status */}
            {(viewProposal.photo_request_status !== 'none' || viewProposal.nic_request_status !== 'none') && (
              <div className="p-3 bg-navy-950 border border-slate-750 rounded-xl text-xs space-y-1.5">
                <span className="font-bold block uppercase text-[10px] text-slate-400">Trust & Verification Activity:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-navy-900 border border-slate-700 text-slate-300 text-[11px]">
                    📷 Photo Status: <strong className="text-white">{viewProposal.photo_request_status}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-navy-900 border border-slate-700 text-slate-300 text-[11px]">
                    🛡️ CNIC Status: <strong className="text-white">{viewProposal.nic_request_status}</strong>
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              {viewProposal.admin_status === 'pending_review' && (
                <>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      const reqId = viewProposal.id;
                      setViewProposal(null);
                      setRejectDialog({ isOpen: true, requestId: reqId, reason: '' });
                    }}
                  >
                    Reject Proposal
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={AlertCircle}
                    onClick={() => {
                      const reqId = viewProposal.id;
                      const code = viewProposal.request_code;
                      setViewProposal(null);
                      setRevisionDialog({ isOpen: true, requestId: reqId, requestCode: code, notes: '' });
                    }}
                    className="text-amber-300 hover:text-amber-200 border-amber-500/40"
                  >
                    Request Correction
                  </Button>
                  <Button
                    size="sm"
                    variant="success"
                    icon={CheckCircle}
                    onClick={() => {
                      const reqId = viewProposal.id;
                      const code = viewProposal.request_code;
                      setViewProposal(null);
                      handleApprove(reqId, code);
                    }}
                  >
                    1-Click Approve & Deliver
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={() => setViewProposal(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Request Revision / Correction Dialog */}
      {revisionDialog.isOpen && (
        <Modal
          isOpen={revisionDialog.isOpen}
          onClose={() => setRevisionDialog({ isOpen: false, requestId: null, requestCode: '', notes: '' })}
          title="Request Proposal / Answer Correction"
        >
          <form onSubmit={handleConfirmRevision} className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 leading-relaxed">
              <strong>Safe Moderation:</strong> Asking for correction does <em>not</em> reject the proposal or block the user. The candidate will see your instruction and will be prompted to edit and resubmit their answers.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Correction Instructions for Candidate <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={revisionDialog.notes}
                onChange={(e) => setRevisionDialog(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g. Please remove direct mobile numbers/social handles, or provide more details about family background..."
                className="w-full bg-navy-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRevisionDialog({ isOpen: false, requestId: null, requestCode: '', notes: '' })}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={AlertCircle}
                loading={actionLoadingId === revisionDialog.requestId}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold"
              >
                Send Correction Request
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Reject Proposal Dialog */}
      {rejectDialog.isOpen && (
        <Modal
          isOpen={rejectDialog.isOpen}
          onClose={() => setRejectDialog({ isOpen: false, requestId: null, reason: '' })}
          title="Reject Proposal during Moderation"
        >
          <form onSubmit={handleConfirmReject} className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently reject this proposal? It will not be delivered to the candidate.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Reason / Internal Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={rejectDialog.reason}
                onChange={(e) => setRejectDialog(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Reason for rejection (e.g. Inappropriate language, spam, invalid contact)..."
                className="w-full bg-navy-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRejectDialog({ isOpen: false, requestId: null, reason: '' })}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                icon={XCircle}
                loading={actionLoadingId === rejectDialog.requestId}
              >
                Confirm Rejection
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Candidate Photo Moderation Audit */}
      {photoAuditDialog.isOpen && (
        <Modal
          isOpen={photoAuditDialog.isOpen}
          onClose={handleClosePhotoAudit}
          title="Candidate Photo Moderation Audit / تصویر کوالٹی جائزہ"
          size="md"
        >
          <div className="space-y-4">
            {/* Context Header */}
            <div className="p-3 bg-navy-950/80 border border-slate-700 rounded-xl text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">
                  Proposal: {photoAuditDialog.request?.request_code}
                </span>
                <span className="text-slate-400 text-[11px]">
                  Auditing: <strong className="text-cyan-300 capitalize">{photoAuditDialog.side || 'Candidate'} Photo</strong> ({photoAuditDialog.side === 'sender' ? photoAuditDialog.request?.sender?.name : photoAuditDialog.request?.receiver?.name})
                </span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                (photoAuditDialog.side === 'sender' ? photoAuditDialog.request?.sender_photo_moderation_status : photoAuditDialog.request?.receiver_photo_moderation_status) === 'approved'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {(photoAuditDialog.side === 'sender' ? photoAuditDialog.request?.sender_photo_moderation_status : photoAuditDialog.request?.receiver_photo_moderation_status) === 'approved' ? 'Approved' : 'Pending Review'}
              </span>
            </div>

            {/* Switch between Sender and Receiver photo if both exist */}
            {(photoAuditDialog.request?.sender_photo_path && photoAuditDialog.request?.receiver_photo_path) && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 p-1.5 bg-navy-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleOpenPhotoAudit(photoAuditDialog.request, 'sender')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    photoAuditDialog.side === 'sender'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'bg-navy-900 border border-slate-750 text-slate-300 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="truncate">Sender Photo ({photoAuditDialog.request?.sender?.name})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenPhotoAudit(photoAuditDialog.request, 'receiver')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    photoAuditDialog.side === 'receiver'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'bg-navy-900 border border-slate-750 text-slate-300 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="truncate">Receiver Photo ({photoAuditDialog.request?.receiver?.name})</span>
                </button>
              </div>
            )}

            {/* Photo Preview Container */}
            <div className="flex flex-col items-center justify-center min-h-[280px] bg-navy-950/90 border border-slate-800 rounded-2xl p-3">
              {photoAuditDialog.loading ? (
                <div className="flex flex-col items-center gap-2 py-12 text-xs text-slate-400">
                  <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                  <span>Loading candidate photo...</span>
                </div>
              ) : photoAuditDialog.blobUrl ? (
                <div className="space-y-2 text-center w-full">
                  <img
                    src={photoAuditDialog.blobUrl}
                    alt="Candidate uploaded photo"
                    className="max-h-[380px] max-w-full rounded-xl border border-slate-700 shadow-xl object-contain mx-auto"
                  />
                  <p className="text-[11px] text-slate-400">
                    Verify: Authentic face, clear lighting, no sunglasses/masks, no memes/flowers.
                  </p>
                </div>
              ) : (
                <div className="py-12 text-xs text-slate-500 text-center">
                  <Camera className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <span>Unable to preview photo file.</span>
                </div>
              )}
            </div>

            {/* Watermark Security Level Selector */}
            {photoAuditDialog.blobUrl && !photoAuditDialog.showRejectForm && (
              <div className="p-3 bg-navy-900 border border-slate-750 rounded-xl space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Watermark Security Intensity / واٹر مارک کا معیار:</span>
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    icon={Sparkles}
                    onClick={() => setWatermarkStudioOpen(true)}
                    className="text-[11px] font-bold text-amber-300 border-amber-500/40 hover:bg-amber-500/10 py-1 w-full sm:w-auto justify-center"
                    title="Open Studio to customize sliders and download protected photo for WhatsApp"
                  >
                    Watermark Studio (WhatsApp)
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPhotoAuditDialog(prev => ({ ...prev, watermarkLevel: 'standard' }))}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      photoAuditDialog.watermarkLevel === 'standard'
                        ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-400'
                        : 'bg-navy-950/50 border-slate-750 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="block text-xs font-bold">Standard / ہلکا</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">40% Opacity</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPhotoAuditDialog(prev => ({ ...prev, watermarkLevel: 'medium' }))}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      photoAuditDialog.watermarkLevel === 'medium'
                        ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-400'
                        : 'bg-navy-950/50 border-slate-750 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="block text-xs font-bold text-cyan-300">Medium / متوازن</span>
                    <span className="block text-[10px] text-cyan-200 mt-0.5">65% Balanced</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPhotoAuditDialog(prev => ({ ...prev, watermarkLevel: 'dark' }))}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      photoAuditDialog.watermarkLevel === 'dark'
                        ? 'bg-magenta-950/80 border-magenta-400 text-white shadow-sm ring-1 ring-magenta-400'
                        : 'bg-navy-950/50 border-slate-750 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="block text-xs font-bold text-magenta-300">Heavy Dark / گہرا 🔒</span>
                    <span className="block text-[10px] text-magenta-200 mt-0.5">85% High Contrast</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  منتخب کردہ واٹر مارک پورٹل پر امیدوار کے فون اور پروفائل کوڈ کے ساتھ چہرے پر لاگو ہوگا۔ "Heavy Dark" سے سکرین شاٹ اور غلط استعمال کا مؤثر سدِباب ہوتا ہے۔
                </p>

                {/* Custom Watermark Text Control */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200">
                      Custom Watermark Text / واٹر مارک میں تحریر:
                    </label>
                    <span className="text-[10px] text-cyan-300">Repeated across photo</span>
                  </div>
                  <input
                    type="text"
                    value={photoAuditDialog.watermarkText || ''}
                    onChange={(e) => setPhotoAuditDialog(prev => ({ ...prev, watermarkText: e.target.value }))}
                    placeholder="e.g. RaabtaNow • For: Candidate Name • Confidential"
                    className="w-full bg-navy-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setPhotoAuditDialog(prev => ({
                        ...prev,
                        watermarkText: `RaabtaNow • For: ${photoAuditDialog.side === 'sender' ? (photoAuditDialog.request?.receiver?.name || 'Receiver') : (photoAuditDialog.request?.sender?.name || 'Sender')} • Confidential`
                      }))}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    >
                      Preset: With Name
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoAuditDialog(prev => ({
                        ...prev,
                        watermarkText: `RaabtaNow Rishta Platform • Proposal #${photoAuditDialog.request?.request_code} • Confidential`
                      }))}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    >
                      Preset: Proposal Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoAuditDialog(prev => ({
                        ...prev,
                        watermarkText: `Strictly Confidential • Matrimonial Use Only • Do Not Share`
                      }))}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    >
                      Preset: Strict Warning
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reject Reason Form */}
            {photoAuditDialog.showRejectForm ? (
              <form onSubmit={handleRejectPhoto} className="space-y-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <label className="block text-xs font-bold text-rose-300">
                  Reason for Photo Rejection *
                </label>
                <textarea
                  rows={2}
                  required
                  value={photoAuditDialog.rejectReason}
                  onChange={(e) => setPhotoAuditDialog(prev => ({ ...prev, rejectReason: e.target.value }))}
                  placeholder="e.g. Face not clearly visible, sunglasses worn, or landscape photo..."
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                />
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPhotoAuditDialog(prev => ({ ...prev, showRejectForm: false }))}
                    className="w-full sm:w-auto justify-center"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="danger"
                    size="sm"
                    loading={actionLoadingId === photoAuditDialog.request?.id}
                    className="w-full sm:w-auto justify-center"
                  >
                    Confirm Rejection & Prompt Re-upload
                  </Button>
                </div>
              </form>
            ) : (
              /* Modal Actions */
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={photoAuditDialog.copiedWhatsApp ? Check : Copy}
                  onClick={() => handleCopyWhatsApp(photoAuditDialog.request)}
                  className="text-xs text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 justify-center w-full sm:w-auto font-semibold"
                >
                  {photoAuditDialog.copiedWhatsApp ? 'Copied WhatsApp Msg' : 'Copy WhatsApp Share Link'}
                </Button>

                <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClosePhotoAudit}
                    className="w-full sm:w-auto justify-center"
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={XCircle}
                    onClick={() => setPhotoAuditDialog(prev => ({ ...prev, showRejectForm: true }))}
                    className="w-full sm:w-auto justify-center"
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    variant="success"
                    size="sm"
                    icon={CheckCircle}
                    loading={actionLoadingId === photoAuditDialog.request?.id}
                    onClick={() => handleApprovePhoto(photoAuditDialog.request?.id)}
                    className="font-bold bg-emerald-600 hover:bg-emerald-500 w-full sm:w-auto justify-center shadow-md"
                  >
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Admin Photo Watermark Studio (for manual / WhatsApp sharing) */}
      {watermarkStudioOpen && photoAuditDialog.blobUrl && (
        <AdminPhotoWatermarkModal
          isOpen={watermarkStudioOpen}
          onClose={() => setWatermarkStudioOpen(false)}
          photoBlobUrl={photoAuditDialog.blobUrl}
          candidateCode={photoAuditDialog.request?.candidate_profile?.profile_code || photoAuditDialog.request?.request_code}
          candidateName={photoAuditDialog.request?.candidate_profile?.full_name || 'Candidate'}
        />
      )}
    </div>
  );
}
