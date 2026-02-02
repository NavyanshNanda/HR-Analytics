'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { PipelineMetrics } from '@/lib/types';
import { getFinalStatusData } from '@/lib/calculations';

interface FinalStatusBreakdownProps {
  metrics: PipelineMetrics;
}

const STATUS_COLORS: Record<string, string> = {
  'Selected': '#10B981',
  'Rejected': '#EF4444',
  'In Progress': '#F59E0B',
  'On Hold': '#6B7280',
};

export function FinalStatusBreakdown({ metrics }: FinalStatusBreakdownProps) {
  const data = getFinalStatusData(metrics);
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const total = metrics.selected + metrics.rejected + metrics.inProgress + metrics.onHold;
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
      
      return (
        <div className="custom-tooltip">
          <p className="custom-tooltip-label">{item.name}</p>
          <p className="custom-tooltip-value">
            Count: <strong>{item.value}</strong>
          </p>
          <p className="custom-tooltip-value">
            Percentage: <strong>{percentage}%</strong>
          </p>
        </div>
      );
    }
    return null;
  };
  
  const total = metrics.selected + metrics.rejected + metrics.inProgress + metrics.onHold;
  
  return (
    <div className="dashboard-card">
      <h3 className="section-header">Final Status Breakdown</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Status cards */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <div>
            <p className="text-lg font-bold text-green-700">{metrics.selected}</p>
            <p className="text-xs text-green-600">Selected</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div>
            <p className="text-lg font-bold text-red-700">{metrics.rejected}</p>
            <p className="text-xs text-red-600">Rejected</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div>
            <p className="text-lg font-bold text-yellow-700">{metrics.inProgress}</p>
            <p className="text-xs text-yellow-600">In Progress</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="w-3 h-3 rounded-full bg-gray-500" />
          <div>
            <p className="text-lg font-bold text-gray-700">{metrics.onHold}</p>
            <p className="text-xs text-gray-600">On Hold</p>
          </div>
        </div>
      </div>
    </div>
  );
}
