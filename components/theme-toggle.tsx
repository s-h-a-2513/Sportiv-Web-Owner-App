"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const modes = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Migrate any previously saved "system" preference to an explicit light/dark.
  useEffect(() => {
    if (!mounted) return;
    if (theme === "system") {
      setTheme(resolvedTheme === "dark" ? "dark" : "light");
    }
  }, [mounted, theme, resolvedTheme, setTheme]);

  if (!mounted) {
    return (
      <div
        className={cn("neu-theme-toggle inline-flex h-9 w-[72px] rounded-full", className)}
        aria-hidden
      />
    );
  }

  const activeTheme = theme === "dark" || resolvedTheme === "dark" ? "dark" : "light";

  return (
    <div
      role="group"
      aria-label="Theme"
      className={cn(
        "neu-theme-toggle inline-flex items-center gap-0.5 rounded-full p-1",
        className,
      )}
    >
      {modes.map(({ value, icon: Icon, label }) => {
        const active = activeTheme === value;
        return (
          <button
            key={value}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={() => setTheme(value)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
              active
                ? "neu-theme-knob neu-theme-knob-ready text-court"
                : "bg-transparent text-muted hover:text-ink",
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
          </button>
        );
      })}
    </div>
  );
}
