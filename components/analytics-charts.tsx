"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type AnalyticsChartPoint = {
  day: string;
  bookings: number;
  revenue: number;
  occupancy: number;
};

export function BookingsBarChart({
  data,
  emptyLabel,
}: {
  data: AnalyticsChartPoint[];
  emptyLabel: string;
}) {
  if (data.length === 0) {
    return (
      <div className="grid h-full place-items-center text-sm text-muted">{emptyLabel}</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-ink/10" />
        <XAxis dataKey="day" tick={{ fill: "currentColor" }} className="text-muted" />
        <YAxis allowDecimals={false} tick={{ fill: "currentColor" }} className="text-muted" />
        <Tooltip
          contentStyle={{
            background: "var(--raised)",
            border: "none",
            borderRadius: 12,
            color: "var(--ink)",
          }}
        />
        <Bar dataKey="bookings" fill="var(--court)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RevenueOccupancyChart({
  data,
  emptyLabel,
}: {
  data: AnalyticsChartPoint[];
  emptyLabel: string;
}) {
  if (data.length === 0) {
    return (
      <div className="grid h-full place-items-center text-sm text-muted">{emptyLabel}</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-ink/10" />
        <XAxis dataKey="day" tick={{ fill: "currentColor" }} className="text-muted" />
        <YAxis yAxisId="left" tick={{ fill: "currentColor" }} className="text-muted" />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: "currentColor" }}
          className="text-muted"
        />
        <Tooltip
          contentStyle={{
            background: "var(--raised)",
            border: "none",
            borderRadius: 12,
            color: "var(--ink)",
          }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="revenue"
          stroke="var(--court)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="occupancy"
          stroke="var(--ink)"
          strokeWidth={2}
          strokeOpacity={0.45}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
