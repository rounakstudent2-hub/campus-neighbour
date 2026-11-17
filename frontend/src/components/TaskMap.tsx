import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Task } from '../types';

interface TaskMapProps {
  tasks: Task[];
  userLocation?: { lat: number; lng: number } | null;
  radiusKm?: number;
  onSelectTask?: (task: Task) => void;
  selectedTaskId?: string;
  className?: string;
}

export const TaskMap: React.FC<TaskMapProps> = ({
  tasks,
  userLocation,
  radiusKm = 5,
  onSelectTask,
  selectedTaskId,
  className = 'h-96 w-full'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const circleRef = useRef<L.Circle | null>(null);

  const defaultCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [12.9716, 77.5946];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }

    // User location marker & radius
    if (userLocation) {
      const userPin = L.divIcon({
        className: 'custom-user-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-75"></span>
            <div class="relative w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
              You
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userPin }).addTo(map);
      userMarker.bindPopup('<b class="text-emerald-700 font-semibold">Your Location</b><br/>Search center');
      markersRef.current['__user__'] = userMarker;

      if (radiusKm) {
        circleRef.current = L.circle([userLocation.lat, userLocation.lng], {
          radius: radiusKm * 1000,
          color: '#10b981',
          fillColor: '#34d399',
          fillOpacity: 0.1,
          weight: 1.5,
          dashArray: '4, 8'
        }).addTo(map);
      }
    }

    // Task markers
    tasks.forEach((task) => {
      if (!task.latitude || !task.longitude) return;

      const isSelected = task.id === selectedTaskId;
      const statusColor =
        task.status === 'Open'
          ? 'bg-blue-600'
          : task.status === 'Applied'
          ? 'bg-amber-600'
          : task.status === 'In Progress'
          ? 'bg-purple-600'
          : 'bg-emerald-600';

      const taskPin = L.divIcon({
        className: 'custom-task-pin',
        html: `
          <div class="cursor-pointer transform hover:scale-110 transition-transform ${isSelected ? 'scale-125 z-50' : ''}">
            <div class="px-2 py-1 rounded-full text-xs font-bold text-white shadow-md border border-white flex items-center space-x-1 ${statusColor}">
              <span>₹${task.budget}</span>
            </div>
            <div class="w-2 h-2 mx-auto rotate-45 ${statusColor} -mt-1 border-r border-b border-white"></div>
          </div>
        `,
        iconSize: [60, 30],
        iconAnchor: [30, 28]
      });

      const marker = L.marker([task.latitude, task.longitude], { icon: taskPin }).addTo(map);

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1';
      popupContent.innerHTML = `
        <div class="font-bold text-slate-900 text-sm mb-1">${task.title}</div>
        <div class="text-xs text-slate-500 mb-2 flex items-center justify-between">
          <span>${task.locality || 'Nearby'}</span>
          <span class="font-semibold text-emerald-600">₹${task.budget}</span>
        </div>
        <div class="text-xs text-slate-600 mb-2 line-clamp-2">${task.description}</div>
        <button id="view-task-${task.id}" class="w-full text-center py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer">
          View Task Details
        </button>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-task-${task.id}`);
        if (btn && onSelectTask) {
          btn.onclick = () => onSelectTask(task);
        }
      });

      marker.on('click', () => {
        if (onSelectTask) onSelectTask(task);
      });

      markersRef.current[task.id] = marker;
    });

    // Fit bounds if we have tasks
    if (tasks.length > 0) {
      const group = L.featureGroup(Object.values(markersRef.current));
      map.fitBounds(group.getBounds().pad(0.15));
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13);
    }
  }, [tasks, userLocation, radiusKm, selectedTaskId]);

  return (
    <div className={`relative rounded-xl overflow-hidden shadow border border-slate-200 ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />
      <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[11px] text-slate-600 border border-slate-200 shadow-sm flex items-center space-x-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600"></span>
        <span>Open</span>
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-600"></span>
        <span>Applied</span>
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-600"></span>
        <span>In Progress</span>
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
        <span>Your GPS</span>
      </div>
    </div>
  );
};
