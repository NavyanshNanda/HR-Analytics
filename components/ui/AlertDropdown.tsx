'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, AlertTriangle, ChevronRight } from 'lucide-react';
import { formatDate, formatHoursToReadable } from '@/lib/utils';

export interface RecruiterAlert {
  recruiterName: string;
  candidateName: string;
  candidateId?: string;
  sourcingDate: Date | null;
  screeningDate: Date | null;
  hours: number;
}

export interface PanelistAlert {
  panelistName: string;
  candidateName: string;
  candidateId?: string;
  round: string;
  interviewDate: Date | null;
  feedbackDate: Date | null;
  hours: number | null;
  isPending: boolean;
}

interface AlertDropdownProps {
  recruiterAlerts: RecruiterAlert[];
  panelistAlerts: PanelistAlert[];
  onAlertClick?: (candidateName: string) => void;
  className?: string;
}

export function AlertDropdown({ 
  recruiterAlerts, 
  panelistAlerts, 
  onAlertClick,
  className = '' 
}: AlertDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAllRecruiter, setShowAllRecruiter] = useState(false);
  const [showAllPanelist, setShowAllPanelist] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const totalAlerts = recruiterAlerts.length + panelistAlerts.length;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  const handleAlertItemClick = (candidateName: string) => {
    if (onAlertClick) {
      onAlertClick(candidateName);
    }
    setIsOpen(false);
  };
  
  const displayedRecruiterAlerts = showAllRecruiter ? recruiterAlerts : recruiterAlerts.slice(0, 5);
  const displayedPanelistAlerts = showAllPanelist ? panelistAlerts : panelistAlerts.slice(0, 5);
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="View alerts"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {totalAlerts > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
            {totalAlerts > 99 ? '99+' : totalAlerts}
          </span>
        )}
      </button>
      
      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[480px] bg-white rounded-lg shadow-2xl border border-slate-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-slate-800">Alerts</h3>
              <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                {totalAlerts}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-slate-200 transition-colors"
              aria-label="Close alerts"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>
          
          {/* Content */}
          <div className="overflow-y-auto flex-1">
            {totalAlerts === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">No alerts</p>
                <p className="text-sm mt-1">All deadlines are being met</p>
              </div>
            ) : (
              <div className="p-2">
                {/* Recruiter Alerts */}
                {recruiterAlerts.length > 0 && (
                  <div className="mb-4">
                    <div className="px-3 py-2 bg-red-50 rounded-t-lg">
                      <h4 className="text-sm font-semibold text-red-800">
                        Recruiter Sourcing-to-Screening Alerts ({recruiterAlerts.length})
                      </h4>
                    </div>
                    <div className="space-y-1">
                      {displayedRecruiterAlerts.map((alert, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAlertItemClick(alert.candidateName)}
                          className="w-full text-left p-3 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 truncate group-hover:text-red-700">
                                {alert.candidateName}
                              </p>
                              <p className="text-xs text-slate-600 mt-0.5">
                                Recruiter: {alert.recruiterName}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                <span>Sourced: {formatDate(alert.sourcingDate)}</span>
                                <span>•</span>
                                <span>Screened: {formatDate(alert.screeningDate)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-red-600 whitespace-nowrap">
                                {formatHoursToReadable(alert.hours)}
                              </span>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {recruiterAlerts.length > 5 && (
                      <button
                        onClick={() => setShowAllRecruiter(!showAllRecruiter)}
                        className="w-full text-center py-2 text-sm text-red-600 hover:text-red-700 font-medium hover:bg-red-50 rounded-b-lg transition-colors"
                      >
                        {showAllRecruiter 
                          ? 'Show less' 
                          : `View ${recruiterAlerts.length - 5} more alerts`}
                      </button>
                    )}
                  </div>
                )}
                
                {/* Panelist Alerts */}
                {panelistAlerts.length > 0 && (
                  <div>
                    <div className="px-3 py-2 bg-orange-50 rounded-t-lg">
                      <h4 className="text-sm font-semibold text-orange-800">
                        Panellist Feedback Alerts ({panelistAlerts.length})
                      </h4>
                    </div>
                    <div className="space-y-1">
                      {displayedPanelistAlerts.map((alert, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAlertItemClick(alert.candidateName)}
                          className="w-full text-left p-3 hover:bg-orange-50 rounded-lg transition-colors border border-transparent hover:border-orange-200 group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 truncate group-hover:text-orange-700">
                                {alert.candidateName}
                              </p>
                              <p className="text-xs text-slate-600 mt-0.5">
                                Panellist: {alert.panelistName} • Round: {alert.round}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                <span>Interview: {formatDate(alert.interviewDate)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {alert.isPending ? (
                                <span className="text-xs font-semibold text-yellow-600 whitespace-nowrap">
                                  Pending
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-orange-600 whitespace-nowrap">
                                  {alert.hours !== null ? formatHoursToReadable(alert.hours) : 'Delayed'}
                                </span>
                              )}
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {panelistAlerts.length > 5 && (
                      <button
                        onClick={() => setShowAllPanelist(!showAllPanelist)}
                        className="w-full text-center py-2 text-sm text-orange-600 hover:text-orange-700 font-medium hover:bg-orange-50 rounded-b-lg transition-colors"
                      >
                        {showAllPanelist 
                          ? 'Show less' 
                          : `View ${panelistAlerts.length - 5} more alerts`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
