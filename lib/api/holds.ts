import { createClient } from "@/lib/supabase/client";
import type { FieldSlotHold } from "@/lib/types";

function client() {
  return createClient();
}

const HOLDS_MISSING =
  "Slot holds are not enabled yet. Apply the field_slot_holds migration, then try again.";

function isMissingTable(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    msg.includes("field_slot_holds") ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
}

export async function listFieldHolds(
  fieldId: string,
  fromIso: string,
  toIso: string,
): Promise<{ holds: FieldSlotHold[]; available: boolean; error?: string }> {
  const supabase = client();
  const { data, error } = await supabase
    .from("field_slot_holds")
    .select("*")
    .eq("field_id", fieldId)
    .lt("starts_at", toIso)
    .gt("ends_at", fromIso)
    .order("starts_at", { ascending: true });

  if (error) {
    if (isMissingTable(error)) {
      return { holds: [], available: false, error: HOLDS_MISSING };
    }
    throw error;
  }

  return { holds: (data ?? []) as FieldSlotHold[], available: true };
}

export async function createFieldHold(input: {
  field_id: string;
  starts_at: string;
  ends_at: string;
  reason?: string | null;
}): Promise<FieldSlotHold> {
  const supabase = client();
  const { data, error } = await supabase
    .from("field_slot_holds")
    .insert({
      field_id: input.field_id,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      reason: input.reason ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if (isMissingTable(error)) {
      throw new Error(HOLDS_MISSING);
    }
    throw error;
  }

  return data as FieldSlotHold;
}

export async function deleteFieldHold(id: string): Promise<void> {
  const supabase = client();
  const { error } = await supabase.from("field_slot_holds").delete().eq("id", id);
  if (error) {
    if (isMissingTable(error)) {
      throw new Error(HOLDS_MISSING);
    }
    throw error;
  }
}
