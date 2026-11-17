import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Task, TaskCategory } from '../types';
import { TaskCard } from '../components/TaskCard';
import { TaskMap } from '../components/TaskMap';
import {
  Search,
  Filter,
  MapPin,
  SlidersHorizontal,
  Compass,
  Map,
  List,
  Sparkles,
  IndianRupee,
  Navigation
} from 'lucide-react';

interface BrowseTasksPageProps {
  categories: TaskCategory[];
  initialCategory?: string;
  onSelectTask: (task: Task) => void;
  onNavigate: (view: string) => void;
}

export const BrowseTasksPage: React.FC<BrowseTasksPageProps> = ({
  categories,
  initialCategory,
  onSelectTask,
  onNavigate
}) => {
  const { userLocation, requestCurrentLocation } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || '');
  const [locality, setLocality] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [maxDistance, setMaxDistance] = useState<number>(10);
  const [minBudget, setMinBudget] = useState<string>('');
  const [maxBudget, setMaxBudget] = useState<string>('');
  const [viewMode, setViewMode] = useState<'both' | 'list' | 'map'>('both');
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
  const [locationDetecting, setLocationDetecting] = useState<boolean>(false);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        category: selectedCategory,
        search,
        locality,
        pincode,
        minBudget,
        maxBudget,
        maxDistance,
        status: 'Open' // By default show Open & Applied tasks for students
      };

      if (userLocation?.lat && userLocation?.lng) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
      }

      const res = await api.getTasks(params);
      if (res.success) {
        setTasks(res.tasks);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedCategory, maxDistance, userLocation]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTasks();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setLocality('');
    setPincode('');
    setMinBudget('');
    setMaxBudget('');
    setMaxDistance(10);
  };

  const handleDetectGPS = async () => {
    setLocationDetecting(true);
    await requestCurrentLocation();
    setLocationDetecting(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Explore Neighborhood Tasks</span>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              {tasks.length} Available
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse small tasks posted by verified neighbors. Filter by distance, budget, or category.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setViewMode('both')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              viewMode === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split View</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              viewMode === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          {/* Keyword Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks by title, keyword, or chore..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Category Dropdown */}
          <div className="w-full md:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="">All Task Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Locality Input */}
          <div className="w-full md:w-48 relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              placeholder="Locality (e.g. Indiranagar)"
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </form>

        {/* Distance Radius & Location Helper */}
        <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs text-slate-600">
          {/* Working Radius Slider */}
          <div className="flex items-center space-x-3 w-full lg:w-auto">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold text-slate-700 whitespace-nowrap">Distance Radius:</span>
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={maxDistance}
              onChange={(e) => setMaxDistance(parseInt(e.target.value))}
              className="w-36 sm:w-48 accent-emerald-600 cursor-pointer"
            />
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 whitespace-nowrap">
              Within {maxDistance} km
            </span>
          </div>

          {/* GPS and Reset */}
          <div className="flex items-center space-x-3 self-end lg:self-auto">
            <button
              onClick={handleDetectGPS}
              disabled={locationDetecting}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition"
            >
              <Navigation className={`w-3.5 h-3.5 ${locationDetecting ? 'animate-spin' : ''}`} />
              <span>{locationDetecting ? 'Detecting...' : 'Use My GPS Location'}</span>
            </button>
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium underline"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Locating neighborhood tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Nearby Tasks Found</h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            There are currently no open tasks matching your filter criteria within {maxDistance} km. Try expanding your search radius or clearing keyword filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* TASK CARDS LIST */}
          {(viewMode === 'both' || viewMode === 'list') && (
            <div className={`space-y-4 ${viewMode === 'both' ? 'lg:col-span-6 xl:col-span-7' : 'lg:col-span-12'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onSelect={(t) => {
                      setSelectedTaskId(t.id);
                      onSelectTask(t);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* INTERACTIVE OPENSTREETMAP */}
          {(viewMode === 'both' || viewMode === 'map') && (
            <div className={`sticky top-20 ${viewMode === 'both' ? 'lg:col-span-6 xl:col-span-5' : 'lg:col-span-12'}`}>
              <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                    <Map className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Live Interactive Neighborhood Map</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Pins display task budget in ₹ INR
                  </span>
                </div>
                <TaskMap
                  tasks={tasks}
                  userLocation={userLocation}
                  radiusKm={maxDistance}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={(t) => {
                    setSelectedTaskId(t.id);
                    onSelectTask(t);
                  }}
                  className={viewMode === 'map' ? 'h-[650px]' : 'h-[550px]'}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
