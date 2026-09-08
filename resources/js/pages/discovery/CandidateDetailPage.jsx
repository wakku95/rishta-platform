import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  GraduationCap,
  Briefcase,
  Ruler,
  HeartHandshake,
  Lock,
  Calendar,
  AlertCircle,
  Bookmark,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Heart,
} from 'lucide-react';
import { getPublicProfile } from '../../api/discovery';
import { addToShortlist, removeFromShortlist } from '../../api/shortlist';
import { sendRishtaRequest, acceptRequest, declineRequest, cancelRequest } from '../../api/requests';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function CandidateDetailPage() {
  const { profileCode } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Action states
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);

  // Dialog & modal states
  const [showSendModal, setShowSendModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Confirm dialogs
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [confirmDeclineOpen, setConfirmDeclineOpen] = useState(false);
  const [confirmAcceptOpen, setConfirmAcceptOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [profileCode]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPublicProfile(profileCode);
      if (res.data) {
        setProfile(res.data);
        if (res.data.viewer_context) {
          setIsShortlisted(Boolean(res.data.viewer_context.is_shortlisted));
          setActiveRequest(res.data.viewer_context.active_request);
        }
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('This candidate profile is no longer active or could not be found.');
      } else if (err.response?.status === 403) {
        setError(err.response.data.message || 'Email verification is required to view candidate profiles.');
      } else {
        setError('Failed to load candidate profile. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShortlist = async () => {
    if (shortlistLoading) return;
    setShortlistLoading(true);
    try {
      if (isShortlisted) {
        await removeFromShortlist(profileCode);
        setIsShortlisted(false);
      } else {
        await addToShortlist(profileCode);
        setIsShortlisted(true);
      }
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to update shortlist.' });
    } finally {
      setShortlistLoading(false);
    }
  };

  const handleSendRequest = async () => {
    setActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await sendRishtaRequest(profileCode);
      setShowSendModal(false);
      setActionFeedback({ type: 'success', message: 'Rishta request sent successfully!' });
      // Update active request in view
      if (res.data) {
        setActiveRequest({
          request_code: res.data.request_code,
          status: res.data.status,
          is_sender: true,
          created_at: res.data.created_at,
          expires_at: res.data.expires_at,
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send Rishta request.';
      setActionFeedback({ type: 'error', message: msg });
      setShowSendModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!activeRequest) return;
    setActionLoading(true);
    try {
      const res = await acceptRequest(activeRequest.request_code);
      setConfirmAcceptOpen(false);
      setActionFeedback({ type: 'success', message: 'Rishta request accepted!' });
      setActiveRequest({
        ...activeRequest,
        status: 'accepted',
      });
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to accept request.' });
      setConfirmAcceptOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!activeRequest) return;
    setActionLoading(true);
    try {
      await declineRequest(activeRequest.request_code);
      setConfirmDeclineOpen(false);
      setActionFeedback({ type: 'info', message: 'Rishta request declined.' });
      setActiveRequest(null);
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to decline request.' });
      setConfirmDeclineOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!activeRequest) return;
    setActionLoading(true);
    try {
      await cancelRequest(activeRequest.request_code);
      setConfirmCancelOpen(false);
      setActionFeedback({ type: 'info', message: 'Rishta request cancelled.' });
      setActiveRequest(null);
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to cancel request.' });
      setConfirmCancelOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const formatMaritalStatus = (status) => {
    switch (status) {
      case 'never_married':
        return 'Never Married';
      case 'divorced':
        return 'Divorced';
      case 'widowed':
        return 'Widowed';
      case 'separated':
        return 'Separated';
      default:
        return status;
    }
  };

  const formatManagedBy = (managed) => {
    switch (managed) {
      case 'myself':
        return 'Self (Candidate)';
      case 'parent':
        return 'Parent';
      case 'sibling':
        return 'Brother / Sister';
      case 'guardian':
        return 'Guardian';
      case 'family':
        return 'Family Member';
      default:
        return managed;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <LoadingState text="Loading candidate matrimonial profile..." />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-extrabold text-burgundy-900">Profile Unavailable</h2>
        <p className="text-sm text-stone-600 font-medium">{error}</p>
        <div className="pt-2">
          <Link to="/search">
            <Button variant="primary" icon={ArrowLeft}>
              Back to Candidate Search
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const faithDisplay = (profile.religion === 'Islam' && profile.sect)
    ? `${profile.religion} (${profile.sect})`
    : profile.religion;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/search"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-burgundy-800 hover:text-burgundy-950"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search Results
        </Link>
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

      {/* Main Candidate Header Card */}
      <Card className="p-6 sm:p-8 bg-white border-2 border-stone-300 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-stone-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                Matrimonial Biodata
              </span>
              {profile.verifications?.email_verified && (
                <Badge variant="success" className="inline-flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Email Verified</span>
                </Badge>
              )}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-burgundy-900 tracking-tight">
              Profile #{profile.profile_code}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1">
              Candidate profile managed by <strong className="text-charcoal-800">{formatManagedBy(profile.managed_by)}</strong>
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end">
            <span className="text-2xl sm:text-3xl font-serif font-extrabold text-charcoal-900">
              {profile.age} years
            </span>
            <span className="text-xs font-bold text-stone-500 capitalize flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-burgundy-700" />
              {profile.city}, Pakistan
            </span>
          </div>
        </div>

        {/* Action Bar (Shortlist & Rishta Request) */}
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant={isShortlisted ? 'secondary' : 'outline'}
              size="sm"
              icon={Bookmark}
              loading={shortlistLoading}
              onClick={handleToggleShortlist}
              className={isShortlisted ? 'bg-gold-50 border-gold-400 text-gold-800 font-bold' : 'font-bold'}
            >
              {isShortlisted ? 'Shortlisted' : 'Save to Shortlist'}
            </Button>
          </div>

          {/* Rishta Request Action Context */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!activeRequest ? (
              <Button
                variant="primary"
                size="sm"
                icon={Send}
                onClick={() => setShowSendModal(true)}
                className="font-bold w-full sm:w-auto"
              >
                Send Rishta Request
              </Button>
            ) : activeRequest.status === 'pending' && activeRequest.is_sender ? (
              <div className="flex items-center gap-2">
                <Badge variant="warning" className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Request Pending</span>
                </Badge>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirmCancelOpen(true)}
                >
                  Cancel Request
                </Button>
              </div>
            ) : activeRequest.status === 'pending' && !activeRequest.is_sender ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="success"
                  size="sm"
                  icon={CheckCircle}
                  onClick={() => setConfirmAcceptOpen(true)}
                >
                  Accept Request
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={XCircle}
                  onClick={() => setConfirmDeclineOpen(true)}
                >
                  Decline
                </Button>
              </div>
            ) : activeRequest.status === 'accepted' ? (
              <Badge variant="success" className="inline-flex items-center gap-1.5 py-1.5 px-3">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="font-bold">Rishta Request Accepted</span>
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Structured Demographics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Faith & Origin */}
          <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200 space-y-3">
            <h3 className="font-serif text-sm font-extrabold text-burgundy-900 uppercase tracking-wider pb-1 border-b border-stone-200">
              1. Demographics & Faith
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-0.5">
                <span className="text-stone-500 font-medium">Gender</span>
                <span className="font-extrabold text-charcoal-900 capitalize">{profile.gender}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-stone-500 font-medium">Faith & Sect</span>
                <span className="font-extrabold text-charcoal-900">{faithDisplay}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-stone-500 font-medium">Current City</span>
                <span className="font-extrabold text-charcoal-900">{profile.city}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-stone-500 font-medium">Marital Status</span>
                <span className="font-extrabold text-charcoal-900">{formatMaritalStatus(profile.marital_status)}</span>
              </div>
            </div>
          </div>

          {/* Education & Career */}
          <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200 space-y-3">
            <h3 className="font-serif text-sm font-extrabold text-burgundy-900 uppercase tracking-wider pb-1 border-b border-stone-200">
              2. Education & Vocation
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-0.5">
                <span className="text-stone-500 font-medium">Education</span>
                <span className="font-extrabold text-charcoal-900">{profile.education}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-stone-500 font-medium">Profession</span>
                <span className="font-extrabold text-charcoal-900">{profile.profession}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-stone-500 font-medium">Height</span>
                <span className="font-extrabold text-charcoal-900">
                  {profile.height_formatted || `${profile.height} cm`}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-stone-500 font-medium">Listing Status</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Active for Matrimonial
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Private Information Protection Notice Card */}
      <Card className="p-6 sm:p-8 bg-cream-50 border-2 border-gold-300/60 shadow-xs rounded-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-100 border border-gold-300 flex items-center justify-center text-burgundy-900 shrink-0 mt-0.5">
            <Lock className="w-5 h-5 text-burgundy-800" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif text-base font-extrabold text-burgundy-900">
              Private Information Strictly Protected
            </h3>
            <p className="text-xs sm:text-sm text-charcoal-700 leading-relaxed font-medium">
              To protect the honor, safety, and privacy of all candidates and their families,
              confidential personal statements, family backgrounds, phone numbers, and emails are
              never publicly displayed.
            </p>
            <p className="text-xs text-stone-500 font-medium">
              Private information is released only after mutual rishta expression of interest,
              recipient acceptance, and verified authorization by both parties.
            </p>
          </div>
        </div>
      </Card>

      {/* Modal: Confirm Send Rishta Request */}
      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="Send Formal Rishta Request"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-burgundy-50 border border-burgundy-200 rounded-xl">
            <Heart className="w-6 h-6 text-burgundy-700 shrink-0" />
            <div className="text-xs text-charcoal-800">
              <span className="font-bold block text-sm text-burgundy-900 mb-0.5">Candidate #{profile.profile_code}</span>
              You are initiating a formal Rishta expression of interest. The candidate will be notified of your interest.
            </div>
          </div>

          <div className="text-xs text-stone-600 space-y-1.5 bg-stone-50 p-3 rounded-lg border border-stone-200">
            <p className="font-semibold text-charcoal-900">Important Terms:</p>
            <ul className="list-disc pl-4 space-y-1 text-stone-600">
              <li>Your public biodata will be shared with this candidate.</li>
              <li>This request will remain active for <strong>14 days</strong>.</li>
              <li>If the candidate declines, re-requesting is permanently disabled in this direction.</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSendModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Send}
              loading={actionLoading}
              onClick={handleSendRequest}
            >
              Confirm & Send Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Dialog: Cancel Request */}
      <ConfirmDialog
        isOpen={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        onConfirm={handleCancelRequest}
        title="Cancel Rishta Request"
        message="Are you sure you want to cancel your pending Rishta request? Once cancelled, you may re-initiate if needed."
        confirmText="Yes, Cancel Request"
        cancelText="Keep Request"
        variant="danger"
        loading={actionLoading}
      />

      {/* Confirm Dialog: Decline Request */}
      <ConfirmDialog
        isOpen={confirmDeclineOpen}
        onClose={() => setConfirmDeclineOpen(false)}
        onConfirm={handleDeclineRequest}
        title="Decline Rishta Request"
        message="Are you sure you want to decline this Rishta request? Once declined, this candidate will not be able to re-request you."
        confirmText="Decline Request"
        cancelText="Review Again"
        variant="danger"
        loading={actionLoading}
      />

      {/* Confirm Dialog: Accept Request */}
      <ConfirmDialog
        isOpen={confirmAcceptOpen}
        onClose={() => setConfirmAcceptOpen(false)}
        onConfirm={handleAcceptRequest}
        title="Accept Rishta Request"
        message="Are you sure you want to accept this Rishta request? Both profiles will move to the mutual interest stage."
        confirmText="Accept Request"
        cancelText="Cancel"
        variant="primary"
        loading={actionLoading}
      />
    </div>
  );
}

