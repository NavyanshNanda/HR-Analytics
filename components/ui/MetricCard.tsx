'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray' | 'indigo' | 'cyan';
  onClick?: () => void;
}

const colorStyles = {
  blue: {
    bg: 'from-blue-500/10 to-cyan-500/5',
    border: 'border-blue-500/20',
    icon: 'text-blue-600',
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'group-hover:shadow-blue-500/20'
  },
  green: {
    bg: 'from-green-500/10 to-emerald-500/5',
    border: 'border-green-500/20',
    icon: 'text-green-600',
    gradient: 'from-green-500 to-emerald-500',
    glow: 'group-hover:shadow-green-500/20'
  },
  red: {
    bg: 'from-red-500/10 to-rose-500/5',
    border: 'border-red-500/20',
    icon: 'text-red-600',
    gradient: 'from-red-500 to-rose-500',
    glow: 'group-hover:shadow-red-500/20'
  },
  yellow: {
    bg: 'from-yellow-500/10 to-amber-500/5',
    border: 'border-yellow-500/20',
    icon: 'text-yellow-600',
    gradient: 'from-yellow-500 to-amber-500',
    glow: 'group-hover:shadow-yellow-500/20'
  },
  purple: {
    bg: 'from-purple-500/10 to-pink-500/5',
    border: 'border-purple-500/20',
    icon: 'text-purple-600',
    gradient: 'from-purple-500 to-pink-500',
    glow: 'group-hover:shadow-purple-500/20'
  },
  indigo: {
    bg: 'from-indigo-500/10 to-blue-500/5',
    border: 'border-indigo-500/20',
    icon: 'text-indigo-600',
    gradient: 'from-indigo-500 to-blue-500',
    glow: 'group-hover:shadow-indigo-500/20'
  },
  cyan: {
    bg: 'from-cyan-500/10 to-blue-500/5',
    border: 'border-cyan-500/20',
    icon: 'text-cyan-600',
    gradient: 'from-cyan-500 to-blue-500',
    glow: 'group-hover:shadow-cyan-500/20'
  },
  gray: {
    bg: 'from-slate-500/10 to-gray-500/5',
    border: 'border-slate-500/20',
    icon: 'text-slate-600',
    gradient: 'from-slate-500 to-gray-500',
    glow: 'group-hover:shadow-slate-500/20'
  }
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
  const styles = colorStyles[color];
  const CardWrapper = onClick ? 'button' : 'div';
  
  return (
    <CardWrapper
      className={cn(
        'group relative overflow-hidden rounded-2xl p-6 text-left',
        'bg-white/70 backdrop-blur-xl border border-white/20',
        'shadow-[0_8px_32px_0_rgba(31,38,135,0.12)]',
        'hover:shadow-[0_8px_40px_0_rgba(31,38,135,0.18)]',
        'hover:-translate-y-0.5',
        'transition-all duration-300',
        onClick && 'cursor-pointer w-full',
        styles.glow
      )}
      onClick={onClick}
    >
      {/* Gradient overlay */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300',
        styles.bg
      )} />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            'p-3 rounded-xl border transition-all duration-300',
            `bg-gradient-to-br ${styles.bg} ${styles.border}`,
            'group-hover:scale-110 group-hover:rotate-3'
          )}>
            {Icon && <Icon className={cn('w-6 h-6', styles.icon)} />}
          </div>
          
          {trend && (
            <div className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm',
              trend.isPositive 
                ? 'bg-green-500/10 text-green-700 border border-green-500/20' 
                : 'bg-red-500/10 text-red-700 border border-red-500/20'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        <div>
          <div className="text-3xl font-bold text-slate-800 mb-1 tabular-nums">
            {value}
          </div>
          <div className="text-sm font-medium text-slate-600 mb-1">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-slate-500">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300',
        styles.gradient
      )} />
    </CardWrapper>
  );
}

interface MetricCardGroupProps {
  children: React.ReactNode;
}

export function MetricCardGroup({ children }: MetricCardGroupProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {children}
    </div>
  );
}
