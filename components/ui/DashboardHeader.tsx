'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ArrowLeft, User } from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
  userType?: string;
  actions?: React.ReactNode;
}

export function DashboardHeader({ 
  title, 
  subtitle, 
  userName,
  userType,
  actions 
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const showBackButton = pathname !== '/';
  
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link
                href="/"
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <Home className="w-5 h-5" />
              </Link>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-800">{title}</h1>
              {subtitle && (
                <p className="text-sm text-slate-500">{subtitle}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {actions}
            {userName && (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
                <User className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">{userName}</span>
                {userType && (
                  <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                    {userType}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
