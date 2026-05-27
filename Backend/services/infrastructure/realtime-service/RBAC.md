# realtime-service — RBAC & Auth Contract (WebSocket)

**Phase 3 / Batch C canonical auth migration.** realtime-service is a **websocket consumer**.
Socket.IO handshake auth verifies **only** canonical RS256 auth-service tokens via
`@baalvion/auth-node` `createJwksVerifier`. The HS256 fallback was **removed**; legacy /
non-canonical / malformed tokens are rejected.

## WebSocket token verification (`index.js`)
- `createJwksVerifier({ jwksUri, staticPublicKey, issuer:'baalvion-auth', audience:'baalvion-platform', rejectHs256:true, requiredClaims:['sub','org_id','sid','jti'], validateRolesPermissions:true })`.
- Verification runs as a Socket.IO **namespace middleware** (`namespace.use(...)`) on every namespace: `/dashboard /ir /jobs /admin /ctm`. It also runs on reconnect (handshake re-auth) and namespace join.
- `audience` corrected from `baalvion-services` → `baalvion-platform`; HS256 shared `secret` config removed.

## Canonical socket context (`socket.data`)
| JWT claim | `socket.data` |
|---|---|
| `sub` → `userId` | `org_id` → `orgId` | `roles[]` → `roles` | `permissions[]` → `permissions` | `sid` → `sessionId` | `jti` → `jti` |

(replaces the former scalar `socket.data.role`).

## Role hierarchy & namespace authorization
`viewer < member < editor < manager < admin < owner < super_admin`.
- **Namespace allow-list** (`config.namespaceRoles`) is roles[]-aware: a connection is allowed when **any** held role is in the namespace's list (e.g. `/admin` ⇒ `['admin','super_admin']`).
- **Room guards** (`joinAuthorizedRooms` / `guardRoomJoin`): personal room `user:<id>`; org room `org:<orgId>` (own org only); `admin:global` requires `roles.includes('admin') || roles.includes('super_admin')`.

## Rejected tokens (→ handshake error, codes 4001/4003)
HS256 (rejected); legacy `id`/`orgId`/`sessionId` (missing canonical claims); malformed JWT; wrong `iss`/`aud`; insufficient namespace role.

## Risk note
`JWT_BYPASS_AUTH=true` (`config.jwt.bypassAuth`) is a **dev-only** bypass that grants
`roles:['super_admin']` to unauthenticated sockets. It logs a startup WARNING and a per-connection
warning. Must remain `false` in staging/production.

## Migration notes (Batch C)
- `index.js`: removed `hs256Secret` from the verifier; added `rejectHs256`/`requiredClaims`/`validateRolesPermissions`; scalar `socket.data.role` → `roles[]` across the namespace check, room guards, and connection log.
- `config/appConfig.js`: removed HS256 `secret`; `audience` → `baalvion-platform`.
