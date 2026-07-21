"use client";

import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

type Event = {
  id: string;
  title: string;
  date: string;
  color?: string;
};

export default function BookingsCalendar() {
  const [events] = useState<Event[]>([
    { id: '1', title: 'Home Visit - Alice', date: new Date().toISOString().split('T')[0], color: '#3b82f6' },
    { id: '2', title: 'Consultation - Bob', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], color: '#10b981' },
    { id: '3', title: 'Checkup - Charlie', date: new Date(Date.now() + 172800000).toISOString().split('T')[0], color: '#f59e0b' }
  ]);

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Bookings Calendar</h1>
        <p className="text-sm text-slate-400 mt-1">View and manage your upcoming appointments.</p>
      </div>

      <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={events}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
          }}
          height="700px"
        />
      </div>
    </div>
  );
}
