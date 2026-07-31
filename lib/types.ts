export type SportType =
  | "football"
  | "cricket"
  | "padel"
  | "tennis"
  | "badminton"
  | "other";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled_by_player"
  | "cancelled_by_owner"
  | "completed"
  | "no_show";

export type BookingSource = "player_app" | "owner_manual";

export type VerificationStatus = "pending" | "verified" | "rejected";

export type SlotMinutes = 30 | 60;

export const SPORT_OPTIONS: { value: SportType; label: string }[] = [
  { value: "football", label: "Football" },
  { value: "cricket", label: "Cricket" },
  { value: "padel", label: "Padel" },
  { value: "tennis", label: "Tennis" },
  { value: "badminton", label: "Badminton" },
  { value: "other", label: "Other" },
];

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled_by_player: "Cancelled (player)",
  cancelled_by_owner: "Cancelled (owner)",
  completed: "Completed",
  no_show: "No-show",
};

export interface Field {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  address_line: string | null;
  city: string | null;
  location?: unknown;
  sports: SportType[];
  slot_minutes: SlotMinutes;
  price_per_slot: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FieldPhoto {
  id: string;
  field_id: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
}

export interface FieldWeeklySchedule {
  id: string;
  field_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface FieldScheduleException {
  id: string;
  field_id: string;
  exception_date: string;
  is_closed: boolean;
  override_start_time: string | null;
  override_end_time: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  field_id: string;
  player_id: string | null;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  price_snapshot: number;
  notes: string | null;
  source: BookingSource;
  guest_name: string | null;
  guest_phone: string | null;
  created_by_owner_id: string | null;
  created_at: string;
  updated_at: string;
  fields?: Pick<Field, "id" | "name" | "city" | "slot_minutes" | "price_per_slot"> | null;
}

export interface AvailableSlot {
  starts_at: string;
  ends_at: string;
  price: number;
}

export interface FieldAnalyticsDaily {
  field_id: string;
  day: string;
  bookings_count: number;
  cancelled_count: number;
  revenue_pkr: number;
  booked_minutes: number;
  available_minutes: number;
  occupancy_pct: number;
}

export interface OwnerProfile {
  user_id: string;
  business_name: string | null;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface UserRow {
  id: string;
  role: "player" | "owner";
  full_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface FieldSlotHold {
  id: string;
  field_id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_at: string;
}

export interface CreateOwnerBookingGuestBody {
  field_id: string;
  starts_at: string;
  ends_at: string;
  guest_name: string;
  guest_phone: string;
  notes?: string;
}

export interface CreateOwnerBookingPlayerBody {
  field_id: string;
  starts_at: string;
  ends_at: string;
  player_phone: string;
  notes?: string;
}

export type CreateOwnerBookingBody =
  | CreateOwnerBookingGuestBody
  | CreateOwnerBookingPlayerBody;

export interface CreateFieldInput {
  name: string;
  description?: string | null;
  address_line?: string | null;
  city?: string | null;
  lat: number;
  lng: number;
  sports: SportType[];
  slot_minutes: SlotMinutes;
  price_per_slot: number;
  is_active?: boolean;
}

export interface UpdateFieldInput {
  name?: string;
  description?: string | null;
  address_line?: string | null;
  city?: string | null;
  lat?: number;
  lng?: number;
  sports?: SportType[];
  slot_minutes?: SlotMinutes;
  price_per_slot?: number;
  is_active?: boolean;
}
