'use client';

import React from 'react';
import { X } from 'lucide-react';

interface FilterBadgeProps {
  label: string;
  count: number;
  onClear: () => void;
}

export function FilterBadge({ label, count, onClear }: FilterBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
      <span className="text-sm font-medium text-blue-700">
        {label}: {count}
      </span>
      <button
        onClick={onClear}
        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded p-0.5 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
