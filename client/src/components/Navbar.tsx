import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import { Notification } from '../types';
import { EditProfileModal } from './EditProfileModal';
import {
  Bell,
  MessageSquare,
  PlusCircle,
  User,
  LogOut,
  MapPin,
  Shield,
  Briefcase,
  ChevronDown,
  Compass,
  CheckCircle2,
  X,
  Pencil
} from 'lucide-react';

interface NavbarProps {
  onNavigate: (view: string, param?: string) => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentView }) => {
  const { user, logout, userLocation, requestCurrentLocation, loginAsDemo } = useAuth();
  const { recentNotification } = useSocket();

  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (recentNotification) {
      setNotifications(prev => [recentNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    }
  }, [recentNotification]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLocationClick = async () => {
    setLocationLoading(true);
    await requestCurrentLocation();
    setLocationLoading(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center">
                Campus<span className="text-emerald-600">Neighbor</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 block -mt-1 tracking-wider uppercase">
                Hyperlocal Marketplace
              </span>
            </div>
          </div>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => onNavigate('browse')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                currentView === 'browse'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Explore Tasks</span>
            </button>

            {user?.role === 'neighbor' && (
              <>
                <button
                  onClick={() => onNavigate('neighbor-dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'neighbor-dashboard'
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  My Posted Tasks
                </button>
                <button
                  onClick={() => onNavigate('post-task')}
                  className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm flex items-center space-x-1.5 ml-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Post a Task</span>
                </button>
              </>
            )}

            {user?.role === 'student' && (
              <>
                <button
                  onClick={() => onNavigate('student-dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    currentView === 'student-dashboard'
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Student Dashboard</span>
                </button>
              </>
            )}

            {user?.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin-dashboard')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                  currentView === 'admin-dashboard'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin Console</span>
              </button>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-2.5">
            {/* Location Pill */}
            <button
              onClick={handleLocationClick}
              title="Click to detect current GPS location"
              className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              <MapPin className={`w-3.5 h-3.5 ${locationLoading ? 'animate-bounce text-emerald-600' : 'text-emerald-600'}`} />
              <span className="max-w-[120px] truncate">{userLocation?.locality || 'Bengaluru'}</span>
            </button>

            {/* Quick Demo Switcher for Evaluation */}
            <div className="relative">
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
              >
                <span>Demo Accounts</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showDemoMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                  <div className="px-3 py-1 font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                    Instant Switch Roles
                  </div>
                  <button
                    onClick={async () => {
                      await loginAsDemo('priya.neighbor@gmail.com', 'neighbor');
                      setShowDemoMenu(false);
                      onNavigate('neighbor-dashboard');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">Priya Sharma (Neighbor)</div>
                      <div className="text-[11px] text-slate-500">Indiranagar • Posts tasks</div>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">Customer</span>
                  </button>
                  <button
                    onClick={async () => {
                      await loginAsDemo('rahul.student@iisc.edu.in', 'student');
                      setShowDemoMenu(false);
                      onNavigate('student-dashboard');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">Rahul Verma (Student)</div>
                      <div className="text-[11px] text-slate-500">IISc Bangalore • Helper</div>
                    </div>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">Student</span>
                  </button>
                  <button
                    onClick={async () => {
                      await loginAsDemo('admin@marketplace.local', 'admin');
                      setShowDemoMenu(false);
                      onNavigate('admin-dashboard');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-purple-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">Admin Superuser</div>
                      <div className="text-[11px] text-slate-500">Full platform controls</div>
                    </div>
                    <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-medium">Admin</span>
                  </button>
                </div>
              )}
            </div>

            {user ? (
              <>
                {/* Messages button */}
                <button
                  onClick={() => onNavigate('messages')}
                  title="Messages & Chat"
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifs(!showNotifs);
                      if (!showNotifs) loadNotifications();
                    }}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                        <span className="font-bold text-slate-900 text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                if (n.link_url) {
                                  setShowNotifs(false);
                                  onNavigate(n.link_url.replace('/dashboard/tasks/', 'task-detail-'));
                                }
                              }}
                              className={`p-3.5 hover:bg-slate-50 transition cursor-pointer ${
                                !n.is_read ? 'bg-emerald-50/50' : ''
                              }`}
                            >
                              <div className="flex items-start space-x-2.5">
                                <div className="mt-0.5 w-2 h-2 rounded-full flex-shrink-0 bg-emerald-500" />
                                <div className="flex-1">
                                  <div className="text-xs font-bold text-slate-900">{n.title}</div>
                                  <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</div>
                                  <div className="text-[10px] text-slate-400 mt-1">
                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Avatar & Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-1 pl-2 bg-slate-100 hover:bg-slate-200 rounded-full transition"
                  >
                    <img
                      src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`}
                      alt={user.full_name}
                      className="w-7 h-7 rounded-full bg-white object-cover"
                    />
                    <span className="text-xs font-semibold text-slate-700 max-w-[90px] truncate hidden sm:inline">
                      {user.full_name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 mr-1" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <div className="font-bold text-slate-900">{user.full_name}</div>
                        <div className="text-slate-500 truncate text-[11px]">{user.email}</div>
                        <span className="inline-block mt-1 uppercase text-[9px] font-extrabold tracking-wider bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          {user.role}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowEditProfileModal(true);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-emerald-800 flex items-center space-x-2 font-semibold"
                      >
                        <Pencil className="w-4 h-4 text-emerald-600" />
                        <span>Edit Profile & Photo</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          if (user.role === 'student') onNavigate('student-dashboard');
                          else if (user.role === 'neighbor') onNavigate('neighbor-dashboard');
                          else onNavigate('admin-dashboard');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
                      >
                        <User className="w-4 h-4 text-slate-500" />
                        <span>My Dashboard & Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('payments');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
                      >
                        <CheckCircle2 className="w-4 h-4 text-slate-500" />
                        <span>Payment History</span>
                      </button>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                          onNavigate('landing');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center space-x-2 font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                >
                  Log In
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-sm"
                >
                  Join Community
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      </header>
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
      />
    </>
  );
};
