"use client";

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  MessageSquare,
  Star,
  MapPin,
  Building2,
  Settings,
  ArrowRight,
  Briefcase,
  Loader,
  ShieldCheck,
} from 'lucide-react';
import apiClient from '@/lib/api/api-client';

export default function ProviderDashboardPage() {
  // Fetch business profile
  const { data: business, isLoading: isBusinessLoading } = useQuery({
    queryKey: ['provider-business-profile'],
    queryFn: async () => {
      const res = await apiClient.get('/provider/businesses/me');
      return res.data?.data || res.data;
    }
  });

  const businessId = business?.id;

  // Fetch services
  const { data: services = [] } = useQuery({
    queryKey: ['provider-services', businessId],
    queryFn: async () => {
      const res = await apiClient.get('/provider/businesses/me/services');
      return Array.isArray(res.data) ? res.data : (res.data.data || []);
    },
    enabled: !!businessId,
  });

  // Fetch bookings
  const { data: bookings = [] } = useQuery({
    queryKey: ['provider-bookings', businessId],
    queryFn: async () => {
      const res = await apiClient.get('/bookings', { params: { providerId: businessId } });
      return Array.isArray(res.data) ? res.data : (res.data.data || []);
    },
    enabled: !!businessId,
  });

  const quickLinks = [
    {
      title: 'Bookings',
      description: 'View and manage service requests',
      icon: Calendar,
      color: 'emerald',
      href: '/bookings',
    },
    {
      title: 'Catalog',
      description: 'Manage your services and products',
      icon: Briefcase,
      color: 'blue',
      href: '/catalog',
    },
    {
      title: 'Messages',
      description: 'Chat with your customers',
      icon: MessageSquare,
      color: 'indigo',
      href: '/chat',
    },
    {
      title: 'Coverage Area',
      description: 'Set your service location on the map',
      icon: MapPin,
      color: 'purple',
      href: '/coverage',
    },
    {
      title: 'Reviews',
      description: 'See what customers are saying',
      icon: Star,
      color: 'amber',
      href: '/reviews',
    },
    {
      title: 'Business Profile',
      description: 'Update your business details',
      icon: Building2,
      color: 'cyan',
      href: '/profile',
    },
    {
      title: 'Settings',
      description: 'Account and notification preferences',
      icon: Settings,
      color: 'slate',
      href: '/settings',
    },
  ];

  if (isBusinessLoading) {
    return (
      <div className="flex h-64 items-center justify-center space-x-2">
        <Loader className="animate-spin text-emerald-500" />
        <span className="text-sm text-slate-400">Loading dashboard...</span>
      </div>
    );
  }

  // Calculate live stats
  const pendingBookingsCount = bookings.filter((b: any) => b.status === 'PENDING' || b.status === 'SUBMITTED' || b.status === 'REQUESTED').length;
  const activeServicesCount = services.filter((s: any) => s.isActive).length;
  const businessStatus = business?.status || 'PENDING_REVIEW';

  const stats = [
    { label: 'Pending Requests', value: pendingBookingsCount, icon: Calendar, color: 'emerald' },
    { label: 'Active Services', value: activeServicesCount, icon: Briefcase, color: 'blue' },
    { label: 'Rating', value: business?.rating || '4.8', icon: Star, color: 'amber' },
    { label: 'Status', value: businessStatus, icon: ShieldCheck, color: businessStatus === 'APPROVED' ? 'emerald' : 'rose' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Provider Dashboard</h1>
        <p className="text-slate-400 mt-1">Manage your business and services ({business?.name || 'Provider Account'})</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-xl font-bold mt-1 uppercase ${stat.label === 'Status' && stat.value === 'APPROVED' ? 'text-emerald-400' : 'text-white'}`}>{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-500/10`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600 transition-all group"
              >
                <div className={`p-2.5 rounded-lg w-fit bg-${link.color}-500/10`}>
                  <Icon className={`w-5 h-5 text-${link.color}-400`} />
                </div>
                <h3 className="font-semibold text-white mt-4">{link.title}</h3>
                <p className="text-sm text-slate-400 mt-1">{link.description}</p>
                <div className="flex items-center text-xs font-medium text-emerald-400 mt-3 group-hover:underline">
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
