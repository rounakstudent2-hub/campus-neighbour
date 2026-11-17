import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, ArrowRight, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (view: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, loginAsDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setError(null);
    try {
      const success = await login(email, password);
      if (success) {
        onNavigate('browse');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoClick = async (demoEmail: string, role: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await loginAsDemo(demoEmail, role);
      if (success) {
        if (role === 'student') onNavigate('student-dashboard');
        else if (role === 'neighbor') onNavigate('neighbor-dashboard');
        else onNavigate('admin-dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Welcome Back</h1>
          <p className="text-xs text-slate-500 mt-1">
            Log in to manage your neighborhood chores and tasks.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
          >
            {isLoading ? <span>Signing in...</span> : <span>Log In to Account</span>}
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
            Evaluation Demo Logins (Instant)
          </div>
          <div className="space-y-2">
            <button
              onClick={() => handleDemoClick('priya.neighbor@gmail.com', 'neighbor')}
              className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer"
            >
              <span>Neighbor: Priya Sharma (Indiranagar)</span>
              <span className="text-[10px] bg-emerald-200 px-1.5 py-0.5 rounded">Customer</span>
            </button>
            <button
              onClick={() => handleDemoClick('rahul.student@iisc.edu.in', 'student')}
              className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer"
            >
              <span>Student: Rahul Verma (IISc Bangalore)</span>
              <span className="text-[10px] bg-blue-200 px-1.5 py-0.5 rounded">Helper</span>
            </button>
            <button
              onClick={() => handleDemoClick('admin@marketplace.local', 'admin')}
              className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer"
            >
              <span>Administrator: Superuser Operations</span>
              <span className="text-[10px] bg-purple-200 px-1.5 py-0.5 rounded">Admin</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="text-emerald-600 font-bold hover:underline"
          >
            Register Here
          </button>
        </div>
      </div>
    </div>
  );
};
