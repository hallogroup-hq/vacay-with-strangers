-- VACAY WITH STRANGERS (VWS) V1 — AUTHORITATIVE DATABASE MIGRATION
-- Compliant with VWS_ERD_v1.0.md and PostgreSQL 16+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================================
-- 1. AUTHENTICATION & SINGLE ADMIN
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role = 'owner'),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Guard single active admin per VWS PRD DEC-11 & ERD §5.1
CREATE UNIQUE INDEX IF NOT EXISTS uq_single_active_admin
    ON admin_users (role)
    WHERE is_active = true;

-- ============================================================================
-- 2. DESTINATIONS, TRIP SERIES & BATCHES
-- ============================================================================
CREATE TABLE IF NOT EXISTS destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug CITEXT NOT NULL UNIQUE,
    country_code VARCHAR(2) NOT NULL,
    summary TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trip_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    slug CITEXT NOT NULL UNIQUE,
    season TEXT,
    description TEXT,
    publish_state TEXT NOT NULL DEFAULT 'draft' CHECK (publish_state IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_series_id UUID NOT NULL REFERENCES trip_series(id) ON DELETE RESTRICT,
    batch_code TEXT NOT NULL,
    slug CITEXT NOT NULL UNIQUE,
    departure_date DATE NOT NULL,
    return_date DATE NOT NULL,
    departure_timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    capacity INT NOT NULL DEFAULT 12,
    booking_state TEXT NOT NULL DEFAULT 'coming_soon' CHECK (booking_state IN ('coming_soon', 'open', 'closed', 'completed', 'cancelled')),
    published_version_id UUID,
    show_exact_seats BOOLEAN NOT NULL DEFAULT false,
    limited_seats_threshold INT NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_batch_dates CHECK (return_date >= departure_date),
    CONSTRAINT ck_batch_capacity CHECK (capacity >= 0)
);

CREATE INDEX IF NOT EXISTS idx_batches_dates_state ON batches(departure_date, booking_state);

-- ============================================================================
-- 3. MEDIA ASSETS
-- ============================================================================
CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_key TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL,
    width INT,
    height INT,
    alt_text TEXT,
    attribution TEXT,
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
    consent_verified BOOLEAN NOT NULL DEFAULT false,
    consent_reference TEXT,
    uploaded_by_admin UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. BATCH CONTENT REVISIONS & EDITORIAL
-- ============================================================================
CREATE TABLE IF NOT EXISTS batch_content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    revision_no INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    hero_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    lead TEXT,
    route_summary TEXT,
    departure_meeting_info TEXT,
    published_at TIMESTAMPTZ,
    created_by_admin UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_batch_revision UNIQUE (batch_id, revision_no)
);

-- Link batches.published_version_id FK
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_batches_published_version'
    ) THEN
        ALTER TABLE batches
            ADD CONSTRAINT fk_batches_published_version
            FOREIGN KEY (published_version_id)
            REFERENCES batch_content_versions(id)
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS itinerary_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES batch_content_versions(id) ON DELETE CASCADE,
    day_no INT NOT NULL,
    local_date DATE,
    title TEXT NOT NULL,
    description TEXT,
    highlight_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_itinerary_day UNIQUE (version_id, day_no)
);

CREATE TABLE IF NOT EXISTS itinerary_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_day_id UUID NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
    sort_index INT NOT NULL DEFAULT 0,
    start_local_time TEXT,
    end_local_time TEXT,
    activity_type TEXT NOT NULL DEFAULT 'general' CHECK (activity_type IN ('general', 'transport', 'meal', 'highlight', 'optional', 'flight')),
    title TEXT NOT NULL,
    details TEXT,
    location_name TEXT,
    location_lat NUMERIC(9,6),
    location_lng NUMERIC(9,6),
    is_optional BOOLEAN NOT NULL DEFAULT false,
    media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
    local_timezone TEXT NOT NULL DEFAULT 'Asia/Tokyo',
    CONSTRAINT uq_activity_sort UNIQUE (itinerary_day_id, sort_index)
);

CREATE TABLE IF NOT EXISTS price_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES batch_content_versions(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    display_name TEXT NOT NULL,
    package_type TEXT NOT NULL CHECK (package_type IN ('full', 'land_only')),
    room_type TEXT NOT NULL DEFAULT 'sharing' CHECK (room_type IN ('sharing', 'private', 'single')),
    list_price_idr BIGINT NOT NULL,
    promo_price_idr BIGINT,
    promo_start_at TIMESTAMPTZ,
    promo_end_at TIMESTAMPTZ,
    dp_per_traveler_idr BIGINT NOT NULL,
    included_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    excluded_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    land_meeting_info TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT uq_version_sku UNIQUE (version_id, sku),
    CONSTRAINT ck_offer_price CHECK (list_price_idr > 0),
    CONSTRAINT ck_offer_dp CHECK (dp_per_traveler_idr >= 0 AND dp_per_traveler_idr <= list_price_idr),
    CONSTRAINT ck_offer_promo CHECK (
        promo_price_idr IS NULL OR (promo_price_idr > 0 AND promo_price_idr < list_price_idr)
    )
);

CREATE TABLE IF NOT EXISTS installment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_option_id UUID NOT NULL REFERENCES price_options(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_official BOOLEAN NOT NULL DEFAULT true,
    booking_window_start TIMESTAMPTZ,
    booking_window_end TIMESTAMPTZ,
    dp_idr BIGINT NOT NULL,
    terms_notes TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS installment_plan_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installment_plan_id UUID NOT NULL REFERENCES installment_plans(id) ON DELETE CASCADE,
    period_month DATE NOT NULL, -- First day of month e.g. '2026-01-01'
    amount_idr BIGINT NOT NULL,
    sort_index INT NOT NULL DEFAULT 0,
    CONSTRAINT uq_plan_period UNIQUE (installment_plan_id, period_month),
    CONSTRAINT ck_plan_line_amount CHECK (amount_idr > 0)
);

CREATE TABLE IF NOT EXISTS batch_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES batch_content_versions(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    sort_index INT NOT NULL DEFAULT 0,
    usage TEXT NOT NULL DEFAULT 'gallery' CHECK (usage IN ('gallery', 'highlight', 'hero'))
);

CREATE TABLE IF NOT EXISTS adventure_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    headline TEXT NOT NULL,
    story_text TEXT NOT NULL,
    credited_name TEXT,
    consent_status TEXT NOT NULL DEFAULT 'pending' CHECK (consent_status IN ('pending', 'granted', 'revoked')),
    publish_state TEXT NOT NULL DEFAULT 'draft' CHECK (publish_state IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS story_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES adventure_stories(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    sort_index INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS homepage_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    sort_index INT NOT NULL DEFAULT 0,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    style_variant TEXT NOT NULL DEFAULT 'featured' CHECK (style_variant IN ('hero', 'featured', 'grid')),
    caption_override TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value_json JSONB NOT NULL,
    updated_by_admin UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS policy_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    revision_no INT NOT NULL,
    policy_type TEXT NOT NULL CHECK (policy_type IN ('terms', 'privacy', 'cancellation', 'installment')),
    canonical_text TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_by_admin UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    CONSTRAINT uq_policy_rev UNIQUE (policy_type, revision_no)
);

-- ============================================================================
-- 5. BOOKINGS, TRAVELERS & SEAT ALLOCATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    booking_code TEXT NOT NULL UNIQUE,
    primary_contact_name TEXT NOT NULL,
    primary_contact_phone TEXT NOT NULL,
    primary_contact_email TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('inquiry', 'pending', 'confirmed', 'partially_cancelled', 'cancelled', 'completed')),
    source TEXT NOT NULL DEFAULT 'whatsapp' CHECK (source IN ('whatsapp', 'referral', 'manual')),
    notes_private TEXT,
    confirmed_at TIMESTAMPTZ,
    created_by_admin UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_batch_status ON bookings(batch_id, status);

CREATE TABLE IF NOT EXISTS booking_travelers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    contact_phone TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'rescheduled')),
    notes_private TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_travelers_booking ON booking_travelers(booking_id);

CREATE TABLE IF NOT EXISTS booking_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    booking_traveler_id UUID NOT NULL REFERENCES booking_travelers(id) ON DELETE CASCADE,
    price_option_id UUID NOT NULL REFERENCES price_options(id) ON DELETE RESTRICT,
    offer_snapshot_json JSONB NOT NULL,
    agreed_price_idr BIGINT NOT NULL,
    agreed_dp_idr BIGINT NOT NULL,
    effective_policy_version_id UUID REFERENCES policy_versions(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'rescheduled')),
    agreed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_booking_item_traveler UNIQUE (booking_id, booking_traveler_id),
    CONSTRAINT ck_item_price CHECK (agreed_price_idr >= 0),
    CONSTRAINT ck_item_dp CHECK (agreed_dp_idr >= 0 AND agreed_dp_idr <= agreed_price_idr)
);

CREATE TABLE IF NOT EXISTS seat_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    booking_item_id UUID NOT NULL REFERENCES booking_items(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by_admin UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    released_at TIMESTAMPTZ,
    released_by_admin UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    reason TEXT
);

-- At most one ACTIVE seat allocation per booking item (ERD §6.1)
CREATE UNIQUE INDEX IF NOT EXISTS uq_seat_allocation_active_item
    ON seat_allocations (booking_item_id)
    WHERE released_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_seat_allocations_batch_active
    ON seat_allocations (batch_id)
    WHERE released_at IS NULL;

-- ============================================================================
-- 6. SCHEDULES, ADJUSTMENTS & CONTRACTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS booking_schedule_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    revision_no INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'cancelled')),
    final_due_date DATE NOT NULL,
    dp_total_idr BIGINT NOT NULL,
    agreed_terms_snapshot JSONB,
    approved_by_admin UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_booking_schedule_rev UNIQUE (booking_id, revision_no)
);

CREATE TABLE IF NOT EXISTS booking_schedule_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_version_id UUID NOT NULL REFERENCES booking_schedule_versions(id) ON DELETE CASCADE,
    period_month DATE NOT NULL,
    period_end_date DATE NOT NULL,
    planned_amount_idr BIGINT NOT NULL,
    sort_index INT NOT NULL DEFAULT 0,
    CONSTRAINT uq_schedule_line_period UNIQUE (schedule_version_id, period_month),
    CONSTRAINT ck_schedule_line_amount CHECK (planned_amount_idr > 0)
);

CREATE TABLE IF NOT EXISTS booking_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    booking_item_id UUID REFERENCES booking_items(id) ON DELETE SET NULL,
    signed_delta_idr BIGINT NOT NULL,
    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('discount', 'penalty', 'cancellation_relief', 'correction', 'manual')),
    reason_text TEXT NOT NULL,
    approved_by_admin UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS booking_policy_acks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    policy_version_id UUID NOT NULL REFERENCES policy_versions(id) ON DELETE RESTRICT,
    acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    method TEXT NOT NULL DEFAULT 'whatsapp' CHECK (method IN ('whatsapp', 'verbal', 'written')),
    evidence_reference TEXT
);

-- ============================================================================
-- 7. PAYMENTS, REFUNDS, RESCHEDULES & LEDGER
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    amount_idr BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'rejected', 'reversed')),
    payment_channel TEXT NOT NULL DEFAULT 'bank_transfer' CHECK (payment_channel IN ('bank_transfer', 'qris', 'cash', 'other')),
    external_reference TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMPTZ,
    verified_by_admin UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    proof_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
    notes TEXT,
    CONSTRAINT ck_payment_amount CHECK (amount_idr > 0)
);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id, received_at);

CREATE TABLE IF NOT EXISTS payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    booking_item_id UUID NOT NULL REFERENCES booking_items(id) ON DELETE RESTRICT,
    schedule_line_id UUID REFERENCES booking_schedule_lines(id) ON DELETE SET NULL,
    component TEXT NOT NULL CHECK (component IN ('dp', 'installment', 'other')),
    amount_idr BIGINT NOT NULL,
    CONSTRAINT ck_allocation_amount CHECK (amount_idr > 0)
);

CREATE TABLE IF NOT EXISTS refund_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    initiated_by TEXT NOT NULL CHECK (initiated_by IN ('participant', 'organizer', 'other')),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'under_review', 'approved', 'rejected', 'partially_paid', 'paid', 'cancelled')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decision_at TIMESTAMPTZ,
    decision_by_admin UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    decision_notes TEXT
);

CREATE TABLE IF NOT EXISTS refund_case_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    refund_case_id UUID NOT NULL REFERENCES refund_cases(id) ON DELETE CASCADE,
    booking_item_id UUID NOT NULL REFERENCES booking_items(id) ON DELETE RESTRICT,
    paid_dp_attributable_idr BIGINT NOT NULL DEFAULT 0,
    approved_refund_idr BIGINT NOT NULL DEFAULT 0,
    approved_dp_refund_idr BIGINT NOT NULL DEFAULT 0,
    decision_notes TEXT,
    CONSTRAINT ck_refund_item_amounts CHECK (approved_refund_idr >= 0 AND approved_dp_refund_idr >= 0)
);

CREATE TABLE IF NOT EXISTS refund_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    refund_case_id UUID NOT NULL REFERENCES refund_cases(id) ON DELETE RESTRICT,
    amount_idr BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'failed')),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    transfer_reference TEXT,
    proof_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
    entered_by_admin UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    CONSTRAINT ck_refund_payout_amount CHECK (amount_idr > 0)
);

CREATE TABLE IF NOT EXISTS reschedule_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    destination_booking_id UUID REFERENCES bookings(id) ON DELETE RESTRICT,
    source_batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    destination_batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'reviewed', 'approved', 'applied', 'rejected', 'cancelled')),
    reason TEXT NOT NULL,
    approved_by_admin UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_reschedule_batches_diff CHECK (source_batch_id <> destination_batch_id)
);

CREATE TABLE IF NOT EXISTS reschedule_case_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reschedule_case_id UUID NOT NULL REFERENCES reschedule_cases(id) ON DELETE CASCADE,
    source_booking_item_id UUID NOT NULL REFERENCES booking_items(id) ON DELETE RESTRICT,
    destination_booking_item_id UUID REFERENCES booking_items(id) ON DELETE SET NULL,
    dp_credit_decision TEXT NOT NULL DEFAULT 'forfeited' CHECK (dp_credit_decision IN ('forfeited', 'approved_transfer')),
    approved_dp_credit_idr BIGINT NOT NULL DEFAULT 0,
    approved_other_credit_idr BIGINT NOT NULL DEFAULT 0,
    decision_notes TEXT
);

CREATE TABLE IF NOT EXISTS credit_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reschedule_case_id UUID NOT NULL REFERENCES reschedule_cases(id) ON DELETE RESTRICT,
    source_booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    destination_booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    source_booking_item_id UUID REFERENCES booking_items(id) ON DELETE RESTRICT,
    destination_booking_item_id UUID REFERENCES booking_items(id) ON DELETE RESTRICT,
    dp_component_idr BIGINT NOT NULL DEFAULT 0,
    other_component_idr BIGINT NOT NULL DEFAULT 0,
    total_credit_idr BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('pending', 'applied', 'reversed')),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_by_admin UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    CONSTRAINT ck_credit_transfer_sum CHECK (total_credit_idr = dp_component_idr + other_component_idr AND total_credit_idr > 0)
);

-- Authoritative Append-Only Booking Ledger (ERD §6.3)
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    booking_item_id UUID REFERENCES booking_items(id) ON DELETE SET NULL,
    direction TEXT NOT NULL CHECK (direction IN ('debit', 'credit')),
    amount_idr BIGINT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'booking_charge',
        'verified_payment',
        'cancellation_relief',
        'positive_adjustment',
        'negative_adjustment',
        'refund_payout',
        'outbound_credit_transfer',
        'inbound_credit_transfer',
        'reversal'
    )),
    source_kind TEXT NOT NULL,
    source_id UUID NOT NULL,
    reversal_of_entry_id UUID REFERENCES ledger_entries(id) ON DELETE RESTRICT,
    posted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    posted_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    CONSTRAINT ck_ledger_amount CHECK (amount_idr > 0),
    CONSTRAINT uq_ledger_source_idempotent UNIQUE (source_kind, source_id, event_type, direction)
);

CREATE INDEX IF NOT EXISTS idx_ledger_booking ON ledger_entries(booking_id, posted_at);

CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    before_json JSONB,
    after_json JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    request_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id, created_at);

-- ============================================================================
-- 8. DERIVED REPORTING & INTEGRITY VIEWS (ERD §8)
-- ============================================================================

-- Active seat status per batch
CREATE OR REPLACE VIEW v_batch_seat_status AS
SELECT 
    b.id AS batch_id,
    b.batch_code,
    b.slug,
    b.capacity,
    b.booking_state,
    COALESCE(COUNT(sa.id), 0)::int AS allocated_seats,
    GREATEST(0, b.capacity - COALESCE(COUNT(sa.id), 0))::int AS remaining_seats,
    CASE 
        WHEN b.booking_state = 'open' AND (b.capacity - COALESCE(COUNT(sa.id), 0)) <= 0 THEN 'fully_booked'
        ELSE b.booking_state
    END AS effective_status
FROM batches b
LEFT JOIN seat_allocations sa 
    ON sa.batch_id = b.id AND sa.released_at IS NULL
GROUP BY b.id, b.batch_code, b.slug, b.capacity, b.booking_state;

-- Published batch details for public consumption (guarantees NO draft leaks)
CREATE OR REPLACE VIEW v_published_batch_detail AS
SELECT 
    b.id AS batch_id,
    b.batch_code,
    b.slug AS batch_slug,
    b.departure_date,
    b.return_date,
    b.departure_timezone,
    b.capacity,
    b.booking_state,
    b.show_exact_seats,
    b.limited_seats_threshold,
    v.id AS version_id,
    v.revision_no,
    v.title,
    v.lead,
    v.route_summary,
    v.departure_meeting_info,
    v.hero_media_id,
    ts.id AS trip_series_id,
    ts.name AS series_name,
    ts.slug AS series_slug,
    ts.season AS series_season,
    d.id AS destination_id,
    d.name AS destination_name,
    d.slug AS destination_slug,
    d.country_code
FROM batches b
JOIN batch_content_versions v ON b.published_version_id = v.id
JOIN trip_series ts ON b.trip_series_id = ts.id
JOIN destinations d ON ts.destination_id = d.id
WHERE v.status = 'published';

-- Current valid offers for price-from and selection
CREATE OR REPLACE VIEW v_current_offers AS
SELECT 
    po.id AS offer_id,
    po.version_id,
    po.sku,
    po.display_name,
    po.package_type,
    po.room_type,
    po.list_price_idr,
    po.promo_price_idr,
    po.promo_start_at,
    po.promo_end_at,
    po.dp_per_traveler_idr,
    po.included_json,
    po.excluded_json,
    po.land_meeting_info,
    po.is_enabled,
    CASE 
        WHEN po.promo_price_idr IS NOT NULL 
             AND (po.promo_start_at IS NULL OR po.promo_start_at <= CURRENT_TIMESTAMP)
             AND (po.promo_end_at IS NULL OR po.promo_end_at >= CURRENT_TIMESTAMP)
        THEN po.promo_price_idr
        ELSE po.list_price_idr
    END AS effective_price_idr,
    (po.promo_price_idr IS NOT NULL 
     AND (po.promo_start_at IS NULL OR po.promo_start_at <= CURRENT_TIMESTAMP)
     AND (po.promo_end_at IS NULL OR po.promo_end_at >= CURRENT_TIMESTAMP)
    ) AS is_promo_active
FROM price_options po
WHERE po.is_enabled = true;

-- Outstanding balance per booking
CREATE OR REPLACE VIEW v_booking_balance AS
SELECT 
    b.id AS booking_id,
    b.booking_code,
    COALESCE(SUM(CASE WHEN le.direction = 'debit' THEN le.amount_idr ELSE 0 END), 0) AS total_debit_idr,
    COALESCE(SUM(CASE WHEN le.direction = 'credit' THEN le.amount_idr ELSE 0 END), 0) AS total_credit_idr,
    (
        COALESCE(SUM(CASE WHEN le.direction = 'debit' THEN le.amount_idr ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN le.direction = 'credit' THEN le.amount_idr ELSE 0 END), 0)
    ) AS outstanding_balance_idr
FROM bookings b
LEFT JOIN ledger_entries le ON le.booking_id = b.id
GROUP BY b.id, b.booking_code;
