# Why some route trees have no `loading.tsx`

A `loading.tsx` puts the segment behind a Suspense boundary. Next then streams the shell
immediately — which **commits the HTTP status as 200** — and resolves the page afterwards. A
`notFound()` reached after that point can swap the rendered UI, but it cannot change a status
that has already been sent.

Measured on Next 15.5.21, production `next start`:

| Route | With ancestor `loading.tsx` | Without |
|---|---|---|
| unknown case | 200 | **404** |
| unknown community | 200 | **404** |
| unknown profile | 200 | **404** |
| unknown resource | 200 | **404** |

A bare Next 15.5.21 app with no `loading.tsx` returns 404 correctly, so this is the boundary,
not the framework version and not this application's data fetching. Moving the existence check
into `generateMetadata` does **not** help — the boundary commits the response either way.

So these five files were removed, and must not be reintroduced above a route that calls
`notFound()`:

- `app/loading.tsx` (the root fallback — an ancestor of everything)
- `app/cases/loading.tsx`, `app/cases/[id]/loading.tsx`
- `app/community/loading.tsx`
- `app/resources/loading.tsx`

Every other `loading.tsx` is kept: `/my-cases`, `/notifications`, `/profile`, `/invitations`,
`/me/reports`, `/admin`, `/moderation`. None of those trees contains a route that calls
`notFound()`, so none of them can turn a 404 into a 200.

**Before adding a `loading.tsx`,** check whether any page at or below that segment calls
`notFound()`. If one does, the skeleton costs correct HTTP semantics for every unknown
resource beneath it.
