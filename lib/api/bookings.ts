import { createClient } from "@/lib/supabase/client";
import type {
  Booking,
  BookingStatus,
  CreateOwnerBookingBody,
} from "@/lib/types";

function client() {
  return createClient();
}

export async function listBookingsInRange(opts: {
  fromIso: string;
  toIso: string;
  fieldIds?: string[];
  statuses?: BookingStatus[];
  search?: string;
}): Promise<Booking[]> {
  const supabase = client();
  let query = supabase
    .from("bookings")
    .select(
      "*, fields(id, name, city, slot_minutes, price_per_slot, owner_id)",
    )
    .gte("starts_at", opts.fromIso)
    .lte("starts_at", opts.toIso)
    .order("starts_at", { ascending: true });

  if (opts.fieldIds && opts.fieldIds.length > 0) {
    query = query.in("field_id", opts.fieldIds);
  }

  if (opts.statuses && opts.statuses.length > 0) {
    query = query.in("status", opts.statuses);
  }

  if (opts.search?.trim()) {
    const q = opts.search.trim().replace(/[%(),]/g, "");
    query = query.or(`guest_name.ilike.%${q}%,guest_phone.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []) as Booking[];
}

export async function getBooking(id: string): Promise<Booking | null> {
  const supabase = client();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, fields(id, name, city, slot_minutes, price_per_slot)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as Booking | null;
}

export async function createOwnerBooking(
  body: CreateOwnerBookingBody,
): Promise<Booking> {
  const supabase = client();
  const { data, error } = await supabase.functions.invoke("create-owner-booking", {
    body,
  });

  const payload = data as { booking?: Booking; error?: string } | null;
  if (error || payload?.error) {
    throw new Error(payload?.error || error?.message || "Failed to create booking");
  }
  if (!payload?.booking) throw new Error("No booking returned");
  return payload.booking;
}

export async function cancelBooking(bookingId: string): Promise<Booking> {
  const supabase = client();
  const { data, error } = await supabase.functions.invoke("cancel-booking", {
    body: { booking_id: bookingId },
  });

  const payload = data as { booking?: Booking; error?: string } | null;
  if (error || payload?.error) {
    throw new Error(payload?.error || error?.message || "Failed to cancel booking");
  }
  if (!payload?.booking) throw new Error("No booking returned");
  return payload.booking;
}

export async function updateBookingStatus(
  id: string,
  status: Extract<BookingStatus, "completed" | "no_show" | "confirmed" | "pending">,
): Promise<Booking> {
  const supabase = client();
  const { data, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .select("*, fields(id, name, city, slot_minutes, price_per_slot)")
    .single();

  if (error) throw error;
  return data as Booking;
}

export async function updateBookingNotes(id: string, notes: string | null): Promise<Booking> {
  const supabase = client();
  const { data, error } = await supabase
    .from("bookings")
    .update({ notes })
    .eq("id", id)
    .select("*, fields(id, name, city, slot_minutes, price_per_slot)")
    .single();

  if (error) throw error;
  return data as Booking;
}

export function bookingCustomerLabel(booking: Booking): string {
  if (booking.guest_name) return booking.guest_name;
  if (booking.guest_phone) return booking.guest_phone;
  if (booking.player_id) return "Registered player";
  return "Customer";
}

export function subscribeBookings(
  onChange: () => void,
): () => void {
  const supabase = client();
  const channel = supabase
    .channel("owner-bookings")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "bookings" },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
