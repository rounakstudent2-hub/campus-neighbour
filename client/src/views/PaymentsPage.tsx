import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Payment } from '../types';
import { IndianRupee, ShieldCheck, CheckCircle2, Clock, AlertCircle, ArrowLeft } from 'lucide-react';

interface PaymentsPageProps {
  onNavigate: (view: string) => void;
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.getPaymentHistory();
        if (res.success) {
          setPayments(res.payments);
          setSummary(res.summary || {});
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayments();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={() => onNavigate(user?.role === 'student' ? 'student-dashboard' : 'neighbor-dashboard')}
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Payment & Escrow Records</h1>
          <p className="text-xs text-slate-500 mt-1">
            Official ledger of escrow deposits, releases, and transaction receipts.
          </p>
        </div>

        {/* Summary metric card */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 self-start sm:self-auto flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              {user?.role === 'student' ? 'Total Payouts' : 'Total Spent'}
            </div>
            <div className="text-xl font-extrabold text-emerald-700">
              ₹{user?.role === 'student' ? (summary.totalEarnings || 0) : (summary.totalSpent || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Escrow workflow banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex items-start space-x-3 text-xs leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-emerald-400">Neighborhood Escrow Protection:</span> When a neighbor hires a student helper, funds are safely held in escrow. They are only released to the student helper when the neighbor verifies the chore was completed satisfactorily.
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="p-4">Task Details</th>
                <th className="p-4">{user?.role === 'student' ? 'Customer / Neighbor' : 'Student Helper'}</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Gateway</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading records...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    No transactions on file yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{p.task_title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {p.id.substring(0, 8)}...</div>
                    </td>
                    <td className="p-4 text-slate-700">
                      {user?.role === 'student' ? p.customer_name : (p.student_name || 'Assigned Student')}
                    </td>
                    <td className="p-4 font-extrabold text-emerald-600 text-sm">
                      ₹{p.amount}
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-[11px]">
                      {p.payment_gateway} (Test)
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center space-x-1 ${
                        p.status === 'released' ? 'bg-emerald-100 text-emerald-800' :
                        p.status === 'escrow_held' ? 'bg-amber-100 text-amber-800' :
                        p.status === 'refunded' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {p.status === 'released' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        <span>{p.status === 'released' ? 'Released to Student' : p.status === 'escrow_held' ? 'Held in Escrow' : p.status}</span>
                      </span>
                    </td>
                    <td className="p-4 text-right text-slate-400 text-[11px]">
                      {new Date(p.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
