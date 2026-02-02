'use client';

import React from 'react';
import { getStatusColor } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };
  
  if (!status) {
    return (
      <span className={`inline-flex items-center rounded-full border bg-slate-100 text-slate-500 border-slate-200 ${sizeClasses[size]}`}>
        N/A
      </span>
    );
  }
  
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${getStatusColor(status)} ${sizeClasses[size]}`}>
      {status}
    </span>
  );
}
