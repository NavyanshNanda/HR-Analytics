'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface PipelineStage {
  name: string;
  value: number;
  fill: string;
  category: string;
}

interface PipelineBarChartProps {
  data: PipelineStage[];
  onBarClick?: (category: string) => void;
}

export default function PipelineBarChart({ data, onBarClick }: PipelineBarChartProps) {
  const handleClick = (entry: PipelineStage) => {
    if (onBarClick) {
      onBarClick(entry.category);
    }
  };

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 40, left: 20, bottom: 10 }}
        >
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={160}
            axisLine={false}
            tickLine={false}
            tick={{ 
              fontSize: 14, 
              fill: '#64748b',
              textAnchor: 'end'
            }}
          />
          <Tooltip 
            cursor={false}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
          />
          <Bar 
            dataKey="value" 
            radius={[0, 6, 6, 0]}
            cursor="pointer"
            barSize={35}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.fill}
                onClick={() => handleClick(entry)}
                style={{ cursor: 'pointer' }}
              />
            ))}
            <LabelList 
              dataKey="value" 
              position="right" 
              style={{ 
                fill: '#374151', 
                fontWeight: 600,
                fontSize: '14px' 
              }} 
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
