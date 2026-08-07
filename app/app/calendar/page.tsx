"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { PageShell, SoftCard } from "@/components/ui/page";
import { Button, FormMessage, Input, Label, Select } from "@/components/ui/form";
import { listOwnerFields } from "@/lib/api/fields";
import {
  bookingCustomerLabel,
  listBookingsInRange,
  subscribeBookings,
} from "@/lib/api/bookings";
import { createFieldHold, listFieldHolds } from "@/lib/api/holds";
import {
  addDaysIsoDate,
  formatKarachi,
  formatKarachiTime,
  karachiDateString,
  weekRangeContaining,
} from "@/lib/dates";
import { toUserMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import {
  BOOKING_STATUS_LABELS,
  type BookingStatus,
} from "@/lib/types";

const STATUS_FILTERS: BookingStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "no_show",
  "cancelled_by_owner",
  "cancelled_by_player",
];

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [anchor, setAnchor] = useState(() => new Date());
  const [fieldFilter, setFieldFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [holdField, setHoldField] = useState("");
  const [holdStart, setHoldStart] = useState("");
  const [holdEnd, setHoldEnd] = useState("");
  const [holdReason, setHoldReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const week = useMemo(() => weekRangeContaining(anchor), [anchor]);
  const fromIso = rangeFrom ? `${rangeFrom}T00:00:00+05:00` : week.fromIso;
  const toIso = rangeTo ? `${rangeTo}T23:59:59.999+05:00` : week.toIso;

  const fieldsQuery = useQuery({
    queryKey: queryKeys.ownerFields,
    queryFn: listOwnerFields,
  });

  const fields = fieldsQuery.data ?? [];

  useEffect(() => {
    if (!holdField && fields[0]) setHoldField(fields[0].id);
  }, [fields, holdField]);

  const fieldIds = useMemo(
    () =>
      fieldFilter === "all" ? fields.map((f) => f.id) : [fieldFilter],
    [fieldFilter, fields],
  );

  const statuses = useMemo(
    () =>
      statusFilter === "all"
        ? undefined
        : statusFilter === "active"
          ? (["pending", "confirmed"] as BookingStatus[])
          : ([statusFilter] as BookingStatus[]),
    [statusFilter],
  );

  const bookingsQuery = useQuery({
    queryKey: queryKeys.bookingsRange({
      fromIso,
      toIso,
      fieldIds,
      statuses: statuses?.join(",") ?? "all",
      search: debouncedSearch,
    }),
    enabled: fieldsQuery.isSuccess,
    queryFn: () =>
      listBookingsInRange({
        fromIso,
        toIso,
        fieldIds: fieldIds.length
          ? fieldIds
          : ["00000000-0000-0000-0000-000000000000"],
        statuses,
        search: debouncedSearch || undefined,
      }),
  });

  const singleFieldId = fieldIds.length === 1 ? fieldIds[0] : null;

  const holdsQuery = useQuery({
    queryKey: queryKeys.fieldHolds(singleFieldId ?? "", fromIso, toIso),
    enabled: Boolean(singleFieldId),
    queryFn: async () => {
      const h = await listFieldHolds(singleFieldId!, fromIso, toIso);
      return h.holds;
    },
  });

  useEffect(() => {
    return subscribeBookings(() => {
      void queryClient.invalidateQueries({ queryKey: ["bookings-range"] });
      void queryClient.invalidateQueries({ queryKey: ["field-holds"] });
    });
  }, [queryClient]);

  const holdMutation = useMutation({
    mutationFn: createFieldHold,
    onSuccess: async () => {
      setHoldStart("");
      setHoldEnd("");
      setHoldReason("");
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["field-holds"] });
      await queryClient.invalidateQueries({ queryKey: ["bookings-range"] });
    },
    onError: (e) => {
      setFormError(toUserMessage(e, "Failed to create hold"));
    },
  });

  const days = useMemo(() => {
    const start = rangeFrom || week.weekStartDate;
    const end = rangeTo || week.weekEndDate;
    const list: string[] = [];
    let cur = start;
    while (cur <= end) {
      list.push(cur);
      cur = addDaysIsoDate(cur, 1);
      if (list.length > 62) break;
    }
    return list;
  }, [rangeFrom, rangeTo, week.weekEndDate, week.weekStartDate]);

  const bookings = bookingsQuery.data ?? [];
  const holds = holdsQuery.data ?? [];
  const loading =
    fieldsQuery.isLoading ||
    bookingsQuery.isLoading ||
    (Boolean(singleFieldId) && holdsQuery.isLoading);
  const error =
    fieldsQuery.error || bookingsQuery.error || holdsQuery.error
      ? toUserMessage(
          fieldsQuery.error || bookingsQuery.error || holdsQuery.error,
          "Failed to load calendar",
        )
      : formError;

  function onCreateHold() {
    setFormError(null);
    if (!holdField || !holdStart || !holdEnd) {
      setFormError("Field, start, and end are required for a hold");
      return;
    }
    holdMutation.mutate({
      field_id: holdField,
      starts_at: new Date(holdStart).toISOString(),
      ends_at: new Date(holdEnd).toISOString(),
      reason: holdReason || null,
    });
  }

  return (
    <>
      <AppHeader
        title="Calendar"
        description="Bookings across your fields (Asia/Karachi)."
      />
      <PageShell>
        <div className="flex flex-wrap items-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setAnchor((d) => new Date(d.getTime() - 7 * 86400000))}
          >
            Previous week
          </Button>
          <Button type="button" variant="secondary" onClick={() => setAnchor(new Date())}>
            This week
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setAnchor((d) => new Date(d.getTime() + 7 * 86400000))}
          >
            Next week
          </Button>
          <Link href="/app/bookings/new">
            <Button type="button">Add booking</Button>
          </Link>
        </div>

        <SoftCard title="Filters" description="Field, status, date range, and guest search.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label>Field</Label>
              <Select value={fieldFilter} onChange={(e) => setFieldFilter(e.target.value)}>
                <option value="all">All fields</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="active">Pending + confirmed</option>
                <option value="all">All statuses</option>
                {STATUS_FILTERS.map((s) => (
                  <option key={s} value={s}>
                    {BOOKING_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>From</Label>
              <Input
                type="date"
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
              />
            </div>
            <div>
              <Label>To</Label>
              <Input
                type="date"
                value={rangeTo}
                onChange={(e) => setRangeTo(e.target.value)}
              />
            </div>
            <div>
              <Label>Search guest / phone</Label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or phone"
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">
            Showing {rangeFrom || week.weekStartDate} → {rangeTo || week.weekEndDate}
          </p>
        </SoftCard>

        {error ? <FormMessage>{error}</FormMessage> : null}

        <SoftCard
          title="Week board"
          description={loading ? "Loading…" : `${bookings.length} bookings`}
        >
          <div className="space-y-4">
            {days.map((day) => {
              const dayBookings = bookings.filter(
                (b) => karachiDateString(b.starts_at) === day,
              );
              const dayHolds = holds.filter((h) => karachiDateString(h.starts_at) === day);
              return (
                <div key={day} className="neu-inset rounded-[20px] p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    {formatKarachi(`${day}T12:00:00+05:00`, {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  {dayBookings.length === 0 && dayHolds.length === 0 ? (
                    <p className="text-sm text-muted">No bookings</p>
                  ) : (
                    <ul className="space-y-2">
                      {dayBookings.map((b) => (
                        <li key={b.id}>
                          <Link
                            href={`/app/bookings/${b.id}`}
                            className="neu-raised-sm flex flex-wrap items-center justify-between gap-2 rounded-[20px] px-3 py-2 text-sm no-underline hover:no-underline"
                          >
                            <span className="font-medium text-ink">
                              {formatKarachiTime(b.starts_at)}–{formatKarachiTime(b.ends_at)} ·{" "}
                              {b.fields?.name ?? "Field"}
                            </span>
                            <span className="text-muted">
                              {bookingCustomerLabel(b)} · {BOOKING_STATUS_LABELS[b.status]}
                            </span>
                          </Link>
                        </li>
                      ))}
                      {dayHolds.map((h) => (
                        <li
                          key={h.id}
                          className="neu-raised-sm rounded-[20px] px-3 py-2 text-sm text-muted"
                        >
                          Hold · {formatKarachiTime(h.starts_at)}–{formatKarachiTime(h.ends_at)}
                          {h.reason ? ` · ${h.reason}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </SoftCard>

        <SoftCard title="Create slot hold" description="Blocks availability without a booking.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label>Field</Label>
              <Select value={holdField} onChange={(e) => setHoldField(e.target.value)}>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Starts</Label>
              <Input
                type="datetime-local"
                value={holdStart}
                onChange={(e) => setHoldStart(e.target.value)}
              />
            </div>
            <div>
              <Label>Ends</Label>
              <Input
                type="datetime-local"
                value={holdEnd}
                onChange={(e) => setHoldEnd(e.target.value)}
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Input
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                placeholder="Blocked"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                disabled={holdMutation.isPending}
                onClick={() => onCreateHold()}
              >
                Hold slot
              </Button>
            </div>
          </div>
        </SoftCard>
      </PageShell>
    </>
  );
}
