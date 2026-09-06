# Account lifecycle, admin-created credentials, OTP system

Covers checklist sections "User Account", "User Credentials", "OTP System". Primary issuer is `Backend/services/identity/auth-service` (auth-gateway is a thin edge proxy forwarding the same routes; `session-service`'s risk/geo logic has been superseded by `auth-service/service/sessionEnrichmentService.js`, which is now the live path). `Backend/services/infrastructure/proxy-service` runs a second, independent auth system for its own customers (proxy.baalvionstack.com) — see the right-hand notes below and [00-CRITICAL-SECURITY-FINDINGS.md](00-CRITICAL-SECURITY-FINDINGS.md) for two real bugs in it.

## User account lifecycle (auth-service)

| Item | Status | Evidence |
|---|---|---|
| User registration | ✅ | `service/authService.js:165` `register()` |
| Email verification | ⚠️ Link, not OTP | Token link, 24h expiry: `authService.js:188-201`, `models/emailVerifications.js`. A numeric code exists only inside the separate *passwordless login* flow, which incidentally verifies email too |
| Mobile verification OTP | ✅ | `service/phoneVerificationService.js` — expiry, attempts, single-use, cooldown all present |
| Login with email/password | ✅ | `authService.js:236` `login()` |
| Login OTP | ✅ email only | `service/emailLoginService.js` — no SMS/mobile login-OTP exists, only email |
| Forgot password | ✅ | `authService.js:441` `forgotPassword()` |
| Password reset link/OTP | ✅ link | 1h expiry, single-use token: `authService.js:441-474`, `models/passwordResets.js` |
| Change password (logged-in) | ❌ Missing | No endpoint/schema anywhere in auth-service — only the reset-via-token flow exists |
| Change email | ❌ Missing | `updateMe` (`validators/schemas.js:67`) only allows `fullName`/`avatarUrl` |
| Change mobile number | ✅ | `phoneVerificationService.requestOtp` accepts a new phone, only commits on verify (`:75-130`) |
| Account activation | ❌ Dead code | `UserRepository.setStatus()` exists (`repositories/UserRepository.js:100`) but nothing calls it |
| Account deactivation | ⚠️ Narrower forms only | Org-membership suspend (`teamService.js:239`) and whole-org suspend exist; no full user-account deactivation |
| Account deletion | ❌ Missing | No route/service anywhere; `User.destroy` only appears in test cleanup |
| Welcome email | ✅ | `auth.registered` → `notification-service/workers/eventConsumer.js:39-67`, plus a day-1/3/7 onboarding sequence |
| New device/login notification | ⚠️ Dead trigger | Template + handler exist (`eventConsumer.js:125-143`) but nothing ever publishes `auth.new_device_login` |
| Suspicious login notification | ⚠️ Dead trigger, different bug | `session.high_risk` is published over raw **Redis Pub/Sub** (`sessionEnrichmentService.js:123`, `session-service/sessionService.js:157/183/232`) on channel `auth:events`, but notification-service only consumes the Redis **Streams** bus (`baalvion:events`). Nothing bridges the two, so a working handler is unreachable |
| Logout from all devices | ✅ | `authService.js:640` `revokeAllSessions()`, `DELETE /sessions` |
| Session/device management | ✅ | `listSessions`/`revokeSession`/`revokeAllSessions` with geo/device/risk enrichment |

### proxy-service (separate customer auth) — deltas from the above

- `forgotPassword` never emails a token — only logs an internal notification (`service/authService.js:129-140`).
- `resetPassword` takes `{email, newPassword}` with **no token check at all** — see [critical finding #1](00-CRITICAL-SECURITY-FINDINGS.md).
- `verifyEmail` takes only `{email}`, no token — see [critical finding #2](00-CRITICAL-SECURITY-FINDINGS.md).
- Unlike auth-service, proxy-service **does** have a real self-service change-password endpoint (`userRoutes.js:11`, `userService.js:58`).

## User credentials (admin-created accounts)

| Item | auth-service (identity) | proxy-service |
|---|---|---|
| Account created notification | ⚠️ Invite email sent (`teamService.js:108-125`), no separate "created" template | ❌ `user.invited` emitted but nothing subscribes to send an email (`eventBus.js` is a bare in-process `EventEmitter`) |
| Temp password vs. link | ✅ Good pattern — single-use signed link, 7-day expiry, HTML-escaped (`teamService.issueInvitation`, `:85-141`) | ❌ Hardcoded plaintext default password `'InviteOnly123!'` — see [critical finding #3](00-CRITICAL-SECURITY-FINDINGS.md) |
| Account activation link | ✅ same invite link | — |
| Password reset link | ✅ | ❌ no real reset token (finding #1) |
| Credential-change notification | ❌ | Only MFA toggle sends an email (`auth.mfa_enabled` → `eventConsumer.js:159-168`); password reset / phone change fire nothing in either service |

## OTP system

Two live OTP purposes exist — phone verification (`auth-service/models/phoneOtps.js`) and email login/registration (`auth-service/models/emailOtps.js`, and proxy-service's `otpLoginService.js`). Both share the same hardened design:

| Property | Status | Evidence |
|---|---|---|
| Expiry | ✅ | `expires_at` column, enforced in `classifyOtpAttempt` (`phoneVerificationService.js:55-65`) |
| Maximum attempts | ✅ | `attempts` counter + lockout, same function |
| Resend cooldown | ✅ | `phoneVerificationService.js:86-94`, `emailLoginService.js:168-177` |
| Rate limiting | ✅ | Route-level Redis limiters (`middleware/rateLimiter.js:53-58`) plus a per-email hard resend cap (`emailLoginService.js:161-166`) |
| One-time-use enforcement | ✅ | `consumed_at` burned before session mint, race-safe (`emailLoginService.js:316-317`) |
| Purpose tagging | ✅ | `purpose` column, but only `'login'`/`'verify'` are ever used |
| Timestamp | ✅ | Sequelize `timestamps: true` on both models |
| Verification status | ✅ | `consumed_at` + `attempts` double as verification state |

**No OTP exists for:** forgot-password (link-based instead), change-email, payment confirmation, or other sensitive-action confirmation.

Mail transport itself (SES-backed, fail-loud on send failure, rate-limited, outbound-only — no inbound email handling exists anywhere in the platform) was already verified separately and is solid; see the earlier conversation summary if you need that detail again.

## Key files

`auth-service/service/{authService,phoneVerificationService,emailLoginService,mfaService,teamService,sessionEnrichmentService}.js`, `auth-service/models/{emailOtps,phoneOtps,users,invitations}.js`, `auth-service/validators/schemas.js`, `auth-service/repositories/UserRepository.js`, `auth-service/middleware/rateLimiter.js`, `notification-service/workers/eventConsumer.js`, `proxy-service/service/{authService,userService,otpLoginService,signupService}.js`.
