/** Shared React Query keys for owner-web hot paths. */
export const queryKeys = {
  ownerFields: ["owner-fields"] as const,
  ownerAccount: ["owner-account"] as const,
  overviewChecklist: (fieldIds: string[]) =>
    ["overview-checklist", ...fieldIds] as const,
  bookingsRange: (opts: {
    fromIso: string;
    toIso: string;
    fieldIds: string[];
    statuses?: string;
    search?: string;
  }) =>
    [
      "bookings-range",
      opts.fromIso,
      opts.toIso,
      opts.fieldIds.join(","),
      opts.statuses ?? "",
      opts.search ?? "",
    ] as const,
  analytics: (fieldIds: string[], from: string, to: string) =>
    ["analytics", fieldIds.join(","), from, to] as const,
  fieldHolds: (fieldId: string, fromIso: string, toIso: string) =>
    ["field-holds", fieldId, fromIso, toIso] as const,
};
