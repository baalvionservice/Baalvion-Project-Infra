# CanWeMarry — web

Next.js 15 App Router frontend for **CanWeMarry**, the community support platform for
people facing family or community opposition to their relationship or marriage.

Backend: [`canwemarry-service`](../../Backend/services/ecosystem/canwemarry-service).

## Running it

```bash
cp .env.example .env.local
pnpm install --filter canwemarry-web...
pnpm --filter canwemarry-web run dev          # :3071
pnpm --filter canwemarry-web run type-check
pnpm --filter canwemarry-web run build
```

The app needs `canwemarry-service` on `:3070` and the auth-gateway on `GATEWAY_ORIGIN`
(`:3026` by default) to show live data. Without them every data page renders its `ErrorState` rather than failing — that path
is worth exercising deliberately.

## How it talks to the backend

The browser talks only to **this app's own origin**. `/auth-bff/*` is proxied to the
auth-gateway BFF by a runtime route handler (`src/app/auth-bff/[...path]/route.ts`), and the
gateway holds the session in HttpOnly cookies and forwards a server-side Bearer the page
never sees.

It is a route handler rather than a `rewrites()` entry for a deployment reason: **Next
resolves rewrite destinations at build time** and bakes them into `routes-manifest.json`, so
one image promoted through environments would keep calling whatever gateway the build
machine named, and changing `GATEWAY_ORIGIN` at deploy time would silently do nothing.
Reading the variable per request makes it a real runtime setting. The route is not an open
proxy — the destination host comes only from `GATEWAY_ORIGIN`, empty path segments are
dropped and each one is re-encoded (otherwise `/auth-bff//evil.example/x` resolves to a
different host), and the resulting origin is asserted before the request is made.

Same-origin is deliberate, not incidental: a cross-origin gateway would need `SameSite=None`
cookies, which Safari's tracking prevention and Chrome's third-party cookie restrictions
drop — the session would silently stop working for a large share of visitors. It also means
no CORS, no preflight, and a CSP of `connect-src 'self'`.

The consequences:

- No access token is readable from JavaScript, and an XSS here cannot take a credential.
- Nothing auth-related touches `localStorage`. The platform's CI guard
  (`pnpm run ci:auth:localstorage`) rejects it, and it is right to.

`src/lib/api/` is the whole data layer and imports nothing from Next.js or the DOM — the
transport is injected (`configureApi`). A future **Expo** app can use `client.ts`,
`index.ts` and `types.ts` unchanged against the same endpoints, supplying its own transport.

One sharp edge worth knowing: the auth SDK's `authFetch` builds `<gatewayUrl>/api<path>`
itself, so the base configured for the browser is `/canwemarry/v1` and **not**
`/api/canwemarry/v1` — passing the latter produced `/auth-bff/api/api/...` and a 404 on
every page load.

Server components forward the visitor's cookies explicitly via `src/lib/api/server.ts`;
without that a server render would run as an anonymous visitor and a signed-in person would
see the public view of their own case.

## Structure

```
src/
  app/                  routes (App Router)
    auth-bff/[...path]/ runtime proxy to the gateway
    cases/ community/ resources/ profiles/   public + account screens
    moderation/         moderator surface (report queue, review, action history)
    admin/              administrator surface (users, cases, reports, audit)
  components/ui/        design system — Button, Field, Input, Textarea, Select, Card,
                        Badge, Avatar, Container, Modal, Toast, ConfirmDialog,
                        Breadcrumbs, Pagination, FilterBar, Section, RelativeTime,
                        EmptyState, LoadingState, ErrorState
  components/cases/     case card, support panel, participants/consent, updates,
                        reactions, report dialog
  components/comments/  comment thread (replies, edit, delete, report)
  components/community/ join/leave, post composer
  components/moderation/ review panel, role manager
  components/site/      navigation, footer, page header
  lib/api/              transport-agnostic API layer (reusable by Expo)
  lib/auth/             BFF session wiring + identity context
```

### Moderator and administrator are separate sections

`/moderation` is the moderator's surface; `/admin` is the administrator's. Keeping them
apart makes the boundary visible rather than a matter of which links happen to render. A
moderator reaching `/admin/users` or `/admin/audit` gets the server's 403 rendered by
`StaffBoundary` — the page never decides that itself.

## Design intent

The palette is a warm off-white ground with a deep, desaturated teal accent — the register
of a mediation service or a legal-aid charity. What is absent is deliberate: no rose or
magenta anywhere in the scale, because that is a dating product's palette and this is not
one; no high-chroma warning motifs, because fear is not the tone to greet someone in
difficulty with. Red exists only as `danger`, for destructive confirmations.

Responsive from 320px. Controls are 44px on the default size. Motion is minimal and
`prefers-reduced-motion` is honoured — someone may be reading this with a family member
nearby.

Two choices that look like oversights and are not:

- **`robots: noindex`** in the root layout. Case pages carry other people's situations;
  indexing is an operator's deliberate decision, not a default.
- **`display: 'browser'`** in the web manifest. A standalone install puts a CanWeMarry icon
  on someone's home screen, which is the wrong outcome for a person whose family may pick up
  their phone. Installing stays possible; it just does not disguise itself as a separate app.

## Admin routes

`/admin/*` is chrome, not a guard. Every page fetches from an endpoint that enforces the
role server-side; `AdminBoundary` only translates a 401 or 403 into something readable.
Hiding the navigation would be presentation, not security.


## Two upstreams, chosen by session

`serverOptions()` picks where a server component reads from:

- **signed in** → the auth-gateway, forwarding the session cookies, so the page renders as
  the actual person.
- **signed out** → canwemarry-service directly, with no cookies.

The second path exists because the gateway guards `/api/*` with `requireSession()` and
answers 401 to anonymous callers — correct for a product whose whole surface is private,
wrong for one with a public front. Routing an anonymous read around it grants nothing: the
request carries no identity either way. The browser never reaches the service on either path.

Identity is resolved in the root layout and seeded into `IdentityProvider`, so the shell
knows who it is drawing for on the first paint. That removes the signed-out flash and means
an anonymous visitor makes no client-side identity request at all.

## Design system

One type scale (`text-ui` 15px and `text-body` 17px are named steps between Tailwind's `sm`
and `lg`, replacing 34 arbitrary values), one section rhythm (`py-section` / `py-section-lg`,
replacing eight ad-hoc paddings), and one set of radii. Primitives live in
`src/components/ui`: Button (with a real `loading` state), Field, Input, Textarea, Select,
Card, Badge, Avatar, Container, Modal, Toast, ConfirmDialog, Breadcrumbs, Pagination,
FilterBar, Tabs, Section, Stat, RelativeTime, Skeleton, EmptyState, LoadingState, ErrorState.

Tap targets are 44px, and 40px even on `sm` — a measured sweep at 390px found the old 36px
small button, the 38px menu button and the 34px filter pills among the things a thumb misses.

Motion is limited to a 140ms dialog entrance and a spinner on an in-flight button. Skeletons
do not shimmer: a pulsing sweep reads as urgency, which is the wrong register, and it is one
more thing moving on a screen somebody may be reading with a family member nearby.

## SEO, and what is deliberately not indexed

Only pages the **platform** wrote are indexable — the homepage, about, how it works, safety
and the resource directory. Nothing a member wrote is ever indexed, including a case its
author made public: "public" here means visible to people who come to the site, not a result
in a search for someone's name by the family the case is about.

Private pages carry `noindex, nofollow, noarchive, nosnippet, nocache`, no Open Graph tags,
a generic title (`Case · CanWeMarry`, never the case's own), and a UUID in the URL rather
than a slug. The sitemap lists no case, community, post or profile URL — a sitemap is a
public statement that a URL exists.

## Contrast

Machine-verified against the colours that actually render, including the resolved background
behind translucent surfaces, in both themes. The sweep found `--muted-2` failing WCAG AA on
12px text (3.0–3.4:1 where 4.5 is required) and it was darkened to the **smallest** value
that passes on ground, surface and surface-2 alike — 43% rather than 55% — so the scale keeps
its character instead of collapsing towards black. Dark mode already passed and is unchanged.

## Verification performed

- **Responsive:** 17 pages × 8 widths (320 / 375 / 390 / 430 / 768 / 1024 / 1280 / 1440) in
  headless Chromium — no horizontal scroll, no control outside the viewport, no text under
  11px. Tab bars in the staff sections scroll horizontally inside their own container; the
  page itself never does.
- **Accessibility:** `lang` set, one `h1` per page, no skipped heading levels, every form
  control and every button/link carries an accessible name, no duplicate ids, and all 38
  focusable elements on the home page show a visible focus ring.
- **Console:** zero failing requests and zero console errors across every route, signed in
  and signed out.
- **Performance:** zero cumulative layout shift on every public page, no duplicate requests,
  and no tap target under 44px at 390px.
- **Core journey:** registration through the UI against the real auth-service and
  auth-gateway, onboarding, the five-step case form with its publish gate, invitation
  minting, acceptance by a second real account, commenting, reporting, and the moderator
  review — all in a headless browser, no shims.
