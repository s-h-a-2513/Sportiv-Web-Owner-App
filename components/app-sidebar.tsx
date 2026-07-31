"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  MapPinned,
  Settings2,
  Clock3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/app/fields", label: "Fields", icon: MapPinned },
  { href: "/app/schedule", label: "Schedule", icon: Clock3 },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/account", label: "Account", icon: Settings2 },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-ink/5 bg-raised">
      <div className="px-5 py-6">
        <Link href="/app" className="font-display text-xl font-semibold tracking-tight text-ink">
          Sportiv
          <span className="text-court">.</span>
        </Link>
        <p className="mt-1 text-xs text-muted">Owner dashboard</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 pb-6">
        {navItems.map(({ href, label, icon: Icon, ...rest }) => {
          const exact = "exact" in rest && rest.exact;
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-inset text-court shadow-neu-inset"
                  : "text-muted hover:bg-inset/60 hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2.1} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
