"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const modes = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "inline-flex h-9 w-[108px] rounded-xl bg-inset shadow-neu-inset",
          className,
        )}
        aria-hidden
      />
    );
  }

  return (
    <div
      role="group"
      aria-label="Theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-xl bg-inset p-1 shadow-neu-inset",
        className,
      )}
    >
      {modes.map(({ value, icon: Icon, label }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={() => setTheme(value)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
              active
                ? "bg-raised text-court shadow-neu-sm"
                : "text-muted hover:text-ink",
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
          </button>
        );
      })}
    </div>
  );
}
