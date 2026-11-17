import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Task, Application, Review } from '../types';
import { PaymentModal } from '../components/PaymentModal';
import { ReviewModal } from '../components/ReviewModal';
import { ReportModal } from '../components/ReportModal';
import {
  MapPin,
  Calendar,
  Clock,
  IndianRupee,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Star,
  Users,
  GraduationCap,
  ArrowLeft,
  Send,
  Sparkles,
  Check,
  X
} from 'lucide-react';

interface TaskDetailPageProps {
  taskId: string;
  onNavigate: (view: string, param?: string) => void;
}

export const TaskDetailPage: React.FC<TaskDetailPageProps> = ({ taskId, onNavigate }) => {
  const { user } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Application form state (student)
  const [proposedFee, setProposedFee] = useState<number>(0);
  const [pitchNote, setPitchNote] = useState<string>('');
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [applySuccess, setApplySuccess] = useState<boolean>(false);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [completionProof, setCompletionProof] = useState<string>('');
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  const fetchTaskDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getTaskById(taskId);
      if (res.success) {
        setTask(res.task);
        setApplications(res.applications || []);
        setProposedFee(res.task.budget);

        // Fetch reviews for task
        const revRes = await api.getTaskReviews(taskId);
        if (revRes.success) {
          setReviews(revRes.reviews || []);
        }
      } else {
        setError('Task not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load task details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const isOwner = user && task && user.id === task.customer_id;
  const isAssignedStudent = user && task && user.id === task.assigned_student_id;
  const hasApplied = applications.some((a) => a.student_id === user?.id);
  const myApplication = applications.find((a) => a.student_id === user?.id);

  // Student apply handler
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onNavigate('login');
      return;
    }
    setIsApplying(true);
    try {
      const res = await api.applyForTask({
        taskId,
        proposedFee: proposedFee || task!.budget,
        pitchNote
      });
      if (res.success) {
        setApplySuccess(true);
        fetchTaskDetails();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit application.');
    } finally {
      setIsApplying(false);
    }
  };

  // Customer assign student handler
  const handleAssignStudent = async (studentId: string, fee: number) => {
    if (!confirm('Assign this student and hold funds in secure escrow?')) return;
    setIsActionLoading(true);
    try {
      const res = await api.assignTask(taskId, { studentId, agreedFee: fee });
      if (res.success) {
        fetchTaskDetails();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to assign student.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Student starts task
  const handleStartTask = async () => {
    setIsActionLoading(true);
    try {
      const res = await api.startTask(taskId);
      if (res.success) {
        fetchTaskDetails();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to start task.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Student marks work completed
  const handleCompleteTask = async () => {
    setIsActionLoading(true);
    try {
      const res = await api.completeTask(taskId, completionProof);
      if (res.success) {
        fetchTaskDetails();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to complete task.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Customer confirms completion
  const handleConfirmCompletion = async () => {
    setIsActionLoading(true);
    try {
      const res = await api.confirmTaskCompletion(taskId);
      if (res.success) {
        fetchTaskDetails();
        setShowReviewModal(true); // Prompt review after payment release!
      }
    } catch (err: any) {
      alert(err.message || 'Failed to confirm completion.');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs">Loading task details...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Task Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">{error || 'This task does not exist or was deleted.'}</p>
        <button
          onClick={() => onNavigate('browse')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to Browse
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => onNavigate('browse')}
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to all tasks</span>
      </button>

      {/* MAIN TASK HEADER CARD */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {task.category_name}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                task.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                task.status === 'Applied' ? 'bg-amber-100 text-amber-800' :
                task.status === 'Assigned' ? 'bg-indigo-100 text-indigo-800' :
                task.status === 'In Progress' ? 'bg-purple-100 text-purple-800 animate-pulse' :
                task.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                'bg-slate-100 text-slate-700'
              }`}>
                Status: {task.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {task.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <div className="flex items-center space-x-1 font-medium text-slate-700">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>{task.locality}, {task.city} ({task.pincode})</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Deadline: {task.deadline}</span>
              </div>
            </div>
          </div>

          {/* Budget Display */}
          <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-5 min-w-[200px] text-right self-start">
            <div className="text-xs text-emerald-800 font-semibold mb-1">Agreed Task Budget</div>
            <div className="text-3xl font-extrabold text-emerald-700 tracking-tight">
              ₹{task.budget}
            </div>
            <div className="text-[11px] text-emerald-600 mt-1 flex items-center justify-end space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Escrow Protected</span>
            </div>
          </div>
        </div>

        {/* Task description */}
        <div className="py-6 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs">
            Task Description & Requirements
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            {task.description}
          </p>
        </div>

        {/* Customer & Assigned Student Info */}
        <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <img
              src={task.customer_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.customer_name}`}
              alt=""
              className="w-10 h-10 rounded-full bg-slate-200 object-cover"
            />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Posted by Neighbor</div>
              <div className="text-xs font-bold text-slate-900">{task.customer_name}</div>
              <div className="text-[11px] text-slate-500">{task.customer_locality || 'Local Resident'}</div>
            </div>
          </div>

          {task.assigned_student_name && (
            <div className="flex items-center space-x-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <img
                src={task.assigned_student_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assigned_student_name}`}
                alt=""
                className="w-10 h-10 rounded-full bg-slate-200 object-cover"
              />
              <div className="flex-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Assigned Student Helper</div>
                <div className="text-xs font-bold text-slate-900">{task.assigned_student_name}</div>
                <div className="text-[11px] text-slate-500">Working on task</div>
              </div>
              <button
                onClick={() => onNavigate('messages')}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-semibold flex items-center space-x-1 shadow-xs"
                title="Open Chat"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ACTIONS & WORKFLOW SECTION */}

      {/* 1. Student Application Form (If student & task is Open or Applied and not yet applied) */}
      {user?.role === 'student' && !isOwner && !hasApplied && (task.status === 'Open' || task.status === 'Applied') && (
        <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center space-x-2 text-emerald-700 mb-2 font-bold text-base">
            <Sparkles className="w-5 h-5" />
            <span>Apply to Help With This Task</span>
          </div>
          <p className="text-xs text-slate-600 mb-6">
            Introduce yourself to the neighbor. Mention your experience, when you can start, and your proposed fee.
          </p>

          <form onSubmit={handleApply} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Proposed Fee (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="50"
                    value={proposedFee}
                    onChange={(e) => setProposedFee(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Neighbor budget: ₹{task.budget}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pitch Note to Neighbor
              </label>
              <textarea
                rows={3}
                value={pitchNote}
                onChange={(e) => setPitchNote(e.target.value)}
                placeholder="Hi! I am a student at IISc/Christ, live 2km away and can easily help you with this chore today..."
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isApplying}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer flex items-center space-x-2"
            >
              {isApplying ? (
                <span>Submitting Application...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Task Application</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* 2. Student already applied status card */}
      {user?.role === 'student' && hasApplied && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 flex items-start space-x-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Application Submitted</h3>
            <p className="text-xs text-slate-600 mt-1">
              You applied with a proposed fee of <strong>₹{myApplication?.proposed_fee}</strong>. Status:{' '}
              <span className="font-bold text-emerald-700 uppercase text-[11px]">{myApplication?.status}</span>.
              The neighbor has been notified!
            </p>
          </div>
        </div>
      )}

      {/* 3. Customer applicant review section (Neighbor who posted task) */}
      {isOwner && (task.status === 'Open' || task.status === 'Applied') && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Interested Student Helpers ({applications.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review verified student profiles, ratings, and proposed fees before assigning.
              </p>
            </div>
          </div>

          {applications.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No students have applied yet. Your task is visible on the neighborhood map!
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-4">
                    <img
                      src={app.student_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.student_name}`}
                      alt=""
                      className="w-12 h-12 rounded-full bg-slate-100 object-cover flex-shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900">{app.student_name}</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                          {app.college_name || 'College Student'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-500">
                        <span className="flex items-center text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                          {app.average_rating || 5.0} ({app.ratings_count || 0})
                        </span>
                        <span>•</span>
                        <span>{app.total_tasks_completed || 0} completed tasks</span>
                      </div>
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                        "{app.pitch_note || 'Ready to assist with this task!'}"
                      </p>
                    </div>
                  </div>

                  {/* Fee & Action */}
                  <div className="flex items-center space-x-4 self-end md:self-center">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Proposed Fee</div>
                      <div className="text-lg font-extrabold text-emerald-600">₹{app.proposed_fee}</div>
                    </div>
                    <button
                      onClick={() => handleAssignStudent(app.student_id, app.proposed_fee)}
                      disabled={isActionLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      Hire & Assign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Task In Progress / Completed Actions Banner */}
      {(task.status === 'Assigned' || task.status === 'In Progress' || task.status === 'Completed') && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Task Execution & Progress</h2>

          <div className="flex flex-wrap gap-3">
            {/* Student Actions */}
            {isAssignedStudent && task.status === 'Assigned' && (
              <button
                onClick={handleStartTask}
                disabled={isActionLoading}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Start Working on Task
              </button>
            )}

            {isAssignedStudent && (task.status === 'In Progress' || task.status === 'Assigned') && (
              <div className="w-full space-y-3 pt-2">
                <input
                  type="text"
                  value={completionProof}
                  onChange={(e) => setCompletionProof(e.target.value)}
                  placeholder="Completion notes (e.g. Bought items and handed over receipt / completed tutoring NCERT ch 4)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
                <button
                  onClick={handleCompleteTask}
                  disabled={isActionLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Mark Work as Completed
                </button>
              </div>
            )}

            {/* Customer Actions */}
            {isOwner && task.status === 'Completed' && (
              <button
                onClick={handleConfirmCompletion}
                disabled={isActionLoading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center space-x-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm Completion & Release Payment (₹{task.budget})</span>
              </button>
            )}

            {/* Chat button */}
            <button
              onClick={() => onNavigate('messages')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Open Direct Chat</span>
            </button>

            {/* Leave Review (if completed) */}
            {task.status === 'Completed' && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
              >
                <Star className="w-4 h-4" />
                <span>Leave a Review</span>
              </button>
            )}

            {/* Report Issue button */}
            <button
              onClick={() => setShowReportModal(true)}
              className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition ml-auto flex items-center space-x-1"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Report Issue</span>
            </button>
          </div>
        </div>
      )}

      {/* REVIEWS SECTION */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span>Community Ratings & Reviews</span>
          </h2>
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <img
                      src={r.reviewer_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.reviewer_name}`}
                      alt=""
                      className="w-6 h-6 rounded-full bg-slate-200"
                    />
                    <span className="text-xs font-bold text-slate-800">{r.reviewer_name}</span>
                  </div>
                  <div className="flex items-center text-amber-500 font-bold text-xs">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      {showReviewModal && (
        <ReviewModal
          taskId={task.id}
          taskTitle={task.title}
          revieweeId={isOwner ? (task.assigned_student_id || '') : task.customer_id}
          revieweeName={isOwner ? (task.assigned_student_name || 'Student') : task.customer_name || 'Neighbor'}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => fetchTaskDetails()}
        />
      )}

      {showReportModal && (
        <ReportModal
          taskId={task.id}
          reportedUserId={isOwner ? task.assigned_student_id : task.customer_id}
          targetName={isOwner ? (task.assigned_student_name || 'Student') : task.customer_name || 'Neighbor'}
          onClose={() => setShowReportModal(false)}
          onSuccess={() => alert('Report filed with moderation team.')}
        />
      )}
    </div>
  );
};
