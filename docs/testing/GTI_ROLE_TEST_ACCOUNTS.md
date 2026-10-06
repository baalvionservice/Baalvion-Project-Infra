# GTI role test accounts (local only)

One login for every GTI authority role, so each role can be tested on its own. **Local databases only.**
All accounts share one password, and several hold the highest platform roles, so they must never exist on a
real environment. The seed script refuses to run against any database host other than localhost.

Password for every account: `GtiTest!2026#Role`

## 1. Set up

You need the local stack running (identity service on :3001, Postgres, and the GTI app).

```bash
cd Backend/services/identity/auth-service
DB_HOST=localhost DB_NAME=baalvion DB_USER=baalvion_app DB_PASSWORD=<local postgres password> \
  node scripts/seedGtiRoleAccounts.js
```

The script is safe to run again; it resets the password and memberships. It prints the accounts it created.

## 2. Test one role

1. Start GTI against the local identity service, e.g. `GATEWAY_PROXY_TARGET=http://localhost:3026 pnpm --filter baalvion-eternal-absolute-singularity dev`.
2. Open `http://localhost:9003/login`.
3. Pick **who you are** on the page (it only shows the right hint; the form works for everyone).
4. Sign in with the email from the table below and the password above.
5. Check you land where the table says, that the sidebar shows only that role's sections, and that a page
   from a more powerful role (for example `/governance` as a buyer) is refused.

## 3. The accounts

| Email | Role | Persona | Organisation type | Lands on |
|---|---|---|---|---|
| `test.super-admin@gti.local` | super_admin | Sovereign Master | platform_owner | /governance |
| `test.platform-admin@gti.local` | platform_admin | Platform Administrator | platform_owner | /governance/platform-admin |
| `test.sovereign-admin@gti.local` | sovereign_admin | Sovereign Administrator | platform_owner | /governance/sovereign-admin |
| `test.sovereign-operator@gti.local` | sovereign_operator | Sovereign Operator | platform_owner | /governance/control-tower |
| `test.platform-auditor@gti.local` | platform_auditor | Sovereign Auditor | platform_owner | /governance/audit-logs |
| `test.national-regulator@gti.local` | national_regulator | National Regulator | regulator | /governance/regulatory |
| `test.arbitrator@gti.local` | arbitrator | Legal Adjudicator | regulator | /governance/disputes |
| `test.org-owner@gti.local` | org_owner | Organization Principal | buyer | /executive/command |
| `test.executive-director@gti.local` | executive_director | Executive Command | buyer | /executive/command |
| `test.finance-director@gti.local` | finance_director | Treasury Command | buyer | /financials/treasury |
| `test.operations-director@gti.local` | operations_director | Logistics Command | buyer | /logistics-shipment/control-tower |
| `test.buyer@gti.local` | buyer | Buyer | buyer | /buyer/dashboard |
| `test.buyer-node@gti.local` | buyer_node | Buyer Node | buyer | as Buyer |
| `test.treasury-operator@gti.local` | treasury_operator | Treasury Node | buyer | /finance-settlement |
| `test.trade-analyst@gti.local` | trade_analyst | Intelligence Node | buyer | /intelligence-hub |
| `test.member@gti.local` | member | Trade Participant | buyer | /dashboard |
| `test.seller@gti.local` | seller | Seller | seller | /seller/dashboard |
| `test.seller-node@gti.local` | seller_node | Seller Node | seller | as Seller |
| `test.agent@gti.local` | agent | Trade Agent | trade_agent | /agent/dashboard |
| `test.logistics-coordinator@gti.local` | logistics_coordinator | Fulfillment Node | logistics_provider | /logistics-shipment |
| `test.compliance-director@gti.local` | compliance_director | Compliance Command | compliance_agency | /governance/compliance-admin |
| `test.compliance-admin@gti.local` | compliance_admin | Compliance Administrator | compliance_agency | /governance/compliance-admin |
| `test.compliance-officer@gti.local` | compliance_officer | Compliance Node | compliance_agency | /compliance |
| `test.customs-agent@gti.local` | customs_agent | Customs Authority | customs_authority | /governance/customs |
| `test.bank-admin@gti.local` | bank_admin | Bank Authority | bank | /governance/bank-admin |
| `test.insurance-admin@gti.local` | insurance_admin | Insurance Authority | insurance_provider | /insurance |

"Lands on" comes from `src/core/personas.ts`. A user's organisation type can take precedence over it for some roles.

## 4. Things that trip people up

- **Rate limit.** The login endpoint allows 10 *failed* attempts per 15 minutes per IP (successful logins do not count).
  If you are locked out locally, restart the identity container to clear the in-memory counter.
- **Platform roles are special.** `platform_admin` is set on the user (`auth.users.platform_role`), not as an
  organisation membership role; the identity service rejects a platform role in a membership. The seed handles this.
- **Database must be migrated.** Logins need migration `003_auth_audit_log.sql` and `017_business_grants.sql`
  (a database built only from `sync()` can lack them). Without 003 you get audit-write errors.
- **Signing key.** The identity service reads its RS256 key from `JWT_PRIVATE_KEY_PATH` / `JWT_PUBLIC_KEY_PATH`. If the
  key *path* is passed in `JWT_PRIVATE_KEY` instead (which expects the PEM text), every login fails with
  `error:1E08010C:DECODER routines::unsupported`.

## 5. Clean up

```sql
DELETE FROM auth.team_members WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE 'test.%@gti.local');
DELETE FROM auth.organizations WHERE slug LIKE 'gti-test-%';
DELETE FROM auth.users WHERE email LIKE 'test.%@gti.local';
```

## 6. Not for production

For a live environment use the public sign-up (`/register` creates buyer and seller accounts) and the
institutional onboarding flow, or grant roles through the admin console with a **unique password per account**.
Never reuse this password or this script there.

## 7. Testing a real login on a live site (read-only)

`Frontend/Global-Trade-Infrastructure-main/scripts/live-smoke.mjs` signs in with an account **you** provide, then sends
read-only requests to the trade and finance backends and tells you which ones answer. It never writes data and never
prints your password, cookies or tokens. Run it on your own machine:

```bash
export GTI_EMAIL='you@example.com'
read -s GTI_PASSWORD && export GTI_PASSWORD       # type the password; it is not echoed or saved in history
node Frontend/Global-Trade-Infrastructure-main/scripts/live-smoke.mjs
```

Defaults to `https://trade.baalvion.com`; set `GTI_BASE` for another host. Use an account without MFA.
Result codes: `200` backend answered; `403` your role may not use that area (normal); `404` the route or the service
behind it is missing; `5xx`/`502` the service is down.
