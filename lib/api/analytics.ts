import { createClient } from "@/lib/supabase/client";
import type { FieldAnalyticsDaily } from "@/lib/types";

function client() {
  return createClient();
}

export async function listAnalyticsForFields(
  fieldIds: string[],
  fromDay: string,
  toDay: string,
): Promise<FieldAnalyticsDaily[]> {
  if (fieldIds.length === 0) return [];

  const supabase = client();
  const { data, error } = await supabase
    .from("field_analytics_daily")
    .select("*")
    .in("field_id", fieldIds)
    .gte("day", fromDay)
    .lte("day", toDay)
    .order("day", { ascending: true });

  if (error) throw error;
  return (data ?? []) as FieldAnalyticsDaily[];
}

export function aggregateAnalytics(rows: FieldAnalyticsDaily[]) {
  const bookings = rows.reduce((s, r) => s + r.bookings_count, 0);
  const revenue = rows.reduce((s, r) => s + Number(r.revenue_pkr), 0);
  const booked = rows.reduce((s, r) => s + r.booked_minutes, 0);
  const available = rows.reduce((s, r) => s + r.available_minutes, 0);
  const occupancy = available > 0 ? (booked / available) * 100 : 0;

  return {
    bookings,
    revenue,
    occupancy,
    booked,
    available,
  };
}
