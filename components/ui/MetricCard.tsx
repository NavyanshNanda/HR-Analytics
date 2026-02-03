'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  onClick?: () => void;
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  green: 'bg-green-50 text-green-600 border-green-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
  gray: 'bg-slate-50 text-slate-600 border-slate-200',
};

const iconBgClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  red: 'bg-red-100 text-red-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  purple: 'bg-purple-100 text-purple-600',
  gray: 'bg-slate-100 text-slate-600',
};

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  color = 'blue',
  onClick 
}: MetricCardProps) {
  const CardWrapper = onClick ? 'button' : 'div';
  const clickableClasses = onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : '';
  
  return (
    <CardWrapper 
      className={`metric-card ${clickableClasses} ${onClick ? 'text-left w-full' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="metric-value mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${iconBgClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </CardWrapper>
  );
}

interface MetricCardGroupProps {
  children: React.ReactNode;
}

export function MetricCardGroup({ children }: MetricCardGroupProps) {
  return (
    <div className="dashboard-grid-4">
      {children}
    </div>
  );
}
