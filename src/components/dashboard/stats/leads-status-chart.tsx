'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface LeadsData {
  status: string;
  label: string;
  count: number;
  color: string;
}

interface LeadsStatusChartProps {
  data: LeadsData[];
}

export function LeadsStatusChart({ data }: LeadsStatusChartProps) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#666"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#666"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#141414',
              border: '1px solid #2a2a2a',
              borderRadius: '2px',
              fontSize: '12px',
              color: '#f5f5f5',
            }}
            cursor={{ fill: '#1c1c1c' }}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]} name="Leads">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
