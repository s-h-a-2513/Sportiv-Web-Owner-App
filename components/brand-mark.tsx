import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { icon: 28, wordmark: "text-lg" },
  md: { icon: 34, wordmark: "text-[1.2rem]" },
  lg: { icon: 48, wordmark: "text-2xl" },
} as const;

export function BrandMark({
  size = "md",
  href = "/app",
  className,
  showWordmark = true,
}: {
  size?: keyof typeof sizes;
  href?: string | null;
  className?: string;
  showWordmark?: boolean;
}) {
  const { icon, wordmark } = sizes[size];

  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/assets/sportiv_mark.png"
        alt=""
        width={icon}
        height={icon}
        className="aspect-square object-contain"
        priority={size === "lg"}
      />
      {showWordmark ? (
        <span className={cn("font-display font-bold tracking-tight text-ink", wordmark)}>
          Sportiv
        </span>
      ) : null}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex no-underline hover:no-underline">
      {content}
    </Link>
  );
}
