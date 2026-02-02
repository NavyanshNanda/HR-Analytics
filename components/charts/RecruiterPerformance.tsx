'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { RecruiterMetrics } from '@/lib/types';
import { AlertBadge } from '@/components/ui/AlertBadge';
import { formatHoursToReadable } from '@/lib/utils';
import { AlertTriangle, Users, CheckCircle, Clock } from 'lucide-react';

interface RecruiterPerformanceProps {
  recruiters: RecruiterMetrics[];
}

export function RecruiterPerformance({ recruiters }: RecruiterPerformanceProps) {
  const chartData = recruiters.map(r => ({
    name: r.recruiterName,
    sourced: r.candidatesSourced,
    cleared: r.screeningCleared,
    notCleared: r.screeningNotCleared,
    inProgress: r.screeningInProgress,
    alertCount: r.alertCount,
    screeningRate: r.screeningRate.toFixed(1),
  }));
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="custom-tooltip-label">{data.name}</p>
          <p className="text-sm text-slate-600">Sourced: <strong>{data.sourced}</strong></p>
          <p className="text-sm text-green-600">Cleared: <strong>{data.cleared}</strong></p>
          <p className="text-sm text-red-600">Not Cleared: <strong>{data.notCleared}</strong></p>
          <p className="text-sm text-yellow-600">In Progress: <strong>{data.inProgress}</strong></p>
          <p className="text-sm text-slate-600">Screening Rate: <strong>{data.screeningRate}%</strong></p>
          {data.alertCount > 0 && (
            <p className="text-sm text-red-600">⚠️ {data.alertCount} alerts</p>
          )}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="dashboard-card">
      <h3 className="section-header">Recruiter Performance</h3>
      
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-700">
            {recruiters.reduce((sum, r) => sum + r.candidatesSourced, 0)}
          </p>
          <p className="text-xs text-blue-600">Total Sourced</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-700">
            {recruiters.reduce((sum, r) => sum + r.screeningCleared, 0)}
          </p>
          <p className="text-xs text-green-600">Total Cleared</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-700">
            {recruiters.length > 0 
              ? (recruiters.reduce((sum, r) => sum + r.screeningRate, 0) / recruiters.length).toFixed(1)
              : 0}%
          </p>
          <p className="text-xs text-purple-600">Avg Screening Rate</p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-2xl font-bold text-red-700">
            {recruiters.reduce((sum, r) => sum + r.alertCount, 0)}
          </p>
          <p className="text-xs text-red-600">Total Alerts</p>
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cleared" stackId="a" fill="#10B981" name="Cleared" />
            <Bar dataKey="notCleared" stackId="a" fill="#EF4444" name="Not Cleared" />
            <Bar dataKey="inProgress" stackId="a" fill="#F59E0B" name="In Progress" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Detailed table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Recruiter</th>
              <th>Sourced</th>
              <th>Cleared</th>
              <th>Not Cleared</th>
              <th>In Progress</th>
              <th>Rate</th>
              <th>Avg Time</th>
              <th>Alerts</th>
            </tr>
          </thead>
          <tbody>
            {recruiters.map((recruiter) => (
              <tr key={recruiter.recruiterName}>
                <td className="font-medium">{recruiter.recruiterName}</td>
                <td>{recruiter.candidatesSourced}</td>
                <td className="text-green-600">{recruiter.screeningCleared}</td>
                <td className="text-red-600">{recruiter.screeningNotCleared}</td>
                <td className="text-yellow-600">{recruiter.screeningInProgress}</td>
                <td>
                  <span className={`font-medium ${
                    recruiter.screeningRate >= 50 ? 'text-green-600' : 
                    recruiter.screeningRate >= 30 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {recruiter.screeningRate.toFixed(1)}%
                  </span>
                </td>
                <td>{formatHoursToReadable(recruiter.avgSourcingToScreeningHours)}</td>
                <td>
                  {recruiter.alertCount > 0 ? (
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      {recruiter.alertCount}
                    </span>
                  ) : (
                    <span className="text-green-600">✓</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
