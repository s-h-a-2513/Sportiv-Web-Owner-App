"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { PageShell, SoftCard, StatChip } from "@/components/ui/page";
import { Button, FormMessage } from "@/components/ui/form";
import { listOwnerFields, listFieldPhotos } from "@/lib/api/fields";
import { listWeeklySchedules } from "@/lib/api/schedules";
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
import type { Booking, Field, FieldAnalyticsDaily } from "@/lib/types";

export default function OverviewPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [analytics, setAnalytics] = useState<FieldAnalyticsDaily[]>([]);
  const [verification, setVerification] = useState<string>("Pending");
  const [missingPhotos, setMissingPhotos] = useState<string[]>([]);
  const [missingSchedule, setMissingSchedule] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const ownerFields = await listOwnerFields();
        if (cancelled) return;
        setFields(ownerFields);

        const today = todayKarachi();
        const fromIso = startOfTodayKarachiIso();
        const toIso = karachiEndOfDayUtc(today).toISOString();
        const weekTo = addDaysIsoDate(today, 6);

        const fieldIds = ownerFields.map((f) => f.id);

        const [dayRows, upcomingRows, analyticsRows, account] = await Promise.all([
          fieldIds.length
            ? listBookingsInRange({
                fromIso,
                toIso,
                fieldIds,
                statuses: ["pending", "confirmed"],
              })
            : Promise.resolve([] as Booking[]),
          fieldIds.length
            ? listBookingsInRange({
                fromIso,
                toIso: karachiEndOfDayUtc(weekTo).toISOString(),
                fieldIds,
                statuses: ["pending", "confirmed"],
              })
            : Promise.resolve([] as Booking[]),
          fieldIds.length
            ? listAnalyticsForFields(fieldIds, today, weekTo)
            : Promise.resolve([] as FieldAnalyticsDaily[]),
          getOwnerAccount(),
        ]);

        if (cancelled) return;
        setTodayBookings(dayRows);
        setUpcoming(upcomingRows.slice(0, 8));
        setAnalytics(analyticsRows);
        setVerification(verificationLabel(account.profile?.verification_status));

        const noPhoto: string[] = [];
        const noSchedule: string[] = [];
        await Promise.all(
          ownerFields.map(async (f) => {
            const [photos, weekly] = await Promise.all([
              listFieldPhotos(f.id),
              listWeeklySchedules(f.id),
            ]);
            if (photos.length === 0) noPhoto.push(f.name);
            if (weekly.length === 0) noSchedule.push(f.name);
          }),
        );
        if (!cancelled) {
          setMissingPhotos(noPhoto);
          setMissingSchedule(noSchedule);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load overview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
                  className="flex items-center justify-between rounded-xl bg-inset px-4 py-3 text-sm shadow-neu-inset hover:bg-raised/60"
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
            <ul className="divide-y divide-ink/5 rounded-2xl bg-inset shadow-neu-inset">
              {upcoming.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/app/bookings/${b.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-raised/50"
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
