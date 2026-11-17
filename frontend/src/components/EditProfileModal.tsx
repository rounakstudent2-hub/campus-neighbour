import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { detectStateFromLocation, getUserState } from '../utils/location';
import {
  X,
  Camera,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  Phone,
  MapPin,
  GraduationCap,
  Sparkles
} from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [locality, setLocality] = useState(user?.locality || '');
  const [city, setCity] = useState(user?.city || '');
  const [stateName, setStateName] = useState(user?.state || 'West Bengal');
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [address, setAddress] = useState(user?.address || '');

  // Student specific fields
  const studentProfile = user?.role === 'student' ? (profile as any) : null;
  const [collegeName, setCollegeName] = useState(studentProfile?.college_name || '');
  const [educationLevel, setEducationLevel] = useState(studentProfile?.education_level || '');
  const [skillsStr, setSkillsStr] = useState(
    Array.isArray(studentProfile?.skills) ? studentProfile.skills.join(', ') : ''
  );
  const [bio, setBio] = useState((profile as any)?.bio || '');
  const [workingRadiusKm, setWorkingRadiusKm] = useState(studentProfile?.working_radius_km || 5);

  // Avatar state
  const [previewAvatar, setPreviewAvatar] = useState(
    user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.full_name || 'user'}`
  );
  const [selectedImageData, setSelectedImageData] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Synchronize state when user changes or modal opens
  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setLocality(user.locality || '');
      setCity(user.city || '');
      setStateName(user.state || detectStateFromLocation({ locality: user.locality, city: user.city, pincode: user.pincode, state: user.state }));
      setPincode(user.pincode || '');
      setAddress(user.address || '');
      setPreviewAvatar(
        user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name || 'user'}`
      );
      setSelectedImageData(null);
      setErrorMsg(null);
      setSuccessMsg(null);

      if (user.role === 'student') {
        const sp = profile as any;
        setCollegeName(sp?.college_name || '');
        setEducationLevel(sp?.education_level || '');
        setSkillsStr(Array.isArray(sp?.skills) ? sp.skills.join(', ') : '');
        setWorkingRadiusKm(sp?.working_radius_km || 5);
      }
      setBio((profile as any)?.bio || '');
    }
  }, [user, profile, isOpen]);

  if (!isOpen || !user) return null;

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 5 MB.');
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImageData(result);
      setPreviewAvatar(result);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  // Generate randomized Dicebear avatar based on current name
  const handleGenerateAvatar = () => {
    const seed = `${fullName.trim() || 'user'}-${Date.now()}`;
    const generatedUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
    setSelectedImageData(null);
    setPreviewAvatar(generatedUrl);
  };

  // Submit profile updates
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('User full name cannot be empty.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: any = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        locality: locality.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        address: address.trim(),
        bio: bio.trim()
      };

      if (selectedImageData) {
        payload.imageData = selectedImageData;
      } else if (previewAvatar) {
        payload.avatarUrl = previewAvatar;
      }

      if (user.role === 'student') {
        payload.collegeName = collegeName.trim();
        payload.educationLevel = educationLevel.trim();
        payload.skills = skillsStr
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        payload.workingRadiusKm = workingRadiusKm;
      }

      const res = await api.updateProfile(payload);
      if (res.success) {
        await refreshUser();
        setSuccessMsg('Profile updated successfully! All changes are live.');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Edit Profile & Photo</h2>
              <p className="text-xs text-slate-500">
                Update your display name, upload a custom picture, and manage your details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Profile Picture Upload Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group shrink-0">
              <img
                src={previewAvatar}
                alt={fullName}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-white"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload a new profile picture"
                className="absolute inset-0 rounded-full bg-slate-900/50 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition cursor-pointer backdrop-blur-[2px]"
              >
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">Change</span>
              </button>
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Profile Picture</span>
                <span className="text-[11px] text-slate-500">
                  Upload an image (PNG, JPG, WEBP, SVG up to 5MB)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
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

          {/* User Full Name (Rewriteable) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              User Full Name <span className="text-emerald-600 font-normal">(Rewriteable)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              This name is shown to everyone on the marketplace, task pins, chats, and ratings.
            </p>
          </div>

          {/* Contact & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Locality / Area</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Indiranagar, Koramangala"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Street Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 100 Feet Road, 12th Main"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* City, State, PIN Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Kolkata, Bengaluru"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">State / Region</label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="e.g. West Bengal, Karnataka"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">PIN Code</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => {
                  const val = e.target.value;
                  setPincode(val);
                  const st = detectStateFromLocation({ pincode: val, locality, city });
                  if (st) setStateName(st);
                }}
                placeholder="741404 / 560038"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Student Helper Fields */}
          {user.role === 'student' && (
            <div className="pt-2 border-t border-slate-100 space-y-4">
              <div className="text-xs font-bold text-blue-800 flex items-center space-x-1.5 uppercase tracking-wider">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Student Helper Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">College / University</label>
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. IISc Bangalore / Christ University"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Education Level</label>
                  <input
                    type="text"
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science (Year 3)"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Skills & Services (comma-separated tags)
                </label>
                <input
                  type="text"
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="e.g. Math Tutoring, Dog Walking, Wi-Fi Setup, Grocery Shopping"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Preferred Working Radius</span>
                  <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {workingRadiusKm} km
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="1"
                  value={workingRadiusKm}
                  onChange={(e) => setWorkingRadiusKm(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Bio / About */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">About / Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your neighbors a bit about yourself..."
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
