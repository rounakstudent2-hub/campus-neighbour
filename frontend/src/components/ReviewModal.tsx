import React, { useState } from 'react';
import { api } from '../services/api';
import { Star, X } from 'lucide-react';

interface ReviewModalProps {
  taskId: string;
  taskTitle: string;
  revieweeId: string;
  revieweeName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  taskId,
  taskTitle,
  revieweeId,
  revieweeName,
  onClose,
  onSuccess
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.submitReview({
        taskId,
        revieweeId,
        rating,
        comment
      });
      if (res.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit review.');
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

        <h3 className="text-lg font-bold text-slate-900 mb-1">Rate & Review</h3>
        <p className="text-xs text-slate-500 mb-4">
          Share your experience working with <span className="font-semibold text-slate-800">{revieweeName}</span> for "{taskTitle}".
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star selector */}
          <div className="flex flex-col items-center justify-center py-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none transition-colors"
                >
                  <Star
                    className={`w-7 h-7 ${
                      (hoverRating || rating) >= star
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-600 mt-2">
              {rating === 5 ? 'Excellent Experience' : rating === 4 ? 'Very Good' : rating === 3 ? 'Average' : 'Could be better'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Your Review / Feedback
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Was the student punctual, polite, and effective? Write a few sentences to help neighbors..."
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
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
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Submitting...' : 'Post Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
