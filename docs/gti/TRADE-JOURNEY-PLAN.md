# One connected trade journey — plan and status

Last updated 2026-10-13. Facts were checked in the code, on a local copy, and (where stated) on
production. "Built" means built and tested; nothing here is deployed yet.

## The aim
Baalvion owns one unified trade experience and coordinates the ecosystem; authorised partners
(forwarders, customs brokers, banks, insurers) provide their specialist services inside it.
Everyone party to an order sees **one shared order journey**, each with only what their job needs.

| Step | Who acts | What happens |
|---|---|---|
| 1. Request and offer | Buyer, seller | Quote request -> offers -> a deal |
| 2. Order confirmed | Buyer, seller | The deal becomes an order |
| 3. Documents | Seller (+ buyer) | Invoice, packing list, certificate of origin, bill of lading |
| 4. Book transport | Seller or buyer, forwarder | Freight quote -> container booking -> shipment |
| 5. Customs | Customs broker, authority | Export then import clearance |
| 6. In transit | Everyone | Tracking, delays, alerts |
| 7. Delivery and payment | Buyer, bank | Proof of delivery, escrow released |

## Decisions (owner, 2026-10-13)
1. **Parties:** buyer, seller, assigned freight forwarder, customs broker, bank or payment provider,
   insurer, and an assigned trade agent. Each organisation is linked to the order explicitly, with a
   defined role and defined permissions.
2. **Access:** a forwarder or broker sees only what its work needs — relevant shipment, booking,
   customs information and authorised documents — and never prices, margins, payment details or
   unrelated documents unless explicitly authorised. Enforced in the backend and the database.
3. **Partners:** independent organisations onboard, are verified, invited and assigned, with
   role-based access from the start. First release: sellers work with existing partner forwarders and
   brokers while Baalvion tracks the journey. The design must let partners later manage bookings
   inside Baalvion without a redesign.
4. **First corridor:** India <-> UAE. Other corridors later, with no country assumptions in the core.

Direction: parties model and secure access first; one shared journey reusable across all 10 role
dashboards; event-driven hand-offs, reliable status and audit logs; do **not** present settlements,
letters of credit, contracts or approvals as operational until their real workflows exist;
integration-first so partners connect progressively.

## Correction to what I said earlier
I said "the database already links the steps". That overstated it. Checked properly:
- There are **two order systems with incompatible ids**: `oms.orders` (uuid; the live one, served by
  the order-execution service) and `trade.orders` (integer; the older one that shipments, escrows,
  payments and disputes point at with foreign keys).
- Several journey tables (bills of lading, customs entries, freight bookings, freight quotes,
  insurance policies, certificates of origin) store the order as **free text with no foreign key**.
- `tradeops.trade_operations` (uuid order id) is the intended spine, but it is only created at one
  point: when a freight booking is materialised. Nothing exists for the steps before booking.

So the connections are looser than I first described, which is why the journey needs its own root.

## Blockers found, and how Step 1 handles each

**1. Row-level security does not protect anything in production today. (critical)**
Measured on production today: the only database role is `baalvion_app`, it is a superuser with
`bypassrls`, and 125 trade tables have row security on, forced, and inert. Superusers ignore every
policy. Your decision 2 (database enforcement) is therefore not achievable by policies alone yet.
*Handled:* the journey tables have correct policies, tested **as a non-superuser role**, plus a
second restricted connection the journey module can use on its own
(`scripts/create-journey-db-role.sql`, `JOURNEY_DB_USER` / `JOURNEY_DB_PASSWORD`). Until that role
exists, the module enforces the same rules in the application, using the same `party_can` function
the policies use, and `GET /v1/order_journeys/_status` says `application-only` plainly.
*Needs from you:* someone with database admin rights to run that script on production and set the two
variables. Cutting the whole platform over to a non-superuser role is a much larger, separate
project (an earlier audit found it would take the Java finance services down if done naively).

**2. Two order systems, two id types.** *Handled:* the journey keys on the live order (`oms.orders`,
uuid) and carries no foreign key to it, so the two services' migrations stay independent; the order
service opens the journey. *Later:* bridge the downstream records (bookings, customs entries,
documents) to the journey; the free-text order ids need cleaning up as they are linked.

**3. Where a journey is opened.** *Handled:* by the order service, over a signed request
(`POST /v1/internal/order-journeys`, HMAC, five-minute replay window, refuses everything when no
secret is set), because only it knows who the buyer and seller are. *Needs:* the order service to
make that call when an order is confirmed (Step 4).

**4. There is no "customs broker" organisation type.** The platform has `customs_authority`, which is
the government body, not a private licensed agent. *Handled for now:* a logistics provider or trade
agent can hold the broker role. *Needs your decision:* add a `customs_broker` type (a database check
in the identity service, the organisation list in the frontend, and an 11th dashboard).

**5. Two organisation vocabularies.** trade-service's own table says `carrier` and `insurer`; the
platform identity says `logistics_provider` and `insurance_provider`, and trade-service rows exist
only for organisations that completed KYC. *Handled:* the lookup translates the two names and only
accepts active organisations. *Recommended:* an internal organisation-directory call to the identity
service, so there is one source of truth.

**6. Price is spread across many tables.** The journey table has no price column at all (a test
asserts it), but `trade_operations` carries `total_value` and buyer/seller ids. Later steps must read
logistics data through journey-aware views, never from those tables directly, for service providers.

## Step 1 — built and tested
**Database (migration 089):** `order_journeys` (no commercial columns), `order_parties` (role,
status, permissions, document scopes, or an external partner that is tracked but has no login),
append-only `order_party_events`, `order_party_directory` view, row-level policies, and database
constraints that forbid a forwarder or broker from ever holding `commercial.view` or `payment.view`.
**Application:** roles and permissions as plain data (`service/journey/permissions.js`), journey and
party operations, signed internal ingress, and routes under `/v1/order_journeys`.
**Rules:** an outsider gets "not found" (never "forbidden"), an invited organisation can only accept
or decline, removing a party ends access at once, every change is audited in the same transaction,
a price-bearing document needs an explicit value permission, and nothing in the rules mentions a
country.
**Tested:** 27 database checks as a non-superuser role; 55 rule and service checks run in both
enforcement modes with identical answers; an end-to-end walk through the real login, the site's API
proxy and the gateway (27 checks). Architecture contract (C1–C8) clean; existing suites unchanged.

## What is not done
- The journey **read model** (the seven steps and who acts next) and the **page**: Steps 2 and 3.
- Hand-offs between steps and the order service's call to open a journey: Step 4.
- Invitations to organisations not yet on the platform beyond tracking them as external parties.
- The restricted database role on production, and the `customs_broker` type: need your action/decision.

## Next
2. Journey read endpoint: the seven steps, state, next actor, linked records, filtered per party.
3. Journey page in plain words, phone and iPad friendly, reusing the new dashboard building blocks.
4. Hand-offs and the order service's call.
5. Replace the unbacked steps (settlements, contracts, approvals) with real workflows.
6. The other eight dashboards, reading from the journey.
