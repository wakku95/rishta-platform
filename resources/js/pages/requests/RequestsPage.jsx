import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Inbox,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  Hourglass,
  Eye,
  Calendar,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  getReceivedRequests,
  getSentRequests,
  acceptRequest,
  declineRequest,
  cancelRequest,
} from '../../api/requests';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Alert from '../../components/ui/Alert';
import Pagination from '../../components/ui/Pagination';
import ContactUnlockModal from '../../components/requests/ContactUnlockModal';

export default function RequestsPage() {
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent'
  const [statusFilter, setStatusFilter] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Actions
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [confirmAcceptOpen, setConfirmAcceptOpen] = useState(false);
  const [confirmDeclineOpen, setConfirmDeclineOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [unlockRequest, setUnlockRequest] = useState(null);

  useEffect(() => {
    fetchRequests(activeTab, page, statusFilter);
  }, [activeTab, page, statusFilter]);

  const fetchRequests = async (tab, targetPage = 1, status = '') => {
    setLoading(true);
    try {
      const params = { page: targetPage };
      if (status) params.status = status;

      const res = tab === 'received'
        ? await getReceivedRequests(params)
        : await getSentRequests(params);

      setRequests(res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      await acceptRequest(selectedRequest.request_code);
      setConfirmAcceptOpen(false);
      setActionFeedback({ type: 'success', message: 'Rishta request accepted!' });
      fetchRequests(activeTab, page, statusFilter);
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to accept request.' });
      setConfirmAcceptOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      await declineRequest(selectedRequest.request_code);
      setConfirmDeclineOpen(false);
      setActionFeedback({ type: 'info', message: 'Rishta request declined.' });
      fetchRequests(activeTab, page, statusFilter);
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to decline request.' });
      setConfirmDeclineOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      await cancelRequest(selectedRequest.request_code);
      setConfirmCancelOpen(false);
      setActionFeedback({ type: 'info', message: 'Rishta request cancelled.' });
      fetchRequests(activeTab, page, statusFilter);
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to cancel request.' });
      setConfirmCancelOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="warning" className="inline-flex items-center gap-1 font-bold">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="success" className="inline-flex items-center gap-1 font-bold">
            <CheckCircle className="w-3 h-3" />
            <span>Accepted</span>
          </Badge>
        );
      case 'declined':
        return (
          <Badge variant="danger" className="inline-flex items-center gap-1 font-bold">
            <XCircle className="w-3 h-3" />
            <span>Declined</span>
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="neutral" className="inline-flex items-center gap-1 font-bold">
            <Ban className="w-3 h-3" />
            <span>Cancelled</span>
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="neutral" className="inline-flex items-center gap-1 font-bold">
            <Hourglass className="w-3 h-3" />
            <span>Expired</span>
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Rishta Requests
        </h1>
        <p className="text-sm text-slate-400 font-medium mt-1">
          Manage received formal expressions of interest and track requests you sent to candidate profiles.
        </p>
      </div>

      {actionFeedback && (
        <Alert
          variant={actionFeedback.type === 'error' ? 'danger' : actionFeedback.type === 'success' ? 'success' : 'info'}
          dismissible
          onClose={() => setActionFeedback(null)}
        >
          {actionFeedback.message}
        </Alert>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex rounded-xl bg-navy-850 p-1 border border-slate-750 max-w-xs">
          <button
            onClick={() => { setActiveTab('received'); setPage(1); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'received'
                ? 'bg-gradient-to-r from-magenta-500 to-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Received</span>
          </button>
          <button
            onClick={() => { setActiveTab('sent'); setPage(1); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sent'
                ? 'bg-gradient-to-r from-magenta-500 to-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Sent</span>
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Filter status:</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-xs font-medium rounded-xl border border-slate-700 py-1.5 px-3 bg-navy-750 text-white focus:border-magenta-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20">
          <LoadingState text={`Loading ${activeTab} rishta requests...`} />
        </div>
      ) : requests.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={activeTab === 'received' ? Inbox : Send}
            title={activeTab === 'received' ? 'No received requests' : 'No sent requests'}
            description={
              activeTab === 'received'
                ? 'You have not received any Rishta requests yet. When candidates express formal interest in your profile, they will appear here.'
                : 'You have not sent any Rishta requests yet. Search active candidates and send a formal expression of interest.'
            }
            action={
              activeTab === 'sent' && (
                <Link to="/search">
                  <Button variant="primary">Browse Candidates</Button>
                </Link>
              )
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const candidate = req.candidate_profile;
            return (
              <Card
                key={req.request_code}
                className="p-5 sm:p-6 bg-navy-800 border border-slate-750 shadow-md hover:border-magenta-500/40 transition-colors rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Request info & Candidate summary */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {req.request_code}
                    </span>
                    {getStatusBadge(req.status)}
                    <span className="text-xs text-slate-400">
                      {req.created_at ? new Date(req.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>

                  {candidate ? (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <Link
                          to={`/profiles/${candidate.profile_code}`}
                          className="font-serif text-lg font-bold text-white hover:text-magenta-400 transition-colors"
                        >
                          Candidate #{candidate.profile_code}
                        </Link>
                        <span className="text-xs font-bold text-slate-400">
                          ({candidate.age} yrs • {candidate.gender} • {candidate.city})
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {candidate.education} • {candidate.profession} • {candidate.religion}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Candidate profile unavailable</p>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  {candidate && (
                    <Link to={`/profiles/${candidate.profile_code}`}>
                      <Button variant="secondary" size="sm" icon={Eye}>
                        View Profile
                      </Button>
                    </Link>
                  )}

                  {/* Accepted Connection Actions */}
                  {req.status === 'accepted' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Lock}
                      onClick={() => {
                        setUnlockRequest(req);
                        setUnlockModalOpen(true);
                      }}
                      className="font-bold shadow-md"
                    >
                      Contact Details & Verification
                    </Button>
                  )}

                  {/* Received Pending Actions */}
                  {activeTab === 'received' && req.status === 'pending' && (
                    <>
                      <Button
                        variant="success"
                        size="sm"
                        icon={CheckCircle}
                        onClick={() => { setSelectedRequest(req); setConfirmAcceptOpen(true); }}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={XCircle}
                        onClick={() => { setSelectedRequest(req); setConfirmDeclineOpen(true); }}
                      >
                        Decline
                      </Button>
                    </>
                  )}

                  {/* Sent Pending Actions */}
                  {activeTab === 'sent' && req.status === 'pending' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => { setSelectedRequest(req); setConfirmCancelOpen(true); }}
                    >
                      Cancel Request
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}

          {meta && meta.last_page > 1 && (
            <div className="flex justify-center pt-6">
              <Pagination
                currentPage={meta.current_page}
                totalPages={meta.last_page}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* Phase 5 Contact Unlock & Payment Modal */}
      {unlockRequest && (
        <ContactUnlockModal
          isOpen={unlockModalOpen}
          onClose={() => {
            setUnlockModalOpen(false);
            setUnlockRequest(null);
          }}
          requestCode={unlockRequest.request_code}
          candidateProfile={unlockRequest.candidate_profile}
          onUnlocked={() => {
            fetchRequests(activeTab, page, statusFilter);
          }}
        />
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={confirmAcceptOpen}
        onClose={() => setConfirmAcceptOpen(false)}
        onConfirm={handleAccept}
        title="Accept Rishta Request"
        message="Are you sure you want to accept this Rishta request? Both candidates will enter the mutual interest stage."
        confirmText="Accept Request"
        cancelText="Cancel"
        variant="primary"
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={confirmDeclineOpen}
        onClose={() => setConfirmDeclineOpen(false)}
        onConfirm={handleDecline}
        title="Decline Rishta Request"
        message="Are you sure you want to decline this Rishta request? This sender will be permanently prohibited from re-requesting you."
        confirmText="Decline Request"
        cancelText="Review Again"
        variant="danger"
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Rishta Request"
        message="Are you sure you want to cancel your sent Rishta request?"
        confirmText="Yes, Cancel"
        cancelText="Keep"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
