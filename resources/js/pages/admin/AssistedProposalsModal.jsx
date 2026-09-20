import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import Badge from '../../components/ui/Badge';
import { Loader2 } from 'lucide-react';

const AssistedProposalsModal = ({ profile, onClose }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const data = await adminApi.listProposals(profile.id);
        // data could be paginated, so it might be data.data if the interceptor didn't flatten it, or just data.
        setProposals(data || []);
      } catch (err) {
        setError('Failed to load proposals.');
      } finally {
        setLoading(false);
      }
    };
    fetchProposals();
  }, [profile.id]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 pt-20 sm:pt-24 pb-8 overflow-y-auto">
      <div className="bg-navy-900 border border-white/15 rounded-2xl max-w-3xl w-full p-6 shadow-2xl my-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Sent Proposals for {profile.user.name}</h3>
            <p className="text-sm text-slate-400">Profile Code: {profile.profile_code}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm px-2.5 py-1 rounded-lg bg-navy-800">
            ✕ Close
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-magenta-500" /></div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {proposals.length === 0 ? (
              <div className="text-center p-8 text-slate-400 bg-navy-800/50 rounded-xl border border-white/5">
                No proposals have been sent for this profile yet.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {proposals.map(req => (
                  <div key={req.request_code} className="p-4 bg-navy-800/80 border border-white/10 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-white text-base mb-1">
                        To: {req.receiver_profile_code} <span className="text-sm font-normal text-slate-400">({req.receiver_name})</span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Sent on: {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Badge variant={
                        req.status === 'accepted' ? 'success' : 
                        req.status === 'declined' ? 'danger' : 
                        req.status === 'expired' ? 'secondary' : 'warning'
                      }>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistedProposalsModal;
