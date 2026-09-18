import React, { useEffect, useState } from 'react';
import { CreditCard, KeyRound, RefreshCw, CheckCircle2, Clock, Eye, Check, X, FileText, AlertCircle, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/admin';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';

export default function AdminFinancialsTab() {
  const [subTab, setSubTab] = useState('payments'); // 'payments' | 'unlocks'
  const [payments, setPayments] = useState([]);
  const [unlocks, setUnlocks] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'paid' | 'failed'
  const [feedback, setFeedback] = useState(null);

  // Actions state
  const [actionLoading, setActionLoading] = useState(null); // payment ID
  const [viewingReceipt, setViewingReceipt] = useState(null); // payment object
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [rejectingPayment, setRejectingPayment] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchPayments = async (page = 1, currentFilter = statusFilter) => {
    setLoading(true);
    try {
      const params = { page };
      if (currentFilter !== 'all') {
        params.status = currentFilter;
      }
      const data = await adminApi.getPayments(params);
      setPayments(data.data || []);
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

  const fetchUnlocks = async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminApi.getUnlocks({ page });
      setUnlocks(data.data || []);
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
    if (subTab === 'payments') {
      fetchPayments(1, statusFilter);
    } else {
      fetchUnlocks(1);
    }
  }, [subTab, statusFilter]);

  const handleCloseReceipt = () => {
    if (receiptUrl) {
      URL.revokeObjectURL(receiptUrl);
    }
    setViewingReceipt(null);
    setReceiptUrl(null);
  };

  const handleApprove = async (payment) => {
    if (!window.confirm(`Approve payment of Rs. ${Math.round(payment.amount)} for connection #${payment.rishta_request?.request_code}? This will unlock the phone verification step for candidates.`)) {
      return;
    }
    setActionLoading(payment.id);
    setFeedback(null);
    try {
      await adminApi.approvePayment(payment.id);
      setFeedback({ type: 'success', message: `Payment for #${payment.rishta_request?.request_code || payment.payment_uuid} successfully approved!` });
      if (viewingReceipt?.id === payment.id) {
        handleCloseReceipt();
      }
      await fetchPayments(pagination.current_page, statusFilter);
    } catch (err) {
      console.error('Approval failed:', err);
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to approve payment.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async (e) => {
    e?.preventDefault();
    if (!rejectingPayment || !rejectReason.trim()) return;
    setActionLoading(rejectingPayment.id);
    setFeedback(null);
    try {
      await adminApi.rejectPayment(rejectingPayment.id, rejectReason.trim());
      setFeedback({ type: 'success', message: 'Payment rejected.' });
      setRejectingPayment(null);
      setRejectReason('');
      if (viewingReceipt?.id === rejectingPayment.id) {
        handleCloseReceipt();
      }
      await fetchPayments(pagination.current_page, statusFilter);
    } catch (err) {
      console.error('Rejection failed:', err);
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to reject payment.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteReceipt = async (payment) => {
    if (!payment?.receipt_path) return;
    if (payment.status === 'pending') {
      alert('Cannot delete receipt while payment is pending review. Please approve or reject first.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete this receipt file from server storage to free up disk space?\n\nThe payment record (#${payment.rishta_request?.request_code || payment.payment_uuid}) and candidate unlock will remain 100% intact.`)) {
      return;
    }
    setActionLoading(payment.id);
    setFeedback(null);
    try {
      await adminApi.deletePaymentReceipt(payment.id);
      setFeedback({ type: 'success', message: `Receipt file for #${payment.rishta_request?.request_code || payment.payment_uuid} deleted from storage.` });
      if (viewingReceipt?.id === payment.id) {
        handleCloseReceipt();
      }
      await fetchPayments(pagination.current_page, statusFilter);
    } catch (err) {
      console.error('Failed to delete receipt:', err);
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to delete receipt file.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenReceipt = async (payment) => {
    if (receiptUrl) {
      URL.revokeObjectURL(receiptUrl);
    }
    setViewingReceipt(payment);
    setReceiptLoading(true);
    setReceiptUrl(null);
    try {
      const response = await adminApi.getPaymentReceiptBlob(payment.id);
      const mime = response.headers?.['content-type'] || 'image/jpeg';
      const blob = new Blob([response.data], { type: mime });
      const url = URL.createObjectURL(blob);
      setReceiptUrl(url);
    } catch (err) {
      console.error('Failed to load receipt file:', err);
      let errMsg = 'Could not load receipt file from server.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) errMsg = json.message;
        } catch {
          // ignore
        }
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      }
      setFeedback({ type: 'error', message: errMsg });
    } finally {
      setReceiptLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab('payments')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              subTab === 'payments' 
                ? 'bg-magenta-500 text-white shadow-md' 
                : 'bg-navy-800 text-slate-300 hover:text-white'
            }`}
          >
            Payment Transactions
          </button>
          <button
            onClick={() => setSubTab('unlocks')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              subTab === 'unlocks' 
                ? 'bg-magenta-500 text-white shadow-md' 
                : 'bg-navy-800 text-slate-300 hover:text-white'
            }`}
          >
            Contact Unlock Audit
          </button>
        </div>

        <Button
          size="sm"
          variant="secondary"
          icon={RefreshCw}
          onClick={() => subTab === 'payments' ? fetchPayments(pagination.current_page) : fetchUnlocks(pagination.current_page)}
          isLoading={loading}
        >
          Refresh
        </Button>
      </div>

      {feedback && (
        <Alert
          variant={feedback.type === 'error' ? 'danger' : 'success'}
          dismissible
          onClose={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}

      {subTab === 'payments' && (
        <div className="flex items-center gap-2 pb-1 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Filter:</span>
          {[
            { id: 'all', label: 'All Payments' },
            { id: 'pending', label: 'Pending Reviews' },
            { id: 'paid', label: 'Paid / Approved' },
            { id: 'failed', label: 'Failed / Rejected' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                statusFilter === f.id
                  ? 'bg-slate-700 text-white font-bold border border-slate-500'
                  : 'bg-navy-800 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {subTab === 'payments' ? (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-navy-800/60 shadow-sm">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-navy-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Payment UUID / Ref</th>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Gateway</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-white block">{p.payment_uuid}</span>
                      {p.transaction_reference && (
                        <span className="text-[11px] font-mono text-amber-400">Ref: {p.transaction_reference}</span>
                      )}
                      {p.rishta_request?.request_code && (
                        <span className="text-[10px] text-slate-400 block font-mono">Req: #{p.rishta_request.request_code}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-white font-medium block">{p.user?.name || 'User'}</span>
                      <span className="text-xs text-slate-400 font-mono">{p.user?.email}</span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-white">Rs. {Math.round(p.amount)} {p.currency}</td>
                    <td className="px-5 py-3.5 uppercase font-mono text-xs text-slate-300">{p.gateway}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase inline-block ${
                        p.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : p.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {p.status}
                      </span>
                      {p.status === 'failed' && p.admin_notes && (
                        <span className="block text-[11px] text-rose-300/80 mt-1 max-w-xs truncate" title={p.admin_notes}>
                          Note: {p.admin_notes}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      {p.paid_at ? new Date(p.paid_at).toLocaleString() : new Date(p.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.receipt_path ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenReceipt(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-navy-700 hover:bg-navy-600 text-cyan-300 border border-slate-600 transition"
                              title="View Receipt Proof"
                            >
                              <Eye className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Receipt</span>
                            </button>
                            {p.status !== 'pending' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteReceipt(p)}
                                disabled={actionLoading === p.id}
                                className="inline-flex items-center justify-center p-1 rounded-lg text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition disabled:opacity-50"
                                title="Delete receipt image from server storage to free space"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          p.gateway === 'jazzcash_qr' && p.status !== 'pending' && (
                            <span className="text-[11px] text-slate-500 italic pr-1" title="Receipt image was purged from server">
                              Purged
                            </span>
                          )
                        )}

                        {p.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(p)}
                              disabled={actionLoading === p.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition disabled:opacity-50"
                              title="Approve Payment"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { setRejectingPayment(p); setRejectReason(''); }}
                              disabled={actionLoading === p.id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition disabled:opacity-50"
                              title="Reject Payment"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-500 text-sm">
                    {loading ? 'Loading payments...' : 'No payment transactions found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-navy-800/60 shadow-sm">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-navy-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Request</th>
                <th className="px-5 py-3.5">Initiator (Sender)</th>
                <th className="px-5 py-3.5">Recipient (Receiver)</th>
                <th className="px-5 py-3.5">Sender OTP</th>
                <th className="px-5 py-3.5">Receiver OTP</th>
                <th className="px-5 py-3.5">Unlocked State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {unlocks.length > 0 ? (
                unlocks.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-white">{u.request_code}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{u.sender?.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{u.sender_phone_masked || 'No phone'}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{u.receiver?.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{u.receiver_phone_masked || 'No phone'}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      {u.sender_verified ? (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.receiver_verified ? (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.unlocked ? (
                        <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                          Released
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded bg-slate-700/50 text-slate-400 font-bold text-xs">
                          In Progress
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-slate-500 text-sm">
                    {loading ? 'Loading unlocks...' : 'No contact unlock records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Receipt Viewer Modal */}
      <Modal
        isOpen={Boolean(viewingReceipt)}
        onClose={handleCloseReceipt}
        title="Payment Receipt Proof"
        subtitle={viewingReceipt ? `Ref: ${viewingReceipt.transaction_reference || viewingReceipt.payment_uuid} • User: ${viewingReceipt.user?.name}` : ''}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 py-2">
          {receiptLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Loading payment receipt file...
            </div>
          ) : receiptUrl ? (
            <div className="bg-navy-950 p-2 rounded-xl border border-slate-750 flex items-center justify-center max-h-[65vh] overflow-auto">
              <img
                src={receiptUrl}
                alt="Receipt Proof"
                className="max-h-[60vh] max-w-full object-contain rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="hidden py-10 text-center text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-500" />
                <p className="text-xs">Document format may be PDF or non-image.</p>
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs text-magenta-400 font-bold underline"
                >
                  Open in New Tab
                </a>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-sm">
              Receipt file could not be displayed.
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-750">
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCloseReceipt}
              >
                Close
              </Button>
              {receiptUrl && (
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-magenta-400 hover:text-magenta-300 font-bold underline"
                >
                  Open Original
                </a>
              )}
            </div>

            {viewingReceipt?.status === 'pending' ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    const p = viewingReceipt;
                    handleCloseReceipt();
                    setRejectingPayment(p);
                    setRejectReason('');
                  }}
                >
                  Reject Proof
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={actionLoading === viewingReceipt.id}
                  onClick={() => handleApprove(viewingReceipt)}
                >
                  Approve Payment
                </Button>
              </div>
            ) : (
              viewingReceipt?.receipt_path && (
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={actionLoading === viewingReceipt.id}
                  onClick={() => handleDeleteReceipt(viewingReceipt)}
                  title="Permanently delete receipt image from server storage"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Delete File
                </Button>
              )
            )}
          </div>
        </div>
      </Modal>

      {/* Reject Payment Reason Modal */}
      <Modal
        isOpen={Boolean(rejectingPayment)}
        onClose={() => { setRejectingPayment(null); setRejectReason(''); }}
        title="Reject Payment Proof"
        subtitle={rejectingPayment ? `TID: ${rejectingPayment.transaction_reference} • Candidate: ${rejectingPayment.user?.name}` : ''}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Rejection Reason *
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Transaction ID was not found in JazzCash statement, or receipt was unreadable."
              className="w-full bg-navy-950 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-magenta-500 h-24"
              required
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              This reason will be visible to the user so they can correct and re-submit.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-750">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => { setRejectingPayment(null); setRejectReason(''); }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={actionLoading === rejectingPayment?.id}
            >
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
