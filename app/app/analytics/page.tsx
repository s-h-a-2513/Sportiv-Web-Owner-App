"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { PageShell, SoftCard, StatChip } from "@/components/ui/page";
import { FormMessage, Label, Select } from "@/components/ui/form";
import { listOwnerFields } from "@/lib/api/fields";
import { aggregateAnalytics, listAnalyticsForFields } from "@/lib/api/analytics";
import { addDaysIsoDate, todayKarachi } from "@/lib/dates";
import { toUserMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";

const BookingsBarChart = dynamic(
  () =>
    import("@/components/analytics-charts").then((m) => m.BookingsBarChart),
  { ssr: false, loading: () => <ChartLoading /> },
);

const RevenueOccupancyChart = dynamic(
  () =>
    import("@/components/analytics-charts").then((m) => m.RevenueOccupancyChart),
  { ssr: false, loading: () => <ChartLoading /> },
);

function ChartLoading() {
  return (
    <div className="grid h-full place-items-center text-sm text-muted">Loading chart…</div>
  );
}

export default function AnalyticsPage() {
  const [fieldId, setFieldId] = useState("all");

  const range = useMemo(() => {
    const to = todayKarachi();
    return { from: addDaysIsoDate(to, -13), to };
  }, []);

  const fieldsQuery = useQuery({
    queryKey: queryKeys.ownerFields,
    queryFn: listOwnerFields,
  });

  const fields = fieldsQuery.data ?? [];
  const analyticsFieldIds = useMemo(
    () => (fieldId === "all" ? fields.map((f) => f.id) : [fieldId]),
    [fieldId, fields],
  );

  const analyticsQuery = useQuery({
    queryKey: queryKeys.analytics(analyticsFieldIds, range.from, range.to),
    enabled: fieldsQuery.isSuccess && analyticsFieldIds.length > 0,
    queryFn: () =>
      listAnalyticsForFields(analyticsFieldIds, range.from, range.to),
  });

  const rows = analyticsQuery.data ?? [];
  const loading = fieldsQuery.isLoading || analyticsQuery.isLoading;
  const error =
    fieldsQuery.error || analyticsQuery.error
      ? toUserMessage(
          fieldsQuery.error || analyticsQuery.error,
          "Failed to load analytics",
        )
      : null;

  const chartData = useMemo(() => {
    const byDay = new Map<
      string,
      { day: string; bookings: number; revenue: number; occupancy: number; n: number }
    >();
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
  const emptyLabel = loading ? "Loading…" : "No analytics yet";

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
            <BookingsBarChart data={chartData} emptyLabel={emptyLabel} />
          </div>
        </SoftCard>

        <SoftCard
          title="Revenue & occupancy"
          description="Stacked view of daily revenue and occupancy %."
        >
          <div className="h-72 w-full">
            <RevenueOccupancyChart data={chartData} emptyLabel={emptyLabel} />
          </div>
        </SoftCard>
      </PageShell>
    </>
  );
}
