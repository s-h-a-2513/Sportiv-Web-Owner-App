"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { createField } from "@/lib/api/fields";
import { LocationMapPicker } from "@/components/location-map-picker";
import { toUserMessage } from "@/lib/errors";
import { SPORT_OPTIONS, type SportType } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  address_line: z.string().optional(),
  city: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  sports: z.array(z.string()).min(1, "Select at least one sport"),
  slot_minutes: z.coerce.number(),
  price_per_slot: z.coerce.number().min(0, "Price must be ≥ 0"),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function NewFieldPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      address_line: "",
      city: "",
      lat: 31.5204,
      lng: 74.3587,
      sports: ["football"],
      slot_minutes: 60,
      price_per_slot: 0,
      is_active: true,
    },
  });

  const selectedSports = watch("sports") ?? [];
  const lat = watch("lat");
  const lng = watch("lng");

  function toggleSport(sport: SportType) {
    const next = selectedSports.includes(sport)
      ? selectedSports.filter((s) => s !== sport)
      : [...selectedSports, sport];
    setValue("sports", next, { shouldValidate: true });
  }

  async function onSubmit(values: FormValues) {
    setFormError(null);
    if (values.slot_minutes !== 30 && values.slot_minutes !== 60) {
      setFormError("Slot length must be 30 or 60 minutes");
      return;
    }
    try {
      const field = await createField({
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
      router.replace(`/app/fields/${field.id}`);
    } catch (e) {
      setFormError(toUserMessage(e, "Failed to create field"));
    }
  }

  return (
    <>
      <AppHeader title="New field" description="Add a court or pitch to your inventory." />
      <PageShell>
        <SoftCard title="Field details" description="Drop a map pin for the court. Currency is PKR.">
          <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-xl space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="e.g. Pitch A" {...register("name")} />
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
              <Input id="city" placeholder="Lahore" {...register("city")} />
            </div>
            <LocationMapPicker
              value={{ lat, lng }}
              onChange={({ lat: nextLat, lng: nextLng }) => {
                setValue("lat", nextLat, { shouldValidate: true, shouldDirty: true });
                setValue("lng", nextLng, { shouldValidate: true, shouldDirty: true });
              }}
              error={errors.lat?.message || errors.lng?.message}
            />
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
                <FieldError message={errors.slot_minutes?.message} />
              </div>
              <div>
                <Label htmlFor="price_per_slot">Price per slot (PKR)</Label>
                <Input
                  id="price_per_slot"
                  type="number"
                  min={0}
                  step="1"
                  {...register("price_per_slot")}
                />
                <FieldError message={errors.price_per_slot?.message} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" className="rounded" {...register("is_active")} />
              Active (visible for booking)
            </label>

            {formError ? <FormMessage>{formError}</FormMessage> : null}

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save field"}
              </Button>
              <Link href="/app/fields">
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
