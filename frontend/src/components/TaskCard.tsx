import React from 'react';
import { Task } from '../types';
import {
  MapPin,
  Calendar,
  IndianRupee,
  Users,
  CheckCircle,
  Clock,
  Sparkles,
  ShoppingBag,
  Home,
  Heart,
  GraduationCap,
  FileText,
  Laptop,
  PartyPopper,
  CheckSquare,
  Tag
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onSelect }) => {
  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'ShoppingCart':
        return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
      case 'Home':
        return <Home className="w-4 h-4 text-amber-600" />;
      case 'PawPrint':
        return <Heart className="w-4 h-4 text-rose-600" />;
      case 'GraduationCap':
        return <GraduationCap className="w-4 h-4 text-blue-600" />;
      case 'FileText':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'Laptop':
        return <Laptop className="w-4 h-4 text-cyan-600" />;
      case 'PartyPopper':
        return <PartyPopper className="w-4 h-4 text-pink-600" />;
      case 'CheckSquare':
        return <CheckSquare className="w-4 h-4 text-teal-600" />;
      default:
        return <Tag className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">Open</span>;
      case 'Applied':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Applicants Waiting</span>;
      case 'Assigned':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">Assigned</span>;
      case 'In Progress':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 animate-pulse">In Progress</span>;
      case 'Completed':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1"><CheckCircle className="w-3 h-3 mr-1" />Completed</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">Cancelled</span>;
      case 'Disputed':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">Disputed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div
      onClick={() => onSelect(task)}
      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        {/* Top meta bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-emerald-50 transition">
              {getCategoryIcon(task.category_icon)}
            </span>
            <span className="text-xs font-semibold text-slate-600 truncate max-w-[150px]">
              {task.category_name || 'General Task'}
            </span>
          </div>
          {getStatusBadge(task.status)}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition line-clamp-1 mb-2">
          {task.title}
        </h3>

        {/* Description snippet */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {task.description}
        </p>

        {/* Location & Distance badge */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-slate-500">
          <div className="flex items-center space-x-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{task.locality || 'Nearby'}</span>
          </div>

          {task.distance_km !== undefined && task.distance_km !== null && (
            <div className="flex items-center space-x-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-100 font-semibold">
              <span>{task.distance_km} km away</span>
            </div>
          )}

          <div className="flex items-center space-x-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{task.deadline}</span>
          </div>
        </div>
      </div>

      {/* Bottom customer & budget footer */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
        <div className="flex items-center space-x-2">
          <img
            src={task.customer_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.customer_name || 'Neighbor'}`}
            alt={task.customer_name}
            className="w-7 h-7 rounded-full bg-slate-100 object-cover"
          />
          <div>
            <div className="text-xs font-semibold text-slate-800 leading-tight">
              {task.customer_name || 'Neighbor'}
            </div>
            {task.applications_count !== undefined && task.applications_count > 0 && (
              <div className="text-[10px] text-amber-600 font-medium flex items-center space-x-0.5">
                <Users className="w-2.5 h-2.5" />
                <span>{task.applications_count} student{task.applications_count > 1 ? 's' : ''} applied</span>
              </div>
            )}
          </div>
        </div>

        {/* Budget */}
        <div className="text-right">
          <div className="text-xs text-slate-400 font-medium">Budget</div>
          <div className="text-lg font-extrabold text-emerald-600 tracking-tight flex items-center justify-end">
            <span>₹{task.budget}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
