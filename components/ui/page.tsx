import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-1 flex-col gap-6 px-6 py-8 md:px-10 md:py-10", className)}>
      {children}
    </div>
  );
}

export function SoftCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("neu-raised rounded-[28px] p-6 md:p-8", className)}>
      <h2 className="font-display text-lg font-bold tracking-tight text-ink">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

/** @deprecated Prefer SoftCard */
export function PlaceholderCard(props: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return <SoftCard {...props} />;
}

export function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="neu-inset rounded-[20px] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
