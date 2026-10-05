# Baalvion publicity and investor readiness: pending work

Last updated: 2026-10-05. Everything in the "Verified facts" section was checked against the incorporation
record, the code, the live sites, or a named published source. Anything not verified is under "Pending".

If Baalvion is approached by press or investors tomorrow, read sections 1 to 3 first.

---

## 1. The one rule that shapes everything

Baalvion Industries Private Limited is a **private limited company**. Under Section 42 of the Companies Act,
2013 it may not advertise or solicit investment from the general public. A private placement goes to
**identified persons only**, up to 200 per financial year, with Form PAS-4.

- Public, indexable pages tell the story and show the progress. They never make an offer.
- The raise (amount, use of funds, terms), equity grants and projections stay **behind the invitation gate**
  on ir.baalvion.com (`src/lib/invite-gate.ts`). The gate fails closed: with no invitations configured, nobody gets in.
- Converting to a public limited company does not by itself allow public fundraising. A public offer needs a
  prospectus (s.26) and, in practice, an SEBI-compliant issue.
- The company secretary or lawyer should approve the final wording before anything is announced.

---

## 2. Verified facts (safe to state publicly)

| Fact | Source |
|---|---|
| Legal name: Baalvion Industries Private Limited | `@baalvion/company` |
| Incorporated 11 March 2025, CIN U43121OD2025PTC048479 | `@baalvion/company` |
| Directors: Deepak Kumar Kuldeep (publicly known as Allen Krewzz) and Dilip Kumar Kuldeep | Owner, live leadership page |
| Global trade in goods and services reached about $35 trillion in 2025 | [UNCTAD](https://unctad.org/news/global-trade-hit-record-35-trillion-despite-slowing-momentum); WTO gives $34.65T ([WTO, March 2026](https://www.wto.org/english/res_e/booksp_e/gtos0326_e.pdf)) |
| Trade-finance gap is about $2.5 trillion, roughly 10% of trade | [ADB, 2025 survey](https://www.adb.org/publications/adb-global-trade-finance-gap-survey) |
| 14 sites answer HTTP 200 (checked 2026-10-05) | Live check; see section 4 |
| GTI: public site and trade reference data are live; the trading platform behind sign-in is not | Live test; see section 5 |

Wording to use: Baalvion operates within a roughly $35 trillion global trade ecosystem. **Do not call $35 trillion a
"market cap" or Baalvion's market.** It is the value of trade, not revenue Baalvion can earn.

### Do not claim (not verified)
- That the AI agents (sanctions screening, route optimisation, HS-code classification) are live. They are built and ready to deploy.
- That trade flows are onboarded, or any revenue, customers, pilots or volumes.
- "Category leader", "most ambitious technology conglomerate", "four live platforms", Mining as live.
- "~80% of trade is un-digitised", a serviceable-market figure, or any growth or margin projection.
- Any investor-day, earnings call, webcast, filing or press-release history. None exists.
- The $50M amount, the planned $100M round, equity percentages or valuations, on any public page.

---

## 3. Decisions and inputs needed from the owner

| # | Needed | Why |
|---|---|---|
| 1 | Real product stage: which pieces run for real users, which are built only | Blueprint and every investor claim depend on it |
| 2 | How Baalvion charges (per shipment, subscription, percentage) | Investors ask how it earns |
| 3 | Real use-of-funds split for the $50M | The old 40/30/20/10 split was invented and has been removed |
| 4 | The numbers that would trigger the later $100M round | Milestone story |
| 5 | Any revenue, customers, pilots or letters of intent | The only traction we can show |
| 6 | Check the 80% / 20% founder split against the register of members | Printed on the public ownership page |
| 7 | Whether a founder "veto" exists in the Articles of Association | Removed from public pages until confirmed |
| 8 | Titles for Tamanna Shaikh and Adarsh Patra (owner says both CEO; of what?) | CMS leadership page, and the old blueprint conflicts |
| 9 | Add the public name "Allen Krewzz" to Deepak's profile in the CMS admin console | Leadership page comes from the CMS, not code |
| 10 | Soften the "AI-native category leader" headline on why-invest | Hard to defend with no live customers |
| 11 | Lawyer / company secretary review of all investor wording | Section 42 |
| 12 | Governance Overview lists "Restated Certificate of Incorporation", "Bylaws", committee charters | US listed-company terms; confirm they exist for this company or replace |
| 13 | Decide whether to keep the Straits Research trade-finance revenue figure (~$51B) | Commercial source, labelled "indicative" |

---

## 4. Site status

14 of the 15 sites the registry calls live answered HTTP 200 on 2026-10-05.

| Site | Tested in a real browser | State |
|---|---|---|
| baalvion.com | Yes, 21 pages, zero errors | Done |
| ir.baalvion.com | Yes, live site and a production build | Done; open items in sections 3 and 5 |
| trade.baalvion.com (GTI) | Yes, 24 pages | Auth console error fixed; server work pending (section 5) |
| marketunderworld.com (Insiders) | No | Test next |
| about.baalvion.com | No | Test next |
| ships.baalvion.com | No | Test next |
| signal.baalvion.com | No | Test next |
| jobs.baalvion.com | No | Test next |
| imperialpedia.com | No | Test next; see existing AdSense notes |
| lawelitenetwork.com | No | Held on purpose (AdSense); see existing notes |
| community.marketunderworld.com | No | |
| canwemarry.baalvion.com | No | |
| proxy.baalvionstack.com | No | |
| amarisemaisonavenue.com | No | |
| controlthemarket.com | n/a | **Down.** Marked not launched in the registry |

Not live (registry): mining, connect, dashboard, help, newaiskillsteam. They show "In development" on baalvion.com with no links.

---

## 5. Technical work still open

**GTI (trade.baalvion.com)**
- `/trade-bff/` returns 404 for every path on production, so **sign-in fails**. The route has to be added to the real Caddy config on the server (`/opt/baalvion/stack`, not tracked in this repo).
- The trading backend's database (Prisma, 57 models) is not set up on the production box (see `deploy/stack/caddy/Caddyfile`).
- The home page says "sign in to see it running". Change that copy until sign-in works.
- React hydration error #418 on 13 pages. Production builds only; not reproduced locally.

**ir.baalvion.com**
- Pages held behind the invitation (modelled numbers that are not real): `/financials`, `/use-of-proceeds`, `/market-opportunity`, `/news-and-events/*`, `/governance/committee-composition`.
- After deploy, **nobody can open the held pages until invitations are configured** (`IR_INVEST_INVITES`, one entry per named person; `pnpm invite:new`).
- The invite-only $50M room is **not built**.
- `/invest/blueprint` (the old founder blueprint) is internal and still contains wrong facts: Mining as live, "$33 trillion", draft leftovers, `[To hire]` slots. Rebuild once section 3 is answered.
- `src/components/sections/thesis-section.tsx` has invented Y1 to Y5 bars and an invented allocation split. It is registered but not rendered on the live site. Delete it.
- Next.js warns that `src/app/sitemap.ts` and `src/app/sitemap.xml/route.ts` both resolve to `/sitemap.xml`.

**Registry (`@baalvion/sites`)**
- Two tests already failed before this work: the site count (test expects 19, registry has 21) and "an unassigned site says so".
- `market.baalvion.com` is referenced by baalvion.com but is not in the registry.

**Search and analytics**
- Add each site in Google Search Console (domain property) and submit its sitemap. Also Bing Webmaster Tools.
- The GTM container (GTM-MFDQSXT5) and the Cloudflare beacon are now allowed in ir.baalvion.com's content security policy. Confirm tags fire after deploy.

---

## 6. Deploy checklist (manual)

Merging to `main` builds and pushes images to GHCR (`build-hostinger-images.yml`). It does **not** deploy. The live sites change only when someone pulls the images and restarts the containers on the Hostinger box.

1. Follow `docs/operations/vps-health-and-safe-deploy-runbook.md`.
2. Deploy **ir.baalvion.com first**. The old `/strategic-operator` page (founder ownership split, "Supreme Veto", co-founder equity offers) is publicly reachable on the live site until this ships.
3. Then baalvion.com, then GTI.
4. After each: load the pages in a browser, confirm no console errors, confirm held pages redirect to `/invest/request-access`, confirm sitemaps list only public pages.

---

## 7. Where the work lives

Four pull requests plus this document, each on its own branch from `main`:
- `feat/baalvion-com-investor-story`: investor story, company facts, dead links, structured data.
- `feat/ir-investor-readiness`: sourced market figures, claims corrected, held pages, public ownership and program pages, CSP, H1s.
- `fix/gti-skip-session-check-on-public-pages`: stops the failed sign-in check on marketing pages.
- `fix/sites-ctm-not-live`: marks controlthemarket.com not live.
- `docs/baalvion-publicity-pending-work`: this file.
