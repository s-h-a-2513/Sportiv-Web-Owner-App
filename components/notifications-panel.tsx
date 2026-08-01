"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatKarachiTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

type Notif = {
  id: string;
  at: string;
  title: string;
  bookingId: string;
  kind: string;
};

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("owner-booking-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        (payload) => {
          const row = (payload.new ?? payload.old) as {
            id?: string;
            status?: string;
            starts_at?: string;
            guest_name?: string | null;
          } | null;
          if (!row?.id) return;

          const kind = payload.eventType;
          const title =
            kind === "INSERT"
              ? `New booking${row.guest_name ? ` · ${row.guest_name}` : ""}`
              : kind === "UPDATE"
                ? `Booking updated · ${row.status ?? ""}`
                : "Booking removed";

          const item: Notif = {
            id: `${row.id}-${Date.now()}`,
            at: new Date().toISOString(),
            title,
            bookingId: row.id,
            kind,
          };

          setItems((prev) => [item, ...prev].slice(0, 20));
          setToast(title);
          window.setTimeout(() => setToast(null), 4000);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="neu-raised-sm relative rounded-full p-2 text-muted hover:text-ink"
      >
        <Bell className="h-4 w-4" />
        {items.length > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-court" />
        ) : null}
      </button>

      {toast ? (
        <div className="neu-raised fixed bottom-4 right-4 z-50 max-w-sm rounded-[20px] px-4 py-3 text-sm text-ink">
          {toast}
        </div>
      ) : null}

      {open ? (
        <div className={cn("neu-raised absolute right-0 z-40 mt-2 w-80 rounded-[28px] p-3")}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Recent booking events
          </p>
          {items.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted">No events yet this session.</p>
          ) : (
            <ul className="max-h-72 space-y-1 overflow-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/app/bookings/${item.bookingId}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-[16px] px-3 py-2 text-sm no-underline hover:neu-inset hover:no-underline"
                  >
                    <p className="font-medium text-ink">{item.title}</p>
                    <p className="text-xs text-muted">{formatKarachiTime(item.at)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
