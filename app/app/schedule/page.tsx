"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { PageShell, SoftCard } from "@/components/ui/page";
import { Button } from "@/components/ui/form";
import { listOwnerFields } from "@/lib/api/fields";
import { listWeeklySchedules } from "@/lib/api/schedules";
import type { Field } from "@/lib/types";

export default function SchedulePage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [hoursCount, setHoursCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await listOwnerFields();
        if (cancelled) return;
        setFields(rows);
        const counts: Record<string, number> = {};
        await Promise.all(
          rows.map(async (f) => {
            const weekly = await listWeeklySchedules(f.id);
            counts[f.id] = weekly.length;
          }),
        );
        if (!cancelled) setHoursCount(counts);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <AppHeader
        title="Schedule"
        description="Cross-field availability and opening hours."
      />
      <PageShell>
        <SoftCard
          title="All fields"
          description="Open a field to edit weekly hours, exceptions, and holds."
        >
          {loading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : fields.length === 0 ? (
            <div className="text-center">
              <p className="text-sm text-muted">No fields yet.</p>
              <Link href="/app/fields/new" className="mt-3 inline-block">
                <Button type="button">Add a field</Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-ink/5 rounded-2xl bg-inset shadow-neu-inset">
              {fields.map((f) => (
                <li key={f.id}>
                  <Link
                    href={`/app/fields/${f.id}/schedule`}
                    className="flex items-center justify-between px-4 py-3 text-sm hover:bg-raised/50"
                  >
                    <span className="font-medium text-ink">{f.name}</span>
                    <span className="text-muted">
                      {(hoursCount[f.id] ?? 0) === 0
                        ? "No hours set"
                        : `${hoursCount[f.id]} window${hoursCount[f.id] === 1 ? "" : "s"}`}
                    </span>
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
