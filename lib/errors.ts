/**
 * Map unknown errors to safe user-facing copy.
 * Raw upstream messages are only forwarded in development.
 */
export function toUserMessage(err: unknown, fallback: string): string {
  if (process.env.NODE_ENV === "development" && err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}
