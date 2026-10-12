# Who to contact and what to give Claude — per roadmap item

Companion to `END-TO-END-TRADE-ROADMAP.md`. Written 2026-10-13.

Caveat: provider names are real, but I have not checked their current pricing, approval
times or which countries they accept. Confirm each on the provider's own site before paying
or signing. Never paste secrets into chat. Put them in a local `.env` file (git-ignored) and
tell Claude the variable names; production values go into the server's env, not the repo.

## How hand-over works
1. You sign up / sign the agreement.
2. You give Claude: the **API documentation link**, a **sandbox or test account**, and the
   credentials as env-var values in a local file.
3. Claude builds and tests against the sandbox, then you approve before anything touches
   production or spends money.

## Start with these four (they unblock the most, mostly free to begin)
1. **A licensed customs broker in India and one in the UAE** (item 1) — everything else in
   customs depends on this.
2. **Maersk developer account** (item 2) — free sign-up, and it covers rates, booking, schedules.
3. **An AIS vessel-position key** (item 3) — free tier exists.
4. **A KYC vendor sandbox** (item 5).

---

## Item 1 — Customs filing
| Need | Who | What to ask for | Give Claude |
|---|---|---|---|
| India broker | A CBIC-licensed Customs Broker (CHA) with ICEGATE access | API or file-drop spec, test environment, status webhook, fees, who is declarant of record | API docs, test credentials -> `BROKER_*` vars |
| UAE broker | A Dubai Customs-registered clearing agent on Dubai Trade / Mirsal 2 | Same | Same |
| US (later) | A CBP-licensed customs broker on ACE | Same | Same |
| Own direct access (optional, later) | CBIC ICEGATE (India), Dubai Trade, CBP ABI | Enrolment packs | Cert/key paths + IDs (`ICEGATE_*`, `MIRSAL_*`, `ACE_*`) |

What Claude has already built: the broker channel. It needs the broker's real API to be
mapped onto it.

## Item 2 — Carrier booking, rates, schedules
| Need | Who | Give Claude |
|---|---|---|
| Ocean carriers | Maersk developer portal; also CMA CGM, Hapag-Lloyd and MSC APIs. Many follow DCSA standards, so one adapter can cover several | Client id/secret + sandbox access |
| Air / express | DHL, FedEx and UPS developer portals | API keys per carrier |
| Rate aggregator (optional) | Freightos, Xeneta, SeaRates | Key + docs |
| Booking for carriers without an API | A freight forwarder partner | Their booking process/API |

Claude replaces the "(PLACEHOLDER)" connectors with real calls and wires the carrier
schedules into the existing `/sailing_schedules/import`.

## Item 3 — Live vessel and container tracking
| Need | Who | Give Claude |
|---|---|---|
| AIS positions | AISstream (free websocket), MarineTraffic, VesselFinder, Spire Maritime, Datalastic | API key |
| Container tracking (optional) | Terminal49, ShipsGo, carriers' own track-and-trace APIs | API key |

## Item 4 — Product standards and import rules per country
This is a data and authority problem, not an API problem. Real sources only, each rule
linked to its source and dated.
| Need | Source |
|---|---|
| Tariffs and trade stats (free) | UN Comtrade, ITC Market Access Map, WTO tariff data |
| India | DGFT (licences, ITC-HS), BIS (certification), FSSAI (food), CDSCO (medical), customs notifications |
| UAE | MoIAT / ECAS (conformity), Ministry of Climate Change (some goods), Dubai Customs |
| EU / US | EU TARIC, CE/REACH; US FDA, USDA, CPSC, FCC |
| Paid duty/compliance API (optional) | Avalara Cross-Border, Zonos, Descartes |

Give Claude: the first products (HS codes) and corridor. Claude loads them with a source
link and an as-of date on every row. Nothing is generated.

## Item 5 — KYC
| Who | Give Claude |
|---|---|
| One of: Sumsub, Persona, Onfido, Veriff, Jumio | Sandbox keys + webhook secret |
| Sanctions screening (optional paid) | ComplyAdvantage, Dow Jones, or free OFAC/UN lists |

## Item 6 — Door to door
| Need | Who |
|---|---|
| Inland trucking / rail | A haulage partner or aggregator in each pilot country |
| Warehousing / CFS | A container freight station partner at the pilot ports |
Give Claude: their booking API or process.

## Item 7 — Money
| Need | Who | Give Claude |
|---|---|---|
| PayPal on GTI | PayPal business account | Live client id/secret |
| Letters of credit / trade finance | A bank with trade-finance products | Their onboarding + API/process |
| Cross-border payouts / FX (optional) | Wise Platform or a bank | Keys |
Existing gateways (Razorpay, Stripe, PayU, Cashfree) already have code.

## Item 8 — Business and legal  (no code needed first)
- A lawyer who knows freight forwarding and customs in India and the UAE: licences you need
  (e.g. multimodal transport registration, freight-forwarder rules), liability, terms.
- A marine cargo insurer or broker for cover on shipments.
- Decide who is the contracting party with the shipper: Baalvion, or the broker/forwarder.

---

## What Claude can do with no partner at all
- Build every adapter against the provider's sandbox the day you hand over keys.
- Wire free data now: UN Comtrade statistics, AISstream ingestion once a free key exists.
- Fix the maritime screens and measure how complete the compliance tables are today.
- Review and commit the GTI PayPal work.
- Pilot-readiness checklist and a test shipment script for the first corridor.
