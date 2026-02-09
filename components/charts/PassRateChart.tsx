'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { ChartCard } from '@/components/ui/ChartCard';
import { TrendingUp } from 'lucide-react';

interface PassRateChartProps {
  data: {
    r1Cleared: number;
    r1Rejected: number;
    r2Cleared: number;
    r2Rejected: number;
    r3Cleared: number;
    r3Rejected: number;
  };
}

export function PassRateChart({ data }: PassRateChartProps) {
  const chartData = [
    { 
      name: 'Round 1', 
      Cleared: data.r1Cleared, 
      Rejected: data.r1Rejected,
      total: data.r1Cleared + data.r1Rejected
    },
    { 
      name: 'Round 2', 
      Cleared: data.r2Cleared, 
      Rejected: data.r2Rejected,
      total: data.r2Cleared + data.r2Rejected
    },
    { 
      name: 'Round 3', 
      Cleared: data.r3Cleared, 
      Rejected: data.r3Rejected,
      total: data.r3Cleared + data.r3Rejected
    },
  ];
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="custom-tooltip-label">{item.name}</p>
          <p className="text-green-600">
            Cleared: <strong>{item.Cleared}</strong>
          </p>
          <p className="text-red-600">
            Rejected: <strong>{item.Rejected}</strong>
          </p>
          <p className="text-slate-600 text-xs mt-1">
            Total: {item.total}
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <ChartCard
      title="Pass Rate by Round"
      icon={<TrendingUp className="w-5 h-5 text-green-600" />}
      variant="glass"
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
            barSize={50}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />
            <Bar 
              dataKey="Cleared" 
              fill="#22C55E" 
              radius={[10, 10, 0, 0]}
            >
              <LabelList 
                dataKey="Cleared" 
                position="top" 
                fill="#15803D" 
                fontSize={14}
                fontWeight="bold"
              />
            </Bar>
            <Bar 
              dataKey="Rejected" 
              fill="#EF4444" 
              radius={[10, 10, 0, 0]}
            >
              <LabelList 
                dataKey="Rejected" 
                position="top" 
                fill="#991B1B" 
                fontSize={14}
                fontWeight="bold"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
