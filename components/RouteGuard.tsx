"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((state) => state.accessToken);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!token && pathname !== '/login') {
        router.push('/login');
      }
      if (token && pathname === '/login') {
        router.push('/');
      }
    }
  }, [token, pathname, router, mounted]);

  if (!mounted) return null;

  if (!token && pathname !== '/login') {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-semibold tracking-wider uppercase">
        Verifying Provider credentials...
      </div>
    );
  }

  return <>{children}</>;
}
