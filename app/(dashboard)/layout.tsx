"use client";

import React from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex w-full overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#0f172a' }}>
          <div className="p-6 md:p-8 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
