import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { api } from './services/api';
import { TaskCategory, Task } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './views/LandingPage';
import { BrowseTasksPage } from './views/BrowseTasksPage';
import { TaskDetailPage } from './views/TaskDetailPage';
import { PostTaskPage } from './views/PostTaskPage';
import { NeighborDashboard } from './views/NeighborDashboard';
import { StudentDashboard } from './views/StudentDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { MessagesView } from './views/MessagesView';
import { PaymentsPage } from './views/PaymentsPage';
import { LoginPage } from './views/LoginPage';
import { RegisterPage } from './views/RegisterPage';
import { CheckCircle2, Bell, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { recentNotification, clearRecentNotification } = useSocket();

  const [currentView, setCurrentView] = useState<string>('landing');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<TaskCategory[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.getCategories();
        if (res.success) {
          setCategories(res.categories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const handleNavigate = (view: string, param?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (view.startsWith('task-detail-')) {
      const id = view.replace('task-detail-', '');
      setSelectedTaskId(id);
      setCurrentView('task-detail');
      return;
    }

    if (param) {
      if (view === 'browse') {
        setSelectedCategory(param);
      } else if (view === 'task-detail') {
        setSelectedTaskId(param);
      }
    }

    setCurrentView(view);
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTaskId(task.id);
    setCurrentView('task-detail');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-600">Starting CampusNeighbor...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Real-time Global Toast Alert */}
      {recentNotification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 max-w-sm animate-in slide-in-from-bottom flex items-start space-x-3">
          <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-white mb-0.5">{recentNotification.title}</div>
            <div className="text-slate-300 leading-relaxed">{recentNotification.message}</div>
          </div>
          <button
            onClick={clearRecentNotification}
            className="text-slate-400 hover:text-white p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <Navbar onNavigate={handleNavigate} currentView={currentView} />

      {/* Main Content Router */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage categories={categories} onNavigate={handleNavigate} />
        )}

        {currentView === 'browse' && (
          <BrowseTasksPage
            categories={categories}
            initialCategory={selectedCategory}
            onSelectTask={handleSelectTask}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'task-detail' && (
          <TaskDetailPage taskId={selectedTaskId} onNavigate={handleNavigate} />
        )}

        {currentView === 'post-task' && (
          <PostTaskPage categories={categories} onNavigate={handleNavigate} />
        )}

        {currentView === 'neighbor-dashboard' && (
          <NeighborDashboard onNavigate={handleNavigate} onSelectTask={handleSelectTask} />
        )}

        {currentView === 'student-dashboard' && (
          <StudentDashboard onNavigate={handleNavigate} onSelectTask={handleSelectTask} />
        )}

        {currentView === 'admin-dashboard' && (
          <AdminDashboard onNavigate={handleNavigate} />
        )}

        {currentView === 'messages' && (
          <MessagesView onNavigate={handleNavigate} />
        )}

        {currentView === 'payments' && (
          <PaymentsPage onNavigate={handleNavigate} />
        )}

        {currentView === 'login' && (
          <LoginPage onNavigate={handleNavigate} />
        )}

        {currentView === 'register' && (
          <RegisterPage onNavigate={handleNavigate} />
        )}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
