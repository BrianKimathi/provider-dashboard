"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Settings,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  ShoppingBag,
  Package,
  Wrench,
  Star,
  MapPin,
  Building2,
  LogOut,
} from 'lucide-react';

import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter } from 'next/navigation';

type MenuItem = { name: string; icon: React.ElementType; path: string };
type MenuGroup = { label: string; items: MenuItem[] };

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const businessType = useAuthStore((state) => state.businessType);
  const commerceModel = useAuthStore((state) => state.commerceModel);
  const businessName = useAuthStore((state) => state.businessName);
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  const isItemActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  // Build catalog items based on commerce model
  const catalogItems: MenuItem[] = [];
  if (commerceModel === 'SERVICE' || commerceModel === 'HYBRID' || !commerceModel) {
    catalogItems.push({ name: 'Services', icon: Wrench, path: '/catalog?tab=services' });
  }
  if (commerceModel === 'PRODUCT' || commerceModel === 'HYBRID' || !commerceModel) {
    catalogItems.push({ name: 'Products & Inventory', icon: Package, path: '/catalog?tab=products' });
  }

  const MENU_GROUPS: MenuGroup[] = [
    {
      label: 'Overview',
      items: [{ name: 'Dashboard', icon: LayoutDashboard, path: '/' }],
    },
    {
      label: 'Catalog',
      items: catalogItems.length > 0 ? catalogItems : [{ name: 'Catalog', icon: ShoppingBag, path: '/catalog' }],
    },
    {
      label: 'Operations',
      items: [
        { name: 'Bookings', icon: Calendar, path: '/bookings' },
        { name: 'Messages', icon: MessageSquare, path: '/chat' },
        { name: 'Coverage Area', icon: MapPin, path: '/coverage' },
        { name: 'Places & Stages', icon: ShoppingBag, path: '/places' },
      ],
    },
    {
      label: 'Business',
      items: [
        { name: 'Reviews', icon: Star, path: '/reviews' },
      ],
    },
    {
      label: 'Account',
      items: [
        { name: 'Business Profile', icon: Building2, path: '/profile' },
        { name: 'Settings', icon: Settings, path: '/settings' },
      ],
    },
  ];

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isGroupActive = (group: MenuGroup) => group.items.some((item) => isItemActive(item.path.split('?')[0]));

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 text-slate-300 min-h-screen flex flex-col transition-all duration-300 z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        <Link href="/" className="flex items-center space-x-2 truncate">
          <div className="p-2 bg-emerald-600 rounded-lg text-white shrink-0">
            <ShoppingBag size={20} />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-white tracking-wider text-base">
              PROVIDER
            </span>
          )}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-slate-800 hover:text-white rounded-lg transition-colors hidden md:block"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Commerce Model Badge */}
      {!isCollapsed && commerceModel && (
        <div className="px-4 py-2 border-b border-slate-800">
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-900/60 text-emerald-400 border border-emerald-800">
            {commerceModel === 'HYBRID' ? 'Services + Products' : commerceModel === 'PRODUCT' ? 'Products Only' : 'Services Only'}
          </span>
        </div>
      )}

      {/* Nav Menu */}
      <nav className="flex-1 py-3 px-3 overflow-y-auto">
        {MENU_GROUPS.map((group) => {
          const groupCollapsed = collapsedGroups[group.label];
          const groupActive = isGroupActive(group);

          if (isCollapsed) {
            return (
              <div key={group.label} className="mb-3">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.path.split('?')[0]);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center justify-center px-2 py-2.5 rounded-lg text-sm font-medium transition-all group relative mb-0.5 ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                          : 'hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                      <div className="absolute left-16 bg-slate-950 text-white text-xs px-2 py-1.5 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md">
                        {item.name}
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          }

          return (
            <div key={group.label} className="mb-4">
              <button
                onClick={() => toggleGroup(group.label)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  groupActive ? 'text-emerald-400' : 'text-slate-500'
                } hover:text-slate-300`}
              >
                <span>{group.label}</span>
                <ChevronDown size={12} className={`transition-transform ${groupCollapsed ? 'rotate-[-90deg]' : ''}`} />
              </button>
              {!groupCollapsed && (
                <div className="space-y-0.5 mt-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isItemActive(item.path.split('?')[0]);
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                            : 'hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
          <User size={18} className="text-slate-300" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{businessName || 'Provider Account'}</p>
            <p className="text-[10px] text-slate-500 truncate">provider dashboard</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
