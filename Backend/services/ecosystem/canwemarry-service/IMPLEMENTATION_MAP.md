# CanWeMarry — implementation map

Written before the Prompt 7 changes, from reading the code rather than from memory. Its
purpose is to stop the ecosystem work from rebuilding things that already exist, and to name
the gaps precisely enough that each one is a small, checkable piece of work.

## What already works

| Domain | Backend | Frontend | State |
|---|---|---|---|
| Cases | `caseService` — create/update/delete, 4 sorts, filters on status, visibility, community, country, mine, supporting, free text, support-needed | `/cases`, `/cases/[id]`, `/cases/[id]/edit`, `/create-case`, `/my-cases` | Mature |
| Case participants | `participantService` — invite by relation, respond, withdraw; consent states SELF/INVITED/GRANTED/DECLINED/WITHDRAWN | `participants-panel.tsx` | Mature |
| Support | `supportService` — offer, decide, withdraw, revoke; `case_supporters.status` | `support-panel.tsx` | Mature |
| Comments | `commentService` — threaded via `parent_id`, own-delete, moderation state | `comment-thread.tsx` | Mature |
| Case updates | `caseUpdateService` — create, list, delete | `case-updates.tsx` | Mature |
| Communities | `communityService` — list, get by slug, create, join, leave, approve, members | `/community`, `/community/[slug]` (4 tabs), `/community/create` | **Gaps** |
| Posts | `postService` — create, update, soft-delete tombstone | `post-composer.tsx`, `post-actions.tsx` | Mature |
| Reactions | `reactionService` — set/clear/summary | `reactions.tsx` | Mature |
| Invitations | `invitationService` — 16-char code, SHA-256 hash-only, single-use, expiry, revoke | `invite-panel.tsx`, `/invite/[token]` | Mature |
| Notifications | `notificationService` — 6 events, no self-notification | `/notifications` | Mature |
| Resources | `resourceService` — list/get/create/update, category + country | `/resources`, `/resources/[slug]` | **Gaps** |
| Profiles | `profileService` — own + public by handle, `is_discoverable` | `/profile`, `/profiles/[handle]` | Mature |
| Reports | `reportService` — create, list own | `report-dialog.tsx`, `/me/reports` | Mature |
| Moderation | `moderationService` — queue, review, actions, history | `/moderation/*` | Mature |

19 tables. 69 routes. 42 built frontend routes. 219 service tests.

## Gaps this prompt closes

**G1 — a pending membership is invisible.** `serialize()` sets
`isMember: ctx.communityIds.includes(c.id)`, and `accessContext` builds `communityIds` from
`status: 'ACTIVE'` only. So somebody whose join request is awaiting approval sees exactly
what a stranger sees. That is the specific thing Phase 9 forbids: it makes people believe
they never joined, or worse, that they did.

**G2 — the UI cannot tell a community administrator from a member.** `community_members.role`
holds MEMBER/MODERATOR/ADMIN and `approveMember` enforces it, but the role never reaches the
client, so no management surface can be drawn.

**G3 — no `GET /communities/:id`.** The case page needs the community a case belongs to and
has only `getBySlug`, so it lists up to 100 communities and finds the id client-side. Wrong
past 100 communities, and a wasted query on every case view.

**G4 — no `PATCH /communities/:id`.** A community administrator cannot edit the description,
purpose or rules they are responsible for.

**G5 — member management stops at approve.** No way to decline a pending request or remove
somebody who is behaving badly, which is most of what running a community is.

**G6 — community discovery has one filter.** `listCommunities` accepts only `countryCode`.
Cases already have free-text search, six filters and four sorts; communities have none of it.

**G7 — no related discovery.** Nothing connects a case to the resources or communities that
would help the person reading it.

## Rules that constrain the work

- Related content and search must reuse `visibility.scopeWhere`, never a second query path.
  A related-items list is a discovery surface and leaks exactly as much as discovery does.
- Community administrators are not platform moderators. Their powers stop at their own
  community's description and membership; they get no case access, no global roles, no audit.
- Nothing in this prompt may add ranking, popularity, streaks or urgency. Support is not a
  vote and must never be counted like one.

## What the Prompt 7 pass changed

| Gap | Closed by |
|---|---|
| G1 pending membership invisible | `accessContext` carries PENDING alongside ACTIVE but keeps them apart; `membershipStatus` on the community payload; a waiting state in the join button |
| G2 no way to see a community role | `myRole` on the community payload — null unless the membership is ACTIVE |
| G3 no `GET /communities/:id` | Added, same visibility rule as by-slug; the case page no longer lists 100 communities to find one |
| G4 no community edit | `PATCH /communities/:id`, administrators only, name/description/purpose/rules — never visibility or join policy |
| G5 member management stopped at approve | `POST …/members/:userId/decline` (row removed, so they may ask again) and `DELETE …/members/:userId` (marks LEFT, never removes an administrator) |
| G6 one community filter | free text, visibility and three sorts, including a real last-post ordering across the whole table |
| G7 no related discovery | `GET /cases/:id/related` — resources, communities and cases, through `visibility.scopeWhere`, with no reason field |

Two things were found while testing rather than while reading:

- **Any malformed path parameter answered 500.** `/cases/not-a-uuid` reached Postgres, which
  refused it as an invalid uuid. Now 404 — the same answer a well-formed unknown id gets, so
  the shape of an id is not an oracle. See `middleware/uuidParams.js`.
- **The community hub offered "Create a community" to everyone**, though hosting is granted
  standing; most people were being sent to a page that told them no.

The cleanup script also grew two passes: test communities outlive the accounts that made
them (`created_by` is nulled, not cascaded), and a local `users` row can outlive its auth
account. Both now go.
