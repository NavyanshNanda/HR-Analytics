'use client';

import React from 'react';
import Link from 'next/link';
import { Home, User } from 'lucide-react';
import { AlertDropdown, RecruiterAlert, PanelistAlert } from '@/components/ui/AlertDropdown';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
  userRole?: string;
  recruiterAlerts?: RecruiterAlert[];
  panelistAlerts?: PanelistAlert[];
  onAlertClick?: (candidateName: string) => void;
  showAlerts?: boolean;
  actions?: React.ReactNode;
}

export function DashboardHeader({
  title,
  subtitle,
  userName,
  userRole,
  recruiterAlerts = [],
  panelistAlerts = [],
  onAlertClick,
  showAlerts = true,
  actions,
}: DashboardHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Title and subtitle */}
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
            {subtitle && (
              <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
            )}
          </div>
          
          {/* Right: Actions, Alerts, and User info */}
          <div className="flex items-center gap-4">
            {/* Custom Actions */}
            {actions}
            
            {/* Alert Dropdown */}
            {showAlerts && (
              <AlertDropdown
                recruiterAlerts={recruiterAlerts}
                panelistAlerts={panelistAlerts}
                onAlertClick={onAlertClick}
              />
            )}
            
            {/* User Info */}
            {userName && (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-800">{userName}</p>
                  {userRole && (
                    <p className="text-xs text-slate-500">{userRole}</p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            )}
            
            {/* Home Link */}
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Go to home"
            >
              <Home className="w-5 h-5 text-slate-600" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
