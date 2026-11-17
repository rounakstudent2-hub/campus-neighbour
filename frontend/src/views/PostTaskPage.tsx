import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { TaskCategory } from '../types';
import { reverseGeocode, getCurrentCoordinates } from '../services/location';
import {
  PlusCircle,
  MapPin,
  IndianRupee,
  Clock,
  ArrowLeft,
  Navigation,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Crosshair,
  Loader2
} from 'lucide-react';

interface PostTaskPageProps {
  categories: TaskCategory[];
  onNavigate: (view: string, param?: string) => void;
}

export const PostTaskPage: React.FC<PostTaskPageProps> = ({ categories, onNavigate }) => {
  const { user, userLocation } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [budget, setBudget] = useState('500');
  const [deadline, setDeadline] = useState('Tomorrow by 5:00 PM');
  const [address, setAddress] = useState(user?.address || '');
  const [locality, setLocality] = useState(user?.locality || 'Indiranagar');
  const [pincode, setPincode] = useState(user?.pincode || '560038');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GPS Geolocation state
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);
  const [locationErrorMsg, setLocationErrorMsg] = useState<string | null>(null);
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(
    userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null
  );

  const handleUseCurrentLocation = async () => {
    setIsDetectingLocation(true);
    setLocationSuccessMsg(null);
    setLocationErrorMsg(null);

    try {
      // 1. Ask user for browser geolocation permission and get coords
      const coords = await getCurrentCoordinates();
      setDetectedCoords(coords);

      // 2. Perform reverse geocoding to automatically fill locality, pincode, and address
      const geo = await reverseGeocode(coords.lat, coords.lng);
      if (geo) {
        if (geo.locality) setLocality(geo.locality);
        if (geo.pincode) setPincode(geo.pincode);
        if (geo.address) setAddress(geo.address);

        setLocationSuccessMsg(
          `Location detected: ${geo.locality || 'Nearby'}, ${geo.city || 'Bengaluru'} (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`
        );
      } else {
        setLocationSuccessMsg(
          `GPS Coordinates captured (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})! You can refine the locality name below.`
        );
      }
    } catch (err: any) {
      console.warn('Geolocation error:', err);
      setLocationErrorMsg(
        err.message || 'Could not access GPS location. Please check browser permissions or type your location manually below.'
      );
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !categoryId || !budget) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const lat = detectedCoords?.lat || userLocation?.lat || 12.9784;
      const lng = detectedCoords?.lng || userLocation?.lng || 77.6408;

      const res = await api.createTask({
        title,
        description,
        categoryId,
        budget: parseFloat(budget),
        deadline,
        address,
        locality,
        pincode,
        latitude: lat,
        longitude: lng
      });

      if (res.success && res.task) {
        onNavigate(`task-detail-${res.task.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to post task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={() => onNavigate('neighbor-dashboard')}
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Post a Neighborhood Task</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Hire a verified student helper living within walking or short commute distance.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Task Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Organic grocery pickup from 100ft road supermarket"
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Task Description & Special Instructions *
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide clear details on what needs to be done, approximate time required, and any specific requirements..."
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
            />
          </div>

          {/* Budget & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Budget in INR (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  required
                  className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Deadline / Time Preference *
              </label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="e.g. This Saturday at 3:00 PM"
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* LOCATION SECTION WITH BOTH GPS BUTTON AND MANUAL TYPING */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Task Location & Neighborhood *</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Use your browser GPS or type your neighborhood area manually.
                </p>
              </div>

              {/* Use My Current Location Button */}
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isDetectingLocation}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-60 self-start sm:self-auto"
                title="Requests browser permission to detect current GPS location"
              >
                {isDetectingLocation ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Detecting Location...</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>Use My Current Location</span>
                  </>
                )}
              </button>
            </div>

            {/* GPS Feedback status messages */}
            {locationSuccessMsg && (
              <div className="p-2.5 bg-emerald-100/70 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-medium flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>{locationSuccessMsg}</span>
              </div>
            )}

            {locationErrorMsg && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-center space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{locationErrorMsg}</span>
              </div>
            )}

            {/* Manual input fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Neighborhood Locality / Area *
                </label>
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Indiranagar, 12th Main / Koramangala"
                  required
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 560038"
                  required
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Specific Meeting / Street Address (Only shared with assigned student)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Apt 402, Green Glen Residency, 5th Cross"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Escrow safety notice */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl flex items-start space-x-3 text-xs text-emerald-800">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">CampusNeighbor Escrow Guarantee:</span> You only deposit the task amount when you select a student helper. Funds remain protected in escrow until you verify the work is completely satisfied.
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <span>Publishing Task...</span>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Publish Task to Nearby Students</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
