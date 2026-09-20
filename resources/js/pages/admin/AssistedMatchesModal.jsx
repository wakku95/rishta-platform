import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import Button from '../../components/ui/Button';
import { Loader2, HeartHandshake, CheckCircle2 } from 'lucide-react';

const AssistedMatchesModal = ({ profile, onClose }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingTo, setSendingTo] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await adminApi.searchMatches(profile.id, { per_page: 20 });
        setMatches(data || []);
      } catch (err) {
        setError('Failed to load matches.');
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [profile.id]);

  const handleSendProposal = async (targetProfile) => {
    setSendingTo(targetProfile.profile_code);
    setError(null);
    setSuccessMsg(null);
    try {
      await adminApi.sendProposal(profile.id, { target_profile_code: targetProfile.profile_code });
      setSuccessMsg(`Proposal sent to ${targetProfile.profile_code} successfully.`);
      setMatches(prev => prev.filter(m => m.profile_code !== targetProfile.profile_code));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send proposal.');
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 pt-20 sm:pt-24 pb-8 overflow-y-auto">
      <div className="bg-navy-900 border border-white/15 rounded-2xl max-w-3xl w-full p-6 shadow-2xl my-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Matches for {profile.user.name}</h3>
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

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {successMsg}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-magenta-500" /></div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {matches.length === 0 ? (
              <div className="text-center p-8 text-slate-400 bg-navy-800/50 rounded-xl border border-white/5">
                No compatible matches found based on preferences.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {matches.map(match => (
                  <div key={match.profile_code} className="p-4 bg-navy-800/80 border border-white/10 rounded-xl flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-white text-base mb-1">{match.profile_code}</h4>
                      <div className="text-xs text-slate-300 space-y-1">
                        <p className="capitalize">{match.gender} • {match.age} yrs • {match.height_formatted || `${match.height} cm`}</p>
                        <p>{match.education} • {match.profession}</p>
                        <p>{match.city} • {match.religion} {match.sect ? `(${match.sect})` : ''}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <a 
                        href={`/profiles/${match.profile_code}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-magenta-400 hover:text-magenta-300 underline font-medium"
                      >
                        View Full Profile
                      </a>
                      <Button 
                        size="sm" 
                        variant="primary" 
                        icon={HeartHandshake} 
                        isLoading={sendingTo === match.profile_code}
                        onClick={() => handleSendProposal(match)}
                      >
                        Send Proposal
                      </Button>
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

export default AssistedMatchesModal;
