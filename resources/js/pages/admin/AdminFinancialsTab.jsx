import React, { useEffect, useState } from 'react';
import { CreditCard, KeyRound, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { adminApi } from '../../api/admin';
import Button from '../../components/ui/Button';

export default function AdminFinancialsTab() {
  const [subTab, setSubTab] = useState('payments'); // 'payments' | 'unlocks'
  const [payments, setPayments] = useState([]);
  const [unlocks, setUnlocks] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(false);

  const fetchPayments = async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminApi.getPayments({ page });
      setPayments(data.data || []);
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnlocks = async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminApi.getUnlocks({ page });
      setUnlocks(data.data || []);
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 'payments') {
      fetchPayments(1);
    } else {
      fetchUnlocks(1);
    }
  }, [subTab]);

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab('payments')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              subTab === 'payments' 
                ? 'bg-magenta-500 text-white shadow-md' 
                : 'bg-navy-800 text-slate-300 hover:text-white'
            }`}
          >
            Payment Transactions
          </button>
          <button
            onClick={() => setSubTab('unlocks')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              subTab === 'unlocks' 
                ? 'bg-magenta-500 text-white shadow-md' 
                : 'bg-navy-800 text-slate-300 hover:text-white'
            }`}
          >
            Contact Unlock Audit
          </button>
        </div>

        <Button
          size="sm"
          variant="secondary"
          icon={RefreshCw}
          onClick={() => subTab === 'payments' ? fetchPayments(pagination.current_page) : fetchUnlocks(pagination.current_page)}
          isLoading={loading}
        >
          Refresh
        </Button>
      </div>

      {subTab === 'payments' ? (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-navy-800/60 shadow-sm">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-navy-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Payment UUID / Ref</th>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Gateway</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-white block">{p.payment_uuid}</span>
                      {p.transaction_reference && (
                        <span className="text-[11px] font-mono text-amber-400">Ref: {p.transaction_reference}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-white font-medium block">{p.user?.name || 'User'}</span>
                      <span className="text-xs text-slate-400 font-mono">{p.user?.email}</span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-white">Rs. {Math.round(p.amount)} {p.currency}</td>
                    <td className="px-5 py-3.5 uppercase font-mono text-xs text-slate-300">{p.gateway}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                        p.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {p.paid_at ? new Date(p.paid_at).toLocaleString() : new Date(p.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-slate-500 text-sm">
                    {loading ? 'Loading payments...' : 'No payment transactions recorded.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-navy-800/60 shadow-sm">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-navy-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Request</th>
                <th className="px-5 py-3.5">Initiator (Sender)</th>
                <th className="px-5 py-3.5">Recipient (Receiver)</th>
                <th className="px-5 py-3.5">Sender OTP</th>
                <th className="px-5 py-3.5">Receiver OTP</th>
                <th className="px-5 py-3.5">Unlocked State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {unlocks.length > 0 ? (
                unlocks.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-white">{u.request_code}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{u.sender?.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{u.sender_phone_masked || 'No phone'}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{u.receiver?.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{u.receiver_phone_masked || 'No phone'}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      {u.sender_verified ? (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.receiver_verified ? (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.unlocked ? (
                        <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                          Released
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded bg-slate-700/50 text-slate-400 font-bold text-xs">
                          In Progress
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-slate-500 text-sm">
                    {loading ? 'Loading unlocks...' : 'No contact unlock records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
