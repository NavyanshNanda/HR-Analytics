'use client';

import React, { useState } from 'react';
import { DateFilters } from '@/lib/types';
import { Calendar, Filter, X } from 'lucide-react';
import { format } from 'date-fns';

interface DateFilterProps {
  filters: DateFilters;
  onChange: (filters: DateFilters) => void;
  showReqDate?: boolean;
  showSourcingDate?: boolean;
  showScreeningDate?: boolean;
}

export function DateFilter({ 
  filters, 
  onChange, 
  showReqDate = true,
  showSourcingDate = true,
  showScreeningDate = true 
}: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleDateChange = (field: keyof DateFilters, value: string) => {
    const date = value ? new Date(value) : null;
    onChange({ ...filters, [field]: date });
  };
  
  const clearFilters = () => {
    onChange({});
  };
  
  const hasActiveFilters = Object.values(filters).some(v => v !== null && v !== undefined);
  
  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return '';
    try {
      return format(date, 'yyyy-MM-dd');
    } catch {
      return '';
    }
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
          hasActiveFilters 
            ? 'bg-blue-50 border-blue-300 text-blue-700' 
            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
        }`}
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
        {hasActiveFilters && (
          <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
            Active
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Date Filters</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            {showReqDate && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Req Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={formatDateForInput(filters.reqDateFrom)}
                    onChange={(e) => handleDateChange('reqDateFrom', e.target.value)}
                    className="input-field text-sm"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={formatDateForInput(filters.reqDateTo)}
                    onChange={(e) => handleDateChange('reqDateTo', e.target.value)}
                    className="input-field text-sm"
                    placeholder="To"
                  />
                </div>
              </div>
            )}
            
            {showSourcingDate && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sourcing Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={formatDateForInput(filters.sourcingDateFrom)}
                    onChange={(e) => handleDateChange('sourcingDateFrom', e.target.value)}
                    className="input-field text-sm"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={formatDateForInput(filters.sourcingDateTo)}
                    onChange={(e) => handleDateChange('sourcingDateTo', e.target.value)}
                    className="input-field text-sm"
                    placeholder="To"
                  />
                </div>
              </div>
            )}
            
            {showScreeningDate && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Screening Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={formatDateForInput(filters.screeningDateFrom)}
                    onChange={(e) => handleDateChange('screeningDateFrom', e.target.value)}
                    className="input-field text-sm"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={formatDateForInput(filters.screeningDateTo)}
                    onChange={(e) => handleDateChange('screeningDateTo', e.target.value)}
                    className="input-field text-sm"
                    placeholder="To"
                  />
                </div>
              </div>
            )}
          </div>
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full mt-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
