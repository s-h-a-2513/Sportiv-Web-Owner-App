"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { PageShell, SoftCard, StatChip } from "@/components/ui/page";
import { Button, FormMessage } from "@/components/ui/form";
import { formatSports, listOwnerFields } from "@/lib/api/fields";
import { toUserMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";

export default function FieldsPage() {
  const { data: fields = [], isLoading, error } = useQuery({
    queryKey: queryKeys.ownerFields,
    queryFn: listOwnerFields,
  });

  const activeCount = fields.filter((f) => f.is_active).length;
  const errorMessage = error
    ? toUserMessage(error, "Failed to load fields")
    : null;

  return (
    <>
      <AppHeader title="Fields" description="Courts and venues you manage." />
      <PageShell>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
            <StatChip label="Total fields" value={isLoading ? "…" : String(fields.length)} />
            <StatChip label="Active" value={isLoading ? "…" : String(activeCount)} />
          </div>
          <Link href="/app/fields/new">
            <Button type="button">New field</Button>
          </Link>
        </div>

        <SoftCard
          title="Your fields"
          description="Tap a field to edit details, photos, and schedule."
        >
          {isLoading ? (
            <p className="text-sm text-muted">Loading fields…</p>
          ) : errorMessage ? (
            <FormMessage>{errorMessage}</FormMessage>
          ) : fields.length === 0 ? (
            <div className="neu-inset rounded-[20px] px-4 py-8 text-center">
              <p className="font-semibold text-ink">No fields yet</p>
              <p className="mt-1 text-sm text-muted">
                Add your first court to start taking bookings.
              </p>
              <Link href="/app/fields/new" className="mt-4 inline-block no-underline hover:no-underline">
                <Button type="button">Add a field</Button>
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {fields.map((field) => (
                <li key={field.id}>
                  <Link
                    href={`/app/fields/${field.id}`}
                    className="neu-raised-sm flex items-center justify-between gap-3 rounded-[20px] px-4 py-3 text-sm no-underline hover:no-underline"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{field.name}</p>
                      <p className="truncate text-muted">
                        {formatSports(field.sports)}
                        {field.city ? ` · ${field.city}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-medium text-ink">
                        PKR {Number(field.price_per_slot).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted">
                        {field.is_active ? "Active" : "Inactive"} · {field.slot_minutes}m
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SoftCard>
      </PageShell>
    </>
  );
}
