import React, { useState } from 'react';
import axios from 'axios';
import { Save, User, Mail, Phone, Trash2, Clock, Send, MessageCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

export default function ListingInterestManager({ listing, interest, onUpdated }) {
  const { user: currentAdmin } = useAuth();
  const isSuperAdmin = currentAdmin?.role === 'admin';

  const [status, setStatus] = useState(interest.status);
  const [adminNotes, setAdminNotes] = useState(interest.admin_notes || '');
  const [loading, setLoading] = useState(false);

  // Message to user states
  const [showMsgBox, setShowMsgBox] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState(false);

  const statuses = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'introduced', label: 'Introduced' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const handleUpdate = async () => {
    setLoading(true);
    try {
      if (status !== interest.status) {
        await axios.post(`/api/admin/listings/${listing.id}/interests/${interest.id}/status`, { status });
      }
      if (adminNotes !== interest.admin_notes) {
        await axios.post(`/api/admin/listings/${listing.id}/interests/${interest.id}/notes`, { admin_notes: adminNotes });
      }
      onUpdated();
    } catch (err) {
      alert("Failed to update interest.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!msgText.trim()) return;

    setSendingMsg(true);
    setMsgSuccess(false);
    try {
      await axios.post(`/api/admin/listings/${listing.id}/interests/${interest.id}/message`, {
        message: msgText.trim(),
        status: status,
      });
      setMsgText('');
      setMsgSuccess(true);
      setTimeout(() => setMsgSuccess(false), 3000);
      setShowMsgBox(false);
      onUpdated();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send message to user.");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this interest?")) return;
    try {
      await axios.delete(`/api/admin/listings/${listing.id}/interests/${interest.id}`);
      onUpdated();
    } catch (err) {
      alert("Failed to delete interest.");
    }
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'new': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'contacted': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'in_progress': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'introduced': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'rejected': 
      case 'cancelled': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const isUserAwaiting = interest.last_sender === 'user';
  const conversation = Array.isArray(interest.conversation) ? interest.conversation : [];

  return (
    <div className={`border rounded-xl p-4 flex flex-col gap-4 transition-colors ${
      isUserAwaiting 
        ? 'bg-navy-950/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20' 
        : 'bg-navy-950 border-white/5'
    }`}>
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex gap-3 items-start">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isUserAwaiting ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
          }`}>
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h4 className="font-bold text-white text-base">
                {interest.submitter_name}
              </h4>
              {interest.user_id && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  Registered User
                </span>
              )}
              {isUserAwaiting && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse flex items-center gap-1">
                  ● User Replied • Awaiting Response
                </span>
              )}
            </div>

            {interest.applicant_profile?.profile_code && (
              <div className="mt-1">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-magenta-500/20 border border-magenta-500/30 text-magenta-300">
                  Profile #{interest.applicant_profile.profile_code} ({interest.applicant_profile.age || '?'} yrs • {interest.applicant_profile.city || 'N/A'} • {interest.applicant_profile.profession || 'N/A'})
                </span>
              </div>
            )}

            <div className="text-xs text-slate-400 mt-1.5 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 font-mono"><Phone className="w-3 h-3 text-slate-400" /> {interest.submitter_contact}</span>
              {interest.submitter_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {interest.submitter_email}</span>}
              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {formatDate(interest.created_at)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border appearance-none outline-none cursor-pointer ${getStatusColor(status)}`}
          >
            {statuses.map(s => (
              <option key={s.value} value={s.value} className="bg-navy-900 text-white">{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Initial Inquiry Message */}
      {interest.message && (
        <div className="bg-navy-900/60 rounded-xl p-3 border border-white/5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Initial Inquiry Note:
          </span>
          <p className="text-xs text-slate-200 italic leading-relaxed">"{interest.message}"</p>
        </div>
      )}

      {/* Thread: Conversation Messages */}
      {conversation.length > 0 && (
        <div className="space-y-2 bg-navy-900/40 p-3 rounded-xl border border-white/5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
            Inquiry Message History / بات چیت کا ریکارڈ ({conversation.length})
          </span>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
            {conversation.map((msg, idx) => {
              const isAdmin = msg.sender === 'admin';
              return (
                <div 
                  key={idx} 
                  className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                    isAdmin 
                      ? 'bg-purple-950/40 border border-purple-500/30 text-purple-100 ml-4' 
                      : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-100 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold mb-1 opacity-80">
                    <span className={isAdmin ? 'text-purple-300' : 'text-emerald-300'}>
                      {isAdmin ? '🛡️ Matchmaker Coordinator (Admin)' : `👤 ${msg.sender_name || 'User'}`}
                    </span>
                    <span className="text-slate-400 font-normal">
                      {msg.created_at ? formatDate(msg.created_at) : ''}
                    </span>
                  </div>
                  <p>{msg.message}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action to Message User */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setShowMsgBox(!showMsgBox)}
            className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 py-1"
          >
            <Send className="w-3.5 h-3.5" />
            {showMsgBox ? 'Hide Message Box' : 'Write Message to User / صارف کو پیغام بھیجیں'}
          </button>
          
          <div className="text-[11px] text-slate-400">
            {interest.last_sender === 'user' ? (
              <span className="text-emerald-400 font-semibold">User replied. Awaiting your response.</span>
            ) : interest.last_sender === 'admin' ? (
              <span className="text-purple-300">Message sent. User can reply with 1 message.</span>
            ) : (
              <span className="text-slate-400">No message sent yet.</span>
            )}
          </div>
        </div>

        {showMsgBox && (
          <div className="bg-navy-900/90 border border-cyan-500/30 rounded-xl p-3 flex flex-col gap-2 mt-1">
            <label className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Official Matchmaker Message (Visible to user in their Proposals tab):
            </label>
            <textarea
              rows={3}
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              placeholder="Write your update, instructions, or proposal match details for this candidate..."
              className="w-full bg-navy-950 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[10px] text-slate-400">
                Note: Once sent, the user will be permitted to send exactly 1 response back.
              </span>
              <button
                onClick={handleSendMessage}
                disabled={sendingMsg || !msgText.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 transition"
              >
                <Send className="w-3 h-3" />
                {sendingMsg ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Internal Admin Notes */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-white/5">
        <input 
          type="text" 
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Private internal admin notes (not shown to user)..."
          className="flex-1 bg-navy-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
        />
        <div className="flex items-center gap-2 shrink-0">
          {(status !== interest.status || adminNotes !== (interest.admin_notes || '')) && (
            <button 
              onClick={handleUpdate}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-amber-600 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> Save Status/Notes
            </button>
          )}
          {isSuperAdmin && (
            <button 
              onClick={handleDelete}
              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              title="Delete Interest"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
