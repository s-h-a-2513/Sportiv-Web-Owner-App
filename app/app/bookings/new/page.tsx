"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { PageShell, SoftCard } from "@/components/ui/page";
import {
  Button,
  FieldError,
  FormMessage,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/form";
import { listOwnerFields } from "@/lib/api/fields";
import { createOwnerBooking } from "@/lib/api/bookings";
import { listAvailableSlots } from "@/lib/api/schedules";
import { formatKarachi, formatKarachiTime, todayKarachi } from "@/lib/dates";
import { toUserMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import type { AvailableSlot } from "@/lib/types";

type CustomerMode = "guest" | "player";

export default function NewBookingPage() {
  const router = useRouter();
  const [fieldId, setFieldId] = useState("");
  const [date, setDate] = useState(todayKarachi());
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [mode, setMode] = useState<CustomerMode>("guest");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const fieldsQuery = useQuery({
    queryKey: queryKeys.ownerFields,
    queryFn: listOwnerFields,
  });

  const allFields = fieldsQuery.data ?? [];
  const active = allFields.filter((f) => f.is_active);
  const fields = active.length ? active : allFields;

  useEffect(() => {
    if (!fieldId && fields[0]) setFieldId(fields[0].id);
  }, [fields, fieldId]);

  useEffect(() => {
    if (fieldsQuery.error) {
      setError(toUserMessage(fieldsQuery.error, "Failed to load fields"));
    }
  }, [fieldsQuery.error]);

  useEffect(() => {
    if (!fieldId || !date) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setSelectedSlot("");
    void listAvailableSlots(fieldId, date, date)
      .then((rows) => {
        if (!cancelled) setSlots(rows);
      })
      .catch((e) => {
        if (!cancelled) setError(toUserMessage(e, "Failed to load slots"));
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fieldId, date]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldError(null);

    if (!fieldId) {
      setFieldError("Select a field");
      return;
    }
    const slot = slots.find((s) => s.starts_at === selectedSlot);
    if (!slot) {
      setError("Select an open slot");
      return;
    }

    if (mode === "guest") {
      if (!guestName.trim() || !guestPhone.trim()) {
        setError("Guest name and phone are required");
        return;
      }
    } else if (!playerPhone.trim()) {
      setError("Player phone is required");
      return;
    }

    setSubmitting(true);
    try {
      const booking =
        mode === "guest"
          ? await createOwnerBooking({
              field_id: fieldId,
              starts_at: slot.starts_at,
              ends_at: slot.ends_at,
              guest_name: guestName.trim(),
              guest_phone: guestPhone.trim(),
              notes: notes.trim() || undefined,
            })
          : await createOwnerBooking({
              field_id: fieldId,
              starts_at: slot.starts_at,
              ends_at: slot.ends_at,
              player_phone: playerPhone.trim(),
              notes: notes.trim() || undefined,
            });

      router.replace(`/app/bookings/${booking.id}`);
    } catch (err) {
      setError(toUserMessage(err, "Failed to create booking"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AppHeader
        title="Add booking"
        description="Walk-in guests or registered players — via create-owner-booking."
      />
      <PageShell>
        <SoftCard title="Manual booking" description="Slots come from list_available_slots.">
          <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4">
            <div>
              <Label htmlFor="field_id">Field</Label>
              <Select
                id="field_id"
                value={fieldId}
                onChange={(e) => setFieldId(e.target.value)}
              >
                <option value="">Select field</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                    {!f.is_active ? " (inactive)" : ""}
                  </option>
                ))}
              </Select>
              <FieldError message={fieldError ?? undefined} />
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="slot">Open slot</Label>
              {loadingSlots ? (
                <p className="text-sm text-muted">Loading slots…</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted">No open slots for this date.</p>
              ) : (
                <Select
                  id="slot"
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                >
                  <option value="">Select a slot</option>
                  {slots.map((s) => (
                    <option key={s.starts_at} value={s.starts_at}>
                      {formatKarachiTime(s.starts_at)}–{formatKarachiTime(s.ends_at)} · PKR{" "}
                      {Number(s.price).toLocaleString()}
                    </option>
                  ))}
                </Select>
              )}
              {selectedSlot ? (
                <p className="mt-1 text-xs text-muted">{formatKarachi(selectedSlot)}</p>
              ) : null}
            </div>

            <div>
              <Label>Customer</Label>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("guest")}
                  className={
                    mode === "guest"
                      ? "neu-btn rounded-full px-3 py-2 text-sm font-semibold text-white"
                      : "neu-tab rounded-full px-3 py-2 text-sm font-medium"
                  }
                >
                  Walk-in guest
                </button>
                <button
                  type="button"
                  onClick={() => setMode("player")}
                  className={
                    mode === "player"
                      ? "neu-btn rounded-full px-3 py-2 text-sm font-semibold text-white"
                      : "neu-tab rounded-full px-3 py-2 text-sm font-medium"
                  }
                >
                  Existing player
                </button>
              </div>
            </div>

            {mode === "guest" ? (
              <>
                <div>
                  <Label htmlFor="guest_name">Guest name</Label>
                  <Input
                    id="guest_name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="guest_phone">Guest phone</Label>
                  <Input
                    id="guest_phone"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+92…"
                  />
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="player_phone">Player phone</Label>
                <Input
                  id="player_phone"
                  value={playerPhone}
                  onChange={(e) => setPlayerPhone(e.target.value)}
                  placeholder="Registered player phone"
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error ? <FormMessage>{error}</FormMessage> : null}

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create booking"}
              </Button>
              <Link href="/app/calendar">
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </SoftCard>
      </PageShell>
    </>
  );
}
