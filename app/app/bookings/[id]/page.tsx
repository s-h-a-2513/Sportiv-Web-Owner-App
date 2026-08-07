"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { PageShell, SoftCard } from "@/components/ui/page";
import { Button, FormMessage, Label, Textarea } from "@/components/ui/form";
import {
  bookingCustomerLabel,
  cancelBooking,
  getBooking,
  updateBookingNotes,
  updateBookingStatus,
} from "@/lib/api/bookings";
import { formatKarachi } from "@/lib/dates";
import { toUserMessage } from "@/lib/errors";
import { BOOKING_STATUS_LABELS, type Booking } from "@/lib/types";

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const row = await getBooking(id);
      setBooking(row);
      setNotes(row?.notes ?? "");
    } catch (e) {
      setError(toUserMessage(e, "Failed to load booking"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCancel() {
    if (!booking || !confirm("Cancel this booking?")) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await cancelBooking(booking.id);
      setBooking(updated);
      setMessage("Booking cancelled");
    } catch (e) {
      setError(toUserMessage(e, "Cancel failed"));
    } finally {
      setBusy(false);
    }
  }

  async function onStatus(status: "completed" | "no_show") {
    if (!booking) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await updateBookingStatus(booking.id, status);
      setBooking(updated);
      setMessage(`Marked ${BOOKING_STATUS_LABELS[status].toLowerCase()}`);
    } catch (e) {
      setError(toUserMessage(e, "Update failed"));
    } finally {
      setBusy(false);
    }
  }

  async function onSaveNotes() {
    if (!booking) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await updateBookingNotes(booking.id, notes.trim() || null);
      setBooking(updated);
      setMessage("Notes saved");
    } catch (e) {
      setError(
        toUserMessage(
          e,
          "Could not update notes (check RLS allows owner updates)",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <>
        <AppHeader title="Booking" />
        <PageShell>
          <p className="text-sm text-muted">Loading…</p>
        </PageShell>
      </>
    );
  }

  if (!booking) {
    return (
      <>
        <AppHeader title="Booking" />
        <PageShell>
          <SoftCard title="Not found" description={error ?? "Booking does not exist."}>
            <Link href="/app/calendar">
              <Button type="button" variant="secondary">
                Back to calendar
              </Button>
            </Link>
          </SoftCard>
        </PageShell>
      </>
    );
  }

  const cancellable = booking.status === "pending" || booking.status === "confirmed";

  return (
    <>
      <AppHeader
        title="Booking"
        description={booking.fields?.name ?? booking.field_id}
      />
      <PageShell>
        {message ? <FormMessage tone="success">{message}</FormMessage> : null}
        {error ? <FormMessage>{error}</FormMessage> : null}

        <SoftCard title="Details" description={`Source: ${booking.source}`}>
          <div className="neu-inset grid gap-3 rounded-[20px] p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Status</p>
              <p className="mt-1 font-medium text-ink">
                {BOOKING_STATUS_LABELS[booking.status]}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Field</p>
              <p className="mt-1 font-medium text-ink">
                {booking.fields?.name ?? booking.field_id}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Starts</p>
              <p className="mt-1 font-medium text-ink">{formatKarachi(booking.starts_at)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Ends</p>
              <p className="mt-1 font-medium text-ink">{formatKarachi(booking.ends_at)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Customer</p>
              <p className="mt-1 font-medium text-ink">{bookingCustomerLabel(booking)}</p>
              {booking.guest_phone ? (
                <p className="text-muted">{booking.guest_phone}</p>
              ) : null}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Price</p>
              <p className="mt-1 font-medium text-ink">
                PKR {Number(booking.price_snapshot).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void onSaveNotes()}>
              Save notes
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {cancellable ? (
              <Button type="button" disabled={busy} onClick={() => void onCancel()}>
                Cancel booking
              </Button>
            ) : null}
            {cancellable ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void onStatus("completed")}
                >
                  Mark completed
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void onStatus("no_show")}
                >
                  Mark no-show
                </Button>
              </>
            ) : null}
            <Link href="/app/calendar">
              <Button type="button" variant="ghost">
                Back to calendar
              </Button>
            </Link>
          </div>
        </SoftCard>
      </PageShell>
    </>
  );
}
