'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface StatusData {
  name: string;
  value: number;
  color: string;
}

interface StatusDistributionChartProps {
  data: StatusData[];
}

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="relative h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#141414',
              border: '1px solid #2a2a2a',
              borderRadius: '2px',
              fontSize: '12px',
              color: '#f5f5f5',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[#f5f5f5]">{total}</span>
        <span className="text-[11px] text-[#666] uppercase tracking-wider">Total</span>
      </div>
    </div>
  );
}
