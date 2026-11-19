import { PoolClient } from 'pg';

export interface AuditEventParams {
  adminUserId?: string | null;
  entityType: string;
  entityId: string;
  bookingId?: string | null;
  eventType: string;
  beforeJson?: any;
  afterJson?: any;
  reason?: string | null;
}

export async function logAuditEvent(client: PoolClient, params: AuditEventParams): Promise<void> {
  await client.query(
    `INSERT INTO audit_events (
      admin_user_id, entity_type, entity_id, booking_id, event_type, before_json, after_json, reason
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      params.adminUserId || null,
      params.entityType,
      params.entityId,
      params.bookingId || null,
      params.eventType,
      params.beforeJson ? JSON.stringify(params.beforeJson) : null,
      params.afterJson ? JSON.stringify(params.afterJson) : null,
      params.reason || null,
    ]
  );
}

export interface PostLedgerParams {
  bookingId: string;
  bookingItemId?: string | null;
  direction: 'debit' | 'credit';
  amountIdr: number;
  eventType:
    | 'booking_charge'
    | 'verified_payment'
    | 'cancellation_relief'
    | 'positive_adjustment'
    | 'negative_adjustment'
    | 'refund_payout'
    | 'outbound_credit_transfer'
    | 'inbound_credit_transfer'
    | 'reversal';
  sourceKind: string;
  sourceId: string;
  reversalOfEntryId?: string | null;
  postedBy?: string | null;
}

export async function postLedgerEntry(client: PoolClient, params: PostLedgerParams): Promise<string> {
  const res = await client.query(
    `INSERT INTO ledger_entries (
      booking_id, booking_item_id, direction, amount_idr, event_type, source_kind, source_id, reversal_of_entry_id, posted_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (source_kind, source_id, event_type, direction) DO NOTHING
    RETURNING id`,
    [
      params.bookingId,
      params.bookingItemId || null,
      params.direction,
      params.amountIdr,
      params.eventType,
      params.sourceKind,
      params.sourceId,
      params.reversalOfEntryId || null,
      params.postedBy || null,
    ]
  );

  if (res.rowCount === 0) {
    // Already posted idempotently
    const existing = await client.query(
      `SELECT id FROM ledger_entries 
       WHERE source_kind = $1 AND source_id = $2 AND event_type = $3 AND direction = $4`,
      [params.sourceKind, params.sourceId, params.eventType, params.direction]
    );
    return existing.rows[0].id;
  }

  return res.rows[0].id;
}

export async function allocateSeatTransactional(
  client: PoolClient,
  params: {
    batchId: string;
    bookingItemId: string;
    adminId?: string | null;
    reason?: string | null;
  }
): Promise<string> {
  // 1. Lock batch row to guard capacity (ERD §6.1)
  const batchRes = await client.query(
    `SELECT id, capacity, booking_state FROM batches WHERE id = $1 FOR UPDATE`,
    [params.batchId]
  );
  if (batchRes.rowCount === 0) throw new Error('Batch tidak ditemukan');
  const batch = batchRes.rows[0];

  // 2. Check if booking item already has an active allocation
  const existingRes = await client.query(
    `SELECT id FROM seat_allocations WHERE booking_item_id = $1 AND released_at IS NULL`,
    [params.bookingItemId]
  );
  if (existingRes.rowCount! > 0) {
    throw new Error('Peserta ini sudah memiliki alokasi seat aktif.');
  }

  // 3. Count currently active allocations
  const countRes = await client.query(
    `SELECT COUNT(*)::int AS count FROM seat_allocations WHERE batch_id = $1 AND released_at IS NULL`,
    [params.batchId]
  );
  const activeCount = countRes.rows[0].count;

  if (activeCount + 1 > batch.capacity) {
    throw new Error(`Kapasitas penuh (${activeCount}/${batch.capacity} seats). Alokasi ditolak.`);
  }

  // 4. Insert allocation
  const insertRes = await client.query(
    `INSERT INTO seat_allocations (batch_id, booking_item_id, assigned_by_admin, reason)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [params.batchId, params.bookingItemId, params.adminId || null, params.reason || null]
  );
  const allocationId = insertRes.rows[0].id;

  // 5. Audit log
  await logAuditEvent(client, {
    adminUserId: params.adminId,
    entityType: 'seat_allocation',
    entityId: allocationId,
    eventType: 'seat_allocated',
    afterJson: { batchId: params.batchId, bookingItemId: params.bookingItemId, activeCount: activeCount + 1 },
    reason: params.reason,
  });

  return allocationId;
}

export async function releaseSeatTransactional(
  client: PoolClient,
  params: {
    seatAllocationId: string;
    adminId?: string | null;
    reason: string;
  }
): Promise<void> {
  const currentRes = await client.query(
    `SELECT * FROM seat_allocations WHERE id = $1 AND released_at IS NULL FOR UPDATE`,
    [params.seatAllocationId]
  );
  if (currentRes.rowCount === 0) {
    throw new Error('Alokasi seat tidak ditemukan atau sudah dilepas sebelumnya.');
  }
  const current = currentRes.rows[0];

  await client.query(
    `UPDATE seat_allocations 
     SET released_at = CURRENT_TIMESTAMP, released_by_admin = $1, reason = $2 
     WHERE id = $3`,
    [params.adminId || null, params.reason, params.seatAllocationId]
  );

  await logAuditEvent(client, {
    adminUserId: params.adminId,
    entityType: 'seat_allocation',
    entityId: params.seatAllocationId,
    eventType: 'seat_released',
    beforeJson: current,
    reason: params.reason,
  });
}
