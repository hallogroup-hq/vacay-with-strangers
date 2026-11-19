export type BookingState = 'coming_soon' | 'open' | 'closed' | 'completed' | 'cancelled';
export type EffectiveStatus = BookingState | 'fully_booked';

export type PackageType = 'full' | 'land_only';
export type RoomType = 'sharing' | 'private' | 'single';

export interface Destination {
  id: string;
  name: string;
  slug: string;
  country_code: string;
  summary: string | null;
  is_active: boolean;
  sort_index: number;
}

export interface TripSeries {
  id: string;
  destination_id: string;
  name: string;
  slug: string;
  season: string | null;
  description: string | null;
  publish_state: 'draft' | 'published' | 'archived';
}

export interface Batch {
  id: string;
  trip_series_id: string;
  batch_code: string;
  slug: string;
  departure_date: string;
  return_date: string;
  departure_timezone: string;
  capacity: number;
  booking_state: BookingState;
  published_version_id: string | null;
  show_exact_seats: boolean;
  limited_seats_threshold: number;
}

export interface BatchContentVersion {
  id: string;
  batch_id: string;
  revision_no: number;
  status: 'draft' | 'published' | 'archived';
  hero_media_id: string | null;
  title: string;
  lead: string | null;
  route_summary: string | null;
  departure_meeting_info: string | null;
  published_at: string | null;
}

export interface ItineraryActivity {
  id: string;
  itinerary_day_id: string;
  sort_index: number;
  start_local_time: string | null;
  end_local_time: string | null;
  activity_type: 'general' | 'transport' | 'meal' | 'highlight' | 'optional' | 'flight';
  title: string;
  details: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  is_optional: boolean;
  media_id: string | null;
  local_timezone: string;
}

export interface ItineraryDay {
  id: string;
  version_id: string;
  day_no: number;
  local_date: string | null;
  title: string;
  description: string | null;
  highlight_media_id: string | null;
  activities?: ItineraryActivity[];
}

export interface PriceOption {
  id: string;
  version_id: string;
  sku: string;
  display_name: string;
  package_type: PackageType;
  room_type: RoomType;
  list_price_idr: number;
  promo_price_idr: number | null;
  promo_start_at: string | null;
  promo_end_at: string | null;
  dp_per_traveler_idr: number;
  included_json: string[];
  excluded_json: string[];
  land_meeting_info: string | null;
  is_enabled: boolean;
  effective_price_idr?: number;
  is_promo_active?: boolean;
}

export interface InstallmentPlanLine {
  id: string;
  installment_plan_id: string;
  period_month: string;
  amount_idr: number;
  sort_index: number;
}

export interface InstallmentPlan {
  id: string;
  price_option_id: string;
  name: string;
  is_official: boolean;
  booking_window_start: string | null;
  booking_window_end: string | null;
  dp_idr: number;
  terms_notes: string | null;
  is_enabled: boolean;
  lines?: InstallmentPlanLine[];
}

export interface Booking {
  id: string;
  batch_id: string;
  booking_code: string;
  primary_contact_name: string;
  primary_contact_phone: string;
  primary_contact_email: string | null;
  status: 'inquiry' | 'pending' | 'confirmed' | 'partially_cancelled' | 'cancelled' | 'completed';
  source: 'whatsapp' | 'referral' | 'manual';
  notes_private: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingTraveler {
  id: string;
  booking_id: string;
  full_name: string;
  contact_phone: string | null;
  status: 'active' | 'cancelled' | 'rescheduled';
  notes_private: string | null;
  created_at: string;
}

export interface BookingItem {
  id: string;
  booking_id: string;
  booking_traveler_id: string;
  price_option_id: string;
  offer_snapshot_json: any;
  agreed_price_idr: number;
  agreed_dp_idr: number;
  effective_policy_version_id: string | null;
  status: 'active' | 'cancelled' | 'rescheduled';
  agreed_at: string;
}

export interface SeatAllocation {
  id: string;
  batch_id: string;
  booking_item_id: string;
  assigned_at: string;
  assigned_by_admin: string | null;
  released_at: string | null;
  released_by_admin: string | null;
  reason: string | null;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount_idr: number;
  status: 'pending_verification' | 'verified' | 'rejected' | 'reversed';
  payment_channel: 'bank_transfer' | 'qris' | 'cash' | 'other';
  external_reference: string | null;
  received_at: string;
  verified_at: string | null;
  verified_by_admin: string | null;
  notes: string | null;
}

export interface LedgerEntry {
  id: string;
  booking_id: string;
  booking_item_id: string | null;
  direction: 'debit' | 'credit';
  amount_idr: number;
  event_type: string;
  source_kind: string;
  source_id: string;
  reversal_of_entry_id: string | null;
  posted_at: string;
  posted_by: string | null;
}

export interface InstallmentSimulationMonth {
  month_name: string;
  month_date: string;
  amount_idr: number;
}

export interface InstallmentSimulationResult {
  is_eligible: boolean;
  reason?: string;
  h30_date: string;
  departure_date: string;
  price_per_traveler_idr: number;
  headcount: number;
  total_price_idr: number;
  dp_per_traveler_idr: number;
  total_dp_idr: number;
  remaining_balance_idr: number;
  tenor_months: number;
  monthly_amount_idr: number;
  schedule: InstallmentSimulationMonth[];
  is_official: boolean;
}
