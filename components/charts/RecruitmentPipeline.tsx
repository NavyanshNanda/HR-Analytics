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
  LabelList,
} from 'recharts';
import { PipelineMetrics } from '@/lib/types';
import { getFunnelData } from '@/lib/calculations';

interface RecruitmentPipelineProps {
  metrics: PipelineMetrics;
}

export function RecruitmentPipeline({ metrics }: RecruitmentPipelineProps) {
  const data = getFunnelData(metrics);
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = metrics.totalCandidates > 0 
        ? ((item.value / metrics.totalCandidates) * 100).toFixed(1) 
        : 0;
      
      return (
        <div className="custom-tooltip">
          <p className="custom-tooltip-label">{item.name}</p>
          <p className="custom-tooltip-value">
            Count: <strong>{item.value}</strong>
          </p>
          <p className="custom-tooltip-value">
            Rate: <strong>{percentage}%</strong>
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="dashboard-card">
      <h3 className="section-header">Recruitment Pipeline</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 40, left: 100, bottom: 10 }}
            barSize={35}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              radius={[0, 4, 4, 0]}
            >
              <LabelList 
                dataKey="value" 
                position="right" 
                style={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
              />
              {data.map((entry, index) => (
                <Bar key={`bar-${index}`} dataKey="value" fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Conversion rates */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {metrics.totalCandidates > 0 
                ? ((metrics.screeningCleared / metrics.totalCandidates) * 100).toFixed(1) 
                : 0}%
            </p>
            <p className="text-xs text-slate-500">Screening Rate</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">
              {metrics.screeningCleared > 0 
                ? ((metrics.r1Cleared / metrics.screeningCleared) * 100).toFixed(1) 
                : 0}%
            </p>
            <p className="text-xs text-slate-500">R1 to Screening</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {metrics.totalCandidates > 0 
                ? ((metrics.joined / metrics.totalCandidates) * 100).toFixed(1) 
                : 0}%
            </p>
            <p className="text-xs text-slate-500">Overall Conversion</p>
          </div>
        </div>
      </div>
    </div>
  );
}
