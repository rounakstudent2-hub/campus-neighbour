import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { UserPlus, GraduationCap, Home, ShieldCheck, Camera, Upload, X } from 'lucide-react';
import { detectStateFromLocation } from '../utils/location';

interface RegisterPageProps {
  onNavigate: (view: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [role, setRole] = useState<UserRole>('neighbor');
  const [fullName, setFullName] = useState('');
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [locality, setLocality] = useState('Indiranagar');
  const [pincode, setPincode] = useState('560038');
  const [address, setAddress] = useState('');

  // Student specific
  const [collegeName, setCollegeName] = useState('Indian Institute of Science (IISc)');
  const [educationLevel, setEducationLevel] = useState('Undergraduate');
  const [skills, setSkills] = useState('Grocery Shopping, Math Tutoring, Tech Support, Pet Care');
  const [workingRadiusKm, setWorkingRadiusKm] = useState(5);
  const [isGuardianApproved, setIsGuardianApproved] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isBengal =
        locality.toLowerCase().includes('newtown') ||
        locality.toLowerCase().includes('kolkata') ||
        locality.toLowerCase().includes('salt lake') ||
        locality.toLowerCase().includes('rajarhat') ||
        locality.toLowerCase().includes('action area') ||
        (pincode && pincode.startsWith('7'));

      const derivedCity = isBengal
        ? 'Kolkata'
        : locality.toLowerCase().includes('mumbai')
        ? 'Mumbai'
        : locality.toLowerCase().includes('delhi')
        ? 'Delhi'
        : 'Bengaluru';

      const derivedState = detectStateFromLocation({ locality, city: derivedCity, pincode });

      const payload: any = {
        fullName,
        email,
        password,
        phone,
        role,
        locality,
        city: derivedCity,
        state: derivedState,
        pincode,
        address,
        latitude: isBengal ? 22.5867 : locality.toLowerCase().includes('koramangala') ? 12.9352 : 12.9784,
        longitude: isBengal ? 88.4754 : locality.toLowerCase().includes('koramangala') ? 77.6245 : 77.6408
      };

      if (avatarData) {
        payload.imageData = avatarData;
      }

      if (role === 'student') {
        payload.collegeName = collegeName;
        payload.educationLevel = educationLevel;
        payload.skills = skills.split(',').map((s) => s.trim()).filter(Boolean);
        payload.workingRadiusKm = workingRadiusKm;
        payload.isGuardianApproved = isGuardianApproved;
      }

      const success = await register(payload);
      if (success) {
        if (role === 'student') onNavigate('student-dashboard');
        else onNavigate('neighbor-dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Join CampusNeighbor</h1>
          <p className="text-xs text-slate-500 mt-1">
            Connect with your local community as a resident or student helper.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">I am registering as:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('neighbor')}
                className={`p-3 rounded-2xl border text-left transition flex items-center space-x-3 cursor-pointer ${
                  role === 'neighbor'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className={`p-2 rounded-xl ${role === 'neighbor' ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}>
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Neighbor / Resident</div>
                  <div className="text-[10px] text-slate-500">I need help with tasks</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('student')}
                className={`p-3 rounded-2xl border text-left transition flex items-center space-x-3 cursor-pointer ${
                  role === 'student'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className={`p-2 rounded-xl ${role === 'student' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Student / Helper</div>
                  <div className="text-[10px] text-slate-500">I want to earn flexible income</div>
                </div>
              </button>
            </div>
          </div>

          {/* Profile Picture Upload (Optional) */}
          <div className="flex items-center space-x-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="relative group shrink-0">
              <img
                src={avatarData || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName || 'newuser'}`}
                alt="Avatar Preview"
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs bg-white"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-slate-900/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-800">Profile Picture (Optional)</div>
              <div className="text-[11px] text-slate-500">Upload a custom photo or use default avatar</div>
              <div className="mt-1.5 flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => setAvatarData(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>Choose Photo</span>
                </button>
                {avatarData && (
                  <button
                    type="button"
                    onClick={() => setAvatarData(null)}
                    className="text-[11px] text-rose-600 hover:underline flex items-center space-x-0.5"
                  >
                    <X className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Rohan Sharma"
                required
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Neighborhood Locality</label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="Indiranagar / Koramangala / HSR"
                required
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="560038"
                required
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Student Specific Fields */}
          {role === 'student' && (
            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-3">
              <div className="text-xs font-bold text-blue-900 flex items-center space-x-1">
                <GraduationCap className="w-4 h-4 text-blue-700" />
                <span>Student Verification & Credentials</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">College / University *</label>
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  placeholder="e.g. IISc Bangalore / Christ University / PES University"
                  required
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Skills & Strengths</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Comma separated: Math, Tech Help, Grocery, Pet Sitting"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                  <span>Preferred Radius:</span>
                  <span className="text-blue-700">{workingRadiusKm} km</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={workingRadiusKm}
                  onChange={(e) => setWorkingRadiusKm(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="guardian-check"
                  checked={isGuardianApproved}
                  onChange={(e) => setIsGuardianApproved(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
                <label htmlFor="guardian-check" className="text-[11px] text-slate-600 cursor-pointer">
                  I confirm I am 18+ years of age or have verified guardian consent.
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already registered?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="text-emerald-600 font-bold hover:underline"
          >
            Log In Here
          </button>
        </div>
      </div>
    </div>
  );
};
