import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, XCircle, Share2, Eye } from 'lucide-react';
import Badge from '../../components/ui/Badge';

export default function AdminSocialMediaTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('pending');

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
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/social-media-publication-requests');
      setRequests(res.data.data);
    } catch (err) {
      console.error(err);
      alert();
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      await axios.post('/api/admin/social-media-publication-requests/' + selectedRequest.id + '/approve');
      alert();
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      alert();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      alert();
      return;
    }
    try {
      setActionLoading(true);
      await axios.post('/api/admin/social-media-publication-requests/' + selectedRequest.id + '/reject', {
        rejection_reason: rejectionReason
      });
      alert();
      setSelectedRequest(null);
      setRejectionReason('');
      fetchRequests();
    } catch (err) {
      alert();
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPublished = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      await axios.post('/api/admin/social-media-publication-requests/' + selectedRequest.id + '/mark-published');
      alert();
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      alert();
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkRemoved = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      await axios.post('/api/admin/social-media-publication-requests/' + selectedRequest.id + '/mark-removed');
      alert();
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      alert();
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter(r => r.status === filter || filter === 'all');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white">Social Media Publication Requests</h2>
        
        <div className="flex bg-navy-800 p-1 rounded-lg border border-slate-700 overflow-x-auto text-sm">
          {['all', 'pending', 'approved', 'published', 'rejected', 'removal_requested'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap capitalize transition ${filter === f ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-navy-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No requests found.</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-navy-950 border-b border-slate-800 text-xs uppercase font-semibold text-slate-400">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Profile</th>
                <th className="px-6 py-4">Platforms</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-navy-800/50 transition">
                  <td className="px-6 py-4">{formatDate(req.submitted_at || req.created_at)}</td>
                  <td className="px-6 py-4 font-semibold text-white">
                    {req.profile?.profile_code || req.assisted_listing_id || 'Unknown'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {req.requested_platforms?.includes('facebook') && <span>FB</span>}
                      {req.requested_platforms?.includes('instagram') && <span>IG</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={
                      req.status === 'published' ? 'success' : 
                      req.status === 'removal_requested' || req.status === 'removed' || req.status === 'rejected' ? 'danger' : 
                      req.status === 'approved' ? 'info' : 'warning'
                    } size="sm">{req.status.replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedRequest(req)}
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

      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-navy-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-navy-800/50">
              <h3 className="font-bold text-white">Review Request #{selectedRequest.id}</h3>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-white transition">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto min-h-0">
              
              {/* Context info */}
              <div className="flex justify-between items-start text-sm">
                <div>
                  <p className="text-slate-400">Profile Code</p>
                  <p className="text-white font-bold">{selectedRequest.profile?.profile_code || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Status</p>
                  <Badge variant="warning">{selectedRequest.status.replace('_', ' ')}</Badge>
                </div>
                <div>
                  <p className="text-slate-400">Platforms</p>
                  <div className="flex gap-2 mt-1">
                    {selectedRequest.requested_platforms?.includes('facebook') && <span>FB</span>}
                    {selectedRequest.requested_platforms?.includes('instagram') && <span>IG</span>}
                  </div>
                </div>
              </div>

              {/* Private Info Alert */}
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
                <h4 className="font-bold text-rose-400 mb-2 text-sm">🔒 PRIVATE INFO - DO NOT PUBLISH</h4>
                <p className="text-xs text-rose-300">
                  User Name: {selectedRequest.user?.name} <br/>
                  Email: {selectedRequest.user?.email} <br/>
                  Phone: {selectedRequest.user?.phone || 'N/A'}
                </p>
              </div>

              {/* Public Snapshot Preview */}
              <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-xl">
                <h4 className="font-bold text-blue-400 mb-3 text-sm">🌐 Publication Preview (Approved Snapshot)</h4>
                
                <div className="bg-navy-950 p-4 rounded-lg border border-slate-700 text-sm font-mono text-slate-300 space-y-1">
                  <p className="text-blue-300 font-bold mb-2">RaabtaNow Profile: {selectedRequest.public_profile_snapshot?.profile_code}</p>
                  <p className="text-white">{selectedRequest.public_profile_snapshot?.gender} | {selectedRequest.public_profile_snapshot?.age} years old | {selectedRequest.public_profile_snapshot?.city}</p>
                  <p>{selectedRequest.public_profile_snapshot?.education} | {selectedRequest.public_profile_snapshot?.profession}</p>
                  <p>{selectedRequest.public_profile_snapshot?.marital_status?.replace('_', ' ')}</p>
                  <p>Height: {selectedRequest.public_profile_snapshot?.height_formatted}</p>
                  {selectedRequest.public_profile_snapshot?.religion && <p>{selectedRequest.public_profile_snapshot.religion}{selectedRequest.public_profile_snapshot.sect ? ` (${selectedRequest.public_profile_snapshot.sect})` : ''}</p>}
                  
                  {selectedRequest.public_profile_snapshot?.about && <p className="mt-3 italic">"{selectedRequest.public_profile_snapshot.about}"</p>}
                  
                  <p className="text-blue-300 mt-4 font-bold">Interested? Contact RaabtaNow for further details.</p>
                </div>
              </div>

              {/* Status & History Info */}
              {selectedRequest.status !== 'pending' && (
                <div className="p-4 bg-navy-950 rounded-xl text-sm">
                  {selectedRequest.rejection_reason && <p className="text-rose-400">Rejection Reason: {selectedRequest.rejection_reason}</p>}
                  {selectedRequest.removal_reason && <p className="text-rose-400">Removal Reason: {selectedRequest.removal_reason}</p>}
                  {selectedRequest.approved_at && <p className="text-emerald-400">Approved at: {formatDate(selectedRequest.approved_at)}</p>}
                  {selectedRequest.published_at && <p className="text-blue-400">Published at: {formatDate(selectedRequest.published_at)}</p>}
                  {selectedRequest.removal_requested_at && <p className="text-amber-400">Removal requested at: {formatDate(selectedRequest.removal_requested_at)}</p>}
                  {selectedRequest.removed_at && <p className="text-slate-400">Removed at: {formatDate(selectedRequest.removed_at)}</p>}
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-slate-800 pt-6 space-y-4">
                
                {selectedRequest.status === 'pending' && (
                  <>
                    <div className="flex gap-4">
                      <button 
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl transition disabled:opacity-50"
                      >
                        Approve for Publication
                      </button>
                    </div>
                    <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
                      <label className="block text-xs font-semibold text-rose-400 mb-2">Reject Request</label>
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
                  </>
                )}

                {selectedRequest.status === 'approved' && (
                  <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 text-center">
                    <p className="text-blue-300 text-sm mb-3">
                      This profile is approved. Please manually create a post on Facebook/Instagram using the snapshot above. Once posted, confirm below.
                    </p>
                    <button 
                      onClick={handleMarkPublished}
                      disabled={actionLoading}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition disabled:opacity-50"
                    >
                      Confirm: I Have Published This
                    </button>
                  </div>
                )}

                {selectedRequest.status === 'removal_requested' && (
                  <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 text-center">
                    <p className="text-amber-300 text-sm mb-3">
                      The user has requested removal of this publication. Please manually delete the post from Facebook/Instagram.
                    </p>
                    <button 
                      onClick={handleMarkRemoved}
                      disabled={actionLoading}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-xl transition disabled:opacity-50"
                    >
                      Confirm: I Have Removed This
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
