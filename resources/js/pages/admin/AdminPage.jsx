import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  BarChart3, Users, HeartHandshake, 
  Layers, CreditCard, Shield, ShieldCheck, ArrowLeft 
} from 'lucide-react';
import AdminOverviewTab from './AdminOverviewTab';
import AdminUsersTab from './AdminUsersTab';
import AdminProfilesTab from './AdminProfilesTab';
import AdminRequestsTab from './AdminRequestsTab';
import AdminFinancialsTab from './AdminFinancialsTab';
import AdminVerificationsTab from './AdminVerificationsTab';

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const setTab = (tab) => {
    setSearchParams({ tab });
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'users', name: 'Users & Accounts', icon: Users },
    { id: 'profiles', name: 'Profiles Moderation', icon: HeartHandshake },
    { id: 'verifications', name: 'Verifications', icon: ShieldCheck },
    { id: 'requests', name: 'Rishta Requests', icon: Layers },
    { id: 'financials', name: 'Financials & Unlocks', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen pb-20 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header with Title and Back to App Link */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 border border-amber-400/40">
              <Shield className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                RaabtaNow <span className="text-amber-400">Admin Control</span>
              </h1>
              <p className="text-xs text-slate-400">Administrative management, user moderation, and financial audit portal.</p>
            </div>
          </div>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3.5 py-2 rounded-xl bg-navy-800/80 border border-white/10 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Matrimonial Dashboard
          </Link>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-magenta-500 to-purple-600 text-white shadow-md shadow-magenta-500/20'
                    : 'bg-navy-800/80 text-slate-300 hover:text-white hover:bg-navy-750 border border-white/5'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="mt-6">
          {activeTab === 'overview' && <AdminOverviewTab />}
          {activeTab === 'users' && <AdminUsersTab />}
          {activeTab === 'profiles' && <AdminProfilesTab />}
          {activeTab === 'verifications' && <AdminVerificationsTab />}
          {activeTab === 'requests' && <AdminRequestsTab />}
          {activeTab === 'financials' && <AdminFinancialsTab />}
        </div>
      </div>
    </div>
  );
}
