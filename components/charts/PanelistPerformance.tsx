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
  Legend,
  LabelList,
} from 'recharts';
import { PanelistMetrics } from '@/lib/types';
import { formatHoursToReadable } from '@/lib/utils';
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface PanelistPerformanceProps {
  panelists: PanelistMetrics[];
}

export function PanelistPerformance({ panelists }: PanelistPerformanceProps) {
  const chartData = panelists.map(p => ({
    name: p.panelistName,
    R1: p.r1Interviews,
    R2: p.r2Interviews,
    R3: p.r3Interviews,
    total: p.totalInterviews,
    passRate: p.passRate.toFixed(1),
    alertCount: p.alertCount,
  }));
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="custom-tooltip-label">{data.name}</p>
          <p className="text-sm text-blue-600">R1: <strong>{data.R1}</strong></p>
          <p className="text-sm text-purple-600">R2: <strong>{data.R2}</strong></p>
          <p className="text-sm text-orange-600">R3: <strong>{data.R3}</strong></p>
          <p className="text-sm text-slate-600">Total: <strong>{data.total}</strong></p>
          <p className="text-sm text-green-600">Pass Rate: <strong>{data.passRate}%</strong></p>
          {data.alertCount > 0 && (
            <p className="text-sm text-red-600">⚠️ {data.alertCount} feedback delays</p>
          )}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="dashboard-card">
      <h3 className="section-header">Panellist Performance</h3>
      
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-700">
            {panelists.reduce((sum, p) => sum + p.totalInterviews, 0)}
          </p>
          <p className="text-xs text-blue-600">Total Interviews</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-700">
            {panelists.reduce((sum, p) => sum + p.passedInterviews, 0)}
          </p>
          <p className="text-xs text-green-600">Passed</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-700">
            {panelists.length > 0 
              ? (panelists.reduce((sum, p) => sum + p.passRate, 0) / panelists.length).toFixed(1)
              : 0}%
          </p>
          <p className="text-xs text-purple-600">Avg Pass Rate</p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-2xl font-bold text-red-700">
            {panelists.reduce((sum, p) => sum + p.alertCount, 0)}
          </p>
          <p className="text-xs text-red-600">Feedback Alerts</p>
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }} barSize={40} barGap={8}>
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
            <Legend />
            <Bar dataKey="R1" fill="#3B82F6" name="R1" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="R1" position="center" fill="white" fontSize={12} formatter={(value: number) => value > 0 ? value : ''} />
            </Bar>
            <Bar dataKey="R2" fill="#8B5CF6" name="R2" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="R2" position="center" fill="white" fontSize={12} formatter={(value: number) => value > 0 ? value : ''} />
            </Bar>
            <Bar dataKey="R3" fill="#F97316" name="R3" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="R3" position="center" fill="white" fontSize={12} formatter={(value: number) => value > 0 ? value : ''} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Detailed table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Panellist</th>
              <th>R1</th>
              <th>R2</th>
              <th>R3</th>
              <th>Total</th>
              <th>Passed</th>
              <th>Pass Rate</th>
              <th>Avg Feedback</th>
              <th>Alerts</th>
            </tr>
          </thead>
          <tbody>
            {panelists.map((panelist) => (
              <tr key={panelist.panelistName}>
                <td className="font-medium">{panelist.panelistName}</td>
                <td>{panelist.r1Interviews}</td>
                <td>{panelist.r2Interviews}</td>
                <td>{panelist.r3Interviews}</td>
                <td className="font-medium">{panelist.totalInterviews}</td>
                <td className="text-green-600">{panelist.passedInterviews}</td>
                <td>
                  <span className={`font-medium ${
                    panelist.passRate >= 50 ? 'text-green-600' : 
                    panelist.passRate >= 30 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {panelist.passRate.toFixed(1)}%
                  </span>
                </td>
                <td>{formatHoursToReadable(panelist.avgFeedbackTimeHours)}</td>
                <td>
                  {panelist.alertCount > 0 ? (
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      {panelist.alertCount}
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
