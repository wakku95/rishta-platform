import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Users, UserCheck, UserX, ShieldCheck, 
  HeartHandshake, CheckCircle2, Clock, 
  CreditCard, KeyRound, MapPin, TrendingUp,
  AlertCircle, RefreshCw, MessageSquare, FileText,
  ClipboardList, ArrowRight, AlertTriangle, Layers, Sparkles
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import Button from '../../components/ui/Button';

export default function AdminOverviewTab({ onNavigateTab }) {
  const [, setSearchParams] = useSearchParams();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleNavigate = (tabId) => {
    if (onNavigateTab) {
      onNavigateTab(tabId);
    } else {
      setSearchParams({ tab: tabId });
    }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading && !metrics) {
    return (
      <div className="py-16 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-magenta-500 mb-3" />
        <p className="text-slate-400 text-sm">Aggregating platform analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <span>{error}</span>
        </div>
        <Button size="sm" variant="danger" onClick={fetchMetrics}>Retry</Button>
      </div>
    );
  }

  const { users, profiles, requests, financials, recent, pending_actions } = metrics;

  const pendingActions = pending_actions || {
    total: 0,
    bio_approvals: 0,
    direct_inquiries: 0,
    verifications: { total: 0, registered: 0, magic_links: 0 },
    requests: { total: 0, proposals: 0, photos: 0 },
    financial_unlocks: 0,
    assisted_submissions: 0,
    assisted_interests: 0,
  };

  const actionCards = [
    {
      id: 'bio_approvals',
      title: 'Bio Approval',
      description: 'Candidate "About" bios',
      count: pendingActions.bio_approvals || 0,
      tab: 'profiles',
      icon: FileText,
      accent: 'amber',
    },
    {
      id: 'direct_inquiries',
      title: 'Direct Inquiries',
      description: 'Matchmaker leads',
      count: pendingActions.direct_inquiries || 0,
      tab: 'inquiries',
      icon: MessageSquare,
      accent: 'cyan',
    },
    {
      id: 'verifications',
      title: 'Verifications',
      description: 'CNIC & live selfies',
      count: pendingActions.verifications?.total ?? 0,
      subDetail: pendingActions.verifications?.total > 0
        ? `${pendingActions.verifications?.registered || 0} app • ${pendingActions.verifications?.magic_links || 0} magic`
        : null,
      tab: 'verifications',
      icon: ShieldCheck,
      accent: 'blue',
    },
    {
      id: 'requests',
      title: 'Rishta Requests',
      description: 'Proposals & photos',
      count: pendingActions.requests?.total ?? 0,
      subDetail: pendingActions.requests?.total > 0
        ? `${pendingActions.requests?.proposals || 0} prop • ${pendingActions.requests?.photos || 0} photo`
        : null,
      tab: 'requests',
      icon: Layers,
      accent: 'purple',
    },
    {
      id: 'financial_unlocks',
      title: 'Financial Unlocks',
      description: 'TID payment proofs',
      count: pendingActions.financial_unlocks || 0,
      tab: 'financials',
      icon: CreditCard,
      accent: 'emerald',
    },
    {
      id: 'assisted_submissions',
      title: 'Assisted Intake',
      description: 'Public profile forms',
      count: pendingActions.assisted_submissions || 0,
      tab: 'submissions',
      icon: ClipboardList,
      accent: 'magenta',
    },
    {
      id: 'assisted_interests',
      title: 'Listing Interests',
      description: 'New assisted leads',
      count: pendingActions.assisted_interests || 0,
      tab: 'listings',
      icon: HeartHandshake,
      accent: 'pink',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Bar with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Platform Overview & Growth</h2>
          <p className="text-xs text-slate-400">Real-time indicators across user adoption, matchmaking, and micro-transactions.</p>
        </div>
        <Button size="sm" variant="secondary" icon={RefreshCw} onClick={fetchMetrics} isLoading={loading}>
          Refresh
        </Button>
      </div>

      {/* ======================================================== */}
      {/* ⚡ ADMIN ACTION CENTER: PENDING TASKS AWAITING ACTION     */}
      {/* ======================================================== */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-navy-900 via-navy-850 to-navy-900 border border-white/10 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-md border ${
              pendingActions.total > 0
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-amber-500/10 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10'
            }`}>
              {pendingActions.total > 0 ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-white tracking-tight">Admin Action Center</h3>
                {pendingActions.total > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-sm animate-pulse">
                    {pendingActions.total} Pending Action{pendingActions.total > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    All Clear (0 Actions Required)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time pending counters across all admin tabs. Click any card below to jump directly to that tab.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">
              {pendingActions.total === 0 
                ? '✅ All platform items are currently resolved' 
                : `⚡ ${pendingActions.total} item(s) awaiting your review`}
            </span>
          </div>
        </div>

        {/* 7 Counter Action Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {actionCards.map((card) => {
            const Icon = card.icon;
            const hasPending = card.count > 0;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleNavigate(card.tab)}
                className={`group relative p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between hover:scale-[1.02] cursor-pointer ${
                  hasPending
                    ? 'bg-gradient-to-b from-amber-500/15 via-navy-900 to-navy-950 border-amber-500/50 hover:border-amber-400 shadow-md shadow-amber-500/10'
                    : 'bg-navy-950/60 border-white/5 hover:border-white/20 hover:bg-navy-900/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                      hasPending
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                      hasPending
                        ? 'bg-amber-500/25 text-amber-300 border-amber-500/40 font-black'
                        : 'bg-emerald-500/10 text-emerald-400/90 border-emerald-500/20'
                    }`}>
                      {hasPending ? 'Pending' : 'Clear'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                    {card.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate leading-tight">
                    {card.description}
                  </p>
                  {card.subDetail && (
                    <span className="text-[9px] font-mono font-medium text-amber-300/80 block mt-1 truncate">
                      {card.subDetail}
                    </span>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-white/5 flex items-baseline justify-between">
                  <span className={`text-2xl font-black ${
                    hasPending ? 'text-amber-400 font-mono' : 'text-slate-400 font-mono'
                  }`}>
                    {card.count}
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-white flex items-center gap-0.5 font-semibold transition-colors">
                    <span>{hasPending ? 'Review' : 'Open'}</span>
                    <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-navy-800/80 border border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">{users.total}</span>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-emerald-400 font-medium">+{users.new_this_week} this week</span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-400">{users.suspended} suspended</span>
            </div>
          </div>
        </div>

        {/* Active Profiles (Combined Registered + Assisted) */}
        <div className="p-5 rounded-2xl bg-navy-800/80 border border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Profiles</span>
            <div className="w-9 h-9 rounded-xl bg-magenta-500/10 text-magenta-400 flex items-center justify-center border border-magenta-500/20">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{profiles.active}</span>
              <span className="text-[11px] font-semibold text-magenta-300">Total Live</span>
            </div>
            {profiles.breakdown ? (
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Self-Registered:</span>
                  <span className="font-bold text-slate-200">{profiles.breakdown.registered_active} <span className="text-slate-500 font-normal">(M:{profiles.breakdown.registered_male} | F:{profiles.breakdown.registered_female})</span></span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Assisted Listings:</span>
                  <span className="font-bold text-amber-300">{profiles.breakdown.assisted_published} <span className="text-slate-500 font-normal">(M:{profiles.breakdown.assisted_male} | F:{profiles.breakdown.assisted_female})</span></span>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-slate-300">M: {profiles.male_active}</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-300">F: {profiles.female_active}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{profiles.draft} draft</span>
              </div>
            )}
          </div>
        </div>

        {/* Match Requests */}
        <div className="p-5 rounded-2xl bg-navy-800/80 border border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rishta Requests</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">{requests.total}</span>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-emerald-400 font-medium">{requests.accepted} accepted</span>
              <span className="text-slate-500">•</span>
              <span className="text-purple-400">{requests.acceptance_rate}% conv.</span>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-navy-800/80 border border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Revenue (Safepay)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">Rs. {financials.total_revenue_pkr.toLocaleString()}</span>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-amber-400 font-medium">{financials.successful_payments} paid unlocks</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400">{financials.unlocked_contacts} unlocked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Top Cities & Request Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Matrimonial Hubs */}
        <div className="p-6 rounded-2xl bg-navy-800/80 border border-white/10 shadow-sm">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-magenta-400" />
            Top Matrimonial Hubs (Cities)
          </h3>
          <div className="space-y-3">
            {profiles.top_cities?.length > 0 ? (
              profiles.top_cities.map((cityItem, idx) => (
                <div key={cityItem.city} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-xs font-mono text-slate-500">{idx + 1}.</span>
                    <span className="text-sm font-semibold text-slate-200 capitalize">{cityItem.city}</span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-navy-700 text-slate-300 border border-white/5">
                    {cityItem.total} candidate{cityItem.total > 1 ? 's' : ''}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic py-4">No location data captured yet.</p>
            )}
          </div>
        </div>

        {/* Requests Funnel Breakdown */}
        <div className="p-6 rounded-2xl bg-navy-800/80 border border-white/10 shadow-sm">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            Mutual Proposal Funnel Status
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-navy-900/60 border border-white/5">
              <span className="text-[11px] font-semibold text-amber-400 block">Pending Response</span>
              <span className="text-lg font-bold text-white mt-1 block">{requests.pending}</span>
            </div>
            <div className="p-3 rounded-xl bg-navy-900/60 border border-white/5">
              <span className="text-[11px] font-semibold text-emerald-400 block">Mutually Accepted</span>
              <span className="text-lg font-bold text-white mt-1 block">{requests.accepted}</span>
            </div>
            <div className="p-3 rounded-xl bg-navy-900/60 border border-white/5">
              <span className="text-[11px] font-semibold text-rose-400 block">Declined</span>
              <span className="text-lg font-bold text-white mt-1 block">{requests.declined}</span>
            </div>
            <div className="p-3 rounded-xl bg-navy-900/60 border border-white/5">
              <span className="text-[11px] font-semibold text-slate-400 block">Sender Cancelled</span>
              <span className="text-lg font-bold text-white mt-1 block">{requests.cancelled}</span>
            </div>
            <div className="p-3 rounded-xl bg-navy-900/60 border border-white/5">
              <span className="text-[11px] font-semibold text-slate-400 block">14-Day Expired</span>
              <span className="text-lg font-bold text-white mt-1 block">{requests.expired}</span>
            </div>
            <div className="p-3 rounded-xl bg-navy-900/60 border border-white/5">
              <span className="text-[11px] font-semibold text-purple-400 block">Acceptance Rate</span>
              <span className="text-lg font-bold text-white mt-1 block">{requests.acceptance_rate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <div className="p-6 rounded-2xl bg-navy-800/80 border border-white/10 shadow-sm">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            Recent Registrations
          </h3>
          <div className="divide-y divide-white/5">
            {recent.users?.map((u) => (
              <div key={u.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-200 block">{u.name}</span>
                  <span className="text-xs text-slate-400 font-mono">{u.email}</span>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    u.status === 'suspended' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {u.status}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Financial Transactions */}
        <div className="p-6 rounded-2xl bg-navy-800/80 border border-white/10 shadow-sm">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-amber-400" />
            Recent Contact Unlock Transactions
          </h3>
          <div className="divide-y divide-white/5">
            {recent.payments?.length > 0 ? (
              recent.payments.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-slate-200 block">{p.user?.name || 'User'}</span>
                    <span className="text-xs text-slate-400 font-mono">Ref: {p.transaction_reference || p.payment_uuid?.substring(0, 8)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-amber-400 block">Rs. {Math.round(p.amount)}</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      p.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic py-4">No transactions recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
