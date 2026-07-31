import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsPanel } from "@/components/notifications-panel";

export function AppHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="flex items-start justify-between gap-4 px-6 py-4 md:px-10">
      <div className="neu-header flex min-w-0 flex-1 items-start justify-between gap-4 rounded-full px-5 py-3">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold tracking-tight text-ink">{title}</h1>
          {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <NotificationsPanel />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
