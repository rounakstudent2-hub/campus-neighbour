import React, { useState } from 'react';
import { Task } from '../types';
import { api } from '../services/api';
import { ShieldCheck, CreditCard, Smartphone, Building, X, CheckCircle, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  task: Task;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ task, onClose, onSuccess }) => {
  const [method, setMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('user@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePay = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      // 1. Create order
      const orderRes = await api.createPaymentOrder(task.id, task.budget);
      if (!orderRes.success) throw new Error('Could not create order.');

      // 2. Simulated processing delay for realistic UX
      await new Promise((r) => setTimeout(r, 1200));

      // 3. Verify payment into escrow
      const verifyRes = await api.verifyPayment({
        taskId: task.id,
        orderId: orderRes.order.id,
        paymentId: `pay_rzp_mock_${Date.now()}`,
        amount: task.budget,
        studentId: task.assigned_student_id
      });

      if (verifyRes.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError('Payment verification failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Payment processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Payment Secured in Escrow!</h3>
            <p className="text-sm text-slate-600">
              ₹{task.budget} is safely deposited. The funds will be released to the student helper once you confirm satisfactory completion.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Secure Escrow Checkout</h3>
                <span className="text-xs text-slate-500">Powered by Razorpay (Test Environment)</span>
              </div>
            </div>

            {/* Test Mode Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Test Mode Active:</strong> No real bank charge will be made. You can simulate instant payment to hold funds in escrow.
              </span>
            </div>

            {/* Task summary */}
            <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">Task Payment For:</div>
              <div className="font-bold text-slate-900 text-sm">{task.title}</div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-600">Agreed Task Amount:</span>
                <span className="text-lg font-extrabold text-emerald-600">₹{task.budget}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3 mb-5">
              <div className="text-xs font-bold text-slate-700">Select Payment Method:</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('upi')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition ${
                    method === 'upi'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>UPI / QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('card')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition ${
                    method === 'card'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('netbanking')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition ${
                    method === 'netbanking'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>NetBanking</span>
                </button>
              </div>

              {method === 'upi' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">UPI ID / VPA</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {method === 'card' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Test Card Details</label>
                  <input
                    type="text"
                    value={cardNumber}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="p-2.5 mb-4 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Action button */}
            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing Escrow Deposit...</span>
                </>
              ) : (
                <span>Deposit ₹{task.budget} into Escrow</span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
