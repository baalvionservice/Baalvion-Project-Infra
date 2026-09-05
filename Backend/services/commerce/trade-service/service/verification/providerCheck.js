'use strict';
/**
 * The bridge between a verification submission and whichever KYC/KYB vendor is
 * configured. This is what makes `KYC_PROVIDER=<vendor>` actually mean something:
 * before it existed the adapter interface and registry in ./kycProviders/ were
 * complete and entirely unreferenced, so every decision was human regardless of
 * what was configured.
 *
 * Swapping vendors is a two-line change and nothing else in the codebase moves:
 *
 *     registerProvider('sumsub', () => new SumsubProvider({ token, secret }));
 *     KYC_PROVIDER=sumsub
 *
 * Two rules this module will not bend:
 *
 *   1. NO PROVIDER MEANS MANUAL, NEVER SKIPPED. With nothing registered the record
 *      stays exactly where it was — 'submitted', in the human queue. It does not
 *      auto-approve, and it does not silently pass.
 *   2. A VENDOR FAILURE IS NOT A VERDICT. If the submission call throws, the record
 *      falls back to the manual queue with the error recorded. An unreachable vendor
 *      must never read as "checked".
 */
const { getActiveProvider } = require('./kycProviders');

/**
 * Hand a freshly submitted record to the active vendor, if there is one.
 * Mutates and returns the record; never throws.
 *
 * @param {'identity'|'company'} kind
 * @param {object} record  the IdentityVerification / CompanyVerification row
 * @param {object} payload the applicant/company detail to send
 */
async function dispatch(kind, record, payload) {
    const provider = getActiveProvider();
    if (!provider) return { dispatched: false, reason: 'no provider configured — manual review' };

    try {
        const result = kind === 'identity'
            ? await provider.submitIdentity(payload)
            : await provider.submitCompany(payload);

        const externalRef = result && (result.externalRef || result.external_ref);
        if (!externalRef) throw new Error(`${provider.name} returned no externalRef`);

        await record.update({
            provider_name: provider.name,
            provider_ref: String(externalRef),
            provider_submitted_at: new Date(),
            provider_result: { submitted: true },
            // The vendor now holds the case; it is genuinely under review rather than
            // sitting untouched in the queue.
            status: 'under_review',
        });
        return { dispatched: true, provider: provider.name, externalRef: String(externalRef) };
    } catch (err) {
        // Fail to the human queue, loudly, with the reason on the record.
        await record.update({
            provider_name: provider.name,
            provider_result: { submitted: false, error: err.message, at: new Date().toISOString() },
        }).catch(() => {});
        // eslint-disable-next-line no-console
        console.error(`[kyc] ${provider.name} submission failed for ${kind} ${record.id}: ${err.message}`);
        return { dispatched: false, provider: provider.name, error: err.message };
    }
}

/**
 * Turn a vendor callback into a decision on our record.
 * Signature verification is the adapter's job — it is the only thing that knows the
 * vendor's scheme — so a `parseWebhookVerdict` that throws means "reject this call".
 *
 * @returns {{applied:boolean, kind?:string, decision?:string, recordId?:string, reason?:string}}
 */
async function applyWebhook({ providerName, payload, headers, rawBody, db }) {
    const provider = getActiveProvider();
    if (!provider) return { applied: false, reason: 'no provider configured' };
    if (providerName && providerName !== provider.name) {
        return { applied: false, reason: `callback is for '${providerName}' but '${provider.name}' is active` };
    }

    // Throws on a bad signature — deliberately not caught here, so the route answers 401.
    const verdict = provider.parseWebhookVerdict(payload, headers, rawBody);
    const { externalRef, kind, decision, reason } = verdict || {};
    if (!externalRef || !kind) return { applied: false, reason: 'callback carried no externalRef/kind' };
    if (!['approved', 'rejected'].includes(decision)) {
        // Vendors emit progress events too; only a terminal decision moves our record.
        return { applied: false, reason: `no terminal decision in callback (got '${decision}')` };
    }

    const model = kind === 'identity' ? db.IdentityVerification : db.CompanyVerification;
    const record = await model.findOne({ where: { provider_name: provider.name, provider_ref: String(externalRef) } });
    if (!record) return { applied: false, reason: `no ${kind} verification holds ref ${externalRef}` };
    if (['approved', 'rejected'].includes(record.status)) {
        return { applied: false, reason: 'already decided', recordId: record.id, kind, decision: record.status };
    }

    await record.update({ provider_result: { ...(record.provider_result || {}), verdict: decision, reason: reason || null, at: new Date().toISOString() } });

    // Route through the real state machine so expiry, checklist rollup, badge
    // recompute and notifications all fire exactly as they do for a human decision.
    if (kind === 'identity') {
        await require('./identity').review({
            identityVerification: record, decision, reviewedBy: `provider:${provider.name}`, rejectionReason: reason || null,
        });
    } else {
        await require('./company').reviewCompanyVerification({
            record, decision, reviewedBy: `provider:${provider.name}`, rejectionReason: reason || null,
        });
    }

    return { applied: true, kind, decision, recordId: record.id, provider: provider.name };
}

module.exports = { dispatch, applyWebhook };
