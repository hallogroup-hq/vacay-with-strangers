# VACAY WITH STRANGERS — PRODUCT REQUIREMENTS DOCUMENT

**Document:** VWS-PRD-001  
**Version:** 1.0 — implementation baseline, conditional on the open items in §18  
**Date:** 15 October 2026  
**Product:** Vacay With Strangers (VWS)  
**Deliverable:** responsive public website + private single-admin VWS Studio  
**Implementation target:** Google Antigravity  
**Primary language:** Bahasa Indonesia, with selective natural English brand language  
**Current contact channel:** WhatsApp `+62 857-7499-9875` (`https://wa.me/6285774999875`)

> **Source of truth / implementation precedence:** (1) decisions explicitly confirmed by the owner in project discussion; (2) this approved PRD and ERD; (3) attached brand guideline and trip materials for reference; (4) documented and approved clarifications. The attached 2026 trip posters and January 2026 itinerary are *reference materials*, not automatically verified live inventory, pricing or terms. Never seed unconfirmed details as public facts.

---

## 1. Executive summary

VWS is an Indonesian, youth-oriented **open-trip travel club for people who may not know one another before departure**. Destinations include Japan, China, Vietnam, Kazakhstan and future countries. Trips are organized by **destination → trip series (e.g. Japan Autumn) → departures/batches**. The public site balances brand experience with useful trip discovery and WhatsApp inquiries. The private **VWS Studio** lets one authenticated administrator create/edit destinations, series and batches; manage day-by-day itineraries, package variants, prices, promotions, galleries and site content; and manually record reservations, seat assignments, monthly installments, refunds and reschedules.

**Brand direction:** *Hybrid — playful but classy.* Expressive editorial compositions, dominant genuine destination/traveler photography, strong hierarchy, generous negative space and intentional micro-interactions. Not a generic OTA, travel template, gradient-heavy SaaS homepage or marketing-copy dump.

**Explicit exclusions:** customer login, automated checkout, payment gateway, automated confirmation, automated seat holding, CRM/mass messaging, multi-admin RBAC and automatic refund decisions.

### 1.1 Non-negotiable experience promises

1. A visitor can discover an appropriate trip, understand its true availability and price, inspect an itinerary and open a context-rich WhatsApp conversation **without signing in**.
2. Every published price, promotion, room/package option, installment schedule, seat count and itinerary is drawn from approved VWS-managed data, never hard-coded promotional artwork.
3. One administrator can manage *all* public content and operational bookings through VWS Studio without changing application source.
4. Confirmed bookings retain **commercial snapshots**; later edits to public prices or policies cannot silently mutate their financial terms.
5. Payment, refund, cancellation, seat and reschedule operations remain traceable and reversible through *audited corrections*, never destructive history deletion.
6. No fake testimonials, fabricated travelers, fake urgency, decorative UI filler, placeholder admin instructions visible to customers or AI-generated-looking copy.

## 2. Confirmed decisions / decision log

| ID | Decision | Status |
|---|---|---|
| DEC-01 | Hybrid playful/classy, immersive hero plus featured upcoming trip | LOCKED |
| DEC-02 | Public website is travel discovery + WhatsApp conversion | LOCKED |
| DEC-03 | Destination → series → batch; batch-specific itinerary/pricing | LOCKED |
| DEC-04 | Full Package and Land Tour Only, optional room/pricing variants, early-bird/promos | LOCKED |
| DEC-05 | Official installment plans **and** clearly non-binding custom simulations | LOCKED |
| DEC-06 | Booking Seat/DP then monthly installments; dates within each month flexible | LOCKED |
| DEC-07 | Full payment due at latest 30 calendar days prior to departure (H-30) | LOCKED |
| DEC-08 | WhatsApp is sole public booking/contact CTA, no public checkout/payment | LOCKED |
| DEC-09 | Individual and group bookings; one primary booking contact | LOCKED |
| DEC-10 | Seat allocation and release only by admin; no auto-holds | LOCKED |
| DEC-11 | Single Admin for VWS Studio | LOCKED |
| DEC-12 | Participant-initiated cancellation: DP non-refundable | LOCKED |
| DEC-13 | Other refunds, reschedule and DP transfer judged case-by-case by admin | LOCKED |
| DEC-14 | Dynamic create/edit/duplicate/publish batch and itinerary via dashboard | LOCKED |
| DEC-15 | Past travel documentation supports trust; trip/destination remains primary | LOCKED |

**Policy boundary:** “DP non-refundable” is a policy for *participant-initiated cancellation*; do not apply it blindly when VWS cancels the trip or where applicable law/contract requires another outcome. Publish understandable terms before customers pay.

## 3. Goals, outcome measures and non-goals

### 3.1 Goals

- Encourage qualified WhatsApp inquiries from trip detail, including a selected destination/batch, Full vs Land, offer, headcount and installment interest.
- Showcase the brand's authentic strangers-to-travel-buddies personality through curated real media, not abstract marketing sections.
- Enable batch growth and itinerary changes without developer support.
- Maintain accurate availability, durable booking/payment data and transparent refund/reschedule records.
- Provide a fast, legible, delightful **mobile-first** experience with a deliberate desktop editorial composition.

### 3.2 Success metrics (targets set after baseline)

- `trip_detail_view → whatsapp_join_click` conversion rate (event-based; not equivalent to real bookings).
- % of inquiries carrying recognized `batch_id`, chosen offer and party size.
- Administrator time to duplicate and publish an ordinary batch.
- Invalid price/availability events or overbookings: **zero**.
- Incorrect financial balance after verified payments/refunds/movements: **zero**.
- Core Web Vitals at p75 on mobile: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 (aspirational QA gates with monitoring, not license to fake telemetry).

### 3.3 Non-goals

No payment processing, customer account, traveler self-service portal, automated emails/WhatsApp, membership/loyalty, marketplace vendors, international currency checkout, artificial seat reservation countdown or real-time group chat.

## 4. Users and jobs to be done

| Persona | Context / job |
|---|---|
| Solo Gen Z traveler | “Find a trip worth joining even though I have no companion.” |
| First-jobber / budget-conscious traveler | “See the real cost, what is included, and how monthly payments could work before contacting VWS.” |
| Friend-group organizer | “Choose packages for a group, understand the combined cost, and contact VWS once.” |
| VWS single administrator | “Publish trips, keep inventory honest, record seat decisions and payment history without spreadsheets or developers.” |

Visitors may browse anonymously. Sensitive traveler identity details are handled privately only when necessary after booking discussion.

## 5. Public information architecture and routes

| Route pattern | Page | Role |
|---|---|---|
| `/` | Home | Immersive visual hero + featured open/soon trips + curated stories |
| `/trips` | Explore Trips | Filterable countries/series/batches, no fictitious listings |
| `/destinations/[slug]` | Destination landing | Country overview and its available/archived trips; can redirect to filtered Explore if sparse |
| `/trips/[series-slug]/[batch-slug]` | Batch detail | Actual conversion page; unique stable batch URL |
| `/adventures` | Past Adventures | Real trip galleries and consented stories |
| `/about` | About VWS | Concept, trusted organizers/contact, essential credibility |
| `/terms`, `/privacy` | Legal | Published terms, privacy practices, relevant policies |
| `/not-found` | 404 | Concise guided recovery |

**Canonical URLs:** unique readable slugs; do not use an ambiguous `Batch 01` slug across years. No production-visible `draft`, `internal`, `test`, “Phase E/F”, placeholder or developer note labels. Admin routes are never indexed.

### 5.1 Home

- Full-bleed photography or **optional** tasteful short video; featured trip content is readable on narrow screens and on slow connections.
- Prioritize 1 current featured upcoming batch with explicit date/price-from/status/CTA. Admin chooses editorial fallback if none is Open.
- Curated upcoming trips with strong visual variation; no endless same-card grid.
- Destination exploration, compact explanation of the VWS social premise, real completed-adventure media and one meaningful end CTA.
- All sections can be reordered/enabled/disabled by admin through limited safe templates—not an unrestricted page builder.

### 5.2 Explore Trips

- Filters: country, season (where meaningful), month of departure, registration state. Optional sort by nearest valid departure date.
- Clear per-batch date, duration, destination/route, `price from`, availability status and featured image.
- Empty filter state is useful, not exaggerated: “Belum ada trip yang cocok. Lihat destinasi lain.”
- Closed/Full batches may remain browsable, but their CTA asks for future batch info, not seat confirmation.
- Completed batches live in adventure archive and may be discoverable contextually.

### 5.3 Batch Detail — sequence and interaction

1. **Hero / decision essentials:** imagery, series + batch name, exact dates, duration, route/cities, published status, `starting at` price, prominent inquiry.
2. **Batch selection:** switch among valid related batches; URL and all displayed operational data update consistently.
3. **The Journey:** day selector for each actual day; hero visual and concise highlights; expandable schedule lines with time, location, activity type, notes and optional flag. Accommodate missing per-activity images without broken layout.
4. **Package chooser:** Full Package vs Land Tour Only; only actual offers appear. Optionally Sharing/Private, promotions; clearly list inclusions/exclusions and land-tour meeting location/time when known. Label unknown specifics as “Konfirmasi melalui WhatsApp,” never invent.
5. **Group headcount:** default 1; more than 1 produces proper group totals; supported mixed package selections may be handled in admin, with a public simplified single-offer group estimate unless the feature is explicitly activated.
6. **Installment planner:** official verified plans first and visually separate custom **non-binding** proposal; DP, remaining balance, monthly plan, final payment deadline, full totals, current validity and group quantity. Disallow an impossible official plan.
7. **Trust / actual trip vibe:** approved photos, consented experience snippets, actual trip leader only if managed as published content.
8. **Essentials and terms:** inclusions/exclusions, meeting point, documents/visa guidance with dated verification, itinerary-change disclaimer, DP/cancellation/reschedule terms, H-30 deadline, contact.
9. **WhatsApp CTA:** sticky *non-obscuring* mobile action; content reflects selected batch, offer, traveler count and official/custom preference.

No forced multi-step checkout; no elaborate quiz, synthetic countdown or repetitive self-congratulatory copy.

### 5.4 Past Adventures and About

- Archive relates actual completed batch to photos/videos/captions and optional consented travelers’ quotes.
- Never fabricate a completed trip or imply a promotional image is real traveler documentation.
- About conveys premise, actual organizers, contact, clear trust indicators only if verifiable.
- Media license/consent and takedown workflow exist in VWS Studio.

## 6. Public batch state model

`content_state ∈ {draft, published, archived}` is **distinct from** operational registration state.

| Operational state | Meaning | Public CTA |
|---|---|---|
| `coming_soon` | Announced, bookings not open | Ask about schedule |
| `open` | Can inquire subject to actual remaining allocation | Join / Ask on WhatsApp |
| `closed` | Registration intentionally stopped | Ask about next batch |
| `completed` | Trip ended | Explore past adventure |
| `cancelled` | Organizer cancelled | Read update/contact support |

**Fully booked is derived** from `capacity - active allocations <= 0` (do not invent a separate mutable truth). When `open` and no seats left, present `Fully Booked` and alternate inquiry. `Limited seats` label is permitted only when a configurable *real* threshold is reached. Admin controls whether the exact remaining count is displayed; if displayed, it must be transactional and accurate.

Content draft/preview must never leak into public listing or search indexing. A past completed trip can remain publicly browseable even when registration ended.

## 7. Pricing and offer rules

**Domain:** one batch has one or more published `price_options`/offers. Different offers may represent Full, Land Tour Only, Sharing, Private and other explicitly configured variants. Promotions/early bird attach to specific offers and must be time-bounded, auditable and timezone-aware.

- Each offer stores name, package type (`full`/`land_only`), optional room mode, currency IDR, list price, optional verified promo price, conditions, inclusion/exclusion lists, minimum DP per traveler and publication availability.
- A package type is not a different trip series. Package inclusions are configurable per option.
- `price from` is the minimum *currently valid* published bookable offer for that batch, not the cheapest expired promotion.
- Promotion price and validity must be explicit; no stackable discounts unless later authorized.
- A created booking snapshots each traveler’s package, price, DP, discount/policy, and reference version. Subsequent offer edits affect future bookings only.
- Group invoice = sum of agreed individual line totals + signed authorized adjustments; no implicit group discounts.
- Validate a chosen party size against confirmed free seat capacity at **the admin allocation stage**, not at WhatsApp click.
- Mixed packages within group bookings are **data-supported**, but public mixed-package selector is P1 until explicitly authorized; admin can accurately record a mixed group from a WhatsApp conversation in V1.

**Critical source warning:** Autumn 7–14 Nov 2026 poster presents Rp21m promo and Rp24m regular but a promo validity “31 December” without a coherent year relative to departure, and graphic price typography appears truncated. Never publish these numbers/conditions automatically; manually verify current price and dates.

## 8. Installments: locked contract and calculation

### 8.1 Commercial business rules

- DP/booking-seat payment precedes remaining installments; DP normally contributes to the quoted trip price, pending owner verification (OPEN-02).
- Official plan: monthly **nominal** and installment period(s) recorded at booking; **exact payment date within the applicable month is flexible**, not fixed to one day of month.
- All amounts must be fully settled no later than **departure date minus 30 calendar days** (`Asia/Jakarta` as commercial policy timezone unless explicitly configured); deadline is based on **the actual batch departure**, not itinerary day labels.
- Last monthly period must end by H-30; if H-30 falls mid-month, the last period closes on that day rather than month end.
- Custom simulator is explicitly labeled *estimasi / perlu persetujuan VWS*. It creates **no invoice, seat allocation, booking or guaranteed installment agreement**.
- If H-30 has passed, hide or disable new self-service monthly installment proposals; show truthful “Tanyakan opsi pembayaran ke tim” and never imply credit extension. A manual exceptional agreement requires explicit admin override reason and applicable policy review; it must not be created silently.
- An official schedule cannot have installment month periods after H-30. If exact total cannot be divided evenly, distribute integer rupiah with remainder to the final installment; never lose/add rupiah through rounding.
- DP may be distinct by offer; each member of a group has attributable DP amount, required for partial cancellation/reschedule reconciliation.

### 8.2 Simulator inputs/outputs

Inputs: batch departure, available offer, quantity, effective price, offer DP minimum, current date, eligible payment months, published official plan(s). Custom mode: user-proposed DP and count/periods *bounded by feasibility* and tagged unapproved.

Outputs: price per person, party total, DP total, post-DP balance, schedule by **month**, amount each month, full-payment deadline, explicit “official” or “simulation only” state.

**Illustrative case:** a batch leaving 7 Nov 2026 has H-30 deadline on **8 Oct 2026**. On 15 Oct 2026, monthly installments must not be advertised as available for a *new* booking on that batch. This is an acceptance-test fixture, not permission to publish the batch as currently available.

### 8.3 Payment tracking

- Admin may register DP and subsequent partial/multiple monthly remittances. Recording an amount smaller than expected is allowed and creates a visible remaining amount.
- Payment states: `recorded/pending_verification`, `verified`, `rejected`, `reversed` (with explicit reason and audit). Only **verified** payments decrease outstanding.
- Every installment period has planned amount and month period; cumulative verified allocations may cover more than one period, and must be explicit/traceable.
- Missing installment amounts after a month end are flagged for admin action, *not automatically charged or cancelled*.
- Refunds are distinct money-out records, never negative/erased inbound transfers.

## 9. WhatsApp conversion contract

Canonical destination: `https://wa.me/6285774999875?text=<encoded>`.

Sample generated inquiry (values must be sourced from actual page state):

> Halo Vacay With Strangers! Aku tertarik Japan Autumn Trip — Batch 01 (7–14 November 2026). Paket: Land Tour Only, 2 peserta. Aku mau tanya ketersediaan seat dan skema cicilan resmi. Terima kasih!

If custom simulation selected, state `simulasi custom (belum disetujui)` and include summarized inputs. Never embed PII or private notes in URL. CTA event logging (if consent/settings allow) records `batch_id`, public offer ID and context *without storing WhatsApp message body or the user's phone number*. A click is **not** a booking nor confirmed inquiry received.

## 10. VWS Studio — single-admin experience

### 10.1 Navigation and quick actions

Default after sign-in: actionable Trips/Batch list, not a fake analytics dashboard. Primary navigation:

1. **Trips** — destinations, series, batches, itinerary, pricing and included items.
2. **Bookings** — primary contact, individual/group members, seat allocation, cancellation and rescheduling.
3. **Payments** — verified receipts, installment periods, outstanding balance, refund request/resolution.
4. **Content** — homepage slotting, media, story archive, legal pages, settings.

A modest Settings sub-area controls WhatsApp number, public site info, admin security and audit visibility.

### 10.2 Content editing

- Create destination/series/batch; duplicate an existing **content configuration** to form a new batch.
- Duplicate itinerary days, activities, gallery references, offers only **as draft content**. **Never** duplicate travelers, booking IDs, payments, seat allocations or accounting history.
- Day/activities CRUD with explicit order index, local times, places, descriptions, transit/optional type and linked media; manual reorder accessible by keyboard as alternative to drag/drop.
- Save draft, validation, preview private, publish atomically, unpublish/archive with warnings. Published version remains stable until the new version is published.
- Revisions/rollback must not delete booking snapshots or retroactively rewrite trip history.
- Media manager stores asset attribution, alt text, consent where applicable; optimize assets and preview mobile cropping.
- Homepage configurable featured batch and curated blocks with fallback when batch becomes closed/expired.
- Site legal/terms edited by admin, explicitly published and versioned.

### 10.3 Booking workspace

- Create booking from a WhatsApp conversation manually; reference code, primary payer/contact, one or more travelers, selected offer per traveler, negotiated terms and notes.
- Booking statuses: `inquiry` (if manually saved), `pending`, `confirmed`, `partially_cancelled`, `cancelled`, `completed` (defined workflow transitions; not simply free text).
- Allocate/release seats *explicitly* at traveler level, with owner-visible reason and immediate calculated availability. Admin may confirm a booking before assigning seats but it must be flagged as needing allocation; public capacity counts allocations, not bookings.
- Prevent oversell with atomic DB transaction and row lock for batch capacity; handle simultaneous requests even with Single Admin (multiple tabs or retries).
- Store booked commercial terms as immutable snapshot or auditable adjustment; never silently reprice.
- Attach relevant records (optional proof, consent) in private storage; apply retention and access controls.
- Search by booking code, batch, traveler and status; do not expose PII in public search or logs.

### 10.4 Cancellation/reschedule/refund

- Admin manually initiates cancellation for one or several travelers, or entire booking, with **actor and cause** (`participant_requested`, `organizer_cancelled`, other).
- For *participant-requested* cancellation, mark DP attributable to cancelled traveler(s) as **non-refundable by default**, with documented review of non-DP funds. Do not automatically assume an outcome for organizer cancellation or legally required remedies.
- Refund request states: `requested`, `under_review`, `approved`, `rejected`, `partially_paid`, `paid`, `cancelled`. Money-out transfer requires amount/date/reference and can be recorded only against approval, with auditable exception path if legally required.
- Reschedule may involve one member of a group. **Recommended V1 reconciliation:** create a new linked booking under destination batch for moved travelers, move/credit money only via **explicit ledger adjustments and transfer decisions**, then update source allocations. Never move the entire group or mutate historical batch pointers behind the scenes.
- DP transfer to new batch is admin case-by-case; record approved transfer amount, reason and bilateral agreement; transferring a DP is **not** refunding it.
- Batch or package changes can change price and deadline, but require admin-reviewed amount adjustment and a new installment schedule; preserve old schedule history.
- Batch cancel/reschedule notifications are handled through existing human WhatsApp workflows (no automated sends).

## 11. Admin security and privacy

- Exactly **one active owner/admin user** for V1; no customer registration and no staff invitations.
- Secure authentication, strong password/passkey as provider permits, MFA strongly preferred, rate limiting, session timeout, secure recovery process. An admin email must not be hard-coded as an authorization shortcut.
- Server-side authorization for every admin API, storage object and export; database credentials/secrets server-side only. Apply RLS or equivalent server authorization so anonymous clients cannot read booking, traveler or payment data.
- Separate public and private media buckets/access mechanisms. Signed URLs for private evidence; never expose travel documents or bank details publicly.
- Audit append-only for booking changes, seat operations, financial verification/correction, reschedules, refunds, admin login/security changes and publication events.
- Daily encrypted DB backups plus restoration drill before release. Avoid storing passport number/photo or sensitive identity data unless V1 truly needs it and appropriate notice/security/retention are defined.
- Consent to use traveler photos/stories and a takedown workflow; privacy notice should reflect Indonesian applicable rules and actual integrations (review legally).

## 12. Editorial / visual design system

**Authoritative brand asset:** `KV-Vacay With Stranger.pdf` (7 pages). Reference graphic treatments from provided 2026 poster and onboarding assets. Typography shown in guideline: **Achiko Regular** (expressive/display) and **Sora family** (interface/body). Verify commercial webfont rights and actual font files before shipping; implement safe typographic fallbacks if unavailable.

Colors sampled directly from the brand guideline PDF (confirm as formal design tokens with brand owner):

| Token suggestion | Sample HEX | Usage guidance |
|---|---|---|
| Electric purple | `#5335FF` | expressive large moments; restrained on reading surfaces |
| VWS orange | `#FD562A` | emphasis / selected interactions |
| Neon lime | `#DAFF02` | selective high-energy accents, not long body text |
| Hot pink | `#FF00AA` | rare campaign / accents |
| Deep ink | `#1F1E1F` | text / contrast |
| Warm off-white | `#F3EFEB` | calm editorial canvas |
| Muted purple | `#685BC6` | optional supporting tone |

**Design directives:** editorial hierarchy; real imagery; asymmetry used intentionally; generous visual breathing room; non-repeating section treatments; bright colors used with control; natural Indonesian microcopy with occasional brand-appropriate English. Meaningful states and clear actions matter more than novelty motion.

**Explicit rejection tests (AI-slop gate):** no default SaaS hero patterns, generic gradients, oversized blob/shadow decoration, decorative glassmorphism, excessive pill badges, repeated 3-card sections, random floating stickers, unnecessary tiny subheaders, emoji spam, fake review statistics, counterfeit destination photos, pointless SEO paragraphs, placeholder/draft/internal labels on production.

### 12.1 Mobile/accessibility

- Design from 360/375px upwards; desktop is designed, not stretched. No horizontal overflow for essential information.
- Small screen sticky CTA respects safe areas and never covers input controls or last itinerary rows.
- Components remain usable with keyboard, touch target ~44px, semantic headings, visible focus and descriptive alt text; target WCAG 2.2 AA contrast/usability.
- Motion optional/subtle, honors `prefers-reduced-motion`; lazy-load below-fold media with proper dimensions. Avoid scroll-jacking, forced autoplay with audio and custom cursor interference.
- Image/media focal points and crops editable in studio. Fallback when 0 or 1 media item exist.

## 13. Content and media governance

- Mandatory fields for a published batch: real title, season where appropriate, departure/return date, timezone, destination, itinerary at least one valid day, published offer and price, package inclusions/exclusions, accurate booking/contact state, H-30 deadline and appropriate disclosures.
- Completed trip content may exist with no gallery; gallery comes later, never filled with fake past participants.
- All city/activity timing in attached January and November brochures must be independently confirmed for the intended batch. **Do not merge Jan 2026 day-by-day data into Nov 2026 trip.**
- Travel-document/visa/health/baggage guidance must be dated and verified with authoritative providers before displaying as current compliance advice; do not blindly republish older boarding or visa details.
- Permit draft/published/archived status for documents and optional internal annotations that never reach customer-facing pages.

## 14. Functional acceptance criteria (P0)

### Discovery

- AC-PUB-01: home with no active Open batch still looks complete; no invented departure dates/prices.
- AC-PUB-02: changing country/month/season filters returns correct batch set and accessible empty state.
- AC-PUB-03: full/closed trips never promise guaranteed seats; counts match active seat allocations.
- AC-PUB-04: batch switching updates canonical URL, itinerary, offers, deadline and WhatsApp context.
- AC-PUB-05: public never sees any unpublished draft revision.

### Pricing and installments

- AC-PRI-01: published Full and Land offers display distinct inclusions, prices and meeting arrangements.
- AC-PRI-02: expired promos do not affect displayed price-from or booking snapshots.
- AC-PRI-03: headcount changes totals exactly in integer IDR; no floating-point discrepancies.
- AC-PAY-01: official plans always end no later than H-30.
- AC-PAY-02: monthly payment can be received on any day in its month, subject to final H-30 cutoff.
- AC-PAY-03: for departure 2026-11-07 and now 2026-10-15, new installment schedule is **unavailable**.
- AC-PAY-04: custom simulation is explicitly not guaranteed and cannot create booking/seat allocation.
- AC-PAY-05: partial payment accurately reduces outstanding; rejected/unverified payment does not.

### Admin and operations

- AC-ADM-01: creating a new destination/series/batch and publishing it needs zero code deployment.
- AC-ADM-02: duplicating a batch copies only content/pricing configuration, never bookings or money records.
- AC-ADM-03: one changed itinerary draft does not alter public content until publish.
- AC-ADM-04: two simultaneous seat allocations cannot exceed batch capacity, including same admin in two tabs.
- AC-ADM-05: group booking with 3 travelers can cancel or reschedule 1 without removing other 2.
- AC-ADM-06: DP is non-refundable on participant cancellation unless policy/lawful exception is documented; other refund amounts are manually decided.
- AC-ADM-07: DP transfer on reschedule only after explicit admin decision; no implicit migration.
- AC-ADM-08: old booking price/policy preserved after live offer update.
- AC-ADM-09: a recorded refund has distinct approval and actual payout states; money is never erased.
- AC-ADM-10: authenticated admin-only routes and private files reject anonymous requests.
- AC-ADM-11: publishing/editing does not emit placeholder/demo/internal wording on public pages.

### Reliability and usability

- AC-QA-01: workflows usable at 360px, 768px, 1440px and with keyboard-only navigation.
- AC-QA-02: no broken images or content jumps; tests cover no-media and no-batch cases.
- AC-QA-03: no public PII leaks via SEO, analytics, API, browser cache or source code.
- AC-QA-04: backup and restore tested with real relational integrity.

## 15. Technical architecture (proposal, not yet vendor-locked)

- Responsive server-rendered web stack appropriate for Antigravity; recommended **Next.js + TypeScript**, custom design tokens/components, accessible semantic HTML.
- **PostgreSQL** is the recommended transactional database; exact provider (Neon/Supabase/managed Postgres) requires approval. ORM/SQL migrations must enforce critical constraints at database level, not frontend-only.
- Secure server functions/API for admin writes, seat allocation and payment/refund transactions. Never put privileged database credentials in the browser.
- Object storage (e.g. S3-compatible/R2) for optimized public media and permissioned private evidence. Exact provider TBD.
- Transactional audit logs, canonical URL/SEO metadata, sitemap for public pages, robots disallow/noindex admin, dynamic Open Graph media fallback.
- Optional privacy-conscious analytics only for aggregate content engagement and WhatsApp CTA clicks; no automatic insertion of third-party pixels.
- Configurable deployment and backup; initial hosting unspecified, maintain portable environment variable configuration.

**Important:** This technology choice is a recommendation, not a silent commitment. Antigravity must present architecture, tradeoffs, operating costs and migrations for approval prior to implementation.

## 16. Delivery phases and QA/release gates

| Gate | Deliverables | Pass criteria |
|---|---|---|
| G0 — Discovery lock | PRD/ERD, open policy confirmations, actual brand/media inventory | No unresolved P0 ambiguity hidden as a guess |
| G1 — Design foundation | responsive wireframes for home/explore/trip detail + VWS Studio, tokens | Creative review approves non-slop design before broad page implementation |
| G2 — Data and auth | migrations, access control, seed strategy, backup restore | Relational tests, anonymous data isolation, migration rollback tested |
| G3 — Public browsing | Home/Explore/Detail/Archive/About, real CMS publishing, WhatsApp | Real-state UI and mobile testing; no fake production data |
| G4 — Booking and finance | group bookings, manual seats, official plans, receipts, refunds, reschedule | Edge-case integration tests and ledger reconciliation pass |
| G5 — Production readiness | accessibility, performance, security, editorial QA, disaster recovery | Complete acceptance matrix, owner sign-off, no critical/high bugs |

**Stop-the-line:** failed gate must be fixed and rechecked; no automatic promotion to the next phase. No production deployment without owner authorization. No internal status labels or developer notes may appear in public production.

### 16.1 Test scenario matrix

1. Trip available but no seats allocated; verify capacity display and CTA.
2. Two admins tabs allocate last seat simultaneously; only one succeeds.
3. 3-person group: 1 participant cancels with DP and partial installments; remaining 2 preserve their price and seats.
4. 1 group participant reschedules to another batch, DP transfer rejected; source/target bookings and ledgers reconcile.
5. Same move with DP transfer approved; only approved amount credited, source transfer recorded, no double-counted receipt.
6. Full vs Land offers show different inclusions and price-from; early bird expiry changes only new quotes.
7. Plan starts close to departure; impossible months absent; H-30 at month midpoint.
8. Partial remittance recorded/pending vs verified; duplicate bank reference detection and reversal audit.
9. Cancelled by VWS scenario **does not** blindly apply participant DP policy.
10. Published itinerary edited in draft and previewed; public old revision remains until approved publish.
11. No trip/gallery state and content image failures have designed empty/fallback state.
12. Anonymous user cannot fetch admin APIs, traveler details or private receipt media.

## 17. P0/P1/deferred scope register

| Feature | Phase | Comments |
|---|---|---|
| Five public page families + core legal pages | P0 | No unnecessary site sections |
| Immersive hero + editorial upcoming batch | P0 | Image-first; video optional |
| Batch filtering, itinerary explorer, responsive status | P0 | Actual published data only |
| Multiple offers Full/Land and optional room variants | P0 | Offer publication & immutable snapshots |
| Official installments, custom non-binding planner, H-30 | P0 | Dates flexible within month |
| WhatsApp CTA with selected context | P0 | No outbound automated messaging |
| Single-admin CMS, preview, publish, batch duplication | P0 | Revision-consistent |
| Group bookings, seat allocations and finance ledger | P0 | Manual decisions, atomic constraints |
| Manual refund/reschedule with audit | P0 | No rules engine for amounts |
| Real past media, consented stories, settings | P0 | Can start with sparse content |
| Self-service downloadable itinerary PDF | P1 | Not explicitly approved as must-have; optional after stable content |
| Public mixed-package group pricing UI | P1 | Admin supports mixed groups in V1 |
| Advanced analytics and performance dashboards | Deferred | Avoid faux SaaS visuals |
| Traveler login, payment gateway, automated reminders | Deferred | Outside V1 |
| Multiple admin roles and self-service groups | Deferred | Outside V1 |

## 18. Open requirements — do not let implementation invent policy

**Blocking for production acceptance (may build schema/UI with placeholders; must approve before live publication):**

| ID | Missing owner decision / confirmation | Safe interim rule |
|---|---|---|
| OPEN-01 | Final verified price/DP per published Full/Land/Sharing/Private offer and promo dates; exact November promo poster inconsistencies | No public numerical offer until confirmed in admin |
| OPEN-02 | Is DP included in total price, and DP requirement per traveler vs booking? | Model per-traveler DP allocated within total; mark as tentative until approved |
| OPEN-03 | Exact monthly-period rule: payment by end of calendar month, and handling of overdue/short-paid installments | Default display monthly periods; flag shortfall after end-of-month; **no automatic penalty** |
| OPEN-04 | Official plan qualification when H-30 already passed; is a late cash/full settlement exception allowed? | Disable new official installments; admin-only review and document exception |
| OPEN-05 | Specific cancellation terms and refund disclosure wording; organizer cancellation handling | Non-DP refund remains admin decision; legal terms must be approved |
| OPEN-06 | Consent/privacy language, retention schedule, whether passport/visa data will be recorded in Studio | Minimize fields; do not implement passport upload by default |
| OPEN-07 | Actual upcoming batch dates, duration, inclusions, meeting points, accurate package offers, and publication approval | Store as unpublished staging seed; do not publicly claim availability |

**Important but non-blocking for schema design (defaults are explicitly provisional):**

| ID | Question | Proposed default |
|---|---|---|
| OPEN-08 | Show numeric remaining seats? | Only status by default; optionally turn on exact counts |
| OPEN-09 | Allow mixed Full/Land offers within one group on public calculator? | Admin-side yes; public calculator same offer for selected group until P1 |
| OPEN-10 | Storage/hosting/auth/Postgres provider and budget | Use portable architecture, require architecture approval |
| OPEN-11 | Rights to Achiko webfont and original trip photography, including participant consent | Do not ship unlicensed fonts/media |
| OPEN-12 | Use IDR only and Indonesian as primary site language? | IDR and Bahasa Indonesia; natural English as brand flavor |
| OPEN-13 | Booking invoice grouping and optional batch-by-batch credit carryover in partial reschedule | Use linked new booking and explicit credit adjustment for moved participant |
| OPEN-14 | Should VWS Studio export bookings/reconciliation as CSV? | Optional small P1 enhancement, not P0 |
| OPEN-15 | Which content sections/real images should be featured first? | Admin-selected; fallback gracefully |

**Decision rule:** Unresolved item ≠ permission to improvise policy, invent trip inventory, invent traveler stories, or broaden technical scope. If information cannot be confirmed, render honest states or hold affected publication.

## 19. Source mapping / provenance

- `KV-Vacay With Stranger.pdf`, pages 1–6: logo/visual direction, **Achiko and Sora** typography, color fields, moodboard and graphic elements. Sampled color values in §12 are extraction from PDF and require brand-owner sign-off as application tokens.
- `Vacay With Strangers Autumn 2026.jpg` and `Vacay With Strangers Autumn 2026 (2).jpg`: 7–14 Nov 2026 autumn example; destination and promo/pricing layout; numerical/travel claims require validation before publishing.
- `Vacay With Strangers General Itinerary - 7-14 November 2026-03.jpg`: example November itinerary structure, subject to changed agenda.
- `Onboarding Winter In Japan 9 - 14 January 2026 |Vacay With Strangers .pdf`: previous-batch onboarding and unusually detailed time-specific itinerary, useful for data model and editorial depth, **not reusable as another batch’s live schedule**.
- `[Itinerary 9-14 January] Winter In Japan-Vacay With Strangers.pdf`: alternative operational January schedule; differs in timing from onboarding presentation, underscoring the need for published revision and authoritative admin confirmation.
- Owner decisions in this discussion through **15 Oct 2026** override older template/example values for the product.

---

**Change control:** Any addition outside the P0 list requires an explicit owner decision and PRD/ERD amendment before implementation. The design team may propose, but cannot silently implement extra features or restyle the brand away from this direction.
