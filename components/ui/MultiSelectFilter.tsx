'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Select...'
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };
  
  const handleClear = () => {
    onChange([]);
  };
  
  const handleSelectAll = () => {
    onChange(filteredOptions);
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg hover:border-slate-400 transition-colors text-sm min-w-[180px]"
      >
        <span className="text-slate-700 truncate">
          {selected.length === 0 ? placeholder : `${label} (${selected.length})`}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-xl border border-slate-200 z-50 max-h-96 flex flex-col">
          {/* Header */}
          <div className="p-3 border-b border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-800">{label}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            
            {/* Search */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Actions */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleSelectAll}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Select All ({filteredOptions.length})
              </button>
              {selected.length > 0 && (
                <>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={handleClear}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear ({selected.length})
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Options List */}
          <div className="overflow-y-auto flex-1 p-2">
            {filteredOptions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No options found</p>
            ) : (
              <div className="space-y-1">
                {filteredOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleToggle(option)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 rounded transition-colors"
                  >
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                      selected.includes(option)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-slate-300'
                    }`}>
                      {selected.includes(option) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="flex-1 truncate text-slate-700">{option}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
