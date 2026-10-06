import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, CheckCircle2, XCircle, 
  Eye, RefreshCw, FileText, Search, AlertCircle, ExternalLink, Trash2,
  Link as LinkIcon, Clock, Copy, Check, UserCheck, PhoneCall, AlertTriangle
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import Button from '../../components/ui/Button';

export default function AdminVerificationsTab() {
  const [activeSection, setActiveSection] = useState('registered'); // 'registered' | 'magic_links'
  
  // Registered users state
  const [verifications, setVerifications] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');

  // Magic verification links state
  const [magicLinks, setMagicLinks] = useState([]);
  const [magicPagination, setMagicPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [magicStatusFilter, setMagicStatusFilter] = useState('');
  const [magicSearch, setMagicSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Common UI state
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState(null);

  // Detail / Review Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState('registered'); // 'registered' | 'magic_link'
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Document Preview State
  const [activeDoc, setActiveDoc] = useState(null); // { url, mime, side, label }
  const [docLoading, setDocLoading] = useState(null); // 'front' | 'back' | null
  const [docError, setDocError] = useState(null);

  // Storage Purge State
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeDays, setPurgeDays] = useState(30);
  const [purging, setPurging] = useState(false);

  const calculateAge = (dobString) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const closeReviewModal = () => {
    if (activeDoc?.url) {
      URL.revokeObjectURL(activeDoc.url);
    }
    setActiveDoc(null);
    setDocLoading(null);
    setDocError(null);
    setSelectedItem(null);
    setShowRejectForm(false);
    setRejectReason('');
  };

  const handleLoadDoc = async (item, side, label, isMagicLink = false) => {
    if (!item) return;
    setDocLoading(side);
    setDocError(null);
    try {
      const response = isMagicLink
        ? await adminApi.getVerificationLinkDocBlob(item.id, side)
        : await adminApi.getDocumentBlob(item.id, side);
        
      const mime = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: mime });
      const url = URL.createObjectURL(blob);

      if (activeDoc?.url) {
        URL.revokeObjectURL(activeDoc.url);
      }
      setActiveDoc({ url, mime, side, label });
    } catch (err) {
      setDocError(err.response?.data?.message || 'Failed to load document.');
    } finally {
      setDocLoading(null);
    }
  };

  const openReviewModal = (item, type = 'registered') => {
    setSelectedItem(item);
    setModalType(type);
    setShowRejectForm(false);
    setRejectReason('');

    if (type === 'magic_link') {
      if (item.document_front_path) {
        handleLoadDoc(item, 'front', 'Document Front Side', true);
      } else if (item.document_back_path) {
        handleLoadDoc(item, 'back', 'Document Back Side', true);
      }
    } else {
      if (!item.documents_purged_at && (item.document_front_path || item.document_back_path)) {
        const defaultLabel = item.type === 'identity' ? 'CNIC Front Side' : (item.document_name || 'Education Certificate');
        handleLoadDoc(item, 'front', defaultLabel, false);
      }
    }
  };

  const handlePurge = async (e) => {
    e.preventDefault();
    setPurging(true);
    setMessage(null);
    try {
      const res = await adminApi.purgeDocuments(Number(purgeDays));
      setMessage({ type: 'success', text: res.message });
      setShowPurgeModal(false);
      fetchVerifications(pagination.current_page);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Purge failed.' });
    } finally {
      setPurging(false);
    }
  };

  const fetchVerifications = async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminApi.getVerifications({
        page,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setVerifications(data.data || []);
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

  const fetchMagicLinks = async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminApi.getVerificationLinks({
        page,
        status: magicStatusFilter || undefined,
        search: magicSearch || undefined,
      });
      setMagicLinks(data.data || []);
      setMagicPagination({
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
    if (activeSection === 'registered') {
      fetchVerifications(1);
    } else {
      fetchMagicLinks(1);
    }
  }, [activeSection, typeFilter, statusFilter, magicStatusFilter]);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this verification submission?')) return;
    setActionLoadingId(id);
    setMessage(null);
    try {
      if (modalType === 'magic_link') {
        const res = await adminApi.approveVerificationLink(id);
        setMessage({ type: 'success', text: res.message || 'Candidate verification approved successfully.' });
        closeReviewModal();
        fetchMagicLinks(magicPagination.current_page);
      } else {
        const res = await adminApi.approveVerification(id);
        setMessage({ type: 'success', text: res.message });
        closeReviewModal();
        fetchVerifications(pagination.current_page);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Approval failed.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!rejectReason || rejectReason.length < 5) {
      alert('Please provide a reason of at least 5 characters.');
      return;
    }

    setActionLoadingId(selectedItem.id);
    setMessage(null);
    try {
      if (modalType === 'magic_link') {
        const res = await adminApi.rejectVerificationLink(selectedItem.id, rejectReason);
        setMessage({ type: 'success', text: res.message || 'Candidate verification rejected.' });
        closeReviewModal();
        fetchMagicLinks(magicPagination.current_page);
      } else {
        const res = await adminApi.rejectVerification(selectedItem.id, rejectReason);
        setMessage({ type: 'success', text: res.message });
        closeReviewModal();
        fetchVerifications(pagination.current_page);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Rejection failed.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteMagicLink = async (id) => {
    if (!window.confirm("Are you sure you want to delete this verification request? This will permanently remove the link and any uploaded document files. The candidate profile itself will NOT be affected.")) return;
    setActionLoadingId(id);
    setMessage(null);
    try {
      const res = await adminApi.deleteVerificationLink(id);
      setMessage({ type: 'success', text: res.message || 'Verification link deleted successfully.' });
      if (selectedItem?.id === id) {
        closeReviewModal();
      }
      fetchMagicLinks(magicPagination.current_page);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete verification request.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteRegistered = async (id) => {
    if (!window.confirm("Are you sure you want to delete this verification record? This will permanently remove the record and any uploaded document files. The user account and profile will NOT be affected.")) return;
    setActionLoadingId(id);
    setMessage(null);
    try {
      const res = await adminApi.deleteVerification(id);
      setMessage({ type: 'success', text: res.message || 'Verification record deleted successfully.' });
      if (selectedItem?.id === id) {
        closeReviewModal();
      }
      fetchVerifications(pagination.current_page);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete verification record.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const copyMagicLink = (linkItem) => {
    const fullUrl = `${window.location.origin}/verify-doc/${linkItem.token}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedId(linkItem.id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const renderStatusBadge = (status) => {
    if (status === 'approved') {
      return <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Approved</span>;
    }
    if (status === 'rejected') {
      return <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">Rejected</span>;
    }
    if (status === 'submitted') {
      return <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" /> Submitted</span>;
    }
    if (status === 'expired') {
      return <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-slate-500/20 text-slate-400 border border-slate-500/30">Expired</span>;
    }
    return <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">Pending</span>;
  };

  const formatDocType = (type) => {
    switch (type) {
      case 'salary_slip':
        return { label: 'Salary Slip / Income', badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
      case 'degree':
        return { label: 'Educational Degree', badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
      case 'other':
        return { label: 'Other Document', badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
      case 'cnic':
      default:
        return { label: 'CNIC / National ID', badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-navy-900/70 border border-white/10 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSection('registered')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'registered'
                ? 'bg-gradient-to-r from-magenta-600 to-pink-600 text-white shadow-lg shadow-magenta-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Registered Users (In-App Submissions)</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/20">
              {pagination.total || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('magic_links')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'magic_links'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Candidate Magic Links (WhatsApp Submissions)</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/20">
              {magicPagination.total || 0}
            </span>
          </button>
        </div>

        {activeSection === 'registered' && (
          <Button
            size="sm"
            variant="secondary"
            icon={Trash2}
            onClick={() => setShowPurgeModal(true)}
            className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs"
          >
            Purge Storage
          </Button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          message.type === 'success' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* SECTION 1: REGISTERED USERS */}
      {activeSection === 'registered' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <form onSubmit={(e) => { e.preventDefault(); fetchVerifications(1); }} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-navy-800/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-magenta-500"
                />
              </div>
              <Button type="submit" size="sm" variant="primary">Search</Button>
            </form>

            <div className="flex items-center gap-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-navy-800/90 border border-slate-700/80 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-magenta-500"
              >
                <option value="">All Types</option>
                <option value="identity">Identity (CNIC)</option>
                <option value="education">Education</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-navy-800/90 border border-slate-700/80 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-magenta-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => fetchVerifications(pagination.current_page)} isLoading={loading}>
                Refresh
              </Button>
            </div>
          </div>

          {/* Registered Verifications Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-navy-800/60 shadow-sm">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-navy-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Submitted</th>
                  <th className="px-5 py-3.5">Reviewer</th>
                  <th className="px-5 py-3.5 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {verifications.length > 0 ? (
                  verifications.map((v) => (
                    <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white">{v.user?.name || 'User'}</div>
                        <div className="text-xs text-slate-400 font-mono">{v.user?.email}</div>
                      </td>
                      <td className="px-5 py-3.5 capitalize font-semibold text-white">
                        {v.type === 'identity' ? 'Identity (CNIC)' : 'Education'}
                      </td>
                      <td className="px-5 py-3.5">{renderStatusBadge(v.status)}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">
                        {v.submitted_at ? new Date(v.submitted_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-300">
                        {v.reviewer ? v.reviewer.name : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={Eye}
                          onClick={() => openReviewModal(v, 'registered')}
                        >
                          Review
                        </Button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRegistered(v.id)}
                          title="Delete verification record"
                          disabled={actionLoadingId === v.id}
                          className="p-1.5 rounded-lg bg-navy-700 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition inline-flex items-center justify-center border border-white/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-slate-500 text-sm">
                      {loading ? 'Loading verifications...' : 'No verification requests found.'}
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
                  onClick={() => fetchVerifications(pagination.current_page - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pagination.current_page >= pagination.last_page}
                  onClick={() => fetchVerifications(pagination.current_page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: CANDIDATE MAGIC LINKS (WHATSAPP VERIFICATIONS) */}
      {activeSection === 'magic_links' && (
        <div className="space-y-4">
          {/* Info Notice */}
          <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-200 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>
                These are single-use document verification links generated from <strong>Matchmaker Engine</strong> and sent via WhatsApp to candidates. Candidates upload their CNIC or documents directly without needing an account.
              </span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <form onSubmit={(e) => { e.preventDefault(); fetchMagicLinks(1); }} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search candidate code, name or phone..."
                  value={magicSearch}
                  onChange={(e) => setMagicSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-navy-800/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <Button type="submit" size="sm" variant="primary">Search</Button>
            </form>

            <div className="flex items-center gap-3">
              <select
                value={magicStatusFilter}
                onChange={(e) => setMagicStatusFilter(e.target.value)}
                className="px-3 py-2 bg-navy-800/90 border border-slate-700/80 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="">All Statuses</option>
                <option value="submitted">Submitted (Needs Review)</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending (Waiting on Candidate)</option>
                <option value="rejected">Rejected</option>
              </select>

              <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => fetchMagicLinks(magicPagination.current_page)} isLoading={loading}>
                Refresh
              </Button>
            </div>
          </div>

          {/* Magic Links Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-navy-800/60 shadow-sm">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-navy-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Phone / Contact</th>
                  <th className="px-5 py-3.5">Doc Type</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Photos Submitted</th>
                  <th className="px-5 py-3.5">Reviewer</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {magicLinks.length > 0 ? (
                  magicLinks.map((link) => {
                    const hasPhotos = !!(link.document_front_path || link.document_back_path);
                    return (
                      <tr key={link.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">
                              {link.candidate_name || `Candidate #${link.candidate_code}`}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                              {link.candidate_code}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 capitalize">
                            Source: {link.candidate_type === 'assisted' ? 'Assisted Matchmaker' : 'Registered Profile'}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-xs">
                          {link.phone ? (
                            <span className="font-mono text-slate-300 flex items-center gap-1">
                              <PhoneCall className="w-3 h-3 text-emerald-400" />
                              {link.phone}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          {(() => {
                            const info = formatDocType(link.document_type);
                            return (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${info.badgeColor}`}>
                                {info.label}
                              </span>
                            );
                          })()}
                        </td>

                        <td className="px-5 py-3.5">
                          {renderStatusBadge(link.status)}
                        </td>

                        <td className="px-5 py-3.5 text-xs">
                          {hasPhotos ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Uploaded ({link.submitted_at ? new Date(link.submitted_at).toLocaleDateString() : 'Yes'})
                            </span>
                          ) : (
                            <span className="text-slate-500 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Awaiting upload
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-xs text-slate-300">
                          {link.reviewer ? link.reviewer.name : '—'}
                        </td>

                        <td className="px-5 py-3.5 text-right space-x-2">
                          <Button
                            size="sm"
                            variant={hasPhotos && link.status === 'submitted' ? 'primary' : 'secondary'}
                            icon={Eye}
                            onClick={() => openReviewModal(link, 'magic_link')}
                          >
                            {hasPhotos ? 'Review Photos' : 'Details'}
                          </Button>

                          <button
                            type="button"
                            onClick={() => copyMagicLink(link)}
                            title="Copy candidate verification link"
                            className="p-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-slate-300 hover:text-white transition inline-flex items-center justify-center border border-white/10"
                          >
                            {copiedId === link.id ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteMagicLink(link.id)}
                            title="Delete verification request"
                            disabled={actionLoadingId === link.id}
                            className="p-1.5 rounded-lg bg-navy-700 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition inline-flex items-center justify-center border border-white/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-5 py-8 text-center text-slate-500 text-sm">
                      {loading ? 'Loading candidate magic links...' : 'No candidate verification links found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {magicPagination.last_page > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Showing page {magicPagination.current_page} of {magicPagination.last_page}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={magicPagination.current_page <= 1}
                  onClick={() => fetchMagicLinks(magicPagination.current_page - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={magicPagination.current_page >= magicPagination.last_page}
                  onClick={() => fetchMagicLinks(magicPagination.current_page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* REVIEW & DETAIL MODAL (Supports both Registered & Magic Links) */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 pt-20 sm:pt-24 pb-8 overflow-y-auto">
          <div className="bg-navy-900 border border-white/15 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white capitalize flex items-center gap-2">
                  <span>
                    {modalType === 'magic_link'
                      ? `Candidate Document: ${formatDocType(selectedItem.document_type).label}`
                      : `Review ${selectedItem.type} Verification`}
                  </span>
                  {modalType === 'registered' && selectedItem.user?.profile?.date_of_birth && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-magenta-500/20 text-magenta-300 border border-magenta-500/30 font-semibold tracking-wide">
                      Age: {calculateAge(selectedItem.user.profile.date_of_birth)} yrs
                    </span>
                  )}
                </h3>

                {modalType === 'magic_link' ? (
                  <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                    <span>Candidate: <strong className="text-slate-200">{selectedItem.candidate_name || `#${selectedItem.candidate_code}`}</strong></span>
                    <span className="font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      Code: {selectedItem.candidate_code}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${formatDocType(selectedItem.document_type).badgeColor}`}>
                      Requested: {formatDocType(selectedItem.document_type).label}
                    </span>
                    {selectedItem.phone && (
                      <span className="text-emerald-300 font-mono flex items-center gap-1">
                        <PhoneCall className="w-3 h-3" />
                        {selectedItem.phone}
                      </span>
                    )}
                    <span className="capitalize text-slate-400">
                      Status: {selectedItem.status}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                    <span>User: <strong className="text-slate-200">{selectedItem.user?.name}</strong> ({selectedItem.user?.email})</span>
                    {selectedItem.user?.profile?.education && (
                      <span className="text-cyan-300 font-semibold bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-500/30">
                        Education: {selectedItem.user.profile.education}
                      </span>
                    )}
                    {selectedItem.user?.profile?.date_of_birth && (
                      <span className="text-emerald-300 font-mono">
                        DOB: {selectedItem.user.profile.date_of_birth}
                      </span>
                    )}
                    {selectedItem.user?.profile?.gender && (
                      <span className="capitalize text-slate-300">
                        Gender: {selectedItem.user.profile.gender}
                      </span>
                    )}
                  </p>
                )}
              </div>

              <button 
                onClick={closeReviewModal} 
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-navy-800 transition"
              >
                ✕ Close
              </button>
            </div>

            {/* Document Content / Photos */}
            {modalType === 'magic_link' && !selectedItem.document_front_path && !selectedItem.document_back_path ? (
              <div className="p-6 rounded-xl bg-navy-800/80 border border-white/5 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <div className="text-sm font-bold text-white">No Photos Uploaded Yet</div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  The candidate has received this verification link via WhatsApp, but has not yet uploaded their document pictures.
                </p>
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Copy}
                    onClick={() => copyMagicLink(selectedItem)}
                  >
                    {copiedId === selectedItem.id ? 'Copied Verification Link!' : 'Copy Magic Link for Candidate'}
                  </Button>
                </div>
              </div>
            ) : selectedItem.documents_purged_at ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Physical Document Images Purged (Storage Cleared)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  The original uploaded image files were permanently deleted to free server disk space per retention policy.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-navy-800/80 border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Uploaded Document Photos
                  </span>
                  {activeDoc && (
                    <button
                      type="button"
                      onClick={() => window.open(activeDoc.url, '_blank')}
                      className="inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Full Size in New Tab
                    </button>
                  )}
                </div>

                {/* Side / Document Selectors */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadDoc(selectedItem, 'front', 'Document Front Side', modalType === 'magic_link')}
                    disabled={docLoading === 'front' || !selectedItem.document_front_path}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      activeDoc?.side === 'front'
                        ? 'bg-cyan-600/20 border-cyan-500/60 text-white shadow-sm'
                        : selectedItem.document_front_path
                        ? 'bg-navy-900 hover:bg-navy-750 border-white/10 text-slate-300'
                        : 'bg-navy-950/50 border-dashed border-slate-700/50 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {docLoading === 'front' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    Front Side {selectedItem.document_front_path ? '✓' : '(Not Uploaded)'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadDoc(selectedItem, 'back', 'Document Back Side', modalType === 'magic_link')}
                    disabled={docLoading === 'back' || !selectedItem.document_back_path}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      activeDoc?.side === 'back'
                        ? 'bg-cyan-600/20 border-cyan-500/60 text-white shadow-sm'
                        : selectedItem.document_back_path
                        ? 'bg-navy-900 hover:bg-navy-750 border-white/10 text-slate-300'
                        : 'bg-navy-950/50 border-dashed border-slate-700/50 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {docLoading === 'back' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    Back Side {selectedItem.document_back_path ? '✓' : '(Optional / None)'}
                  </button>
                </div>

                {/* Live Preview Container */}
                <div className="rounded-xl border border-white/10 bg-navy-950 p-2 min-h-[240px] flex items-center justify-center overflow-hidden">
                  {docLoading ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-slate-400 text-xs">
                      <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                      <span>Loading private document photo securely...</span>
                    </div>
                  ) : docError ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-rose-400 text-xs text-center px-4">
                      <AlertCircle className="w-6 h-6 text-rose-500" />
                      <span>{docError}</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleLoadDoc(selectedItem, activeDoc?.side || 'front', activeDoc?.label || 'Document', modalType === 'magic_link')}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : activeDoc ? (
                    activeDoc.mime.startsWith('image/') ? (
                      <img
                        src={activeDoc.url}
                        alt={activeDoc.label}
                        className="max-h-[380px] max-w-full object-contain rounded shadow-lg"
                      />
                    ) : activeDoc.mime === 'application/pdf' ? (
                      <iframe
                        src={activeDoc.url}
                        title={activeDoc.label}
                        className="w-full h-[400px] rounded border-0 bg-white"
                      />
                    ) : (
                      <div className="text-center py-6 text-xs text-slate-300">
                        <p className="mb-2">Document format: {activeDoc.mime}</p>
                        <button
                          type="button"
                          onClick={() => window.open(activeDoc.url, '_blank')}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-500 transition"
                        >
                          Open Document
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-500">
                      Click a document button above to view photo
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedItem.rejection_reason && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                <strong>Current Rejection Reason:</strong> {selectedItem.rejection_reason}
              </div>
            )}

            {/* Action Bar */}
            {showRejectForm ? (
              <form onSubmit={handleReject} className="space-y-3 pt-2 border-t border-white/10">
                <label className="block text-xs font-semibold text-slate-300">
                  Reason for Rejection *
                </label>
                <textarea
                  rows="3"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Image is blurry, edges are cut off, or expired document. Please re-upload a clear picture."
                  className="w-full p-3 bg-navy-850 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setShowRejectForm(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="danger" type="submit" isLoading={actionLoadingId === selectedItem.id}>
                    Confirm Rejection
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between pt-3 border-t border-white/10 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="danger" onClick={() => setShowRejectForm(true)}>
                    Reject Submission
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    icon={Trash2}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20"
                    onClick={() => {
                      if (modalType === 'magic_link') {
                        handleDeleteMagicLink(selectedItem.id);
                      } else {
                        handleDeleteRegistered(selectedItem.id);
                      }
                    }}
                    isLoading={actionLoadingId === selectedItem.id}
                  >
                    Delete Record
                  </Button>
                </div>
                <Button 
                  size="sm" 
                  variant="primary" 
                  icon={CheckCircle2} 
                  onClick={() => handleApprove(selectedItem.id)}
                  isLoading={actionLoadingId === selectedItem.id}
                >
                  Approve Verification
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Purge Storage Modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 pt-20 sm:pt-24 pb-8 overflow-y-auto">
          <div className="bg-navy-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Purge Stored Documents</h3>
                <p className="text-xs text-slate-400">Free server disk space safely</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action permanently removes the raw document images (CNIC and Degree files) from server disk. 
              <strong className="text-emerald-400"> User verification badges and audit records will remain 100% active.</strong>
            </p>

            <form onSubmit={handlePurge} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Retention Threshold:
                </label>
                <select
                  value={purgeDays}
                  onChange={(e) => setPurgeDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-navy-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value={30}>Approved documents older than 30 days (Recommended)</option>
                  <option value={60}>Approved documents older than 60 days</option>
                  <option value={90}>Approved documents older than 90 days</option>
                  <option value={0}>All approved documents (Purge immediately)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <Button size="sm" variant="ghost" onClick={() => setShowPurgeModal(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="danger" type="submit" isLoading={purging}>
                  Confirm Purge
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
