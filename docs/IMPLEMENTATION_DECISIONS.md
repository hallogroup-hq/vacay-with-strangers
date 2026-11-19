# VACAY WITH STRANGERS (VWS) V1 — IMPLEMENTATION DECISIONS & AUDIT

**Document Version:** 1.0  
**Date:** 15 October 2026  
**Status:** G0 Discovery & Scope Lock PASSED  

---

## 1. Asset & Source Inventory Matrix

| Source File | Format / Size | Verified Facts & Information | Usability for V1 | Caveats & Unconfirmed Items |
|---|---|---|---|---|
| `VWS_PRD_v1.0.md` | Markdown / 40 KB | Technical & business specification, P0 scope, WhatsApp booking rules, admin CRUD, financial invariants | Authoritative source of product requirements | Precedence over templates and draft brochures |
| `VWS_ERD_v1.0.md` | Markdown / 37 KB | 26+ tables, PostgreSQL constraints, append-only ledger, seat allocation locks, versioned content | Authoritative source of data architecture | DDL and migrations must enforce all invariants |
| `VWS_READ_FIRST.md` | Markdown / 4 KB | Handover constraints, separation of Jan 2026 vs Nov 2026, unconfirmed business policies | Authoritative operational guardrail | Autonomous execution granted for passing gates |
| `Visual/Vacay With Strangers Autumn 2026.jpg` | JPG / 1.3 MB (1080x1350) | Japan Countryside Autumn Trip, 8D7N, 7–14 Nov 2026. Osaka, Nagoya, Gifu, Nagano, Tokyo. Highlights: Kamikochi, Togakushi, Suwa Lake, Wasabi Farm, Tokyo Cafe Hopping. Promo Rp 21M, Normal Rp 24M. Inclusions: Flight PP, 3-star hotel, pass, Shinkansen, cycling, 3x meals, baggage, tour leader, content doc. CP: +62 857-7499-9875. | Reference for Autumn Trip series & sample batch data | Typo on poster (`24.000.00` & `21.000.00`), promo validity "31 December" has ambiguous year relative to departure. Staged as unverified/draft in CMS until owner confirms. |
| `Visual/Vacay With Strangers Autumn 2026 (2).jpg` | JPG / 1.7 MB (1080x1350) | Official installment breakdown for Autumn: Booking Seat / DP Rp 1.500.000; 10 installments (Jan–Oct): Promo = 10x Rp 1.950.000 (total Rp 21M); Normal = 10x Rp 2.250.000 (total Rp 24M). October is H-30 cutoff. | Ground truth for 10-month installment formula and H-30 cutoff logic | Valid as test fixture and historical promotional reference; live production values configurable in VWS Studio. |
| `Visual/Vacay With Strangers General Itinerary - 7-14 November 2026-03.jpg` | JPG / 23.5 MB (5486x6857) | Day 1 (7 Nov): JKT-KIX, Dinner Osaka, Shinkansen to Nagoya. Day 2 (8 Nov): Nagoya-Gifu private trip, then Nagano. Day 3 (9 Nov): Nagano-Togakushi, Matsumoto (3N). Day 4 (10 Nov): Azumino cycling & Wasabi farm. Day 5 (11 Nov): Matsumoto Castle & Suwa Lake sunset. Day 6 (12 Nov): Kamikochi day trip to Tokyo. Day 7 (13 Nov): Tokyo cozy spots, packing. Day 8 (14 Nov): Flight NRT-JKT. | Ground truth for Autumn 8-day itinerary | Stored in CMS as initial draft version; editable per batch without affecting code. |
| `Visual/Winter In Japan - Vacay With Strangers-03.jpg` | JPG / 36.9 MB (5486x6858) | Historical Winter trip: 9–14 Jan 2026, 6D5N. Capacity: 11 pax. Promo Rp 18.999.999 / Normal Rp 19.500.000. | Archive reference only | Must NOT be mixed with Autumn 2026 trip. |
| `Visual/[Normal] & [Promo] Installment Scheme Winter.jpg` | JPG / 9.8 MB each | DP Rp 1.5M + Pelunasan DP Rp 1.0M + 6 monthly installments (Jul–Dec). | Historical proof of flexible installment concept | Confirms 2-tier DP historically used; V1 simplifies to single DP per offer. |
| `Visual/Onboarding Winter In Japan.pdf` | PDF / 2.7 MB (33 pages) | Detailed flight schedules (PR539/PR432), baggage rules (30kg check-in, 7kg cabin), hotel locations (Osaka, Nagoya Sakae, Tokyo), cultural norms in Japan. | Operational context & tone-of-voice reference | Contains personal/sensitive flight booking codes and Airbnb logistics; forbidden to expose publicly. |
| `[Itinerary 9-14 January] Winter In Japan.pdf` | PDF / 446 KB (2 pages) | Alternative detailed schedule with embedded Achiko-Regular and Sora-Regular font definitions. | Proof of Achiko and Sora brand typography | Commercial web licensing of Achiko unconfirmed; Sora loaded via webfont with brand-aligned display styling. |

---

## 2. Requirement Conflicts & Reconciliation

1. **Poster Pricing vs Operational Truth:**
   - *Conflict:* The Autumn 2026 poster displays prices Rp 21.000.000 (promo) and Rp 24.000.000 (normal) with a validity "Valid Until 31 December" without specifying the year.
   - *Resolution:* In accordance with PRD DEC-04, AC-PRI-01 and ERD §11, the database will store prices in integer IDR (`list_price_idr = 24000000`, `promo_price_idr = 21000000`, `dp_per_traveler_idr = 1500000`) within a versioned `price_options` table. The promo date is configurable in VWS Studio. No price is hard-coded in the frontend.

2. **Installment Calculation vs Departure Dates:**
   - *Conflict:* The promotional graphic shows 10 monthly payments (Jan–Oct) for a November 2026 departure. If a visitor accesses the site in October 2026, 10 months cannot be offered.
   - *Resolution:* Dynamic timezone-aware algorithm calculates H-30 from departure date (`2026-11-07` minus 30 calendar days = `2026-10-08`). If current runtime is after H-30, no new official installment plan is generated for that batch; the visitor is directed to WhatsApp to inquire about manual full payment or exceptions.

3. **Seat Allocation & Availability Derivation:**
   - *Conflict:* Some traditional travel templates use a mutable `remaining_seats` field.
   - *Resolution:* Strictly enforced per ERD §6.1: `remaining_seats` is derived transactionally as `capacity - COUNT(active seat_allocations)`. An active allocation is a row where `released_at IS NULL`. Row-level lock (`SELECT ... FOR UPDATE`) guarantees no race conditions or overbooking during concurrent allocations.

4. **Group Bookings, Partial Cancellations, and DP Forfeiture:**
   - *Conflict:* In a group of 3, if 1 person cancels, how are funds and seats reconciled?
   - *Resolution:* Each traveler in a booking has a dedicated `booking_item`. On participant-initiated cancellation, the affected traveler's seat is released via admin action, the attributable DP is flagged non-refundable, an authorized negative adjustment reduces the remaining contractual balance, and an append-only audit event and ledger entry are posted. The other 2 travelers remain completely intact.

5. **WhatsApp Message Protocol:**
   - *Conflict:* Generating a booking record upon WhatsApp click vs pure inquiry.
   - *Resolution:* PRD DEC-08 and §9 strictly rule that clicking the WhatsApp CTA generates a prefilled message carrying context (series, batch, package, headcount, installment preference), but creates NO booking record and deducts NO seats. Booking creation is purely manual in VWS Studio by the admin.

---

## 3. Technology Stack & Architecture Decision

- **Framework:** Next.js 15 (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS v4 + Custom Design Tokens (Sora, Brand Color Palette, Zero AI Slop)
- **Database:** PostgreSQL 16 (Native running on local port 5432, database `vws_db` for app, `vws_test_db` for automated tests)
- **Database Access / Driver:** TypeScript SQL driver (`pg` pool) with strict transactional queries, explicit migrations, row locks (`FOR UPDATE`), and integrity validation
- **Authentication:** Single Admin session via HTTP-only secure signed cookie, HMAC-SHA256 session token, timing-safe credential verification, rate limiting, and server-side route guards
- **Media Strategy:** Local storage handler in `public/uploads/` with mime-type and extension validation, separated into public assets and protected receipts with signed access
- **Testing:** Node.js native test runner + custom end-to-end integration test suite verifying DB constraints, seat concurrency, installment math, ledger reconciliation, and API authorization

---

## 4. Status of Open Business Decisions (PRD §18)

- **OPEN-01 (Verified Live Prices):** Configured in VWS Studio with draft/published state. Initial seed is marked unpublished/draft so production public pages display realistic honest state.
- **OPEN-02 (DP Inclusion in Total):** Implemented as DP contributing to total price (`agreed_price_idr = agreed_dp_idr + remaining_installments`).
- **OPEN-03 (Monthly Payment Flexibility):** Due date within month is flexible; final deadline is strictly H-30.
- **OPEN-04 (Late Booking Post H-30):** Disables self-service installment schedule; requires admin contact.
- **OPEN-05 (Cancellation Policy):** Participant cancellation forfeits DP; organizer cancellation is handled case-by-case without automated penalty.
- **OPEN-06 (PII Minimization):** Only full name, contact phone, and optional notes are stored. No passport scans or unneeded PII.
- **OPEN-11 (Font Licensing):** Sora loaded as primary UI & body font; Achiko fallback applied with uppercase typography styling.
