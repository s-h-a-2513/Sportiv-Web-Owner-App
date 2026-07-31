"use client";

import { useEffect, useMemo, useState } from "react";
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
import { AppHeader } from "@/components/app-header";
import { PageShell, SoftCard, StatChip } from "@/components/ui/page";
import { FormMessage, Label, Select } from "@/components/ui/form";
import { listOwnerFields } from "@/lib/api/fields";
import { aggregateAnalytics, listAnalyticsForFields } from "@/lib/api/analytics";
import { addDaysIsoDate, todayKarachi } from "@/lib/dates";
import type { Field, FieldAnalyticsDaily } from "@/lib/types";

export default function AnalyticsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [fieldId, setFieldId] = useState("all");
  const [rows, setRows] = useState<FieldAnalyticsDaily[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => {
    const to = todayKarachi();
    return { from: addDaysIsoDate(to, -13), to };
  }, []);

  useEffect(() => {
    void listOwnerFields()
      .then(setFields)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load fields"));
  }, []);

  useEffect(() => {
    if (fields.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const ids = fieldId === "all" ? fields.map((f) => f.id) : [fieldId];
    void listAnalyticsForFields(ids, range.from, range.to)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load analytics");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fields, fieldId, range]);

  const chartData = useMemo(() => {
    const byDay = new Map<string, { day: string; bookings: number; revenue: number; occupancy: number; n: number }>();
    for (const r of rows) {
      const cur = byDay.get(r.day) ?? {
        day: r.day.slice(5),
        bookings: 0,
        revenue: 0,
        occupancy: 0,
        n: 0,
      };
      cur.bookings += r.bookings_count;
      cur.revenue += Number(r.revenue_pkr);
      cur.occupancy += Number(r.occupancy_pct);
      cur.n += 1;
      byDay.set(r.day, cur);
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({
        day: v.day,
        bookings: v.bookings,
        revenue: Math.round(v.revenue),
        occupancy: v.n ? Math.round(v.occupancy / v.n) : 0,
      }));
  }, [rows]);

  const stats = useMemo(() => aggregateAnalytics(rows), [rows]);

  return (
    <>
      <AppHeader
        title="Analytics"
        description="Utilization and revenue from field_analytics_daily."
      />
      <PageShell>
        {error ? <FormMessage>{error}</FormMessage> : null}

        <div className="max-w-xs">
          <Label>Field</Label>
          <Select value={fieldId} onChange={(e) => setFieldId(e.target.value)}>
            <option value="all">All fields</option>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatChip
            label="Bookings (14d)"
            value={loading ? "…" : String(stats.bookings)}
          />
          <StatChip
            label="Avg. occupancy"
            value={loading ? "…" : `${stats.occupancy.toFixed(0)}%`}
          />
          <StatChip
            label="Gross revenue"
            value={loading ? "…" : `PKR ${Math.round(stats.revenue).toLocaleString()}`}
          />
        </div>

        <SoftCard title="Daily bookings" description="Last 14 days (Asia/Karachi).">
          <div className="h-72 w-full">
            {chartData.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-muted">
                {loading ? "Loading…" : "No analytics yet"}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
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
            )}
          </div>
        </SoftCard>

        <SoftCard title="Revenue & occupancy" description="Stacked view of daily revenue and occupancy %.">
          <div className="h-72 w-full">
            {chartData.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-muted">
                {loading ? "Loading…" : "No analytics yet"}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
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
            )}
          </div>
        </SoftCard>
      </PageShell>
    </>
  );
}
