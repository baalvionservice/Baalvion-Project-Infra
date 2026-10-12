# trade.baalvion.com — end-to-end trade roadmap

Goal: one platform where an importer or exporter can book a container and a ship, clear
customs, produce customs documents and clear goods into another country according to the
product's standards. Nothing here is considered done until it works against the real
counterparty, not a simulation.

How this file works: work one item at a time. When an item is finished and verified it is
moved to `DONE.md` in this folder and removed from here. Each item lists what only a human
or partner can do (**Owner**) and what is code (**Code**).

Started 2026-10-13. Status of the live site on that date: the login page, sign-in role guide,
KYC flow, ports/countries/tariffs pages and shipping directory are live. Nothing below has
been proven end to end with a real shipment.

---

## Item 1 — Customs filing rights  (IN PROGRESS — code built, waiting on a real broker)

Problem: the ICEGATE / ACE / EU / UAE Mirsal / China Single Window connectors are built but
cannot file without accredited access. Software cannot create that access.

**Owner (human / business)**
- [ ] Pick the first corridor (suggested: India <-> UAE).
- [ ] Sign a licensed customs broker / CHA in each country to file under their rights.
- [ ] Get from each broker: API or file-drop spec, test environment, status webhook, fee terms.
- [ ] Decide whether Baalvion also applies for its own direct access later (ICEGATE MEF, CBP ABI).

**Code**
- [x] A `broker` channel next to the five government channels, so a declaration can be
      handed to a partner broker and its filing status tracked on the same state machine.
- [x] Per-country routing: which countries go to the broker, which to a direct gateway.
- [x] Inbound status webhook from the broker (signed, replay-protected).
- [x] Readiness endpoint shows broker channel state like the others.
- [x] Tests for the connector, the routing and the webhook.

Code status (2026-10-13): built and tested locally (17 new tests; HTTPS round trip against a local
server). Not yet run against a real database for the webhook path, and no real broker exists yet,
so none of this has filed anything. The contract the broker must implement is in
`service/customs/connectors/brokerConnector.js`.

Done when: one real declaration is filed through a real broker's test environment and its
acknowledgement comes back into the shipment.

## Item 2 — Real carrier booking

Problem: the Maersk, DHL, FedEx and UPS connectors are labelled placeholders and simulate
until real API credentials are set. No live rates, space confirmation or bill of lading.

**Owner**
- [ ] Open API accounts with at least one ocean carrier (Maersk first) and one air/express.
- [ ] Obtain production credentials and the carrier's terms for rebooking and cancellation.

**Code**
- [ ] Replace the placeholder with the carrier's real API for rates, booking and B/L.
- [ ] Wire the carrier schedule feed into the existing `/sailing_schedules/import`.
- [ ] Remove the simulated path for any carrier that has credentials; fail loudly otherwise.

Done when: a real quote and a real booking confirmation come back for one lane.

## Progress log
- 2026-10-13 — Item 3: the maritime screens already read the real tracking API (the Sept note about hard-coded vessels is out of date). Only the AIS feed is missing.
- 2026-10-13 — Item 4: audited. HS/duty data is 38 codes x 5 countries and says itself it is illustrative; sanctions data was 13 rows. Sanctions replaced with the real OFAC + UN + EU lists (26,659 parties) on branch `feat/trade-service-real-sanctions-lists`, local only. Tariffs/duties and per-country import requirements are NOT done.

## Item 3 — Live ship tracking

Problem: backend tracking exists, but the maritime screens read hard-coded arrays (verify
whether this is still true) and there is no AIS feed.

**Owner**
- [ ] Choose an AIS data provider and obtain a key.

**Code**
- [ ] Verify `governance/maritime` and `intelligence-hub/maritime` against the real API.
- [ ] Ingest AIS positions into the tracking engine; show real vessel positions.

Done when: a vessel on a real booking shows its real position.

## Item 4 — Product standards and import requirements by country

Problem: HS-code and compliance tables exist, but verified per-country import requirements
(licences, BIS, CE, FDA, SPS, labelling) are not loaded. This data must be real and
sourced. It must never be generated.

**Owner**
- [ ] Choose the first products and corridor.
- [ ] Source the requirements from each authority, with a link for every rule.

**Code**
- [ ] Measure what the compliance tables currently hold, per country and HS chapter.
- [ ] Load the verified rules with source and as-of date on every row.
- [ ] Show the importer the exact requirements for their product and destination.

Done when: for the pilot products, the platform lists the real requirements and flags a
shipment that fails them.

## Item 5 — KYC verification vendor

Problem: the KYC flow works, but every decision is manual. No document check, face match or
liveness.

**Owner**
- [ ] Choose a vendor (Onfido, Persona, Jumio, Veriff, Sumsub class) and sign.

**Code**
- [ ] Plug the vendor into the existing liveness endpoint and document check.
- [ ] Keep a human review step for borderline results.

Done when: a real identity document is verified automatically and logged.

## Item 6 — Door to door

Problem: inland trucking and rail booking and last-mile delivery are not clearly covered.

**Owner**
- [ ] Choose inland haulage partners for the pilot corridor.

**Code**
- [ ] Audit what the logistics and warehouse modules do today.
- [ ] Add inland leg booking and tracking linked to the shipment.

Done when: a shipment shows every leg from seller's door to buyer's door.

## Item 7 — Money

Problem: gateways exist, but PayPal for GTI is uncommitted local work, and letters of credit
and trade finance need bank partners.

**Owner**
- [ ] Bank partner for letters of credit / trade finance.
- [ ] PayPal live credentials, if PayPal is wanted on GTI.

**Code**
- [ ] Review, test and commit the GTI PayPal work.
- [ ] Letter-of-credit workflow once a bank partner is chosen.

Done when: a real payment settles and reconciles on the ledger.

## Item 8 — Business and legal

**Owner**
- [ ] Freight-forwarder / NVOCC licence, or a partner who holds one.
- [ ] Cargo insurance partner.
- [ ] Terms of service and liability terms reviewed by counsel.

**Code**
- [ ] Surface the licence holder and terms in the booking flow once decided.

---

## Rules for this file
- Real data only. No fabricated rates, requirements, bios or statistics.
- An item moves to `DONE.md` only after it has worked against the real counterparty.
- Anything that spends money, files with an authority or touches production needs explicit
  approval first.
