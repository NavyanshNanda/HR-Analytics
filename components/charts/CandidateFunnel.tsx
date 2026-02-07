'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface CandidateFunnelProps {
  data: Array<{
    name: string;
    value: number;
    fill: string;
    category: string;
  }>;
  onBarClick?: (category: string) => void;
}

export function CandidateFunnel({ 
  data,
  onBarClick
}: CandidateFunnelProps) {
  const chartData = data.map((item, index) => ({
    name: item.name,
    count: item.value,
    percentage: data[0]?.value > 0 ? (item.value / data[0].value) * 100 : 0,
    category: item.category,
    fill: item.fill,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-800">{data.name}</p>
          <p className="text-sm text-slate-600">Count: <strong>{data.count}</strong></p>
          <p className="text-sm text-slate-600">Percentage: <strong>{data.percentage.toFixed(1)}%</strong></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" stroke="#64748b" style={{ fontSize: '12px' }} />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={150}
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
          <Bar 
            dataKey="count" 
            radius={[0, 10, 10, 0]}
            activeBar={{ fill: 'rgba(59, 130, 246, 0.8)', stroke: '#1e40af', strokeWidth: 2 }}
            onClick={(data) => onBarClick?.(data.category)}
            cursor={onBarClick ? 'pointer' : 'default'}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            <LabelList 
              dataKey="count" 
              position="right" 
              style={{ fill: '#475569', fontWeight: 600, fontSize: '14px' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
