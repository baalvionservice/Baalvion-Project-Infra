import { test, expect, request } from '@playwright/test';
import { Client } from 'pg';

/**
 * IR business onboarding — the full round trip, no mocks.
 *
 * WHAT THIS COVERS, hop by hop:
 *   1. UI      a real browser drives the five-step funnel at /onboarding/business
 *   2. API     the funnel POSTs to the Next same-origin BFF /api/ir/business
 *   3. API     the BFF forwards to ir-service POST /api/v1/business-applications
 *   4. DB      ir-service INSERTs into Postgres `ir.ir_business_applications`
 *   5. DB→UI   the reference minted server-side comes back and renders in the browser
 *   6. proof   this spec then connects to the SAME Postgres and asserts the row is there,
 *              with the values that were typed into the form
 *
 * Step 6 is the point. Steps 1-5 only prove the API answered; a service that logged the
 * payload and returned a made-up reference would pass them. Reading the table back is what
 * makes "update DB" an assertion instead of a claim.
 *
 * WHY THIS APP: /onboarding/business is the one intake in the estate that is public by
 * design — see Frontend/IR-Baalvion-main/src/lib/invite-gate.ts, where it is an explicit
 * OPEN_EXCEPTION to the s.42 investor-side gate. No login, no seeded fixtures, no auth
 * service: the journey needs exactly ir-service + Postgres, which is what CI can stand up.
 *
 * WHAT THIS DOES NOT COVER:
 *   - There is no public read-back page. Staff review lives behind authMiddleware
 *     (routes/businessApplications.js), so the UI never re-fetches the row it created. The
 *     browser's last word is the funnel's completion card; the durable-state check is SQL.
 *   - Documents and beneficial owners are left empty. Both are optional and the document
 *     step reads files as data: URIs, which adds a fixture and a size cliff for no extra
 *     coverage of the hop chain.
 *
 * Run against a production build (`next build && next start`). `next dev` works but
 * recompiles per route, and the first navigation blows past the default timeout.
 */

const WEB = process.env.IR_WEB_URL ?? 'http://127.0.0.1:3027';

// Same env names ir-service's config/appConfig.js reads, so the spec and the service under
// test cannot end up pointed at different databases.
const PG = {
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'baalvion_db',
  user: process.env.DB_USER ?? 'baalvion',
  password: process.env.DB_PASSWORD ?? '',
};

/** One row, or null. Kept to a single short-lived client so a failing test leaks nothing. */
async function queryOne<T extends Record<string, unknown>>(sql: string, params: unknown[]): Promise<T | null> {
  const client = new Client(PG);
  await client.connect();
  try {
    const { rows } = await client.query(sql, params);
    return (rows[0] as T) ?? null;
  } finally {
    await client.end();
  }
}

/**
 * Every run writes real rows into a real table, so nothing may be asserted by position or
 * by "the newest row" — a parallel worker or a rerun would then read someone else's write.
 * The legal name carries the run id and every lookup is keyed on it.
 */
const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
const LEGAL_NAME = `E2E Roundtrip ${runId} Pvt Ltd`;
const CONTACT_EMAIL = `e2e-${runId.toLowerCase()}@example.test`;
const CONTACT_NAME = 'Asha Rao';
const COUNTRY = 'India';
// IEC must satisfy ^[0-9A-Z]{10}$ both client-side (TaxRegistrationStep) and in
// ir-service's zod schema. Slice to exactly ten so a longer runId cannot break the format.
const IEC = `E${runId}0000000`.slice(0, 10);

test.describe('business onboarding writes through to Postgres', () => {
  test('the funnel creates a row and shows the reference Postgres holds', async ({ page }) => {
    await page.goto(`${WEB}/onboarding/business`);

    // Step 1 — Company. The Label in BusinessField.tsx is not bound to its Input (no
    // htmlFor/id), so getByLabel finds nothing; placeholders are the stable handle.
    // exact:true matters: "e.g. Acme" is a substring of "e.g. Acme Exports Pvt Ltd".
    await expect(page.getByRole('heading', { name: 'Company Profile' })).toBeVisible();
    await page.getByPlaceholder('e.g. Acme Exports Pvt Ltd', { exact: true }).fill(LEGAL_NAME);
    await page.getByPlaceholder('e.g. India', { exact: true }).fill(COUNTRY);
    await page.getByPlaceholder('e.g. Asha Rao', { exact: true }).fill(CONTACT_NAME);
    await page.getByPlaceholder('name@company.com', { exact: true }).fill(CONTACT_EMAIL);
    // entityType is not touched: it defaults to private_limited in emptyBusinessOnboardingData.
    await page.getByRole('button', { name: /Continue to KYC/i }).click();

    // Step 2 — KYC. Nothing here is required; the step is passed through deliberately so the
    // spec proves the optional branch submits, which is the shape most applicants send.
    await expect(page.getByRole('heading', { name: /Know Your Customer/i })).toBeVisible();
    await page.getByRole('button', { name: /Continue to Tax IDs/i }).click();

    // Step 3 — Tax. At least one of IEC/GSTIN/VAT is required on both sides of the BFF.
    await expect(page.getByRole('heading', { name: /Trade & Tax Registrations/i })).toBeVisible();
    await page.getByPlaceholder('10-character IEC', { exact: true }).fill(IEC);
    await page.getByRole('button', { name: /Continue to Documents/i }).click();

    // Step 4 — Documents. Optional; DocumentsStep drops incomplete rows on continue.
    await expect(page.getByRole('heading', { name: 'Supporting Documents' })).toBeVisible();
    await page.getByRole('button', { name: /Review & Submit/i }).click();

    // Step 5 — Review. Confirms the client actually carried the typed values this far,
    // rather than the funnel having quietly reset them between steps.
    await expect(page.getByRole('heading', { name: 'Review & Submit' })).toBeVisible();
    await expect(page.getByText(LEGAL_NAME)).toBeVisible();
    await expect(page.getByText(CONTACT_EMAIL)).toBeVisible();

    const submitted = page.waitForResponse(
      (r) => r.url().includes('/api/ir/business') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Submit Application' }).click();

    // The BFF's own answer. A 502 here means ir-service is down and the failure should say
    // so, not surface later as a confusing "reference never appeared".
    const response = await submitted;
    expect(response.status(), 'POST /api/ir/business').toBe(200);

    // Step 6 — the UI renders what came back.
    await expect(page.getByRole('heading', { name: 'Application Submitted' })).toBeVisible();
    const referenceEl = page.getByText(/^BIZ-[0-9A-F]{6}$/);
    await expect(referenceEl).toBeVisible();
    const reference = (await referenceEl.innerText()).trim();

    // The proof. Keyed on legal_name (this run's unique value) rather than on the reference,
    // so a service that invented a reference client-side is caught rather than accommodated.
    const row = await queryOne<{
      reference: string;
      legal_name: string;
      contact_email: string;
      contact_name: string;
      entity_type: string;
      incorporation_country: string;
      iec_code: string;
      status: string;
      kyc_status: string;
    }>(
      `SELECT reference, legal_name, contact_email, contact_name, entity_type,
              incorporation_country, iec_code, status, kyc_status
         FROM ir.ir_business_applications
        WHERE legal_name = $1`,
      [LEGAL_NAME],
    );

    expect(row, `no ir.ir_business_applications row for "${LEGAL_NAME}"`).not.toBeNull();
    expect(row!.reference, 'the reference on screen is not the one in the table').toBe(reference);
    expect(row!.contact_email).toBe(CONTACT_EMAIL);
    expect(row!.contact_name).toBe(CONTACT_NAME);
    expect(row!.incorporation_country).toBe(COUNTRY);
    expect(row!.iec_code).toBe(IEC);
    expect(row!.entity_type).toBe('private_limited');
    // Set by the service, never sent by the client — a client-echo would not produce these.
    expect(row!.status).toBe('submitted');
    expect(row!.kyc_status).toBe('pending');
  });

  test('a submission with no tax registration is refused and writes nothing', async () => {
    /*
     * The control for the test above. Without it, "the row is in the table" proves less than
     * it looks: a table that accepted everything would pass just as happily. This posts a
     * payload the BFF must reject (the funnel blocks it client-side, so it can only be
     * reached by calling the API directly, which anything on the internet can do) and then
     * asserts the same query finds nothing.
     */
    const rejectedName = `E2E Rejected ${runId} Pvt Ltd`;
    const api = await request.newContext();
    const res = await api.post(`${WEB}/api/ir/business`, {
      data: {
        legalName: rejectedName,
        entityType: 'private_limited',
        incorporationCountry: COUNTRY,
        contactName: CONTACT_NAME,
        contactEmail: CONTACT_EMAIL,
        // no iecCode / gstin / vatNumber
      },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toMatch(/registration/i);
    await api.dispose();

    const row = await queryOne(
      'SELECT id FROM ir.ir_business_applications WHERE legal_name = $1',
      [rejectedName],
    );
    expect(row, 'a rejected application was persisted anyway').toBeNull();
  });
});
