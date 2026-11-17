import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Application, Task, Payment, StudentProfile } from '../types';
import { TaskCard } from '../components/TaskCard';
import { getUserState } from '../utils/location';
import {
  Briefcase,
  IndianRupee,
  Star,
  Sliders,
  CheckCircle,
  Clock,
  MapPin,
  GraduationCap,
  MessageSquare,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Camera,
  Upload,
  Pencil,
  RefreshCw,
  User as UserIcon
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (view: string, param?: string) => void;
  onSelectTask: (task: Task) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate, onSelectTask }) => {
  const { user, profile, userLocation, refreshUser } = useAuth();
  const studentProfile = profile as StudentProfile | null;
  const studentState = getUserState(user, userLocation);

  const [activeTab, setActiveTab] = useState<'assigned' | 'applications' | 'earnings' | 'profile'>('assigned');
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Profile Edit State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [previewAvatar, setPreviewAvatar] = useState(
    user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.full_name || 'student'}`
  );
  const [selectedImageData, setSelectedImageData] = useState<string | null>(null);

  const [bio, setBio] = useState(studentProfile?.bio || '');
  const [collegeName, setCollegeName] = useState(studentProfile?.college_name || '');
  const [educationLevel, setEducationLevel] = useState(studentProfile?.education_level || '');
  const [skillsStr, setSkillsStr] = useState(
    Array.isArray(studentProfile?.skills) ? studentProfile.skills.join(', ') : 'Tech Support, Tutoring, Grocery'
  );
  const [workingRadiusKm, setWorkingRadiusKm] = useState(studentProfile?.working_radius_km || 5);
  const [isAvailable, setIsAvailable] = useState(studentProfile?.is_available === 1);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPreviewAvatar(
        user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name || 'student'}`
      );
    }
    if (studentProfile) {
      setBio(studentProfile.bio || '');
      setCollegeName(studentProfile.college_name || '');
      setEducationLevel(studentProfile.education_level || '');
      setSkillsStr(
        Array.isArray(studentProfile.skills) ? studentProfile.skills.join(', ') : 'Tech Support, Tutoring, Grocery'
      );
      setWorkingRadiusKm(studentProfile.working_radius_km || 5);
      setIsAvailable(studentProfile.is_available === 1);
    }
  }, [user, studentProfile]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5 MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImageData(result);
      setPreviewAvatar(result);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateAvatar = () => {
    const seed = `${fullName.trim() || 'student'}-${Date.now()}`;
    const generatedUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
    setSelectedImageData(null);
    setPreviewAvatar(generatedUrl);
  };

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Get tasks assigned to this student
      const taskRes = await api.getTasks({ assignedStudentId: user.id });
      if (taskRes.success) setAssignedTasks(taskRes.tasks);

      // 2. Get applications submitted
      const appRes = await api.getMyApplications();
      if (appRes.success) setApplications(appRes.applications);

      // 3. Get earnings & payment records
      const payRes = await api.getPaymentHistory();
      if (payRes.success) {
        setPayments(payRes.payments);
        setEarningsSummary(payRes.summary || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Full name cannot be empty.');
      return;
    }

    setProfileSaving(true);
    try {
      const skillsArr = skillsStr.split(',').map((s) => s.trim()).filter(Boolean);
      const payload: any = {
        fullName: fullName.trim(),
        bio,
        collegeName,
        educationLevel,
        skills: skillsArr,
        workingRadiusKm,
        isAvailable
      };

      if (selectedImageData) {
        payload.imageData = selectedImageData;
      } else if (previewAvatar) {
        payload.avatarUrl = previewAvatar;
      }

      const res = await api.updateProfile(payload);
      if (res.success) {
        await refreshUser();
        setSelectedImageData(null);
        setProfileSavedMsg(true);
        setTimeout(() => setProfileSavedMsg(false), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Student Profile Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div
            className="relative group cursor-pointer"
            onClick={() => setActiveTab('profile')}
            title="Click to edit profile photo"
          >
            <img
              src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.full_name}`}
              alt=""
              className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/50 object-cover"
            />
            <div className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-[10px] font-bold">
              Change
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Student Helper Portal</span>
              <span className="bg-emerald-400/20 text-emerald-300 text-[10px] px-2 py-0.2 rounded-full border border-emerald-400/30 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Helper</span>
              </span>
            </div>
            <h1 className="text-2xl font-extrabold flex items-center space-x-2">
              <span>{user?.full_name}</span>
              <button
                onClick={() => setActiveTab('profile')}
                title="Edit name and profile"
                className="p-1 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </h1>
            <div className="text-xs text-blue-100 flex items-center space-x-3 mt-1">
              <span className="flex items-center space-x-1">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{studentProfile?.college_name || 'University Student'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{user?.locality || 'Local Helper'}, {studentState} ({workingRadiusKm} km radius)</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className="px-4 py-3 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center space-x-2 cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => onNavigate('browse')}
            className="px-5 py-3 bg-white text-indigo-900 hover:bg-blue-50 rounded-xl font-bold text-xs shadow-md transition flex items-center space-x-2 cursor-pointer"
          >
            <Briefcase className="w-4 h-4 text-indigo-600" />
            <span>Find Nearby Gigs</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Earned</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            ₹{earningsSummary.totalEarnings || studentProfile?.total_earnings || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">₹{earningsSummary.pendingEscrow || 0} held in escrow</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Tasks Completed</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {studentProfile?.total_tasks_completed || 0}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Helper Rating</div>
          <div className="text-2xl font-extrabold text-amber-500 mt-1 flex items-center space-x-1">
            <span>{studentProfile?.average_rating || 5.0}</span>
            <Star className="w-5 h-5 fill-amber-400 inline" />
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{studentProfile?.ratings_count || 0} neighborhood reviews</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Working Radius</div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">
            {workingRadiusKm} km
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{isAvailable ? '🟢 Available for tasks' : '🔴 Unavailable'}</div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeTab === 'assigned'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Assigned Tasks ({assignedTasks.length})
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeTab === 'applications'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          My Applications ({applications.length})
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeTab === 'earnings'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Earnings & Payments ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Profile & Skills
        </button>
      </div>

      {/* TAB 1: ASSIGNED TASKS */}
      {activeTab === 'assigned' && (
        <div className="space-y-4">
          {assignedTasks.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">No tasks currently assigned</h3>
              <p className="text-xs text-slate-500 mb-4">
                Explore open chores around your college or neighborhood and submit an application!
              </p>
              <button
                onClick={() => onNavigate('browse')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                Browse Open Gigs
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {assignedTasks.map((task) => (
                <div key={task.id} className="relative">
                  <TaskCard
                    task={task}
                    onSelect={() => {
                      onSelectTask(task);
                      onNavigate(`task-detail-${task.id}`);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">No active applications</h3>
              <p className="text-xs text-slate-500 mb-4">Apply to nearby chores to start earning.</p>
              <button
                onClick={() => onNavigate('browse')}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
              >
                Find Tasks
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => onNavigate(`task-detail-${app.task_id}`)}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-900">{app.task_title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        app.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' :
                        app.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        Application {app.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center space-x-3">
                      <span>Posted by: <strong>{app.customer_name}</strong></span>
                      <span>•</span>
                      <span>Locality: {app.task_locality}</span>
                    </div>
                    <p className="text-xs text-slate-600 italic mt-1">"{app.pitch_note}"</p>
                  </div>

                  <div className="text-right self-end sm:self-center">
                    <div className="text-[10px] text-slate-400">Proposed Fee</div>
                    <div className="text-base font-extrabold text-emerald-600">₹{app.proposed_fee}</div>
                    <span className="text-[10px] text-indigo-600 font-semibold flex items-center space-x-0.5 justify-end mt-1">
                      <span>View details</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EARNINGS & PAYMENTS */}
      {activeTab === 'earnings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Transaction History</h3>
                <span className="text-xs text-slate-500">All incoming student payouts and escrow deposits</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Task</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-4 font-semibold text-slate-800">{p.task_title}</td>
                        <td className="p-4 text-slate-600">{p.customer_name}</td>
                        <td className="p-4 font-extrabold text-emerald-600">₹{p.amount}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'released' ? 'bg-emerald-100 text-emerald-800' :
                            p.status === 'escrow_held' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {p.status === 'released' ? 'Deposited in Earnings' : 'Protected in Escrow'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">
                          {new Date(p.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PROFILE & SKILLS */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-2xl">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Student Helper Profile</h2>
          <p className="text-xs text-slate-500 mb-6">
            Keep your skills, bio, and working radius up to date to get matched with the best nearby chores.
          </p>

          {profileSavedMsg && (
            <div className="p-3 mb-6 bg-emerald-50 text-emerald-700 text-xs rounded-xl font-bold flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* Profile Picture Upload Section */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group shrink-0">
                <img
                  src={previewAvatar}
                  alt={fullName}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md bg-white"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to upload a new profile picture"
                  className="absolute inset-0 rounded-full bg-slate-900/50 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition cursor-pointer backdrop-blur-[2px]"
                >
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px] font-bold">Change</span>
                </button>
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Profile Picture</span>
                  <span className="text-[11px] text-slate-500">
                    Upload your photo (PNG, JPG, WEBP, SVG up to 5MB)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarFileChange}
                    accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateAvatar}
                    title="Generate a fresh stylized avatar based on your name"
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Generate Avatar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Student Full Name (Rewriteable) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Student Full Name <span className="text-indigo-600 font-normal">(Rewriteable)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                This name is displayed to residents, on applied chores, and in chat.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">College / University Name</label>
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g. Indian Institute of Science (IISc) / Christ University"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Education Level</label>
              <input
                type="text"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                placeholder="e.g. Undergraduate (B.Tech Year 3)"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Skills & Strengths (comma-separated tags)
              </label>
              <input
                type="text"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                placeholder="e.g. Math Tutoring, Dog Walking, Wi-Fi Setup, Grocery Shopping"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bio / About Yourself</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Punctual, polite, and enthusiastic student helper..."
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Working Radius */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-700">Preferred Working Radius:</span>
                <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {workingRadiusKm} km from location
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={workingRadiusKm}
                onChange={(e) => setWorkingRadiusKm(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="avail-toggle"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="avail-toggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                I am actively available to take on neighborhood chores right now
              </label>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={profileSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {profileSaving ? 'Saving Changes...' : 'Save Profile Details'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
