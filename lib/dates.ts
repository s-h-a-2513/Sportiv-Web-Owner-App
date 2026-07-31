import { addDays, format, parseISO, startOfDay } from "date-fns";

export const TZ = "Asia/Karachi";

/** ISO date (yyyy-MM-dd) in Asia/Karachi for an instant. */
export function karachiDateString(date: Date | string = new Date()): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function formatKarachi(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return new Intl.DateTimeFormat("en-PK", { timeZone: TZ, ...options }).format(d);
}

export function formatKarachiTime(date: Date | string): string {
  return formatKarachi(date, { hour: "numeric", minute: "2-digit" });
}

function karachiYmdParts(date: Date): { y: number; m: number; d: number; dow: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = get("weekday");
  const dowMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    y: Number(get("year")),
    m: Number(get("month")),
    d: Number(get("day")),
    dow: dowMap[weekday] ?? 0,
  };
}

/** Approximate UTC instant for Karachi local midnight on a calendar day. */
export function karachiMidnightUtc(isoDate: string): Date {
  // Asia/Karachi is UTC+5 year-round (no DST).
  return parseISO(`${isoDate}T00:00:00+05:00`);
}

export function karachiEndOfDayUtc(isoDate: string): Date {
  return parseISO(`${isoDate}T23:59:59.999+05:00`);
}

/** Week starting Sunday (matches Postgres DOW) in Karachi local calendar. */
export function weekRangeContaining(date: Date = new Date()): {
  weekStartDate: string;
  weekEndDate: string;
  fromIso: string;
  toIso: string;
} {
  const { y, m, d, dow } = karachiYmdParts(date);
  const todayLocal = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const weekStartDate = format(addDays(parseISO(`${todayLocal}T12:00:00`), -dow), "yyyy-MM-dd");
  const weekEndDate = format(addDays(parseISO(`${weekStartDate}T12:00:00`), 6), "yyyy-MM-dd");

  return {
    weekStartDate,
    weekEndDate,
    fromIso: karachiMidnightUtc(weekStartDate).toISOString(),
    toIso: karachiEndOfDayUtc(weekEndDate).toISOString(),
  };
}

export function addDaysIsoDate(isoDate: string, days: number): string {
  return format(addDays(parseISO(`${isoDate}T12:00:00`), days), "yyyy-MM-dd");
}

export function todayKarachi(): string {
  return karachiDateString(new Date());
}

export function startOfTodayKarachiIso(): string {
  return karachiMidnightUtc(todayKarachi()).toISOString();
}

export function eachDayInclusive(from: string, to: string): string[] {
  const days: string[] = [];
  let cur = from;
  while (cur <= to) {
    days.push(cur);
    cur = addDaysIsoDate(cur, 1);
  }
  return days;
}

export { startOfDay };
