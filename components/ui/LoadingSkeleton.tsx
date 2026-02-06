'use client';

import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'card' | 'chart' | 'table' | 'metric';
  count?: number;
}

export function LoadingSkeleton({ variant = 'card', count = 1 }: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  if (variant === 'metric') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {skeletons.map((i) => (
          <div
            key={i}
            className="animate-pulse bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.12)]"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-100 rounded-xl" />
            </div>
            <div className="space-y-3">
              <div className="h-8 bg-gradient-to-r from-slate-200 to-slate-100 rounded-lg w-24" />
              <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-100 rounded w-32" />
              <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-100 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className="animate-pulse bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.12)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-100 rounded-xl" />
          <div className="space-y-2">
            <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-100 rounded w-32" />
            <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-100 rounded w-24" />
          </div>
        </div>
        <div className="h-80 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl" />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="animate-pulse bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.12)]">
        <div className="space-y-4">
          <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-100 rounded w-48" />
          {skeletons.map((i) => (
            <div key={i} className="h-16 bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {skeletons.map((i) => (
        <div
          key={i}
          className="animate-pulse bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] h-64"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-100 rounded-xl" />
            <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-100 rounded w-32" />
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gradient-to-r from-slate-100 to-slate-50 rounded" />
            <div className="h-4 bg-gradient-to-r from-slate-100 to-slate-50 rounded w-5/6" />
            <div className="h-4 bg-gradient-to-r from-slate-100 to-slate-50 rounded w-4/6" />
          </div>
        </div>
      ))}
    </>
  );
}

// Dashboard-specific loading state
export function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Metrics skeleton */}
        <section>
          <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-100 rounded w-32 mb-4" />
          <LoadingSkeleton variant="metric" count={5} />
        </section>

        {/* Charts skeleton */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSkeleton variant="chart" />
          <LoadingSkeleton variant="chart" />
        </section>

        {/* Table skeleton */}
        <section>
          <LoadingSkeleton variant="table" count={5} />
        </section>
      </div>
    </div>
  );
}
