import { cn } from "@/lib/utils";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-semibold text-ink", className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "neu-input w-full rounded-[20px] px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "neu-input w-full rounded-[20px] px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70",
        className,
      )}
      {...props}
    />
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "neu-btn",
        variant === "secondary" && "neu-raised-sm text-ink hover:brightness-[1.02]",
        variant === "ghost" && "text-muted hover:text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{message}</p>;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "neu-input w-full rounded-[20px] px-3.5 py-2.5 text-sm text-ink outline-none transition",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function FormMessage({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
}) {
  if (!children) return null;
  return (
    <p
      className={cn(
        "neu-inset rounded-[20px] px-3 py-2 text-sm",
        tone === "error" && "text-red-600 dark:text-red-400",
        tone === "success" && "text-court",
        tone === "info" && "text-muted",
      )}
    >
      {children}
    </p>
  );
}
