import React, { useState, useEffect } from 'react';
import { 
  Bell, Send, Trash2, Users, AlertTriangle, AlertOctagon, 
  CheckCircle2, Info, RefreshCw, Calendar, Link as LinkIcon, 
  Eye, CheckCheck, Smartphone, ShieldAlert
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

export default function AdminAnnouncementsTab() {
  const [announcements, setAnnouncements] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    target_audience: 'all',
    action_url: '',
    action_label: '',
  });

  const fetchAnnouncements = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.getAnnouncements({ page });
      if (res.success) {
        setAnnouncements(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setSubmitting(true);

    try {
      const res = await adminApi.broadcastAnnouncement({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        target_audience: formData.target_audience,
        action_url: formData.action_url || null,
        action_label: formData.action_label || null,
      });

      if (res.success) {
        setMessage(res.message || 'Announcement broadcasted successfully!');
        setFormData({
          title: '',
          message: '',
          type: 'info',
          target_audience: 'all',
          action_url: '',
          action_label: '',
        });
        fetchAnnouncements(1);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to broadcast announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement? It will be removed for all users.')) {
      return;
    }

    setDeletingId(id);
    try {
      await adminApi.deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      setMessage('Announcement deleted successfully.');
    } catch (err) {
      setError('Failed to delete announcement.');
    } finally {
      setDeletingId(null);
    }
  };

  const getAudienceBadge = (audience) => {
    switch (audience) {
      case 'missing_phone':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Smartphone className="w-3 h-3" /> Missing Phone
          </span>
        );
      case 'unverified_cnic':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <ShieldAlert className="w-3 h-3" /> Unverified CNIC
          </span>
        );
      case 'gender_male':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <Users className="w-3 h-3" /> Male Candidates
          </span>
        );
      case 'gender_female':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30">
            <Users className="w-3 h-3" /> Female Candidates
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Users className="w-3 h-3" /> All Users
          </span>
        );
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'warning':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300">Warning</span>;
      case 'alert':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300">Urgent</span>;
      case 'success':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300">Success</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-300">Info</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-navy-800/50 p-5 rounded-2xl border border-white/5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-magenta-400" />
            In-App Announcements & Broadcasts
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Send targeted alerts directly into users' app & website notification drawer for free.
          </p>
        </div>
        <Button 
          size="sm" 
          variant="secondary" 
          icon={RefreshCw} 
          onClick={() => fetchAnnouncements(pagination.current_page)} 
          isLoading={loading}
        >
          Refresh
        </Button>
      </div>

      {message && (
        <Alert variant="success" title="Success" className="border border-emerald-500/40">
          {message}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" title="Error" className="border border-rose-500/40">
          {error}
        </Alert>
      )}

      {/* Broadcast Creation Form Card */}
      <Card className="p-6 bg-navy-800 border border-slate-750 space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-magenta-500/20 border border-magenta-500/40 flex items-center justify-center text-magenta-300">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Broadcast New In-App Notification</h3>
            <p className="text-xs text-slate-400">Target specific candidate groups or broadcast to everyone</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Notification Title"
              placeholder="e.g. Kindly verify your CNIC / Add WhatsApp number"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Audience
              </label>
              <select
                value={formData.target_audience}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-navy-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-magenta-500 transition"
              >
                <option value="all">🌐 All Registered Candidates</option>
                <option value="missing_phone">📱 Users Missing Contact / WhatsApp Number</option>
                <option value="unverified_cnic">🪪 Users With Unverified CNIC</option>
                <option value="gender_male">👨 Male Candidates Only</option>
                <option value="gender_female">👩 Female Candidates Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Message Content
            </label>
            <textarea
              rows={3}
              placeholder="Write the full notification message shown when the user taps on the notification..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              className="w-full p-3 bg-navy-900 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-magenta-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Notification Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3.5 py-2 bg-navy-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-magenta-500 transition"
              >
                <option value="info">ℹ️ General Info (Cyan)</option>
                <option value="warning">⚠️ Action Reminder (Amber)</option>
                <option value="alert">🚨 Urgent Notice (Rose)</option>
                <option value="success">✅ Announcement (Emerald)</option>
              </select>
            </div>

            <div>
              <Input
                label="Action Link URL (Optional)"
                placeholder="e.g. /dashboard or /profile/edit"
                value={formData.action_url}
                onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
              />
            </div>

            <div>
              <Input
                label="Action Button Label (Optional)"
                placeholder="e.g. Update Now, Verify CNIC"
                value={formData.action_label}
                onChange={(e) => setFormData({ ...formData, action_label: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="gold"
              size="md"
              icon={Send}
              isLoading={submitting}
              className="font-bold px-6 shadow-md"
            >
              Broadcast Notification Now
            </Button>
          </div>
        </form>
      </Card>

      {/* History Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            Sent Broadcast History ({pagination.total})
          </h3>
        </div>

        <div className="bg-navy-800/50 border border-white/5 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-navy-900/80 text-slate-400 text-xs uppercase font-semibold border-b border-white/5">
                <tr>
                  <th className="px-6 py-4">Title & Details</th>
                  <th className="px-6 py-4">Audience</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Read Count</th>
                  <th className="px-6 py-4">Sent At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {announcements.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                      No broadcast notifications sent yet. Use the form above to send your first one.
                    </td>
                  </tr>
                ) : (
                  announcements.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4 max-w-sm">
                        <div className="font-semibold text-white">{item.title}</div>
                        <div className="text-xs text-slate-400 mt-1 line-clamp-2">{item.message}</div>
                        {item.action_url && (
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-magenta-400 font-mono">
                            <LinkIcon className="w-3 h-3" />
                            {item.action_label || 'Link'}: {item.action_url}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getAudienceBadge(item.target_audience)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(item.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-300 bg-white/5 px-2 py-0.5 rounded-md">
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          {item.reads_count || 0} reads
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-mono">
                        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Delete announcement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
