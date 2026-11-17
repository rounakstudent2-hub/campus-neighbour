import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, Task, TaskCategory, Report } from '../types';
import {
  Shield,
  Users,
  Briefcase,
  AlertTriangle,
  Tag,
  BarChart3,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Plus,
  IndianRupee,
  Activity
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (view: string, param?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'tasks' | 'reports' | 'categories'>('stats');
  const [stats, setStats] = useState<any>(null);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & search
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('');

  // New Category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [isAddingCat, setIsAddingCat] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.getAdminStats();
      if (res.success) {
        setStats(res.stats);
        setCategoryStats(res.categoryStats || []);
        setRecentTasks(res.recentTasks || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.getAdminUsers({ search: userSearch, role: userRoleFilter });
      if (res.success) setUsers(res.users);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.getAdminTasks({ status: taskStatusFilter });
      if (res.success) setTasks(res.tasks);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await api.getAdminReports();
      if (res.success) setReports(res.reports);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.getAdminCategories();
      if (res.success) setCategories(res.categories);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchStats(), fetchUsers(), fetchTasks(), fetchReports(), fetchCategories()]).finally(() => {
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [userSearch, userRoleFilter]);

  useEffect(() => {
    if (activeTab === 'tasks') fetchTasks();
  }, [taskStatusFilter]);

  // Actions
  const handleToggleUserStatus = async (userId: string, currentActive: number) => {
    const action = currentActive ? 'suspend' : 'reactivate';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      const res = await api.updateUserStatus(userId, { isActive: currentActive ? false : true });
      if (res.success) {
        fetchUsers();
        fetchStats();
      }
    } catch (err: any) {
      alert(err.message || 'Operation failed.');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await api.updateTaskAdminStatus(taskId, newStatus);
      if (res.success) {
        fetchTasks();
        fetchStats();
      }
    } catch (err: any) {
      alert(err.message || 'Operation failed.');
    }
  };

  const handleResolveReport = async (reportId: string, status: string) => {
    const notes = prompt('Enter administrative notes / action taken:', 'Reviewed and resolved according to safety standards.');
    if (notes === null) return;
    try {
      const res = await api.updateAdminReport(reportId, { status, adminNotes: notes });
      if (res.success) {
        fetchReports();
        fetchStats();
      }
    } catch (err: any) {
      alert(err.message || 'Operation failed.');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsAddingCat(true);
    try {
      const res = await api.createAdminCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim(),
        icon: newCatIcon
      });
      if (res.success) {
        setNewCatName('');
        setNewCatDesc('');
        fetchCategories();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add category.');
    } finally {
      setIsAddingCat(false);
    }
  };

  const handleToggleCategory = async (catId: string, currentActive: number) => {
    try {
      const res = await api.updateAdminCategory(catId, { isActive: currentActive ? false : true });
      if (res.success) fetchCategories();
    } catch (err) {
      alert('Failed to update category.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-purple-200" />
          </div>
          <div>
            <div className="text-xs font-bold text-purple-300 uppercase tracking-wider">Superuser Console</div>
            <h1 className="text-2xl font-extrabold tracking-tight">Platform Operations & Moderation</h1>
            <p className="text-xs text-purple-200 mt-0.5">
              Comprehensive neighborhood marketplace metrics, user management, and dispute control.
            </p>
          </div>
        </div>
      </div>

      {/* KPI STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-semibold">Total Users</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.totalUsers || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{stats?.totalStudents || 0} students • {stats?.totalCustomers || 0} neighbors</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-semibold">Total Tasks</div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">{stats?.totalTasks || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{stats?.activeTasks || 0} active now</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-semibold">Completed Tasks</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{stats?.completedTasks || 0}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-bold">100% verified</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-semibold">Platform Volume</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">₹{stats?.totalVolume || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Total INR paid out</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-semibold">Disputed Tasks</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{stats?.disputedTasks || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active mediation</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-semibold">Pending Reports</div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{stats?.pendingReports || 0}</div>
          <div className="text-[10px] text-rose-600 font-bold mt-0.5">Requires review</div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'stats' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Platform Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'users' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Management ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'tasks' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Task Moderation ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'reports' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Reports & Complaints ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
            activeTab === 'categories' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Category Manager ({categories.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & BREAKDOWN */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Categories breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">Task Volume by Category</h3>
            <div className="space-y-3">
              {categoryStats.map((cs) => (
                <div key={cs.name} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{cs.name}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (cs.task_count || 0) * 20)}%` }}
                      />
                    </div>
                    <span className="font-bold text-slate-900 w-6 text-right">{cs.task_count || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent tasks stream */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">Latest Platform Activity</h3>
            <div className="space-y-3">
              {recentTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onNavigate(`task-detail-${t.id}`)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 cursor-pointer flex items-center justify-between transition"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{t.title}</div>
                    <div className="text-[10px] text-slate-500">By {t.customer_name} • Status: {t.status}</div>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600">₹{t.budget}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user name or email..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold"
              >
                <option value="">All Roles</option>
                <option value="student">Students</option>
                <option value="neighbor">Neighbors</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Locality</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{u.full_name}</div>
                      <div className="text-[10px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'student' ? 'bg-blue-100 text-blue-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{u.locality || 'Bengaluru'}</td>
                    <td className="p-4 text-slate-500 text-[11px]">
                      {u.role === 'student' ? (
                        <span>⭐ {(u as any).average_rating || 5.0} • {(u as any).total_tasks_completed || 0} gigs</span>
                      ) : (
                        <span>{(u as any).total_tasks_posted || 0} tasks posted</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          u.is_active
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {u.is_active ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TASK MODERATION */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">All Marketplace Tasks</h3>
            <select
              value={taskStatusFilter}
              onChange={(e) => setTaskStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Applied">Applied</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Disputed">Disputed</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="p-4">Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Neighbor</th>
                  <th className="p-4">Assigned Student</th>
                  <th className="p-4">Budget</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900 max-w-[200px] truncate">{t.title}</td>
                    <td className="p-4 text-slate-600">{t.category_name}</td>
                    <td className="p-4 text-slate-700">{t.customer_name}</td>
                    <td className="p-4 text-slate-700">{t.assigned_student_name || '—'}</td>
                    <td className="p-4 font-extrabold text-emerald-600">₹{t.budget}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <button
                        onClick={() => onNavigate(`task-detail-${t.id}`)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold"
                      >
                        Inspect
                      </button>
                      {t.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleUpdateTaskStatus(t.id, 'Cancelled')}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-semibold"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: REPORTS & COMPLAINTS */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Incident & Dispute Reports</h3>
            <span className="text-xs text-slate-500">Review neighbor complaints, task disputes, and safety alerts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="p-4">Reporter</th>
                  <th className="p-4">Reported Party / Task</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Zero incident reports on file!
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-4 font-semibold text-slate-900">{r.reporter_name}</td>
                      <td className="p-4 text-slate-600">{r.reported_user_name || r.task_title || 'N/A'}</td>
                      <td className="p-4 font-bold text-rose-600">{r.reason}</td>
                      <td className="p-4 text-slate-600 max-w-[250px] truncate">{r.details}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                          r.status === 'pending' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1">
                        {r.status !== 'resolved' && (
                          <button
                            onClick={() => handleResolveReport(r.id, 'resolved')}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-semibold"
                          >
                            Resolve
                          </button>
                        )}
                        {r.status !== 'dismissed' && (
                          <button
                            onClick={() => handleResolveReport(r.id, 'dismissed')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-semibold"
                          >
                            Dismiss
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CATEGORY MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Add Category Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs max-w-xl">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Add New Task Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category name (e.g. Garden Care & Lawn Mowing)"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Short description of tasks in this category..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
              />
              <button
                type="submit"
                disabled={isAddingCat}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Create Category</span>
              </button>
            </form>
          </div>

          {/* Categories Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Existing Task Categories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl border border-slate-200 flex items-start justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{c.description}</div>
                    <div className="text-[10px] text-slate-400 mt-2 font-mono">slug: {c.slug}</div>
                  </div>
                  <button
                    onClick={() => handleToggleCategory(c.id, c.is_active)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {c.is_active ? 'Active' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
