"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin, Search, Loader, Trash2, RefreshCw, Navigation,
} from 'lucide-react';
import apiClient from '@/lib/api/api-client';

interface StageItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export default function ProviderPlacesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: stages = [], isLoading } = useQuery<StageItem[]>({
    queryKey: ['provider-stages'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/transport/stages');
        return Array.isArray(res.data) ? res.data : (res.data.data || []);
      } catch { return []; }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/transport/stages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-stages'] });
    },
  });

  const filtered = stages.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MapPin className="w-8 h-8 text-emerald-500" />
          <div>
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Places &amp; Stages</h1>
            <p className="text-slate-400 mt-1">User-recorded transit stages, bus stops, and hotspots near your area.</p>
          </div>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['provider-stages'] })}
          className="p-2.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <span className="text-xs text-slate-500 uppercase font-bold">Total Places</span>
          <div className="text-2xl font-bold text-white mt-1">{stages.length}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <span className="text-xs text-slate-500 uppercase font-bold">Recorded By</span>
          <div className="text-2xl font-bold text-white mt-1">Mobile Users</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <span className="text-xs text-slate-500 uppercase font-bold">Nearby</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{stages.length}</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full md:w-80">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search places..."
          className="w-full pl-9 pr-4 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
        />
        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-12 flex justify-center items-center space-x-2">
          <Loader className="animate-spin text-emerald-400" />
          <span className="text-sm text-slate-400">Loading places...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center text-slate-500">
          <MapPin className="mx-auto mb-3" size={40} />
          <p>{searchQuery ? 'No places match your search.' : 'No places recorded yet. Users can contribute from the mobile app.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((stage) => (
            <div key={stage.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-start gap-4">
              <div className="p-2.5 bg-emerald-900/40 rounded-lg shrink-0">
                <Navigation size={18} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-100 text-sm">{stage.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  {stage.latitude.toFixed(6)}, {stage.longitude.toFixed(6)}
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm(`Delete "${stage.name}"?`)) {
                    deleteMutation.mutate(stage.id);
                  }
                }}
                className="p-1.5 bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white border border-red-700 rounded-lg transition-all shrink-0"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
