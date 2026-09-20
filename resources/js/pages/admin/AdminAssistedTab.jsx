import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { Loader2, Plus, Search, Mail, UserPlus, RefreshCw } from 'lucide-react';
import CreateAssistedProfileModal from './CreateAssistedProfileModal';
import AssistedMatchesModal from './AssistedMatchesModal';
import AssistedProposalsModal from './AssistedProposalsModal';
import { FileText } from 'lucide-react';

const AdminAssistedTab = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMatchesModalFor, setShowMatchesModalFor] = useState(null);
  const [showProposalsModalFor, setShowProposalsModalFor] = useState(null);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAssistedProfiles({ search });
      setProfiles(data.data || []);
    } catch (err) {
      setMessage({ text: 'Failed to load assisted profiles', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProfiles();
  };

  const handleResend = async (id) => {
    try {
      await adminApi.resendConfirmation(id);
      setMessage({ text: 'Confirmation email resent.', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to resend confirmation.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Assisted Matchmaking</h2>
          <p className="text-sm text-slate-400 mt-1">Manage profiles created on behalf of users.</p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreateModal(true)}>Create Profile</Button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between ${
          message.type === 'success' 
            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs underline hover:opacity-80">Dismiss</button>
        </div>
      )}

      <Card title="Assisted Profiles">
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <Input 
            placeholder="Search by code, name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          <Button type="submit" variant="secondary" icon={Search}>
            Search
          </Button>
          <Button type="button" variant="ghost" onClick={fetchProfiles} icon={RefreshCw} className="ml-auto" isLoading={loading}>
            Refresh
          </Button>
        </form>

        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : (
          <div className="border border-white/10 rounded-xl divide-y divide-white/5 bg-navy-900/40">
            {profiles.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No profiles found.</div>
            ) : profiles.map(profile => (
              <div key={profile.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                <div>
                  <div className="font-medium text-slate-200">{profile.user.name} ({profile.profile_code})</div>
                  <div className="text-sm text-slate-400">{profile.user.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  {profile.confirmed_at ? (
                    <Badge variant="success">Confirmed</Badge>
                  ) : (
                    <Badge variant="warning">Pending Confirmation</Badge>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleResend(profile.id)} disabled={!!profile.confirmed_at} icon={Mail}>
                    Resend
                  </Button>
                  <Button variant="outline" size="sm" disabled={!profile.confirmed_at} icon={FileText} onClick={() => setShowProposalsModalFor(profile)}>
                    Proposals
                  </Button>
                  <Button variant="primary" size="sm" disabled={!profile.confirmed_at} icon={UserPlus} onClick={() => setShowMatchesModalFor(profile)}>
                    Matches
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showCreateModal && (
        <CreateAssistedProfileModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            setMessage({ text: 'Profile created successfully! Confirmation email sent.', type: 'success' });
            fetchProfiles();
          }}
        />
      )}

      {showMatchesModalFor && (
        <AssistedMatchesModal
          profile={showMatchesModalFor}
          onClose={() => setShowMatchesModalFor(null)}
        />
      )}

      {showProposalsModalFor && (
        <AssistedProposalsModal
          profile={showProposalsModalFor}
          onClose={() => setShowProposalsModalFor(null)}
        />
      )}
    </div>
  );
};

export default AdminAssistedTab;
