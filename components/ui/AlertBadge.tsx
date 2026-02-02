'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface AlertBadgeProps {
  isAlert: boolean;
  message?: string;
  compact?: boolean;
}

export function AlertBadge({ isAlert, message, compact = false }: AlertBadgeProps) {
  if (!isAlert) return null;
  
  if (compact) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 rounded-full" title={message || '48-hour limit exceeded'}>
        <AlertTriangle className="w-4 h-4" />
      </span>
    );
  }
  
  return (
    <div className="alert-badge">
      <AlertTriangle className="w-4 h-4" />
      <span>{message || '48-hour limit exceeded'}</span>
    </div>
  );
}

interface AlertPanelProps {
  title: string;
  count: number;
  children?: React.ReactNode;
}

export function AlertPanel({ title, count, children }: AlertPanelProps) {
  if (count === 0) return null;
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <h3 className="font-semibold text-red-800">{title}</h3>
        <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}
