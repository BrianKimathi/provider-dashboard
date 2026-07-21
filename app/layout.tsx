import React from 'react';
import Providers from '@/components/Providers';
import RouteGuard from '@/components/RouteGuard';
import '@/app/globals.css';

export const metadata = {
  title: 'Changamka Provider Dashboard',
  description: 'Enterprise console for Changamka service providers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 min-h-screen text-slate-100">
        <Providers>
          <RouteGuard>
            {children}
          </RouteGuard>
        </Providers>
      </body>
    </html>
  );
}
