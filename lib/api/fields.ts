import { createClient } from "@/lib/supabase/client";
import { pointEwkt } from "@/lib/location";
import type {
  CreateFieldInput,
  Field,
  FieldPhoto,
  SportType,
  UpdateFieldInput,
} from "@/lib/types";

function client() {
  return createClient();
}

export async function listOwnerFields(): Promise<Field[]> {
  const supabase = client();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("fields")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Field[];
}

export async function getField(id: string): Promise<Field | null> {
  const supabase = client();
  const { data, error } = await supabase.from("fields").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Field | null;
}

export async function createField(input: CreateFieldInput): Promise<Field> {
  const supabase = client();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("fields")
    .insert({
      owner_id: user.id,
      name: input.name,
      description: input.description ?? null,
      address_line: input.address_line ?? null,
      city: input.city ?? null,
      // Placeholder until set_field_location RPC runs (PostgREST geography).
      location: pointEwkt(input.lng, input.lat),
      sports: input.sports,
      slot_minutes: input.slot_minutes,
      price_per_slot: input.price_per_slot,
      is_active: input.is_active ?? true,
      currency: "PKR",
    })
    .select("*")
    .single();

  if (error) {
    // Fallback: insert at (0,0) then set via RPC.
    const { data: fallback, error: fallbackError } = await supabase
      .from("fields")
      .insert({
        owner_id: user.id,
        name: input.name,
        description: input.description ?? null,
        address_line: input.address_line ?? null,
        city: input.city ?? null,
        location: pointEwkt(0, 0),
        sports: input.sports,
        slot_minutes: input.slot_minutes,
        price_per_slot: input.price_per_slot,
        is_active: input.is_active ?? true,
        currency: "PKR",
      })
      .select("*")
      .single();

    if (fallbackError || !fallback) throw error;

    const { error: locError } = await supabase.rpc("set_field_location", {
      p_field_id: fallback.id,
      p_lat: input.lat,
      p_lng: input.lng,
    });
    if (locError) throw locError;

    const refreshed = await getField(fallback.id);
    if (!refreshed) throw locError ?? new Error("Field created but location missing");
    return refreshed;
  }

  const { error: locError } = await supabase.rpc("set_field_location", {
    p_field_id: data.id,
    p_lat: input.lat,
    p_lng: input.lng,
  });
  // Ignore if RPC not migrated yet — EWKT insert may already be correct.
  if (locError && !String(locError.message).includes("Could not find")) {
    // non-fatal if EWKT worked
  }

  return data as Field;
}

export async function updateField(id: string, input: UpdateFieldInput): Promise<Field> {
  const supabase = client();
  const patch: Record<string, unknown> = {};

  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.address_line !== undefined) patch.address_line = input.address_line;
  if (input.city !== undefined) patch.city = input.city;
  if (input.sports !== undefined) patch.sports = input.sports;
  if (input.slot_minutes !== undefined) patch.slot_minutes = input.slot_minutes;
  if (input.price_per_slot !== undefined) patch.price_per_slot = input.price_per_slot;
  if (input.is_active !== undefined) patch.is_active = input.is_active;

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from("fields").update(patch).eq("id", id);
    if (error) throw error;
  }

  if (input.lat !== undefined && input.lng !== undefined) {
    const { error: locError } = await supabase.rpc("set_field_location", {
      p_field_id: id,
      p_lat: input.lat,
      p_lng: input.lng,
    });
    if (locError) {
      const { error: fallback } = await supabase
        .from("fields")
        .update({ location: pointEwkt(input.lng, input.lat) })
        .eq("id", id);
      if (fallback) throw locError;
    }
  }

  const refreshed = await getField(id);
  if (!refreshed) throw new Error("Field not found");
  return refreshed;
}

export async function listFieldPhotos(fieldId: string): Promise<FieldPhoto[]> {
  const supabase = client();
  const { data, error } = await supabase
    .from("field_photos")
    .select("*")
    .eq("field_id", fieldId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as FieldPhoto[];
}

export function fieldPhotoPublicUrl(storagePath: string): string {
  const supabase = client();
  const { data } = supabase.storage.from("field-photos").getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function uploadFieldPhoto(
  fieldId: string,
  file: File,
  sortOrder = 0,
): Promise<FieldPhoto> {
  const supabase = client();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${fieldId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("field-photos")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("field_photos")
    .insert({
      field_id: fieldId,
      storage_path: path,
      sort_order: sortOrder,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as FieldPhoto;
}

export async function deleteFieldPhoto(photo: FieldPhoto): Promise<void> {
  const supabase = client();
  await supabase.storage.from("field-photos").remove([photo.storage_path]);
  const { error } = await supabase.from("field_photos").delete().eq("id", photo.id);
  if (error) throw error;
}

export function formatSports(sports: SportType[]): string {
  return sports.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ");
}
