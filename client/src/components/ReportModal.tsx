import React, { useState } from 'react';
import { api } from '../services/api';
import { AlertTriangle, X } from 'lucide-react';

interface ReportModalProps {
  taskId?: string;
  reportedUserId?: string;
  targetName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  taskId,
  reportedUserId,
  targetName,
  onClose,
  onSuccess
}) => {
  const [reason, setReason] = useState('Task dispute / incomplete work');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.submitReport({
        taskId,
        reportedUserId,
        reason,
        details
      });
      if (res.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
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

        <div className="flex items-center space-x-2 text-rose-600 mb-3">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="text-lg font-bold text-slate-900">Report Issue or Concern</h3>
        </div>

        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Reporting regarding <strong className="text-slate-800">{targetName}</strong>. Our trust & safety team monitors reports 24/7.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Report</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
            >
              <option value="Task dispute / incomplete work">Task dispute / incomplete work</option>
              <option value="No-show without notice">No-show without notice</option>
              <option value="Unprofessional or inappropriate behavior">Unprofessional or inappropriate behavior</option>
              <option value="Payment disagreement">Payment disagreement</option>
              <option value="Suspicious or fake profile">Suspicious or fake profile</option>
              <option value="Safety or physical concern">Safety or physical concern</option>
              <option value="Other">Other reason</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detailed Description
            </label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide specific dates, times, or evidence to assist our investigation..."
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none leading-relaxed"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="flex items-center space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
