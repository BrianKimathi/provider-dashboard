"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { Search, Bell, User, Settings, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';

const PATH_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/catalog': 'Catalog',
  '/bookings': 'Bookings',
  '/chat': 'Messages',
  '/finops': 'Financials & Earnings',
  '/work-queue': 'Work Queue',
  '/settings': 'Settings',
  '/fleet': 'Fleet Management',
  '/coverage': 'Coverage Area',
  '/quotation': 'Quotations',
  '/reviews': 'Customer Reviews',
  '/profile': 'Business Profile',
};

export default function Navbar() {
  const pathname = usePathname();
  const businessName = useAuthStore((s) => s.businessName);
  const title = PATH_TITLES[pathname] ?? 'Provider Console';

  return (
    <header className="bg-slate-900 border-b border-slate-800 h-16 flex items-center justify-between px-6 sticky top-0 z-20 shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 font-medium tracking-wider uppercase">Provider</span>
        <ChevronRight size={12} className="text-slate-600" />
        <h1 className="text-sm font-semibold text-slate-100 tracking-tight">{title}</h1>
      </div>

      {/* Global Actions */}
      <div className="flex items-center space-x-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search provider panel..."
            className="w-60 bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-1.5 pl-9 pr-4 text-xs outline-none text-slate-200 transition-all placeholder:text-slate-500"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
        </div>

        {/* Notifications */}
        <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-all relative">
          <Bell size={18} />
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full absolute right-2.5 top-2.5" />
        </button>

        {/* Settings */}
        <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-all">
          <Settings size={18} />
        </button>

        <div className="w-px h-6 bg-slate-700" />

        {/* User */}
        <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center border border-emerald-500 shrink-0">
            <User size={15} className="text-white" />
          </div>
          <span className="text-xs font-semibold text-slate-200 hidden sm:inline-block truncate max-w-[120px]">
            {businessName || 'My Business'}
          </span>
        </div>
      </div>
    </header>
  );
}
