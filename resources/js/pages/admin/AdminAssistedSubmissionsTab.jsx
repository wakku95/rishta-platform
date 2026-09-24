import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, XCircle, FileText, ChevronRight, UserPlus, Eye } from 'lucide-react';
import Badge from '../../components/ui/Badge';

export default function AdminAssistedSubmissionsTab() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/assisted-submissions');
      setSubmissions(res.data.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load submissions.' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    try {
      setActionLoading(true);
      const res = await axios.post('/api/admin/assisted-submissions/' + selectedSubmission.id + '/approve');
      setMessage({ type: 'success', text: 'Approved successfully.' });
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to approve.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission || !rejectionReason.trim()) {
      setMessage({ type: 'error', text: 'Rejection reason is required.' });
      return;
    }
    try {
      setActionLoading(true);
      await axios.post('/api/admin/assisted-submissions/' + selectedSubmission.id + '/reject', {
        rejection_reason: rejectionReason
      });
      setMessage({ type: 'success', text: 'Rejected successfully.' });
      setSelectedSubmission(null);
      setRejectionReason('');
      fetchSubmissions();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reject.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-slate-400 py-12">Loading submissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Assisted Profile Submissions</h2>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm ${message.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right font-bold">&times;</button>
        </div>
      )}

      <div className="bg-navy-900 border border-slate-800 rounded-2xl overflow-hidden">
        {submissions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No submissions found.</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-navy-950 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400">
              <tr>
                <th className="px-6 py-4">Submitted At</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-navy-800/50 transition">
                  <td className="px-6 py-4">{formatDate(sub.created_at)}</td>
                  <td className="px-6 py-4 font-semibold text-white">{sub.submitter_name}</td>
                  <td className="px-6 py-4 text-emerald-400 font-mono text-xs">{sub.submitter_contact}</td>
                  <td className="px-6 py-4">
                    {sub.status === 'pending' && <Badge variant="warning" size="sm">Pending</Badge>}
                    {sub.status === 'approved' && <Badge variant="success" size="sm">Approved</Badge>}
                    {sub.status === 'rejected' && <Badge variant="danger" size="sm">Rejected</Badge>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedSubmission(sub)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedSubmission && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-navy-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-navy-800/50">
              <h3 className="font-bold text-white">Review Submission #{selectedSubmission.id}</h3>
              <button onClick={() => setSelectedSubmission(null)} className="text-slate-400 hover:text-white transition">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Private Info */}
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
                <h4 className="font-bold text-rose-400 mb-3 text-sm">🔒 Private Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-slate-500 text-xs">Name</span>
                    <strong className="text-white">{selectedSubmission.submitter_name}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-xs">Contact</span>
                    <strong className="text-white font-mono">{selectedSubmission.submitter_contact}</strong>
                  </div>
                </div>
              </div>

              {/* Public Biodata */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                <h4 className="font-bold text-emerald-400 mb-3 text-sm">🌐 Public Biodata (Will be published)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  {Object.entries(selectedSubmission.public_biodata).map(([key, val]) => (
                    <div key={key} className="break-words">
                      <span className="block text-slate-500 text-xs capitalize">{key.replace(/_/g, ' ')}</span>
                      <strong className="text-white capitalize line-clamp-2">{val || '---'}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consent */}
              <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-sm">
                <h4 className="font-bold text-white mb-3 text-sm">Consents</h4>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-slate-300">Terms Accepted: <span className="text-white font-semibold">{formatDate(selectedSubmission.terms_accepted_at)}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedSubmission.social_publication_consent ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                  <span className="text-slate-300">Social Media Consent: <span className="text-white font-semibold">{selectedSubmission.social_publication_consent ? formatDate(selectedSubmission.social_publication_consent_at) : 'Not Given'}</span></span>
                </div>
              </div>

              {/* Status Info */}
              {selectedSubmission.status !== 'pending' && (
                <div className="p-4 bg-navy-950 rounded-xl text-sm">
                  <p className="text-slate-300">Status: <strong className="uppercase">{selectedSubmission.status}</strong></p>
                  {selectedSubmission.rejection_reason && (
                    <p className="text-rose-400 mt-2 text-xs">Reason: {selectedSubmission.rejection_reason}</p>
                  )}
                  {selectedSubmission.resulting_assisted_listing_id && (
                    <p className="text-emerald-400 mt-2 text-xs">Created Listing ID: {selectedSubmission.resulting_assisted_listing_id}</p>
                  )}
                </div>
              )}

              {/* Actions */}
              {selectedSubmission.status === 'pending' && (
                <div className="border-t border-slate-800 pt-6 space-y-4">
                  <div className="flex gap-4">
                    <button 
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl transition disabled:opacity-50"
                    >
                      Approve & Create Listing
                    </button>
                  </div>
                  <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
                    <label className="block text-xs font-semibold text-rose-400 mb-2">Reject Submission</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Rejection Reason..." 
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="flex-1 bg-navy-950 border border-rose-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rose-500"
                      />
                      <button 
                        onClick={handleReject}
                        disabled={actionLoading || !rejectionReason.trim()}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
