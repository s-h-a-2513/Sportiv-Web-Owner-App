import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="bg-wash-scene relative flex min-h-screen flex-col items-center justify-center px-6 py-12 md:px-10">
      <div className="absolute right-4 top-4 z-10 md:right-6 md:top-6">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <BrandMark size="lg" href="/login" className="justify-center" />
          <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
        </div>

        <div className="neu-raised rounded-[28px] p-6 md:p-8">{children}</div>

        {footer ? <div className="mt-6 text-center text-sm text-muted">{footer}</div> : null}
      </div>
    </div>
  );
}
