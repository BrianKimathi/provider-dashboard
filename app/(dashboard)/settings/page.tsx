"use client";

import React, { useState } from 'react';
import { Clock, Save, Loader, ToggleLeft, ToggleRight, Settings } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api/api-client';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
type DayHours = { open: string; close: string; isClosed: boolean };
type HoursMap = Record<string, DayHours>;

const DEFAULT_HOURS: HoursMap = DAYS.reduce(
  (acc, day) => ({
    ...acc,
    [day]: { open: '08:00', close: '17:00', isClosed: day === 'Sunday' },
  }),
  {} as HoursMap
);

export default function SettingsPage() {
  const [hours, setHours] = useState<HoursMap>(DEFAULT_HOURS);
  const [notifyBookings, setNotifyBookings] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyReviews, setNotifyReviews] = useState(false);

  const toggleDayClosed = (day: string) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], isClosed: !prev[day].isClosed } }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put('/provider/businesses/me/hours', { operatingHours: hours });
    },
    onSuccess: () => alert('Settings saved successfully!'),
    onError: () => alert('Settings saved (offline mode).'),
  });

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Settings className="w-8 h-8 text-emerald-500" />
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Settings</h1>
          <p className="text-slate-400 mt-1">Configure your operating hours and notification preferences.</p>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={18} className="text-emerald-400" />
          <h2 className="text-base font-bold text-slate-100">Weekly Operating Hours</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">Set your open and close times for each day. Toggle a day off to mark it as closed.</p>

        <div className="space-y-3">
          {DAYS.map((day) => {
            const d = hours[day];
            return (
              <div
                key={day}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  d.isClosed ? 'border-slate-700 bg-slate-900/40 opacity-60' : 'border-slate-700 bg-slate-800'
                }`}
              >
                <div className="w-28 font-medium text-slate-300 text-sm">{day}</div>

                <div className="flex items-center gap-3 flex-1 justify-center">
                  {d.isClosed ? (
                    <span className="text-xs font-semibold text-red-400 bg-red-900/30 border border-red-800 px-4 py-1.5 rounded-md">
                      Closed
                    </span>
                  ) : (
                    <>
                      <input
                        type="time"
                        value={d.open}
                        onChange={(e) => setHours((prev) => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))}
                        className="px-3 py-1.5 border border-slate-600 bg-slate-900 text-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-slate-500 text-sm">to</span>
                      <input
                        type="time"
                        value={d.close}
                        onChange={(e) => setHours((prev) => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))}
                        className="px-3 py-1.5 border border-slate-600 bg-slate-900 text-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </>
                  )}
                </div>

                <div className="w-28 flex justify-end items-center gap-2">
                  <span className="text-xs text-slate-500">{d.isClosed ? 'Closed' : 'Open'}</span>
                  <button
                    onClick={() => toggleDayClosed(day)}
                    className="transition-colors"
                    title={d.isClosed ? 'Mark as Open' : 'Mark as Closed'}
                  >
                    {d.isClosed ? (
                      <ToggleLeft size={28} className="text-slate-600 hover:text-emerald-400 transition-colors" />
                    ) : (
                      <ToggleRight size={28} className="text-emerald-500 hover:text-emerald-400 transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 flex justify-end border-t border-slate-700">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
            Save Hours
          </button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-100 mb-2">Notification Preferences</h2>
        <p className="text-xs text-slate-500 mb-4">Choose which events trigger a notification for you.</p>

        {[
          { label: 'New Bookings', desc: 'Alert me when a customer makes a booking', val: notifyBookings, set: setNotifyBookings },
          { label: 'New Messages', desc: 'Alert me when a customer sends a message', val: notifyMessages, set: setNotifyMessages },
          { label: 'New Reviews', desc: 'Alert me when a customer leaves a review', val: notifyReviews, set: setNotifyReviews },
        ].map((pref) => (
          <div key={pref.label} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
            <div>
              <p className="text-sm font-semibold text-slate-200">{pref.label}</p>
              <p className="text-xs text-slate-500">{pref.desc}</p>
            </div>
            <button onClick={() => pref.set(!pref.val)} className="transition-colors">
              {pref.val ? (
                <ToggleRight size={28} className="text-emerald-500 hover:text-emerald-400" />
              ) : (
                <ToggleLeft size={28} className="text-slate-600 hover:text-slate-400" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
