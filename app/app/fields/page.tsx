"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { PageShell, SoftCard, StatChip } from "@/components/ui/page";
import { Button, FormMessage } from "@/components/ui/form";
import { formatSports, listOwnerFields } from "@/lib/api/fields";
import type { Field } from "@/lib/types";

export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await listOwnerFields();
        if (!cancelled) setFields(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load fields");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeCount = fields.filter((f) => f.is_active).length;

  return (
    <>
      <AppHeader title="Fields" description="Courts and venues you manage." />
      <PageShell>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
            <StatChip label="Total fields" value={loading ? "…" : String(fields.length)} />
            <StatChip label="Active" value={loading ? "…" : String(activeCount)} />
          </div>
          <Link href="/app/fields/new">
            <Button type="button">New field</Button>
          </Link>
        </div>

        <SoftCard
          title="Your fields"
          description="Tap a field to edit details, photos, and schedule."
        >
          {loading ? (
            <p className="text-sm text-muted">Loading fields…</p>
          ) : error ? (
            <FormMessage>{error}</FormMessage>
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
