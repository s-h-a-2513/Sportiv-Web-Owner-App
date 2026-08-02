"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  deleteFieldPhoto,
  fieldPhotoPublicUrl,
  formatSports,
  getField,
  listFieldPhotos,
  updateField,
  uploadFieldPhoto,
} from "@/lib/api/fields";
import { parseLatLng } from "@/lib/location";
import { LocationMapPicker } from "@/components/location-map-picker";
import { SPORT_OPTIONS, type Field, type FieldPhoto, type SportType } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  address_line: z.string().optional(),
  city: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  sports: z.array(z.string()).min(1, "Select at least one sport"),
  slot_minutes: z.coerce.number(),
  price_per_slot: z.coerce.number().min(0),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function FieldDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [field, setField] = useState<Field | null>(null);
  const [photos, setPhotos] = useState<FieldPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const selectedSports = watch("sports") ?? [];
  const lat = watch("lat");
  const lng = watch("lng");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [f, p] = await Promise.all([getField(id), listFieldPhotos(id)]);
      if (!f) {
        setError("Field not found");
        setField(null);
        return;
      }
      setField(f);
      setPhotos(p);
      const coords = parseLatLng(f.location) ?? { lat: 31.5204, lng: 74.3587 };
      reset({
        name: f.name,
        description: f.description ?? "",
        address_line: f.address_line ?? "",
        city: f.city ?? "",
        lat: coords.lat,
        lng: coords.lng,
        sports: f.sports,
        slot_minutes: f.slot_minutes,
        price_per_slot: Number(f.price_per_slot),
        is_active: f.is_active,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load field");
    } finally {
      setLoading(false);
    }
  }, [id, reset]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleSport(sport: SportType) {
    const next = selectedSports.includes(sport)
      ? selectedSports.filter((s) => s !== sport)
      : [...selectedSports, sport];
    setValue("sports", next, { shouldValidate: true });
  }

  async function onSubmit(values: FormValues) {
    setMessage(null);
    setError(null);
    if (values.slot_minutes !== 30 && values.slot_minutes !== 60) {
      setError("Slot length must be 30 or 60 minutes");
      return;
    }
    try {
      const updated = await updateField(id, {
        name: values.name,
        description: values.description || null,
        address_line: values.address_line || null,
        city: values.city || null,
        lat: values.lat,
        lng: values.lng,
        sports: values.sports as SportType[],
        slot_minutes: values.slot_minutes,
        price_per_slot: values.price_per_slot,
        is_active: values.is_active,
      });
      setField(updated);
      setMessage("Field saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function onToggleActive() {
    if (!field) return;
    try {
      const updated = await updateField(id, { is_active: !field.is_active });
      setField(updated);
      setValue("is_active", updated.is_active);
      setMessage(updated.is_active ? "Field activated" : "Field deactivated");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function onUpload(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const photo = await uploadFieldPhoto(id, file, photos.length);
      setPhotos((prev) => [...prev, photo]);
      setMessage("Photo uploaded");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onDeletePhoto(photo: FieldPhoto) {
    try {
      await deleteFieldPhoto(photo);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (loading) {
    return (
      <>
        <AppHeader title="Field detail" />
        <PageShell>
          <p className="text-sm text-muted">Loading…</p>
        </PageShell>
      </>
    );
  }

  if (!field) {
    return (
      <>
        <AppHeader title="Field detail" />
        <PageShell>
          <SoftCard title="Not found" description={error ?? "This field does not exist."}>
            <Link href="/app/fields">
              <Button type="button" variant="secondary">
                Back to fields
              </Button>
            </Link>
          </SoftCard>
        </PageShell>
      </>
    );
  }

  return (
    <>
      <AppHeader title={field.name} description={field.city ?? "Field details"} />
      <PageShell>
        <div className="flex flex-wrap gap-3">
          <Link href={`/app/fields/${id}/schedule`}>
            <Button type="button">Manage schedule</Button>
          </Link>
          <Button type="button" variant="secondary" onClick={onToggleActive}>
            {field.is_active ? "Deactivate" : "Activate"}
          </Button>
          <Link href="/app/fields">
            <Button type="button" variant="ghost">
              Back
            </Button>
          </Link>
        </div>

        {message ? <FormMessage tone="success">{message}</FormMessage> : null}
        {error ? <FormMessage>{error}</FormMessage> : null}

        <SoftCard title="Edit field" description="Update listing details and pricing.">
          <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-xl space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} {...register("description")} />
            </div>
            <div>
              <Label htmlFor="address_line">Address</Label>
              <Input id="address_line" {...register("address_line")} />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} />
            </div>
            {typeof lat === "number" && typeof lng === "number" ? (
              <LocationMapPicker
                value={{ lat, lng }}
                onChange={({ lat: nextLat, lng: nextLng }) => {
                  setValue("lat", nextLat, { shouldValidate: true, shouldDirty: true });
                  setValue("lng", nextLng, { shouldValidate: true, shouldDirty: true });
                }}
                error={errors.lat?.message || errors.lng?.message}
              />
            ) : null}
            <div>
              <Label>Sports</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {SPORT_OPTIONS.map((opt) => {
                  const on = selectedSports.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleSport(opt.value)}
                      className={
                        on
                          ? "neu-btn rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                          : "neu-tab rounded-full px-3 py-1.5 text-xs font-medium"
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <FieldError message={errors.sports?.message} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="slot_minutes">Slot length</Label>
                <Select id="slot_minutes" {...register("slot_minutes")}>
                  <option value={60}>60 minutes</option>
                  <option value={30}>30 minutes</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="price_per_slot">Price per slot (PKR)</Label>
                <Input id="price_per_slot" type="number" min={0} {...register("price_per_slot")} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" {...register("is_active")} />
              Active
            </label>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </SoftCard>

        <SoftCard title="Photos" description="Uploaded to the field-photos bucket.">
          <div className="flex flex-wrap gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="neu-inset relative w-32 overflow-hidden rounded-[20px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fieldPhotoPublicUrl(photo.storage_path)}
                  alt=""
                  className="h-24 w-full object-cover"
                />
                <button
                  type="button"
                  className="absolute inset-x-0 bottom-0 bg-ink/70 py-1 text-xs text-white"
                  onClick={() => void onDeletePhoto(photo)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Label htmlFor="photo">Upload photo</Label>
            <Input
              id="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={(e) => void onUpload(e.target.files)}
            />
          </div>
        </SoftCard>

        <SoftCard title="Listing preview" description="How players will see this field.">
          <div className="neu-inset rounded-[20px] p-4">
            <div className="flex gap-4">
              {photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fieldPhotoPublicUrl(photos[0].storage_path)}
                  alt=""
                  className="h-24 w-32 rounded-xl object-cover"
                />
              ) : (
                <div className="grid h-24 w-32 place-items-center rounded-xl bg-raised text-xs text-muted">
                  No photo
                </div>
              )}
              <div>
                <p className="font-display text-lg font-semibold text-ink">{field.name}</p>
                <p className="text-sm text-muted">
                  {formatSports(field.sports)}
                  {field.city ? ` · ${field.city}` : ""}
                </p>
                <p className="mt-2 text-sm font-medium text-ink">
                  PKR {Number(field.price_per_slot).toLocaleString()} / {field.slot_minutes} min
                </p>
                <p className="mt-1 text-xs text-muted">
                  {field.is_active ? "Listed" : "Hidden (inactive)"}
                </p>
                {field.description ? (
                  <p className="mt-2 line-clamp-3 text-sm text-muted">{field.description}</p>
                ) : null}
              </div>
            </div>
          </div>
        </SoftCard>
      </PageShell>
    </>
  );
}
