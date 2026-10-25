import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Send, Search, CheckCircle2, AlertTriangle, 
  Clock, ShieldCheck, Heart, User, Sparkles, RefreshCw,
  Bell, FileText, ChevronRight, CheckCheck, Eye
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

const TEMPLATES = [
  {
    id: 'proposal_pending',
    label: '💍 Pending Proposal Nudge',
    title: 'Proposal Response Reminder 💍',
    screen: 'Proposals',
    tab: 'received',
    message: 'Assalam-o-Alaikum, you have a rishta proposal waiting for your response on RaabtaNow. Please review and respond at your earliest convenience.',
  },
  {
    id: 'verify_cnic',
    label: '🛡️ Identity Verification',
    title: 'Get Verified on RaabtaNow 🛡️',
    screen: 'Verification',
    tab: '',
    message: 'Identity verification is quick and confidential! Upload your CNIC to receive the Blue Verified Badge and boost proposal interest.',
  },
  {
    id: 'photo_request',
    label: '📸 Photo Request Reminder',
    title: 'Photo Exchange Request 📸',
    screen: 'Proposals',
    tab: 'received',
    message: 'A prospective candidate has requested to exchange private photos with you. Open RaabtaNow to review.',
  },
  {
    id: 'complete_profile',
    label: '✍️ Complete Profile Bio',
    title: 'Complete Your Rishta Profile ✍️',
    screen: 'MyProfile',
    tab: '',
    message: 'Your matrimonial profile is partially complete. Adding your education and partner preferences helps our matchmakers connect you with the right families.',
  },
];

export default function AdminPushNotificationsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [targetScreen, setTargetScreen] = useState('Proposals');
  const [targetTab, setTargetTab] = useState('received');

  // Submitting state
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  // Audit Logs State
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Search candidates
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;

    setSearching(true);
    setError(null);
    try {
      const res = await adminApi.searchPushCandidates(searchQuery.trim());
      setSearchResults(res.data || []);
      if (res.data?.length === 0) {
        setError('No candidates found matching "' + searchQuery + '". Try Profile Code (e.g. RN-xxxx), email, or name.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error searching candidates.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setSearchResults([]);
    setFeedback(null);
    setError(null);

    // If candidate has pending proposals, pre-fill proposal reminder template
    if (candidate.pending_proposals_count > 0) {
      applyTemplate(TEMPLATES[0]);
    } else if (candidate.verification_status !== 'approved') {
      applyTemplate(TEMPLATES[1]);
    }
  };

  const applyTemplate = (tpl) => {
    setTitle(tpl.title);
    setMessageText(tpl.message);
    setTargetScreen(tpl.screen);
    setTargetTab(tpl.tab);
  };

  const handleSendPush = async (e) => {
    e.preventDefault();
    if (!selectedCandidate) {
      setError('Please search and select a candidate first.');
      return;
    }
    if (!title.trim() || !messageText.trim()) {
      setError('Please fill in both title and message.');
      return;
    }

    setSending(true);
    setFeedback(null);
    setError(null);

    try {
      const res = await adminApi.sendPushNotification({
        user_id: selectedCandidate.user_id,
        title: title.trim(),
        message: messageText.trim(),
        target_screen: targetScreen,
        target_tab: targetTab,
      });

      if (res.success) {
        setFeedback({
          type: res.data?.push_delivered ? 'success' : 'warning',
          message: res.data?.push_delivered
            ? `Mobile push notification delivered instantly to ${selectedCandidate.full_name}'s phone screen!`
            : `Notification saved to ${selectedCandidate.full_name}'s in-app feed. (Note: Device token not active yet)`,
        });

        // Refresh audit logs
        fetchLogs();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch notification.');
    } finally {
      setSending(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await adminApi.getPushNotificationLogs();
      setLogs(res.data?.data || []);
    } catch (err) {
      // quiet fail
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-white/10 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-magenta-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-magenta-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-magenta-500/25 border border-white/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">Direct Mobile Push Notifications</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  100% Free & Instant
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Send real-time mobile push notifications directly to candidates for urgent proposal responses, CNIC verification reminders, and personalized support.
              </p>
            </div>
          </div>

          <button
            onClick={fetchLogs}
            className="self-start md:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-800 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} /> Refresh History
          </button>
        </div>
      </div>

      {feedback && (
        <Alert variant={feedback.type === 'success' ? 'success' : 'warning'}>
          {feedback.message}
        </Alert>
      )}

      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Search */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Search & Target Candidate */}
          <Card className="p-6 bg-navy-900/90 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-magenta-500/20 text-magenta-300 border border-magenta-500/30 flex items-center justify-center text-xs font-bold">1</span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Select Candidate to Notify</h3>
              </div>
              {selectedCandidate && (
                <button
                  type="button"
                  onClick={() => setSelectedCandidate(null)}
                  className="text-xs font-semibold text-slate-400 hover:text-magenta-400 transition"
                >
                  Change Candidate
                </button>
              )}
            </div>

            {!selectedCandidate ? (
              <div className="space-y-3">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by Profile Code (RN-xxxx), name, email, or phone..."
                      className="w-full bg-navy-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-magenta-500 transition"
                    />
                  </div>
                  <Button type="submit" disabled={searching} className="px-5 text-xs font-bold">
                    {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Search'}
                  </Button>
                </form>

                {searchResults.length > 0 && (
                  <div className="border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5 bg-navy-950/80">
                    {searchResults.map((cand) => (
                      <div
                        key={cand.user_id}
                        onClick={() => handleSelectCandidate(cand)}
                        className="p-3.5 flex items-center justify-between hover:bg-white/5 cursor-pointer transition group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            cand.gender === 'male' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                          }`}>
                            {cand.gender === 'male' ? 'M' : 'F'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs group-hover:text-magenta-400 transition">{cand.full_name}</span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/5 text-amber-300 border border-white/10">
                                {cand.profile_code}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span>{cand.city || 'Pakistan'}</span>
                              <span>•</span>
                              <span>{cand.age} Yrs</span>
                              <span>•</span>
                              <span>{cand.email}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {cand.has_push_token ? (
                            <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCheck className="w-3 h-3" /> App Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              In-App Feed
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Selected Candidate Pill Card */
              <div className="p-4 rounded-xl bg-navy-950 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${
                    selectedCandidate.gender === 'male' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                  }`}>
                    {selectedCandidate.gender === 'male' ? 'M' : 'F'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-sm">{selectedCandidate.full_name}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {selectedCandidate.profile_code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span>{selectedCandidate.city || 'Pakistan'}</span>
                      <span>•</span>
                      <span>{selectedCandidate.email}</span>
                      {selectedCandidate.phone && <span>• {selectedCandidate.phone}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  {selectedCandidate.has_push_token ? (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Mobile Device Connected
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Mobile App Not Logged In
                    </span>
                  )}
                  {selectedCandidate.pending_proposals_count > 0 && (
                    <span className="text-[10px] text-magenta-300 font-semibold">
                      {selectedCandidate.pending_proposals_count} Proposal(s) Pending Review
                    </span>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Step 2: Message Content & Quick Templates */}
          <Card className="p-6 bg-navy-900/90 border border-white/10 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-magenta-500/20 text-magenta-300 border border-magenta-500/30 flex items-center justify-center text-xs font-bold">2</span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Compose Notification</h3>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Quick 1-Click Templates
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className="p-2.5 rounded-xl bg-navy-950 border border-white/5 hover:border-magenta-500/50 hover:bg-magenta-500/5 text-left transition group"
                  >
                    <span className="block text-xs font-bold text-slate-200 group-hover:text-white transition">
                      {tpl.label}
                    </span>
                    <span className="block text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                      {tpl.message}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendPush} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Notification Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Proposal Response Reminder 💍"
                  maxLength={100}
                  className="w-full bg-navy-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-magenta-500 transition"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-bold text-slate-300">
                    Message Body <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {messageText.length}/500 chars
                  </span>
                </div>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type the message that will pop up on the user's phone screen..."
                  rows={3}
                  maxLength={500}
                  className="w-full bg-navy-950 border border-white/10 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-magenta-500 transition resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    On Tap: Open Screen
                  </label>
                  <select
                    value={targetScreen}
                    onChange={(e) => setTargetScreen(e.target.value)}
                    className="w-full bg-navy-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-magenta-500 transition"
                  >
                    <option value="Proposals">Proposals Screen</option>
                    <option value="Verification">Verification / CNIC Screen</option>
                    <option value="MyProfile">My Profile Screen</option>
                    <option value="Matches">Discovery / Matches Screen</option>
                    <option value="Notifications">Alerts & Notices Screen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Screen Tab (Optional)
                  </label>
                  <select
                    value={targetTab}
                    onChange={(e) => setTargetTab(e.target.value)}
                    className="w-full bg-navy-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-magenta-500 transition"
                  >
                    <option value="received">Received Tab</option>
                    <option value="sent">Sent Tab</option>
                    <option value="accepted">Accepted Tab</option>
                    <option value="">Default</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={sending || !selectedCandidate}
                  className="w-full py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-magenta-500 to-purple-600 hover:from-magenta-600 hover:to-purple-700 shadow-lg shadow-magenta-500/25 border border-white/20"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching Push...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Send Real-Time Push Notification
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Live Mobile Notification Preview */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 bg-navy-900/90 border border-white/10 space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-magenta-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Live Mobile Screen Preview</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Yeh preview dikhata hai k notification candidate k phone screen par kis tarah pop-up hogi.
            </p>

            {/* Mock Mobile Phone Header / Lockscreen Card */}
            <div className="rounded-2xl p-4 bg-navy-950 border border-white/15 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-3 border-b border-white/5 mb-3">
                <span className="font-semibold text-slate-300">12:45 PM</span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>5G</span>
                  <span>📶</span>
                  <span>🔋 95%</span>
                </div>
              </div>

              {/* Notification Banner */}
              <div className="rounded-xl p-3.5 bg-gradient-to-br from-navy-850 to-navy-900 border border-white/15 shadow-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-magenta-500 flex items-center justify-center text-white text-[10px] font-black shadow-sm">
                      RN
                    </div>
                    <span className="text-[11px] font-black text-white tracking-tight">RaabtaNow</span>
                  </div>
                  <span className="text-[10px] text-slate-400">now</span>
                </div>

                <h4 className="text-xs font-bold text-white pt-1">
                  {title || 'Proposal Response Reminder 💍'}
                </h4>

                <p className="text-[11px] text-slate-300 leading-snug line-clamp-3">
                  {messageText || 'Assalam-o-Alaikum, you have a rishta proposal waiting for your response on RaabtaNow.'}
                </p>

                <div className="pt-1 flex items-center gap-1.5 text-[10px] text-magenta-400 font-bold">
                  <span>Tap to open {targetScreen}</span>
                  <span>→</span>
                </div>
              </div>
            </div>

            {/* Practical Advice Note */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Best Practice Tip:
              </span>
              <span>
                Personalized notifications with friendly, respectful language (e.g. <i>Assalam-o-Alaikum</i>) receive up to <strong>80% faster responses</strong> from matrimonial families.
              </span>
            </div>
          </Card>

          {/* Audit Logs */}
          <Card className="p-6 bg-navy-900/90 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Recent Push History</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono font-bold">{logs.length} sent</span>
            </div>

            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No direct push notifications logged yet.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-navy-950 border border-white/5 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{log.recipient_name || 'Candidate'}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {log.subject_or_template}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>By: {log.admin?.name || 'Admin'}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                        Dispatched
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
