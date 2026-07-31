import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsPanel } from "@/components/notifications-panel";

export function AppHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-ink/5 bg-raised/70 px-6 py-4 backdrop-blur-sm">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        <NotificationsPanel />
        <ThemeToggle />
      </div>
    </header>
  );
}
