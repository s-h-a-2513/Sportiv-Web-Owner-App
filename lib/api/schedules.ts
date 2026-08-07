import { createClient } from "@/lib/supabase/client";
import type {
  AvailableSlot,
  FieldScheduleException,
  FieldWeeklySchedule,
} from "@/lib/types";

function client() {
  return createClient();
}

export async function listWeeklySchedules(fieldId: string): Promise<FieldWeeklySchedule[]> {
  const supabase = client();
  const { data, error } = await supabase
    .from("field_weekly_schedules")
    .select("*")
    .eq("field_id", fieldId)
    .order("weekday", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return (data ?? []) as FieldWeeklySchedule[];
}

/** Field IDs that already have at least one weekly window. */
export async function listWeeklyScheduleFieldIds(
  fieldIds: string[],
): Promise<Set<string>> {
  const set = new Set<string>();
  if (fieldIds.length === 0) return set;

  const supabase = client();
  const { data, error } = await supabase
    .from("field_weekly_schedules")
    .select("field_id")
    .in("field_id", fieldIds);

  if (error) throw error;
  for (const row of data ?? []) {
    set.add((row as { field_id: string }).field_id);
  }
  return set;
}

export async function addWeeklySchedule(input: {
  field_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
}): Promise<FieldWeeklySchedule> {
  const supabase = client();
  const { data, error } = await supabase
    .from("field_weekly_schedules")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data as FieldWeeklySchedule;
}

export async function deleteWeeklySchedule(id: string): Promise<void> {
  const supabase = client();
  const { error } = await supabase.from("field_weekly_schedules").delete().eq("id", id);
  if (error) throw error;
}

export async function listScheduleExceptions(
  fieldId: string,
): Promise<FieldScheduleException[]> {
  const supabase = client();
  const { data, error } = await supabase
    .from("field_schedule_exceptions")
    .select("*")
    .eq("field_id", fieldId)
    .order("exception_date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as FieldScheduleException[];
}

export async function upsertScheduleException(input: {
  field_id: string;
  exception_date: string;
  is_closed: boolean;
  override_start_time?: string | null;
  override_end_time?: string | null;
}): Promise<FieldScheduleException> {
  const supabase = client();
  const { data, error } = await supabase
    .from("field_schedule_exceptions")
    .upsert(
      {
        field_id: input.field_id,
        exception_date: input.exception_date,
        is_closed: input.is_closed,
        override_start_time: input.is_closed ? null : input.override_start_time ?? null,
        override_end_time: input.is_closed ? null : input.override_end_time ?? null,
      },
      { onConflict: "field_id,exception_date" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data as FieldScheduleException;
}

export async function deleteScheduleException(id: string): Promise<void> {
  const supabase = client();
  const { error } = await supabase.from("field_schedule_exceptions").delete().eq("id", id);
  if (error) throw error;
}

export async function listAvailableSlots(
  fieldId: string,
  fromDate: string,
  toDate: string,
): Promise<AvailableSlot[]> {
  const supabase = client();
  const { data, error } = await supabase.rpc("list_available_slots", {
    p_field_id: fieldId,
    p_from_date: fromDate,
    p_to_date: toDate,
  });

  if (error) throw error;
  return (data ?? []) as AvailableSlot[];
}
