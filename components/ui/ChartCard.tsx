'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  action?: ReactNode;
  variant?: 'default' | 'glass' | 'elevated';
}

export function ChartCard({
  title,
  subtitle,
  children,
  className,
  icon,
  action,
  variant = 'glass'
}: ChartCardProps) {
  const variantStyles = {
    default: 'bg-white border border-slate-200',
    glass: 'bg-white/70 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]',
    elevated: 'bg-white border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)]'
  };

  return (
    <div className={cn(
      'rounded-2xl p-6 transition-all duration-300',
      'hover:shadow-[0_8px_40px_0_rgba(31,38,135,0.2)]',
      'hover:-translate-y-0.5',
      variantStyles[variant],
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action && (
          <div className="flex items-center gap-2">
            {action}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

// Specialized variant for metric cards
interface MetricCardGlassProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  onClick?: () => void;
}

export function MetricCardGlass({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  onClick
}: MetricCardGlassProps) {
  const colorStyles = {
    blue: {
      bg: 'from-blue-500/10 to-cyan-500/5',
      border: 'border-blue-500/20',
      icon: 'text-blue-600',
      gradient: 'from-blue-500 to-cyan-500'
    },
    green: {
      bg: 'from-green-500/10 to-emerald-500/5',
      border: 'border-green-500/20',
      icon: 'text-green-600',
      gradient: 'from-green-500 to-emerald-500'
    },
    yellow: {
      bg: 'from-yellow-500/10 to-amber-500/5',
      border: 'border-yellow-500/20',
      icon: 'text-yellow-600',
      gradient: 'from-yellow-500 to-amber-500'
    },
    red: {
      bg: 'from-red-500/10 to-rose-500/5',
      border: 'border-red-500/20',
      icon: 'text-red-600',
      gradient: 'from-red-500 to-rose-500'
    },
    purple: {
      bg: 'from-purple-500/10 to-pink-500/5',
      border: 'border-purple-500/20',
      icon: 'text-purple-600',
      gradient: 'from-purple-500 to-pink-500'
    },
    indigo: {
      bg: 'from-indigo-500/10 to-blue-500/5',
      border: 'border-indigo-500/20',
      icon: 'text-indigo-600',
      gradient: 'from-indigo-500 to-blue-500'
    }
  };

  const styles = colorStyles[color];

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl p-6',
        'bg-white/70 backdrop-blur-xl border border-white/20',
        'shadow-[0_8px_32px_0_rgba(31,38,135,0.12)]',
        'hover:shadow-[0_8px_40px_0_rgba(31,38,135,0.18)]',
        'hover:-translate-y-0.5',
        'transition-all duration-300',
        onClick && 'cursor-pointer'
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
            <Icon className={cn('w-6 h-6', styles.icon)} />
          </div>
          
          {trend && (
            <div className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
              trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
    </div>
  );
}
