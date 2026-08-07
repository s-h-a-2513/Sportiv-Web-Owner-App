"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { PageShell, SoftCard } from "@/components/ui/page";
import { Button, FormMessage, Input, Label, Select } from "@/components/ui/form";
import { getField } from "@/lib/api/fields";
import {
  addWeeklySchedule,
  deleteScheduleException,
  deleteWeeklySchedule,
  listAvailableSlots,
  listScheduleExceptions,
  listWeeklySchedules,
  upsertScheduleException,
} from "@/lib/api/schedules";
import {
  createFieldHold,
  deleteFieldHold,
  listFieldHolds,
} from "@/lib/api/holds";
import { addDaysIsoDate, formatKarachi, todayKarachi } from "@/lib/dates";
import { toUserMessage } from "@/lib/errors";
import {
  WEEKDAY_LABELS,
  type AvailableSlot,
  type Field,
  type FieldScheduleException,
  type FieldSlotHold,
  type FieldWeeklySchedule,
} from "@/lib/types";

export default function FieldSchedulePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [field, setField] = useState<Field | null>(null);
  const [weekly, setWeekly] = useState<FieldWeeklySchedule[]>([]);
  const [exceptions, setExceptions] = useState<FieldScheduleException[]>([]);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [holds, setHolds] = useState<FieldSlotHold[]>([]);
  const [holdsAvailable, setHoldsAvailable] = useState(true);
  const [holdsHint, setHoldsHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [weekday, setWeekday] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("22:00");

  const [exDate, setExDate] = useState(todayKarachi());
  const [exClosed, setExClosed] = useState(true);
  const [exStart, setExStart] = useState("10:00");
  const [exEnd, setExEnd] = useState("18:00");

  const [holdStart, setHoldStart] = useState("");
  const [holdEnd, setHoldEnd] = useState("");
  const [holdReason, setHoldReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = todayKarachi();
      const to = addDaysIsoDate(from, 6);
      const [f, w, e, s, h] = await Promise.all([
        getField(id),
        listWeeklySchedules(id),
        listScheduleExceptions(id),
        listAvailableSlots(id, from, to),
        listFieldHolds(id, `${from}T00:00:00+05:00`, `${to}T23:59:59+05:00`),
      ]);
      setField(f);
      setWeekly(w);
      setExceptions(e);
      setSlots(s);
      setHolds(h.holds);
      setHoldsAvailable(h.available);
      setHoldsHint(h.error ?? null);
    } catch (err) {
      setError(toUserMessage(err, "Failed to load schedule"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onAddWeekly() {
    setError(null);
    try {
      await addWeeklySchedule({
        field_id: id,
        weekday,
        start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
        end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
      });
      await load();
    } catch (err) {
      setError(toUserMessage(err, "Failed to add hours"));
    }
  }

  async function onAddException() {
    setError(null);
    try {
      await upsertScheduleException({
        field_id: id,
        exception_date: exDate,
        is_closed: exClosed,
        override_start_time: exClosed
          ? null
          : exStart.length === 5
            ? `${exStart}:00`
            : exStart,
        override_end_time: exClosed
          ? null
          : exEnd.length === 5
            ? `${exEnd}:00`
            : exEnd,
      });
      await load();
    } catch (err) {
      setError(toUserMessage(err, "Failed to save exception"));
    }
  }

  async function onAddHold() {
    setError(null);
    try {
      if (!holdStart || !holdEnd) {
        setError("Hold start and end are required");
        return;
      }
      await createFieldHold({
        field_id: id,
        starts_at: new Date(holdStart).toISOString(),
        ends_at: new Date(holdEnd).toISOString(),
        reason: holdReason || null,
      });
      setHoldStart("");
      setHoldEnd("");
      setHoldReason("");
      await load();
    } catch (err) {
      setError(toUserMessage(err, "Failed to create hold"));
    }
  }

  return (
    <>
      <AppHeader
        title="Field schedule"
        description={field ? `Hours for ${field.name}` : "Opening hours and exceptions"}
      />
      <PageShell>
        <div className="flex flex-wrap gap-3">
          <Link href={`/app/fields/${id}`}>
            <Button type="button" variant="secondary">
              Back to field
            </Button>
          </Link>
        </div>

        {error ? <FormMessage>{error}</FormMessage> : null}
        {loading ? <p className="text-sm text-muted">Loading…</p> : null}

        <SoftCard
          title="Weekly hours"
          description="Weekday 0 = Sunday … 6 = Saturday (Asia/Karachi)."
        >
          <ul className="mb-4 space-y-2">
            {weekly.length === 0 ? (
              <li className="neu-inset rounded-[20px] px-4 py-3 text-sm text-muted">No weekly windows yet.</li>
            ) : (
              weekly.map((row) => (
                <li
                  key={row.id}
                  className="neu-raised-sm flex items-center justify-between gap-3 rounded-[20px] px-4 py-3 text-sm"
                >
                  <span className="text-ink">
                    {WEEKDAY_LABELS[row.weekday]} · {row.start_time.slice(0, 5)}–
                    {row.end_time.slice(0, 5)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      void deleteWeeklySchedule(row.id).then(load).catch((err) =>
                        setError(toUserMessage(err, "Delete failed")),
                      )
                    }
                  >
                    Remove
                  </Button>
                </li>
              ))
            )}
          </ul>
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <Label>Weekday</Label>
              <Select
                value={weekday}
                onChange={(e) => setWeekday(Number(e.target.value))}
              >
                {WEEKDAY_LABELS.map((label, i) => (
                  <option key={label} value={i}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Start</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label>End</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={() => void onAddWeekly()}>
                Add window
              </Button>
            </div>
          </div>
        </SoftCard>

        <SoftCard
          title="Exceptions"
          description="Close a date or override open hours for a single day."
        >
          <ul className="mb-4 space-y-2">
            {exceptions.length === 0 ? (
              <li className="neu-inset rounded-[20px] px-4 py-3 text-sm text-muted">No exceptions.</li>
            ) : (
              exceptions.map((row) => (
                <li
                  key={row.id}
                  className="neu-raised-sm flex items-center justify-between gap-3 rounded-[20px] px-4 py-3 text-sm"
                >
                  <span className="text-ink">
                    {row.exception_date} ·{" "}
                    {row.is_closed
                      ? "Closed"
                      : `${row.override_start_time?.slice(0, 5)}–${row.override_end_time?.slice(0, 5)}`}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      void deleteScheduleException(row.id).then(load).catch((err) =>
                        setError(toUserMessage(err, "Delete failed")),
                      )
                    }
                  >
                    Remove
                  </Button>
                </li>
              ))
            )}
          </ul>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label>Date</Label>
              <Input type="date" value={exDate} onChange={(e) => setExDate(e.target.value)} />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={exClosed ? "closed" : "override"}
                onChange={(e) => setExClosed(e.target.value === "closed")}
              >
                <option value="closed">Closed</option>
                <option value="override">Override hours</option>
              </Select>
            </div>
            {!exClosed ? (
              <>
                <div>
                  <Label>Start</Label>
                  <Input type="time" value={exStart} onChange={(e) => setExStart(e.target.value)} />
                </div>
                <div>
                  <Label>End</Label>
                  <Input type="time" value={exEnd} onChange={(e) => setExEnd(e.target.value)} />
                </div>
              </>
            ) : null}
            <div className="flex items-end">
              <Button type="button" onClick={() => void onAddException()}>
                Save exception
              </Button>
            </div>
          </div>
        </SoftCard>

        <SoftCard
          title="Slot holds"
          description="Block inventory without creating a booking (requires migration)."
        >
          {!holdsAvailable && holdsHint ? (
            <FormMessage tone="info">{holdsHint}</FormMessage>
          ) : null}
          <ul className="mb-4 space-y-2">
            {holds.length === 0 ? (
              <li className="neu-inset rounded-[20px] px-4 py-3 text-sm text-muted">No holds in the next 7 days.</li>
            ) : (
              holds.map((h) => (
                <li
                  key={h.id}
                  className="neu-raised-sm flex items-center justify-between gap-3 rounded-[20px] px-4 py-3 text-sm"
                >
                  <span className="text-ink">
                    {formatKarachi(h.starts_at)} → {formatKarachiTimeSafe(h.ends_at)}
                    {h.reason ? ` · ${h.reason}` : ""}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      void deleteFieldHold(h.id).then(load).catch((err) =>
                        setError(toUserMessage(err, "Delete failed")),
                      )
                    }
                  >
                    Remove
                  </Button>
                </li>
              ))
            )}
          </ul>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                placeholder="Maintenance"
              />
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={() => void onAddHold()} disabled={!holdsAvailable}>
                Create hold
              </Button>
            </div>
          </div>
        </SoftCard>

        <SoftCard title="Next 7 days" description="Open slots from list_available_slots.">
          {slots.length === 0 ? (
            <p className="text-sm text-muted">No open slots (check hours and activity).</p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-auto">
              {slots.map((slot) => (
                <li
                  key={slot.starts_at}
                  className="neu-raised-sm flex justify-between rounded-[20px] px-4 py-2 text-sm"
                >
                  <span className="text-ink">{formatKarachi(slot.starts_at)}</span>
                  <span className="text-muted">PKR {Number(slot.price).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </SoftCard>
      </PageShell>
    </>
  );
}

function formatKarachiTimeSafe(iso: string) {
  return formatKarachi(iso, { hour: "numeric", minute: "2-digit" });
}
