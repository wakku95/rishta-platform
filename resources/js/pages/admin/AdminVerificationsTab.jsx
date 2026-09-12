import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, CheckCircle2, XCircle, 
  Eye, RefreshCw, FileText, Search, AlertCircle, ExternalLink, Trash2 
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import Button from '../../components/ui/Button';

export default function AdminVerificationsTab() {
  const [verifications, setVerifications] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState(null);

  // Detail / Review Modal
  const [selectedItem, setSelectedItem] = useState(null);
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

  const handleLoadDoc = async (item, side, label) => {
    if (!item) return;
    setDocLoading(side);
    setDocError(null);
    try {
      const response = await adminApi.getDocumentBlob(item.id, side);
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

  const openReviewModal = (item) => {
    setSelectedItem(item);
    setShowRejectForm(false);
    setRejectReason('');
    if (!item.documents_purged_at && (item.document_front_path || item.document_back_path)) {
      const defaultLabel = item.type === 'identity' ? 'CNIC Front Side' : (item.document_name || 'Education Certificate');
      handleLoadDoc(item, 'front', defaultLabel);
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

  useEffect(() => {
    fetchVerifications(1);
  }, [typeFilter, statusFilter]);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this verification submission?')) return;
    setActionLoadingId(id);
    setMessage(null);
    try {
      const res = await adminApi.approveVerification(id);
      setMessage({ type: 'success', text: res.message });
      closeReviewModal();
      fetchVerifications(pagination.current_page);
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
      const res = await adminApi.rejectVerification(selectedItem.id, rejectReason);
      setMessage({ type: 'success', text: res.message });
      closeReviewModal();
      fetchVerifications(pagination.current_page);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Rejection failed.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderStatusBadge = (status) => {
    if (status === 'approved') {
      return <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Approved</span>;
    }
    if (status === 'rejected') {
      return <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">Rejected</span>;
    }
    return <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">Pending</span>;
  };

  return (
    <div className="space-y-6">
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

          <Button
            size="sm"
            variant="secondary"
            icon={Trash2}
            onClick={() => setShowPurgeModal(true)}
            className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
          >
            Purge Storage
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

      {/* Verifications Table */}
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
                  <td className="px-5 py-3.5 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Eye}
                      onClick={() => openReviewModal(v)}
                    >
                      Review
                    </Button>
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

      {/* Review Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 pt-20 sm:pt-24 pb-8 overflow-y-auto">
          <div className="bg-navy-900 border border-white/15 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white capitalize">
                  Review {selectedItem.type} Verification
                </h3>
                <p className="text-xs text-slate-400">
                  User: {selectedItem.user?.name} ({selectedItem.user?.email})
                </p>
              </div>
              <button 
                onClick={closeReviewModal} 
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-navy-800 transition"
              >
                ✕ Close
              </button>
            </div>

            {/* Document Links & Secure Inline Preview */}
            {selectedItem.documents_purged_at ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Physical Document Images Purged (Storage Cleared)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  The original uploaded image files were permanently deleted on{' '}
                  <strong className="text-white">{new Date(selectedItem.documents_purged_at).toLocaleDateString()}</strong>{' '}
                  to free server disk space per retention policy. The verification status and audit record remain 100% active.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-navy-800/80 border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Verification Documents
                  </span>
                  {activeDoc && (
                    <button
                      type="button"
                      onClick={() => window.open(activeDoc.url, '_blank')}
                      className="inline-flex items-center gap-1.5 text-xs text-magenta-300 hover:text-magenta-200 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open in New Tab
                    </button>
                  )}
                </div>

                {/* Side / Document Selectors */}
                {selectedItem.type === 'identity' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoadDoc(selectedItem, 'front', 'CNIC Front Side')}
                      disabled={docLoading === 'front'}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                        activeDoc?.side === 'front'
                          ? 'bg-magenta-600/20 border-magenta-500/60 text-white shadow-sm'
                          : 'bg-navy-900 hover:bg-navy-750 border-white/10 text-slate-300'
                      }`}
                    >
                      {docLoading === 'front' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      CNIC Front Side
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadDoc(selectedItem, 'back', 'CNIC Back Side')}
                      disabled={docLoading === 'back'}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                        activeDoc?.side === 'back'
                          ? 'bg-magenta-600/20 border-magenta-500/60 text-white shadow-sm'
                          : 'bg-navy-900 hover:bg-navy-750 border-white/10 text-slate-300'
                      }`}
                    >
                      {docLoading === 'back' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      CNIC Back Side
                    </button>
                  </div>
                ) : (
                  <div className="flex">
                    <button
                      type="button"
                      onClick={() => handleLoadDoc(selectedItem, 'front', selectedItem.document_name || 'Education Certificate')}
                      disabled={docLoading === 'front'}
                      className="w-full p-2.5 rounded-xl border border-magenta-500/60 bg-magenta-600/20 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                    >
                      {docLoading === 'front' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                      {selectedItem.document_name || 'Education Certificate'} (Front)
                    </button>
                  </div>
                )}

                {/* Live Preview Container */}
                <div className="rounded-xl border border-white/10 bg-navy-950 p-2 min-h-[220px] flex items-center justify-center overflow-hidden">
                  {docLoading ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-slate-400 text-xs">
                      <RefreshCw className="w-6 h-6 animate-spin text-magenta-400" />
                      <span>Loading document securely...</span>
                    </div>
                  ) : docError ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-rose-400 text-xs text-center px-4">
                      <AlertCircle className="w-6 h-6 text-rose-500" />
                      <span>{docError}</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleLoadDoc(selectedItem, activeDoc?.side || 'front', activeDoc?.label || 'Document')}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : activeDoc ? (
                    activeDoc.mime.startsWith('image/') ? (
                      <img
                        src={activeDoc.url}
                        alt={activeDoc.label}
                        className="max-h-[380px] max-w-full object-contain rounded"
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
                          className="px-3 py-1.5 rounded-lg bg-magenta-600 text-white font-medium hover:bg-magenta-500 transition"
                        >
                          Open Document
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-500">
                      Click a document button above to view
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
                  Reason for Rejection (Displayed to user) *
                </label>
                <textarea
                  rows="3"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Document image is blurry or expired. Please upload a clear photo of your original CNIC."
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
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <Button size="sm" variant="danger" onClick={() => setShowRejectForm(true)}>
                  Reject Submission
                </Button>
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
