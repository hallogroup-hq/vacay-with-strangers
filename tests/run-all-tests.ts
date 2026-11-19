import { pool } from '../src/lib/db';
import { runMigrations } from '../src/lib/db/migrate';
import { seedDatabase } from '../src/lib/db/seed';
import { calculateH30Date, calculateInstallmentSchedule } from '../src/lib/finance/installments';
import {
  allocateSeatTransactional,
  releaseSeatTransactional,
  postLedgerEntry,
} from '../src/lib/finance/ledger';
import {
  createManualBooking,
  getPublicBatchBySlugs,
  publishBatchRevision,
} from '../src/lib/db/queries';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
    throw new Error(message);
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('VACAY WITH STRANGERS (VWS) V1 — INTEGRATION TEST SUITE');
  console.log('====================================================');

  // Test 1: H-30 Calculation and Boundary Rules
  console.log('\n[TEST 1] H-30 Calculation & Boundary Logic');
  {
    const h30 = calculateH30Date('2026-11-07');
    assert(h30 === '2026-10-08', `H-30 for 2026-11-07 must be 2026-10-08 (got ${h30})`);

    // On 15 October 2026, installments must be unavailable for a Nov 7 departure
    const testNowPostH30 = new Date('2026-10-15T00:00:00Z');
    const resultPostH30 = calculateInstallmentSchedule({
      departureDate: '2026-11-07',
      effectivePriceIdr: 21000000,
      dpPerTravelerIdr: 1500000,
      headcount: 1,
      now: testNowPostH30,
    });
    assert(resultPostH30.is_eligible === false, 'Installment must be unavailable on 2026-10-15 for 2026-11-07 departure');

    // In January 2026, 10-month schedule should be offered up to October
    const testNowJan = new Date('2026-01-10T00:00:00Z');
    const resultJan = calculateInstallmentSchedule({
      departureDate: '2026-11-07',
      effectivePriceIdr: 21000000,
      dpPerTravelerIdr: 1500000,
      headcount: 1,
      now: testNowJan,
    });
    assert(resultJan.is_eligible === true, 'Installment must be eligible in January 2026');
    assert(resultJan.schedule.length === 10, `Schedule must have 10 months (got ${resultJan.schedule.length})`);

    // Check integer rupiah integrity: sum of schedule + DP must equal total price
    const sumSchedule = resultJan.schedule.reduce((acc, curr) => acc + curr.amount_idr, 0);
    assert(
      sumSchedule + resultJan.total_dp_idr === resultJan.total_price_idr,
      `Schedule sum (${sumSchedule}) + DP (${resultJan.total_dp_idr}) must equal total (${resultJan.total_price_idr})`
    );
  }

  // Test 2: Database Concurrency & Seat Overbooking Guard
  console.log('\n[TEST 2] Database Concurrency & Seat Overbooking Guard');
  {
    const client1 = await pool.connect();
    const client2 = await pool.connect();

    try {
      // Create a test batch with capacity 1
      const testBatchRes = await client1.query(
        `INSERT INTO batches (
          trip_series_id, batch_code, slug, departure_date, return_date, capacity, booking_state
        ) VALUES (
          (SELECT id FROM trip_series LIMIT 1), 'TEST-CAP', 'test-cap-batch-${Date.now()}',
          '2026-12-01', '2026-12-08', 1, 'open'
        ) RETURNING id`
      );
      const batchId = testBatchRes.rows[0].id;

      // Create two test bookings with items
      const b1 = await client1.query(
        `INSERT INTO bookings (batch_id, booking_code, primary_contact_name, primary_contact_phone)
         VALUES ($1, 'TEST-B1-${Date.now()}', 'User 1', '0812345') RETURNING id`,
        [batchId]
      );
      const t1 = await client1.query(
        `INSERT INTO booking_travelers (booking_id, full_name) VALUES ($1, 'Traveler 1') RETURNING id`,
        [b1.rows[0].id]
      );
      const i1 = await client1.query(
        `INSERT INTO booking_items (booking_id, booking_traveler_id, price_option_id, offer_snapshot_json, agreed_price_idr, agreed_dp_idr)
         VALUES ($1, $2, (SELECT id FROM price_options LIMIT 1), '{}'::jsonb, 10000000, 1500000) RETURNING id`,
        [b1.rows[0].id, t1.rows[0].id]
      );

      const b2 = await client1.query(
        `INSERT INTO bookings (batch_id, booking_code, primary_contact_name, primary_contact_phone)
         VALUES ($1, 'TEST-B2-${Date.now()}', 'User 2', '0812346') RETURNING id`,
        [batchId]
      );
      const t2 = await client1.query(
        `INSERT INTO booking_travelers (booking_id, full_name) VALUES ($1, 'Traveler 2') RETURNING id`,
        [b2.rows[0].id]
      );
      const i2 = await client1.query(
        `INSERT INTO booking_items (booking_id, booking_traveler_id, price_option_id, offer_snapshot_json, agreed_price_idr, agreed_dp_idr)
         VALUES ($1, $2, (SELECT id FROM price_options LIMIT 1), '{}'::jsonb, 10000000, 1500000) RETURNING id`,
        [b2.rows[0].id, t2.rows[0].id]
      );

      // Attempt concurrent allocation to the single seat
      let alloc1Success = false;
      let alloc2Success = false;

      await client1.query('BEGIN');
      await client2.query('BEGIN');

      try {
        await allocateSeatTransactional(client1, { batchId, bookingItemId: i1.rows[0].id });
        await client1.query('COMMIT');
        alloc1Success = true;
      } catch (e) {
        await client1.query('ROLLBACK');
      }

      try {
        await allocateSeatTransactional(client2, { batchId, bookingItemId: i2.rows[0].id });
        await client2.query('COMMIT');
        alloc2Success = true;
      } catch (e) {
        await client2.query('ROLLBACK');
      }

      assert(alloc1Success !== alloc2Success, 'Exactly ONE concurrent allocation must succeed for capacity 1');
      console.log(`    Allocation 1: ${alloc1Success ? 'SUCCESS' : 'FAILED'}, Allocation 2: ${alloc2Success ? 'SUCCESS' : 'FAILED'}`);
    } finally {
      client1.release();
      client2.release();
    }
  }

  // Test 3: Group Booking with 3 Travelers, Partial Cancellation & Ledger
  console.log('\n[TEST 3] Group Booking (3 Travelers) & Partial Cancellation');
  {
    const batchRes = await pool.query(`SELECT id FROM batches WHERE slug = 'batch-01-nov-2026'`);
    const batchId = batchRes.rows[0].id;

    const offerRes = await pool.query(`SELECT id FROM price_options WHERE package_type = 'full' LIMIT 1`);
    const offerId = offerRes.rows[0].id;

    const adminRes = await pool.query(`SELECT id FROM admin_users LIMIT 1`);
    const adminId = adminRes.rows[0].id;

    const bookingRes = await createManualBooking({
      batchId,
      primaryContactName: 'Budi Santoso',
      primaryContactPhone: '081299998888',
      travelers: [
        { fullName: 'Budi Santoso', priceOptionId: offerId },
        { fullName: 'Siti Rahma', priceOptionId: offerId },
        { fullName: 'Agus Setiawan', priceOptionId: offerId },
      ],
      adminId,
    });

    assert(bookingRes.totalBookingCharge === 63000000, '3 travelers @ 21M must equal 63,000,000 IDR');

    // Verify 3 active travelers
    const travelers = await pool.query(`SELECT * FROM booking_travelers WHERE booking_id = $1`, [bookingRes.bookingId]);
    assert(travelers.rows.length === 3, 'Must have 3 travelers in booking');

    // Cancel 1 traveler (Agus Setiawan)
    const travelerToCancel = travelers.rows.find((t: any) => t.full_name === 'Agus Setiawan');
    const itemRes = await pool.query(`SELECT * FROM booking_items WHERE booking_traveler_id = $1`, [travelerToCancel.id]);
    const itemToCancel = itemRes.rows[0];

    // Allocate seats for all 3 first
    const alloc1 = await pool.query(
      `INSERT INTO seat_allocations (batch_id, booking_item_id) VALUES ($1, $2) RETURNING id`,
      [batchId, itemToCancel.id]
    );

    // Cancel Agus: mark traveler & item cancelled, release seat, apply negative adjustment for remaining amount (excluding DP)
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE booking_travelers SET status = 'cancelled' WHERE id = $1`, [travelerToCancel.id]);
      await client.query(`UPDATE booking_items SET status = 'cancelled' WHERE id = $1`, [itemToCancel.id]);
      await releaseSeatTransactional(client, {
        seatAllocationId: alloc1.rows[0].id,
        adminId,
        reason: 'Pembatalan atas permintaan peserta (DP forfeited)',
      });

      // Contract adjustment: reduce contractual obligation by (agreed_price - agreed_dp) = (21M - 1.5M = 19.5M)
      const reliefAmount = Number(itemToCancel.agreed_price_idr) - Number(itemToCancel.agreed_dp_idr);
      await postLedgerEntry(client, {
        bookingId: bookingRes.bookingId,
        bookingItemId: itemToCancel.id,
        direction: 'credit',
        amountIdr: reliefAmount,
        eventType: 'cancellation_relief',
        sourceKind: 'booking_adjustment',
        sourceId: itemToCancel.id,
        postedBy: adminId,
      });

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    // Verify other 2 travelers remain active
    const activeTravelers = await pool.query(
      `SELECT * FROM booking_travelers WHERE booking_id = $1 AND status = 'active'`,
      [bookingRes.bookingId]
    );
    assert(activeTravelers.rows.length === 2, 'Remaining 2 travelers must remain active');

    // Verify ledger balance: total debit 63M - cancellation credit 19.5M = 43.5M (2x21M + 1.5M forfeited DP)
    const balRes = await pool.query(`SELECT * FROM v_booking_balance WHERE booking_id = $1`, [bookingRes.bookingId]);
    const balance = Number(balRes.rows[0].outstanding_balance_idr);
    assert(balance === 43500000, `Outstanding balance must be 43,500,000 IDR (got ${balance})`);
  }

  // Test 4: Payment Verification & Reversal with Ledger Accounting
  console.log('\n[TEST 4] Payment Verification, Duplicate Guard & Reversal');
  {
    const bRes = await pool.query(`SELECT id FROM bookings LIMIT 1`);
    const bookingId = bRes.rows[0].id;
    const adminRes = await pool.query(`SELECT id FROM admin_users LIMIT 1`);
    const adminId = adminRes.rows[0].id;

    // Record payment
    const pRes = await pool.query(
      `INSERT INTO payments (booking_id, amount_idr, status, external_reference)
       VALUES ($1, 5000000, 'pending_verification', 'REF-TEST-001') RETURNING id`,
      [bookingId]
    );
    const paymentId = pRes.rows[0].id;

    // Verify ledger has NOT credited pending payment
    const checkPending = await pool.query(
      `SELECT COUNT(*) FROM ledger_entries WHERE source_id = $1`,
      [paymentId]
    );
    assert(Number(checkPending.rows[0].count) === 0, 'Pending payment must not post to ledger');

    // Verify payment and post ledger
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE payments SET status = 'verified', verified_at = CURRENT_TIMESTAMP WHERE id = $1`, [paymentId]);
      await postLedgerEntry(client, {
        bookingId,
        direction: 'credit',
        amountIdr: 5000000,
        eventType: 'verified_payment',
        sourceKind: 'payment',
        sourceId: paymentId,
        postedBy: adminId,
      });
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    const checkVerified = await pool.query(
      `SELECT * FROM ledger_entries WHERE source_id = $1 AND event_type = 'verified_payment'`,
      [paymentId]
    );
    assert(checkVerified.rowCount === 1, 'Verified payment must post exactly 1 ledger credit entry');

    // Duplicate verification attempt must be idempotent
    const clientDup = await pool.connect();
    try {
      await clientDup.query('BEGIN');
      await postLedgerEntry(clientDup, {
        bookingId,
        direction: 'credit',
        amountIdr: 5000000,
        eventType: 'verified_payment',
        sourceKind: 'payment',
        sourceId: paymentId,
        postedBy: adminId,
      });
      await clientDup.query('COMMIT');
    } finally {
      clientDup.release();
    }
    const checkDup = await pool.query(
      `SELECT COUNT(*) FROM ledger_entries WHERE source_id = $1 AND event_type = 'verified_payment'`,
      [paymentId]
    );
    assert(Number(checkDup.rows[0].count) === 1, 'Duplicate verification must NOT create multiple ledger entries');

    // Reverse payment
    const clientRev = await pool.connect();
    try {
      await clientRev.query('BEGIN');
      await clientRev.query(`UPDATE payments SET status = 'reversed' WHERE id = $1`, [paymentId]);
      await postLedgerEntry(clientRev, {
        bookingId,
        direction: 'debit',
        amountIdr: 5000000,
        eventType: 'reversal',
        sourceKind: 'payment',
        sourceId: paymentId,
        reversalOfEntryId: checkVerified.rows[0].id,
        postedBy: adminId,
      });
      await clientRev.query('COMMIT');
    } finally {
      clientRev.release();
    }

    const checkRev = await pool.query(
      `SELECT * FROM ledger_entries WHERE source_id = $1 AND event_type = 'reversal'`,
      [paymentId]
    );
    assert(checkRev.rowCount === 1, 'Reversal must post compensating debit entry');
  }

  // Test 5: Draft Content Revision Isolation
  console.log('\n[TEST 5] Draft Content Revision Isolation (Zero Public Leaks)');
  {
    const batchRes = await pool.query(`SELECT id FROM batches WHERE slug = 'batch-01-nov-2026'`);
    const batchId = batchRes.rows[0].id;

    // Query max revision dynamically
    const maxRevRes = await pool.query(
      `SELECT COALESCE(MAX(revision_no), 1) AS max_rev FROM batch_content_versions WHERE batch_id = $1`,
      [batchId]
    );
    const nextRev = parseInt(maxRevRes.rows[0].max_rev, 10) + 1;

    // Create a draft revision
    const draftRes = await pool.query(
      `INSERT INTO batch_content_versions (batch_id, revision_no, status, title)
       VALUES ($1, $2, 'draft', 'DRAFT UNPUBLISHED TITLE TEST') RETURNING id`,
      [batchId, nextRev]
    );
    const draftId = draftRes.rows[0].id;

    // Fetch public batch by slugs
    const publicBatch = await getPublicBatchBySlugs('japan-autumn', 'batch-01-nov-2026');
    assert(
      publicBatch.title !== 'DRAFT UNPUBLISHED TITLE TEST',
      `Public batch must NOT leak draft revision (got title: "${publicBatch.title}")`
    );
    assert(publicBatch.revision_no === 1, `Public batch must read published revision 1 (got rev: ${publicBatch.revision_no})`);

    // Clean up draft test revision
    await pool.query(`DELETE FROM batch_content_versions WHERE id = $1`, [draftId]);
  }

  console.log('\n====================================================');
  console.log(`ALL INTEGRATION TESTS PASSED: ${passed} passed, ${failed} failed`);
  console.log('====================================================\n');
}

runTests()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test suite failed:', err);
    pool.end();
    process.exit(1);
  });
