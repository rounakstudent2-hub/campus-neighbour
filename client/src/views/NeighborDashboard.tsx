import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Task } from '../types';
import { TaskCard } from '../components/TaskCard';
import { EditProfileModal } from '../components/EditProfileModal';
import { getUserState } from '../utils/location';
import {
  PlusCircle,
  Briefcase,
  Clock,
  CheckCircle,
  IndianRupee,
  Users,
  MapPin,
  Settings,
  MessageSquare,
  Pencil
} from 'lucide-react';

interface NeighborDashboardProps {
  onNavigate: (view: string, param?: string) => void;
  onSelectTask: (task: Task) => void;
}

export const NeighborDashboard: React.FC<NeighborDashboardProps> = ({ onNavigate, onSelectTask }) => {
  const { user, userLocation } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'active' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  const neighborState = getUserState(user, userLocation);

  const fetchMyTasks = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await api.getTasks({ customerId: user.id });
      if (res.success) {
        setTasks(res.tasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, [user]);

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'open') return t.status === 'Open' || t.status === 'Applied';
    if (activeTab === 'active') return t.status === 'Assigned' || t.status === 'In Progress';
    if (activeTab === 'completed') return t.status === 'Completed';
    return true;
  });

  const totalSpent = tasks
    .filter((t) => t.status === 'Completed')
    .reduce((acc, curr) => acc + (curr.budget || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with profile banner */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="relative group cursor-pointer" onClick={() => setShowEditModal(true)} title="Click to change profile photo">
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
            <div className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">Neighbor Portal</div>
            <h1 className="text-2xl font-extrabold flex items-center space-x-2">
              <span>{user?.full_name}</span>
              <button
                onClick={() => setShowEditModal(true)}
                title="Edit name and profile"
                className="p-1 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </h1>
            <div className="text-xs text-emerald-100 flex items-center space-x-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{user?.locality || 'Local Resident'}, {neighborState}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-3 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center space-x-2 cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => onNavigate('post-task')}
            className="px-5 py-3 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-xs shadow-md transition flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>Post a New Task</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Tasks Posted</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{tasks.length}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Reviewing Applicants</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            {tasks.filter((t) => t.status === 'Applied').length}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Tasks In Progress</div>
          <div className="text-2xl font-extrabold text-purple-600 mt-1">
            {tasks.filter((t) => t.status === 'Assigned' || t.status === 'In Progress').length}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Completed & Paid</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            ₹{totalSpent}
          </div>
        </div>
      </div>

      {/* TASK FILTER TABS */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Tasks ({tasks.length})
        </button>

        <button
          onClick={() => setActiveTab('open')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeTab === 'open'
              ? 'bg-amber-500 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Open & Applied ({tasks.filter((t) => t.status === 'Open' || t.status === 'Applied').length})
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeTab === 'active'
              ? 'bg-purple-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          In Progress ({tasks.filter((t) => t.status === 'Assigned' || t.status === 'In Progress').length})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeTab === 'completed'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Completed ({tasks.filter((t) => t.status === 'Completed').length})
        </button>
      </div>

      {/* TASK LISTINGS */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">No tasks in this section</h3>
          <p className="text-xs text-slate-500 mb-4">
            Need an extra pair of hands for groceries, pet care, or tech setup?
          </p>
          <button
            onClick={() => onNavigate('post-task')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
          >
            Post a Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onSelect={() => {
                onSelectTask(task);
                onNavigate(`task-detail-${task.id}`);
              }}
            />
          ))}
        </div>
      )}

      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </div>
  );
};
