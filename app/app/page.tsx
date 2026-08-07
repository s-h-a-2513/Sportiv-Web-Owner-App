"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { PageShell, SoftCard, StatChip } from "@/components/ui/page";
import { Button, FormMessage } from "@/components/ui/form";
import { listOwnerFields, listPhotoCountsByField } from "@/lib/api/fields";
import { listWeeklyScheduleFieldIds } from "@/lib/api/schedules";
import {
  bookingCustomerLabel,
  listBookingsInRange,
} from "@/lib/api/bookings";
import { aggregateAnalytics, listAnalyticsForFields } from "@/lib/api/analytics";
import { getOwnerAccount, verificationLabel } from "@/lib/api/account";
import {
  addDaysIsoDate,
  formatKarachi,
  formatKarachiTime,
  karachiEndOfDayUtc,
  startOfTodayKarachiIso,
  todayKarachi,
} from "@/lib/dates";
import { toUserMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import type { Booking, FieldAnalyticsDaily } from "@/lib/types";

export default function OverviewPage() {
  const today = todayKarachi();
  const fromIso = startOfTodayKarachiIso();
  const toIso = karachiEndOfDayUtc(today).toISOString();
  const weekTo = addDaysIsoDate(today, 6);

  const fieldsQuery = useQuery({
    queryKey: queryKeys.ownerFields,
    queryFn: listOwnerFields,
  });

  const fields = fieldsQuery.data ?? [];
  const fieldIds = useMemo(() => fields.map((f) => f.id), [fields]);

  const accountQuery = useQuery({
    queryKey: queryKeys.ownerAccount,
    queryFn: getOwnerAccount,
  });

  const todayBookingsQuery = useQuery({
    queryKey: queryKeys.bookingsRange({
      fromIso,
      toIso,
      fieldIds,
      statuses: "pending,confirmed",
    }),
    enabled: fieldIds.length > 0,
    queryFn: () =>
      listBookingsInRange({
        fromIso,
        toIso,
        fieldIds,
        statuses: ["pending", "confirmed"],
      }),
  });

  const upcomingQuery = useQuery({
    queryKey: queryKeys.bookingsRange({
      fromIso,
      toIso: karachiEndOfDayUtc(weekTo).toISOString(),
      fieldIds,
      statuses: "pending,confirmed",
      search: "upcoming",
    }),
    enabled: fieldIds.length > 0,
    queryFn: () =>
      listBookingsInRange({
        fromIso,
        toIso: karachiEndOfDayUtc(weekTo).toISOString(),
        fieldIds,
        statuses: ["pending", "confirmed"],
      }),
  });

  const analyticsQuery = useQuery({
    queryKey: queryKeys.analytics(fieldIds, today, weekTo),
    enabled: fieldIds.length > 0,
    queryFn: () => listAnalyticsForFields(fieldIds, today, weekTo),
  });

  const checklistQuery = useQuery({
    queryKey: queryKeys.overviewChecklist(fieldIds),
    enabled: fieldIds.length > 0,
    queryFn: async () => {
      const [photoCounts, scheduledIds] = await Promise.all([
        listPhotoCountsByField(fieldIds),
        listWeeklyScheduleFieldIds(fieldIds),
      ]);
      return { photoCounts, scheduledIds };
    },
  });

  const loading =
    fieldsQuery.isLoading ||
    accountQuery.isLoading ||
    (fieldIds.length > 0 &&
      (todayBookingsQuery.isLoading ||
        upcomingQuery.isLoading ||
        analyticsQuery.isLoading ||
        checklistQuery.isLoading));

  const error =
    fieldsQuery.error ||
    todayBookingsQuery.error ||
    upcomingQuery.error ||
    analyticsQuery.error ||
    checklistQuery.error ||
    accountQuery.error
      ? toUserMessage(
          fieldsQuery.error ||
            todayBookingsQuery.error ||
            upcomingQuery.error ||
            analyticsQuery.error ||
            checklistQuery.error ||
            accountQuery.error,
          "Failed to load overview",
        )
      : null;

  const todayBookings = todayBookingsQuery.data ?? ([] as Booking[]);
  const upcoming = (upcomingQuery.data ?? []).slice(0, 8);
  const analytics = analyticsQuery.data ?? ([] as FieldAnalyticsDaily[]);
  const verification = verificationLabel(
    accountQuery.data?.profile?.verification_status,
  );

  const missingPhotos = fields
    .filter((f) => (checklistQuery.data?.photoCounts.get(f.id) ?? 0) === 0)
    .map((f) => f.name);
  const missingSchedule = fields
    .filter((f) => !checklistQuery.data?.scheduledIds.has(f.id))
    .map((f) => f.name);

  const stats = useMemo(() => aggregateAnalytics(analytics), [analytics]);
  const activeFields = fields.filter((f) => f.is_active).length;

  const checklist = [
    {
      ok: verification === "Verified",
      label:
        verification === "Verified"
          ? "Business verified"
          : `Verification: ${verification}`,
      href: "/app/account",
    },
    {
      ok: fields.length > 0,
      label: fields.length > 0 ? "At least one field" : "Add your first field",
      href: "/app/fields/new",
    },
    {
      ok: missingPhotos.length === 0 && fields.length > 0,
      label:
        missingPhotos.length === 0
          ? "All fields have photos"
          : `Missing photos: ${missingPhotos.join(", ")}`,
      href: "/app/fields",
    },
    {
      ok: missingSchedule.length === 0 && fields.length > 0,
      label:
        missingSchedule.length === 0
          ? "All fields have weekly hours"
          : `Missing schedule: ${missingSchedule.join(", ")}`,
      href: "/app/schedule",
    },
    {
      ok: activeFields > 0,
      label: activeFields > 0 ? "At least one active listing" : "Activate a field",
      href: "/app/fields",
    },
  ];

  return (
    <>
      <AppHeader
        title="Overview"
        description="Today's snapshot across your fields and bookings."
      />
      <PageShell>
        {error ? <FormMessage>{error}</FormMessage> : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatChip
            label="Today's bookings"
            value={loading ? "…" : String(todayBookings.length)}
          />
          <StatChip
            label="Occupancy (7d)"
            value={loading ? "…" : `${stats.occupancy.toFixed(0)}%`}
          />
          <StatChip
            label="Revenue (7d)"
            value={loading ? "…" : `PKR ${Math.round(stats.revenue).toLocaleString()}`}
          />
          <StatChip
            label="Active fields"
            value={loading ? "…" : String(activeFields)}
          />
        </div>

        <SoftCard title="Go-live checklist" description="Finish these before promoting your listing.">
          <ul className="space-y-2">
            {checklist.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="neu-inset flex items-center justify-between rounded-[20px] px-4 py-3 text-sm no-underline hover:no-underline"
                >
                  <span className={item.ok ? "text-ink" : "text-muted"}>{item.label}</span>
                  <span className={item.ok ? "text-court" : "text-muted"}>
                    {item.ok ? "Done" : "Fix"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/app/fields/new">
              <Button type="button">Add a field</Button>
            </Link>
            <Link href="/app/bookings/new">
              <Button type="button" variant="secondary">
                Add booking
              </Button>
            </Link>
            <Link href="/app/calendar">
              <Button type="button" variant="ghost">
                Open calendar
              </Button>
            </Link>
          </div>
        </SoftCard>

        <SoftCard title="Upcoming" description="Next confirmed / pending bookings this week.">
          {loading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : upcoming.length === 0 ? (
            <p className="text-sm text-muted">No upcoming bookings.</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/app/bookings/${b.id}`}
                    className="neu-raised-sm flex items-center justify-between gap-3 rounded-[20px] px-4 py-3 text-sm no-underline hover:no-underline"
                  >
                    <span className="font-medium text-ink">
                      {b.fields?.name ?? "Field"} · {bookingCustomerLabel(b)}
                    </span>
                    <span className="text-muted">
                      {formatKarachi(b.starts_at, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      {formatKarachiTime(b.starts_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SoftCard>
      </PageShell>
    </>
  );
}
