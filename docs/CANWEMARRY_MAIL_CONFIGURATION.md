# Mail configuration contract

Every email CanWeMarry depends on is sent by **auth-service**, through one function —
`utils/mailer.js` → `sendMail()`. There is no second mail path, so configuring this one
transport configures every flow below.

## Flows that depend on it

| Flow | Trigger | Consequence if mail cannot be delivered |
|---|---|---|
| Registration verification | `POST /auth/register` | The account is created and usable, but stays unverified — so it cannot publish a case, comment, support, join, post, accept an invitation or report. |
| Resend verification | `POST /auth/resend-verification` | Somebody who lost the first mail has no way to recover. |
| Password reset | `POST /auth/forgot-password` | Nobody can regain an account they are locked out of. |
| Team invitation | `teamService` | The invitee is never told. |
| Email-OTP login | `emailLoginService` | Sign-in by code is impossible. |

Case invitations are **not** email: CanWeMarry mints a 16-character code and the owner shares
it themselves, deliberately, so the product never needs a third party's address.

## Transport selection

`sendMail()` picks the first that is configured:

1. **Amazon SES** — used when SES credentials are present.
2. **SMTP** — used when `SMTP_HOST` is set.
3. **Neither** — nothing is sent. In development this is a warning; in production it is an
   error at start-up and on every attempt.

## Variables

| Variable | Classification | Notes |
|---|---|---|
| `SMTP_HOST` | **required in production** (unless SES) | Presence of this is what switches SMTP on. |
| `SMTP_PORT` | optional | Defaults to 587. Port 465 uses implicit TLS; anything else with a username requires STARTTLS. |
| `SMTP_USER` | **secret**, optional | Omit for a credential-less local relay such as Mailpit. |
| `SMTP_PASS` | **secret**, optional | Never logged, never returned by any endpoint. |
| `EMAIL_FROM` | optional | Defaults to `noreply@baalvion.com`. Must be a sender the relay accepts. |
| `MAIL_DEV_LOG_LINKS` | **development only** | Prints verification and reset links to the log. The production branch returns before it is read, so setting it in production does nothing. |

None of these belong in source control. `.env*` is gitignored and secret-scanning push
protection is on.

## Verifying a real configuration

There is deliberately no "send a test email" button: a start-up probe would make booting
depend on a third party, and a UI button that mails an arbitrary address is a spam relay.

1. Set the variables and restart auth-service.
2. Read the first mail line in the log. It names the transport and the sender, never a
   credential:
   ```
   [Mailer] SMTP configured (smtp.example.net:587), from noreply@baalvion.com
   ```
   If it says `NO TRANSPORT CONFIGURED`, nothing will be delivered.
3. Register a throwaway account and confirm the message arrives.
4. `GET /admin/health` reports the notification subsystem, but only the in-product part —
   it does not claim email was verified, because this service cannot know that.

For local development without a provider, run any SMTP catcher (Mailpit and similar listen on
1025 with no credentials) and set `SMTP_HOST=localhost`, `SMTP_PORT=1025`. That is a real
transport, so it exercises the true path rather than the console fallback.

## What is NOT verified

**SMTP delivery has not been tested in this environment**, because no provider is configured
here. What has been tested is everything up to the transport: the token is minted, hashed and
stored, the link is correct and brand-aware, the message is composed, the transport ladder
selects correctly, and a missing transport is reported loudly without leaking the link.

The remaining external dependency is credentials for a real relay.
