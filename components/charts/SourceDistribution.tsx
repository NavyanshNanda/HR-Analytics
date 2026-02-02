'use client';

import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { SourceDistributionItem } from '@/lib/types';

interface SourceDistributionProps {
  data: SourceDistributionItem[];
  title?: string;
}

const COLORS = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#F97316', // orange
  '#10B981', // green
  '#EAB308', // yellow
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#F43F5E', // rose
  '#84CC16', // lime
];

export function SourceDistribution({ data, title = 'Source Distribution' }: SourceDistributionProps) {
  const [viewType, setViewType] = useState<'pie' | 'bar'>('pie');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="custom-tooltip-label">{item.source || item.name}</p>
          <p className="custom-tooltip-value">
            Count: <strong>{item.count || item.value}</strong>
          </p>
          <p className="custom-tooltip-value">
            Percentage: <strong>{item.percentage}%</strong>
          </p>
        </div>
      );
    }
    return null;
  };
  
  const pieData = data.map(item => ({
    name: item.source,
    value: item.count,
    percentage: item.percentage,
  }));
  
  const selectedSourceData = selectedSource 
    ? data.find(d => d.source === selectedSource)?.subSources || []
    : [];
  
  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-header mb-0">{title}</h3>
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setViewType('pie')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewType === 'pie' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600'
            }`}
          >
            Pie
          </button>
          <button
            onClick={() => setViewType('bar')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewType === 'bar' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600'
            }`}
          >
            Bar
          </button>
        </div>
      </div>
      
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {viewType === 'pie' ? (
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                onClick={(data) => setSelectedSource(data.name)}
                style={{ cursor: 'pointer' }}
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke={selectedSource === entry.name ? '#1e40af' : 'none'}
                    strokeWidth={selectedSource === entry.name ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
              />
            </PieChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="source" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                radius={[4, 4, 0, 0]}
                onClick={(data) => setSelectedSource(data.source)}
                style={{ cursor: 'pointer' }}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke={selectedSource === entry.source ? '#1e40af' : 'none'}
                    strokeWidth={selectedSource === entry.source ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      
      {/* Sub-source breakdown when a source is selected */}
      {selectedSource && selectedSourceData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-slate-700">
              Sub-sources for {selectedSource}
            </h4>
            <button 
              onClick={() => setSelectedSource(null)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Clear
            </button>
          </div>
          <div className="space-y-2">
            {selectedSourceData.map((sub, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{sub.subSource}</span>
                <span className="font-medium text-slate-800">{sub.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
