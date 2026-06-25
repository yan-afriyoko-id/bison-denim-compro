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
              <stop offset="5%" stopColor="#1E1E1E" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#1E1E1E" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#9ca3af"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#9ca3af"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#1E1E1E',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
            labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
          />
          <Area
            type="monotone"
            dataKey="pages"
            stroke="#1E1E1E"
            strokeWidth={2}
            fill="url(#colorPages)"
            name="Pages"
          />
          <Area
            type="monotone"
            dataKey="posts"
            stroke="#9ca3af"
            strokeWidth={2}
            fill="url(#colorPosts)"
            name="Posts"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
