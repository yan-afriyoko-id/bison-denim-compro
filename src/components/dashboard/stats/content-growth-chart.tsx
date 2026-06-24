'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyData {
  month: string;
  pages: number;
  posts: number;
  services: number;
}

interface ContentGrowthChartProps {
  data: MonthlyData[];
}

export function ContentGrowthChart({ data }: ContentGrowthChartProps) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPages" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f5f5f5" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f5f5f5" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a3a3a3" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a3a3a3" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
          <XAxis
            dataKey="month"
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
            labelStyle={{ color: '#a3a3a3', marginBottom: '4px' }}
          />
          <Area
            type="monotone"
            dataKey="pages"
            stroke="#f5f5f5"
            strokeWidth={2}
            fill="url(#colorPages)"
            name="Pages"
          />
          <Area
            type="monotone"
            dataKey="posts"
            stroke="#a3a3a3"
            strokeWidth={2}
            fill="url(#colorPosts)"
            name="Posts"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
