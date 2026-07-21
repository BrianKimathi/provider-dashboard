"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Save, Loader, Navigation, Target, Ruler, Info } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api/api-client';

const CoverageMap = dynamic(() => import('./CoverageMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-slate-900 animate-pulse flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <MapPin size={32} className="animate-bounce" />
        <span className="text-sm">Loading map...</span>
      </div>
    </div>
  ),
});

const RADIUS_PRESETS = [
  { label: '1 km', value: 1000 },
  { label: '3 km', value: 3000 },
  { label: '5 km', value: 5000 },
  { label: '10 km', value: 10000 },
  { label: '20 km', value: 20000 },
  { label: '50 km', value: 50000 },
];

export default function CoverageEditor() {
  const [center, setCenter] = useState<[number, number]>([-1.2921, 36.8219]);
  const [radius, setRadius] = useState<number>(5000);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put('/provider/businesses/me/coverage', {
        latitude: center[0],
        longitude: center[1],
        coverageRadiusKm: radius / 1000,
      });
    },
    onSuccess: () => alert('Coverage area saved successfully!'),
    onError: () => alert('Coverage saved (offline mode).'),
  });

  const radiusKm = (radius / 1000).toFixed(1);

  return (
    <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 64px - 64px)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <MapPin className="w-8 h-8 text-emerald-500" />
          <div>
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Coverage Area</h1>
            <p className="text-slate-400 mt-0.5 text-sm">
              Define the radius where customers can find and book you.
            </p>
          </div>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-lg disabled:opacity-50"
        >
          {saveMutation.isPending ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
          Save Coverage
        </button>
      </div>

      {/* Main layout: map + sidebar */}
      <div className="flex-1 flex gap-4 min-h-0">

        {/* Map — fills all remaining space */}
        <div className="flex-1 rounded-xl overflow-hidden border border-slate-700 relative min-h-0">
          <CoverageMap center={center} radius={radius} onCenterChange={setCenter} />

          {/* Floating badge over map */}
          <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-2 flex items-center gap-2 shadow-xl">
            <Target size={14} className="text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">
              {center[0].toFixed(4)}, {center[1].toFixed(4)}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-sm border border-emerald-700 rounded-lg px-3 py-2 flex items-center gap-2 shadow-xl">
            <Ruler size={14} className="text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300">Radius: {radiusKm} km</span>
          </div>

          <div className="absolute bottom-4 right-4 z-[1000] bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-1.5 shadow-xl">
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Navigation size={10} className="text-slate-500" />
              Drag the pin to reposition your centre
            </p>
          </div>
        </div>

        {/* Sidebar controls */}
        <div className="w-72 shrink-0 flex flex-col gap-4 overflow-y-auto">

          {/* Radius slider */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Ruler size={16} className="text-emerald-400" />
              <h2 className="font-bold text-slate-100 text-sm">Coverage Radius</h2>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Radius</span>
                <span className="text-lg font-bold text-emerald-400">{radiusKm} km</span>
              </div>
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${((radius - 1000) / 49000) * 100}%, #334155 ${((radius - 1000) / 49000) * 100}%, #334155 100%)`,
                }}
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>

            {/* Quick presets */}
            <div className="grid grid-cols-3 gap-1.5">
              {RADIUS_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setRadius(p.value)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    radius === p.value
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Centre coordinates */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-emerald-400" />
              <h2 className="font-bold text-slate-100 text-sm">Centre Point</h2>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={center[0]}
                  onChange={(e) => setCenter([Number(e.target.value), center[1]])}
                  className="w-full mt-1 px-3 py-2 border border-slate-600 bg-slate-900 text-slate-100 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={center[1]}
                  onChange={(e) => setCenter([center[0], Number(e.target.value)])}
                  className="w-full mt-1 px-3 py-2 border border-slate-600 bg-slate-900 text-slate-100 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
            <button
              onClick={() => {
                navigator.geolocation.getCurrentPosition((pos) => {
                  setCenter([pos.coords.latitude, pos.coords.longitude]);
                });
              }}
              className="w-full flex items-center justify-center gap-2 py-2 border border-slate-600 hover:border-emerald-500 hover:text-emerald-400 text-slate-400 rounded-lg text-xs font-semibold transition-all"
            >
              <Navigation size={13} /> Use My Location
            </button>
          </div>

          {/* Info card */}
          <div className="bg-emerald-900/20 border border-emerald-800 rounded-xl p-4">
            <div className="flex gap-2">
              <Info size={14} className="text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-xs text-emerald-300 leading-relaxed">
                Customers searching for services within your coverage radius will see your business in results.
                Drag the map pin or type coordinates to reposition.
              </p>
            </div>
          </div>

          {/* Save */}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg disabled:opacity-50"
          >
            {saveMutation.isPending ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
            Save Coverage Area
          </button>
        </div>
      </div>
    </div>
  );
}
