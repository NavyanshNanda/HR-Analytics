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
import { PanelistMetrics } from '@/lib/types';

interface PassRateChartProps {
  data: {
    r1PassRate: number;
    r2PassRate: number;
    r3PassRate: number;
    passRate: number;
  };
}

export function PassRateChart({ data }: PassRateChartProps) {
  const chartData = [
    { name: 'R1', rate: data.r1PassRate, fill: '#3B82F6' },
    { name: 'R2', rate: data.r2PassRate, fill: '#8B5CF6' },
    { name: 'R3', rate: data.r3PassRate, fill: '#F97316' },
    { name: 'Overall', rate: data.passRate, fill: '#10B981' },
  ];
  
  const getBarColor = (rate: number) => {
    if (rate >= 60) return '#10B981';
    if (rate >= 40) return '#F59E0B';
    return '#EF4444';
  };
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="custom-tooltip-label">{item.name} Pass Rate</p>
          <p className="custom-tooltip-value">
            <strong>{item.rate.toFixed(1)}%</strong>
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="dashboard-card">
      <h3 className="section-header">Pass Rate by Round</h3>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 10 }} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis 
              tick={{ fontSize: 12 }} 
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList dataKey="rate" position="center" fill="white" fontSize={12} formatter={(value: number) => `${value.toFixed(0)}%`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Rate indicators */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        {chartData.map((item) => (
          <div 
            key={item.name}
            className="text-center p-2 rounded-lg"
            style={{ backgroundColor: `${item.fill}15` }}
          >
            <p className="text-lg font-bold" style={{ color: item.fill }}>
              {item.rate.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-600">{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
