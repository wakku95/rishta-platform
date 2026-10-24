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
  MessageSquare,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Camera,
} from 'lucide-react';
import {
  getReceivedRequests,
  getSentRequests,
  acceptRequest,
  declineRequest,
  cancelRequest,
  requestVerification,
  getMyAssistedInquiries,
  getRequestCounts,
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
import AcceptProposalModal from '../../components/requests/AcceptProposalModal';
import ReplyProposalModal from '../../components/requests/ReplyProposalModal';
import EditProposalModal from '../../components/requests/EditProposalModal';
import PhotoExchangeModal from '../../components/requests/PhotoExchangeModal';
import IdentityVerificationGateModal from '../../components/verification/IdentityVerificationGateModal';
import useAuth from '../../hooks/useAuth';

export default function RequestsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent' | 'assisted'
  const [statusFilter, setStatusFilter] = useState('');
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ received: 0, sent: 0, assisted_inquiries: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Actions
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [confirmAcceptOpen, setConfirmAcceptOpen] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [editProposalModalOpen, setEditProposalModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [confirmDeclineOpen, setConfirmDeclineOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [confirmPhotoRequestOpen, setConfirmPhotoRequestOpen] = useState(false);
  const [photoRequestTarget, setPhotoRequestTarget] = useState(null);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [unlockRequest, setUnlockRequest] = useState(null);
  const [identityGateOpen, setIdentityGateOpen] = useState(false);

  useEffect(() => {
    fetchRequests(activeTab, page, statusFilter);
  }, [activeTab, page, statusFilter]);

  // Handle returning from Safepay Checkout redirect
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paymentStatus = searchParams.get('payment');
    const reqCode = searchParams.get('request');

    if (paymentStatus === 'success') {
      setActionFeedback({
        type: 'success',
        message: 'Payment completed successfully via Safepay! Please complete phone SMS verification below.',
      });
      if (reqCode) {
        setUnlockRequest({ request_code: reqCode });
        setUnlockModalOpen(true);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'failed') {
      setActionFeedback({
        type: 'error',
        message: 'Safepay payment could not be completed or was rejected. Please try again.',
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
      setActionFeedback({
        type: 'info',
        message: 'Safepay payment process was cancelled.',
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchCounts = async () => {
    try {
      const res = await getRequestCounts();
      if (res.success && res.data) {
        setCounts(res.data);
      }
    } catch (e) {
      // quiet
    }
  };

  useEffect(() => {
    fetchCounts();
  }, [activeTab]);

  const fetchRequests = async (tab, targetPage = 1, status = '') => {
    setLoading(true);
    try {
      if (tab === 'assisted') {
        const res = await getMyAssistedInquiries({ page: targetPage });
        setRequests(res.data || []);
        setMeta(res.meta || null);
      } else {
        const params = { page: targetPage };
        if (status) params.status = status;

        const res = tab === 'received'
          ? await getReceivedRequests(params)
          : await getSentRequests(params);

        setRequests(res.data || []);
        setMeta(res.meta || null);
      }
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
      setConfirmAcceptOpen(false);
      const errData = err.response?.data;
      const errCode = errData?.error_code || errData?.error;
      const isIdentityReq = errCode === 'IDENTITY_VERIFICATION_REQUIRED'
        || errData?.errors?.identity_verified === false
        || errData?.message?.toLowerCase().includes('identity verification')
        || errData?.message?.toLowerCase().includes('cnic');

      if (isIdentityReq) {
        setIdentityGateOpen(true);
      } else {
        setActionFeedback({ type: 'error', message: errData?.message || 'Failed to accept request.' });
      }
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

  const handleRequestVerification = async (requestCode, type) => {
    setActionLoading(true);
    try {
      const res = await requestVerification(requestCode, type);
      setActionFeedback({ type: 'success', message: res.message });
      fetchRequests(activeTab, page, statusFilter);
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.response?.data?.message || 'Verification request failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPhotoRequest = async () => {
    if (!photoRequestTarget) return;
    const reqCode = photoRequestTarget.request_code;
    setConfirmPhotoRequestOpen(false);
    await handleRequestVerification(reqCode, 'photo');
    setPhotoRequestTarget(null);
  };

  const getAssistedStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return (
          <Badge variant="warning" className="inline-flex items-center gap-1 font-bold">
            <Clock className="w-3 h-3" />
            <span>Under Review / زیرِ غور</span>
          </Badge>
        );
      case 'contacted':
        return (
          <Badge variant="info" className="inline-flex items-center gap-1 font-bold">
            <Clock className="w-3 h-3" />
            <span>Matchmaker Reviewing / رابطہ ہوا</span>
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="purple" className="inline-flex items-center gap-1 font-bold">
            <Sparkles className="w-3 h-3" />
            <span>In Coordination / پیشرفت میں</span>
          </Badge>
        );
      case 'introduced':
        return (
          <Badge variant="success" className="inline-flex items-center gap-1 font-bold">
            <CheckCircle className="w-3 h-3" />
            <span>Introduced / تعارف کروایا گیا</span>
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="danger" className="inline-flex items-center gap-1 font-bold">
            <XCircle className="w-3 h-3" />
            <span>Not Suitable / غیر موزوں</span>
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="neutral" className="inline-flex items-center gap-1 font-bold">
            <Ban className="w-3 h-3" />
            <span>Cancelled / منسوخ</span>
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getStatusBadge = (status, adminStatus, isSender) => {
    if (adminStatus === 'needs_revision') {
      return (
        <Badge variant="warning" className="inline-flex items-center gap-1 font-bold bg-amber-500/20 text-amber-300 border-amber-500/40">
          <AlertCircle className="w-3 h-3 text-amber-400" />
          <span>Needs Correction / ترمیم درکار ہے</span>
        </Badge>
      );
    }

    switch (status) {
      case 'pending':
        if (isSender && adminStatus === 'pending_review') {
          return (
            <Badge variant="warning" className="inline-flex items-center gap-1 font-bold">
              <Clock className="w-3 h-3" />
              <span>Under Admin Review / زیرِ جائزہ</span>
            </Badge>
          );
        }
        if (isSender && adminStatus === 'rejected') {
          return (
            <Badge variant="danger" className="inline-flex items-center gap-1 font-bold">
              <XCircle className="w-3 h-3" />
              <span>Review Rejected</span>
            </Badge>
          );
        }
        return (
          <Badge variant="warning" className="inline-flex items-center gap-1 font-bold">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </Badge>
        );
      case 'accepted':
        if (adminStatus === 'pending_review') {
          return (
            <Badge variant="warning" className="inline-flex items-center gap-1 font-bold">
              <Clock className="w-3 h-3" />
              <span>{isSender ? 'Response Under Review' : 'Awaiting Admin Approval'}</span>
            </Badge>
          );
        }
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
    <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
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
        <div className="flex rounded-xl bg-navy-850 p-1 border border-slate-750 max-w-full sm:max-w-lg overflow-x-auto">
          <button
            onClick={() => { setActiveTab('received'); setPage(1); }}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'received'
                ? 'bg-gradient-to-r from-magenta-500 to-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Inbox className="w-4 h-4 shrink-0" />
            <span>Received</span>
            {counts.received > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-navy-900/80 font-bold border border-white/20">
                {counts.received}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('sent'); setPage(1); }}
            className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sent'
                ? 'bg-gradient-to-r from-magenta-500 to-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4 shrink-0" />
            <span>Sent</span>
            {counts.sent > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-navy-900/80 font-bold border border-white/20">
                {counts.sent}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('assisted'); setPage(1); }}
            className={`flex-1 min-w-[145px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'assisted'
                ? 'bg-gradient-to-r from-magenta-500 to-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Assisted Inquiries</span>
            {counts.assisted_inquiries > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-navy-900/80 font-bold border border-white/20">
                {counts.assisted_inquiries}
              </span>
            )}
          </button>
        </div>

        {/* Status Filter (Proposal tabs only) */}
        {activeTab !== 'assisted' && (
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
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20">
          <LoadingState text={`Loading ${activeTab === 'assisted' ? 'assisted profile inquiries' : `${activeTab} rishta requests`}...`} />
        </div>
      ) : requests.length === 0 ? (
        <div className="py-12">
          {activeTab === 'assisted' ? (
            <EmptyState
              icon={Sparkles}
              title="No assisted inquiries yet / کوئی اسسٹڈ رابطہ نہیں"
              description="You have not inquired about any matchmaker-assisted profiles yet. When you inquire about assisted profiles, they will appear here along with live coordinator status updates."
              action={
                <Link to="/search">
                  <Button variant="primary">Browse Assisted Profiles</Button>
                </Link>
              }
            />
          ) : (
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
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'assisted' ? (
            requests.map((inq) => {
              const listing = inq.listing;
              return (
                <Card
                  key={inq.id}
                  className="p-3.5 sm:p-5 bg-navy-800 border border-slate-750 shadow-md hover:border-magenta-500/40 transition-colors rounded-2xl flex flex-col gap-3 sm:gap-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                    {/* Left: Inquiry Info & Listing Summary */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-400 bg-navy-900 px-2.5 py-1 rounded-lg border border-slate-750">
                          Inquiry #{inq.id}
                        </span>
                        {getAssistedStatusBadge(inq.status)}
                        <span className="text-xs text-slate-400">
                          {inq.created_at ? new Date(inq.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>

                      {listing ? (
                        <div>
                          <div className="flex items-baseline gap-2">
                            <Link
                              to={`/assisted-listings/${listing.listing_code}`}
                              className="font-serif text-lg font-bold text-white hover:text-magenta-400 transition-colors"
                            >
                              Assisted Listing #{listing.listing_code}
                            </Link>
                            <span className="text-xs font-bold text-slate-400">
                              ({listing.age ? `${listing.age} yrs • ` : ''}{listing.gender} • {listing.city})
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {[listing.education, listing.profession, listing.marital_status].filter(Boolean).join(' • ')}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">Listing details no longer available</p>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-750/70">
                      {listing && (
                        <Link to={`/assisted-listings/${listing.listing_code}`}>
                          <Button variant="secondary" size="sm" icon={Eye} className="font-bold">
                            View Listing / مکمل تفصیل
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* User Submitted Message */}
                  {inq.message && (
                    <div className="w-full pt-3 border-t border-slate-750/70">
                      <div className="bg-navy-900/80 p-3 rounded-xl border border-slate-750/80 text-xs">
                        <span className="font-bold text-slate-400 block text-[10px] uppercase mb-1">
                          Your Submitted Message / آپ کا پیغام:
                        </span>
                        <p className="text-slate-200 italic leading-relaxed">"{inq.message}"</p>
                      </div>
                    </div>
                  )}

                  {/* Admin Coordinator Notes */}
                  {inq.admin_notes && (
                    <div className="w-full p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-purple-300 uppercase text-[10px]">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Matchmaker Update / اسسٹنٹ کوآرڈینیٹر کا جواب:</span>
                      </div>
                      <p className="leading-relaxed pl-5 italic text-purple-100">{inq.admin_notes}</p>
                    </div>
                  )}
                </Card>
              );
            })
          ) : (
            requests.map((req) => {
            const candidate = req.candidate_profile;
            return (
              <Card
                key={req.request_code}
                className="p-3.5 sm:p-5 bg-navy-800 border border-slate-750 shadow-md hover:border-magenta-500/40 transition-colors rounded-2xl flex flex-col gap-3 sm:gap-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                  {/* Left: Request info & Candidate summary */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {req.request_code}
                      </span>
                      {getStatusBadge(req.status, req.admin_status, req.is_sender)}
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
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-750/70">
                    {candidate && (
                      <Link to={`/profiles/${candidate.profile_code}`}>
                        <Button variant="secondary" size="sm" icon={Eye} className="font-bold">
                          View Profile / مکمل پروفائل
                        </Button>
                      </Link>
                    )}

                    {/* Accepted Connection Actions */}
                    {req.status === 'accepted' && (
                      req.admin_status === 'pending_review' ? (
                        <span className="text-xs text-amber-300 font-semibold bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{req.is_sender ? 'Response under admin moderation' : 'Awaiting admin approval of your response'}</span>
                        </span>
                      ) : req.admin_status === 'needs_revision' ? (
                        req.can_edit_response ? (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={AlertCircle}
                            onClick={() => {
                              setSelectedRequest(req);
                              if (req.is_sender) {
                                setReplyModalOpen(true);
                              } else {
                                setConfirmAcceptOpen(true);
                              }
                            }}
                            className="font-bold shadow-md bg-amber-600 hover:bg-amber-500 text-white"
                          >
                            Edit & Resubmit Response
                          </Button>
                        ) : (
                          <span className="text-xs text-amber-300 font-semibold bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Candidate has been requested by admin to revise their response</span>
                          </span>
                        )
                      ) : req.is_sender && req.receiver_questions && !req.sender_answers ? (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={MessageSquare}
                          onClick={() => {
                            setSelectedRequest(req);
                            setReplyModalOpen(true);
                          }}
                          className="font-bold shadow-md bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                        >
                          Answer Candidate's Questions
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Lock}
                          onClick={() => {
                            setUnlockRequest(req);
                            setUnlockModalOpen(true);
                          }}
                          className="font-bold shadow-md bg-gradient-to-r from-magenta-500 to-purple-600 text-white"
                        >
                          Unlock Verified Contact
                        </Button>
                      )
                    )}

                    {/* Received Pending Actions */}
                    {activeTab === 'received' && req.status === 'pending' && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          icon={CheckCircle}
                          onClick={() => {
                            setSelectedRequest(req);
                            const isVerified = Boolean(req.i_am_identity_verified || user?.is_identity_verified);
                            if (!isVerified) {
                              setIdentityGateOpen(true);
                            } else {
                              setConfirmAcceptOpen(true);
                            }
                          }}
                          className="whitespace-nowrap font-bold"
                        >
                          Review & Accept Proposal
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={XCircle}
                          onClick={() => { setSelectedRequest(req); setConfirmDeclineOpen(true); }}
                          className="whitespace-nowrap"
                        >
                          Decline
                        </Button>
                      </>
                    )}

                    {/* Sent Pending Actions */}
                    {activeTab === 'sent' && req.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        {req.admin_status === 'needs_revision' && (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={AlertCircle}
                            onClick={() => { setSelectedRequest(req); setEditProposalModalOpen(true); }}
                            className="whitespace-nowrap font-bold bg-amber-600 hover:bg-amber-500 text-white"
                          >
                            Edit Proposal
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => { setSelectedRequest(req); setConfirmCancelOpen(true); }}
                          className="whitespace-nowrap"
                        >
                          Cancel Request
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Proposal Q&A Section */}
                {(req.sender_intro || req.sender_questions || req.receiver_intro || req.receiver_answers || req.receiver_questions || req.sender_answers || (req.is_sender && (req.receiver_response_pending_moderation || (req.status === 'accepted' && req.admin_status !== 'approved'))) || (!req.is_sender && (req.sender_answers_pending_moderation || (req.status === 'accepted' && req.admin_status !== 'approved' && req.has_sender_answers)))) && (
                  <div className="w-full pt-3 border-t border-slate-750/70 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-magenta-400">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Proposal Communication & Questions / رشتہ انکوائری و سوالات</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {req.sender_intro && (
                        <div className="bg-navy-900/80 p-2.5 rounded-xl border border-slate-750/80">
                          <span className="font-bold text-slate-400 block text-[10px] uppercase">
                            {req.is_sender ? 'Your Introduction' : 'Candidate Introduction'}:
                          </span>
                          <p className="text-slate-200 mt-1 italic leading-relaxed">"{req.sender_intro}"</p>
                        </div>
                      )}

                      {req.sender_questions && (
                        <div className="bg-navy-900/80 p-2.5 rounded-xl border border-cyan-500/20">
                          <span className="font-bold text-cyan-400 block text-[10px] uppercase">
                            {req.is_sender ? 'Your Questions for Candidate' : 'Candidate\'s Questions for You'}:
                          </span>
                          <p className="text-slate-200 mt-1 italic leading-relaxed">"{req.sender_questions}"</p>
                        </div>
                      )}

                      {req.is_sender && (req.receiver_response_pending_moderation || (req.status === 'accepted' && req.admin_status !== 'approved')) ? (
                        <div className="col-span-1 md:col-span-2 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                          {req.admin_status === 'needs_revision' ? (
                            <>
                              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                              <span>Candidate has been requested by administration to revise their response before delivery.</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                              <span>Candidate has responded to your proposal! Their answers are currently under admin review and will appear here once approved.</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <>
                          {req.receiver_intro && (
                            <div className="bg-navy-900/80 p-2.5 rounded-xl border border-purple-500/20">
                              <span className="font-bold text-purple-400 block text-[10px] uppercase">
                                {req.is_sender ? "Candidate's Family & Background" : 'Your Family & Background'}:
                              </span>
                              <p className="text-slate-200 mt-1 italic leading-relaxed">"{req.receiver_intro}"</p>
                            </div>
                          )}

                          {req.receiver_answers && (
                            <div className="bg-navy-900/80 p-2.5 rounded-xl border border-emerald-500/20">
                              <span className="font-bold text-emerald-400 block text-[10px] uppercase">
                                {req.is_sender ? "Candidate's Answers" : 'Your Answers'}:
                              </span>
                              <p className="text-slate-200 mt-1 italic leading-relaxed">"{req.receiver_answers}"</p>
                            </div>
                          )}

                          {req.receiver_questions && (
                            <div className="bg-navy-900/80 p-2.5 rounded-xl border border-amber-500/20">
                              <span className="font-bold text-amber-400 block text-[10px] uppercase">
                                {req.is_sender ? "Candidate's Questions" : 'Your Questions'}:
                              </span>
                              <p className="text-slate-200 mt-1 italic leading-relaxed">"{req.receiver_questions}"</p>
                            </div>
                          )}

                          {!req.is_sender && (req.sender_answers_pending_moderation || (req.status === 'accepted' && req.admin_status !== 'approved' && req.has_sender_answers)) ? (
                            <div className="col-span-1 md:col-span-2 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                              {req.admin_status === 'needs_revision' ? (
                                <>
                                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                                  <span>Sender has been requested by administration to revise their answers before delivery.</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                                  <span>Sender has submitted answers to your questions! They are currently under moderation review and will appear here shortly.</span>
                                </>
                              )}
                            </div>
                          ) : req.sender_answers ? (
                            <div className="bg-navy-900/80 p-2.5 rounded-xl border border-teal-500/20">
                              <span className="font-bold text-teal-400 block text-[10px] uppercase">
                                {req.is_sender ? 'Your Answers to Questions' : "Candidate's Answers"}:
                              </span>
                              <p className="text-slate-200 mt-1 italic leading-relaxed">"{req.sender_answers}"</p>
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Mutual Trust & Next Steps Gate (Phase 4.5) */}
                {req.status === 'accepted' && req.admin_status === 'approved' && (!req.receiver_questions || req.sender_answers) && (
                  <div className="w-full mt-2 p-3.5 bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-magenta-500/30 rounded-xl space-y-2.5 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-magenta-400" />
                          <span>Stage: Mutual Q&A Completed / سوال و جواب کا مرحلہ مکمل</span>
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Carefully evaluate candidate answers. You may exchange photos with candidate before deciding to unlock contact details.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Photo Exchange Action */}
                        {req.candidate_photo_shared ? (
                          <Button
                            size="sm"
                            variant="primary"
                            icon={Camera}
                            onClick={() => { setSelectedRequest(req); setPhotoModalOpen(true); }}
                            className="text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm"
                          >
                            📷 View Candidate Photo
                          </Button>
                        ) : req.photo_requested_by_candidate && req.photo_requested_by_me ? (
                          <Button
                            size="sm"
                            variant="primary"
                            icon={Camera}
                            onClick={() => { setSelectedRequest(req); setPhotoModalOpen(true); }}
                            className="text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm"
                          >
                            {req.my_photo_shared ? '📷 Mutual Photo: Awaiting Candidate' : '📷 Mutual Exchange: Upload My Photo'}
                          </Button>
                        ) : req.photo_requested_by_candidate ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="primary"
                              icon={Camera}
                              onClick={() => { setSelectedRequest(req); setPhotoModalOpen(true); }}
                              className="text-xs font-bold bg-gradient-to-r from-magenta-600 to-pink-600 text-white shadow-sm"
                            >
                              {req.my_photo_shared ? '📷 Photo Exchanged' : '📷 Candidate Requested Photo (Upload)'}
                            </Button>
                            {!req.photo_requested_by_me && (
                              <Button
                                size="sm"
                                variant="secondary"
                                icon={Camera}
                                disabled={actionLoading}
                                onClick={() => {
                                  setPhotoRequestTarget(req);
                                  setConfirmPhotoRequestOpen(true);
                                }}
                                className="text-xs font-semibold text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/10"
                              >
                                Request Their Photo Too
                              </Button>
                            )}
                          </div>
                        ) : req.photo_requested_by_me ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={Camera}
                            onClick={() => { setSelectedRequest(req); setPhotoModalOpen(true); }}
                            className="text-xs font-semibold text-cyan-300 border-cyan-500/40"
                          >
                            📷 {req.my_photo_shared ? 'Manage My Photo' : 'Photo Requested (Awaiting Candidate)'}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={Camera}
                            disabled={actionLoading}
                            onClick={() => {
                              setPhotoRequestTarget(req);
                              setConfirmPhotoRequestOpen(true);
                            }}
                            className="text-xs font-semibold"
                          >
                            Request Photo
                          </Button>
                        )}

                        {/* CNIC Verified Status Badge (Safe & Admin Audited) */}
                        {req.candidate_nic_shared || req.candidate_is_identity_verified ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-lg shadow-sm">
                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>CNIC & Identity Verified ✅</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] text-slate-400 bg-slate-900/50 border border-slate-750 rounded-lg">
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>Verification Pending</span>
                          </span>
                        )}

                        {/* Unlock Contact */}
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Unlock}
                          onClick={() => {
                            setUnlockRequest(req);
                            setUnlockModalOpen(true);
                          }}
                          className="font-bold text-xs bg-gradient-to-r from-magenta-500 to-purple-600 shadow-md text-white"
                        >
                          Satisfied? Unlock Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Needs Revision Feedback Alert */}
                {req.admin_status === 'needs_revision' && req.admin_notes && (
                  <div className="w-full p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-400 uppercase text-[11px]">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{req.can_edit_response ? 'Moderator Feedback / درکار ترمیم:' : 'Moderator Update:'}</span>
                    </div>
                    <p className="leading-relaxed pl-5 italic text-amber-100">
                      {req.can_edit_response ? `"${req.admin_notes}"` : 'The other candidate has been requested by administration to revise their answers before delivery.'}
                    </p>
                    {req.can_edit_response && (
                      <div className="pl-5 pt-1">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setSelectedRequest(req);
                            if (req.status === 'pending') {
                              setEditProposalModalOpen(true);
                            } else if (req.is_sender) {
                              setReplyModalOpen(true);
                            } else {
                              setConfirmAcceptOpen(true);
                            }
                          }}
                          className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                        >
                          Edit & Resubmit Answers
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {req.admin_status === 'rejected' && req.admin_notes && (
                  <div className="w-full p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
                    <strong className="block text-[11px] uppercase text-rose-400">Admin Review Note:</strong>
                    <span>{req.admin_notes}</span>
                  </div>
                )}
              </Card>
            );
          }))}

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

      {/* Accept Proposal Modal */}
      <AcceptProposalModal
        isOpen={confirmAcceptOpen}
        onClose={() => setConfirmAcceptOpen(false)}
        request={selectedRequest}
        onSuccess={() => {
          setActionFeedback({ type: 'success', message: 'Proposal accepted successfully!' });
          fetchRequests(activeTab, page, statusFilter);
        }}
      />

      {/* Reply Proposal Modal (Sender answers receiver's questions) */}
      <ReplyProposalModal
        isOpen={replyModalOpen}
        onClose={() => {
          setReplyModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onSuccess={() => {
          setActionFeedback({ type: 'success', message: 'Your answers have been submitted for moderation review!' });
          fetchRequests(activeTab, page, statusFilter);
        }}
      />

      {/* Edit Initial Proposal Modal (When Admin requests revision) */}
      <EditProposalModal
        isOpen={editProposalModalOpen}
        onClose={() => {
          setEditProposalModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onSuccess={() => {
          setActionFeedback({ type: 'success', message: 'Your proposal has been updated and resubmitted for moderation review!' });
          fetchRequests(activeTab, page, statusFilter);
        }}
      />

      {/* Private Photo Exchange Modal */}
      <PhotoExchangeModal
        isOpen={photoModalOpen}
        onClose={() => {
          setPhotoModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onSuccess={() => {
          fetchRequests(activeTab, page, statusFilter);
        }}
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

      <ConfirmDialog
        isOpen={confirmPhotoRequestOpen}
        onClose={() => {
          setConfirmPhotoRequestOpen(false);
          setPhotoRequestTarget(null);
        }}
        onConfirm={handleConfirmPhotoRequest}
        title="Request Candidate Photo / تصویر کی درخواست"
        variant="primary"
        icon={Camera}
        confirmText="جی ہاں، ریکویسٹ بھیجیں"
        cancelText="منسوخ کریں"
        loading={actionLoading}
        description={
          <div className="space-y-3 text-left">
            <div className="p-3 bg-navy-900/80 border border-slate-700/60 rounded-xl space-y-1.5">
              <p className="text-sm font-semibold text-white">
                کیا آپ امیدوار سے تصویر شیئر کرنے کی درخواست کرنا چاہتے ہیں؟
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                امیدوار کے لائیو تصویر اپلوڈ کرنے اور <strong>ایڈمن کی کوالٹی جانچ و منظوری (Approval)</strong> کے بعد، واٹر مارک شدہ تصویر دیکھنے کے لیے <strong>Rs. 300</strong> فیس ادا کرنی ہوگی۔
              </p>
            </div>
            <div className="p-2.5 bg-cyan-950/40 border border-cyan-800/50 rounded-lg text-xs text-cyan-200 flex items-start gap-2">
              <span className="text-base shrink-0">🛡️</span>
              <span className="leading-snug">
                <strong>فیس کی حفاظت:</strong> ایڈمن کے منظور کرنے سے پہلے آپ سے <strong>کوئی فیس چارج نہیں ہوگی</strong>۔ اگر امیدوار غلط یا غیر معیاری تصویر دے گا تو آپ کے پیسے بالکل ضائع نہیں ہوں گے۔
              </span>
            </div>
          </div>
        }
      />

      {identityGateOpen && (
        <IdentityVerificationGateModal
          isOpen={identityGateOpen}
          onClose={() => setIdentityGateOpen(false)}
          actionType="accept"
          onVerified={() => {
            setIdentityGateOpen(false);
            if (selectedRequest) {
              setConfirmAcceptOpen(true);
            }
            fetchRequests(activeTab, page, statusFilter);
          }}
        />
      )}
    </div>
  );
}
