'use strict';
/**
 * Indexed matcher for the real sanctions lists.
 *
 * The original matcher compared a name against every listed name (and re-normalised
 * each one) on every screening, and treated "one name contains the other" as a hit.
 * That is fine for thirteen rows. Against ~26,000 listed parties and ~50,000 names
 * it is both too slow and wrong in practice: a customer called "Global Trading
 * Company" must not be blocked because some listed alias is "Global Trading".
 *
 * This index is built once per reference-data load and answers a screening in
 * milliseconds. It also grades every hit, because "block" and "a person should
 * look at this" are different outcomes and a sanctions programme that cannot tell
 * them apart either blocks real customers or waves through real matches:
 *
 *   exact       same words after normalisation              -> block
 *   reordered   same words in a different order (2+ words)  -> block
 *   fuzzy       very close spelling (transliteration, typo)  -> review
 *   partial     the listed name is wholly inside the input   -> review
 *   weak        matches only an alias the publisher flags as weak/low-quality -> review
 *   short_exact the whole name is a few letters ("CEC")      -> review
 *   common_name an exact match made only of very common words ("Dubai Trading") -> review
 *   legal_form_differs same name but a different legal form (LLC vs Company)   -> review
 *
 * An individual's exact-name hit where the input names a country that the listing
 * does not include is downgraded to review: a common name in the wrong country is
 * the classic false positive, and the listing's own country data is what rules it
 * out. Entities are never downgraded this way.
 */

// Legal-form and filler words. Removed from BOTH sides before comparing so
// "Acme Trading Ltd" and "ACME TRADING LIMITED" are the same name.
const FILLER = new Set([
    'the', 'and', 'of', 'ltd', 'limited', 'llc', 'inc', 'incorporated', 'co', 'company', 'corp', 'corporation',
    'sa', 'gmbh', 'ag', 'plc', 'jsc', 'ojsc', 'pjsc', 'ooo', 'oao', 'zao', 'bv', 'nv', 'pte', 'pvt', 'private',
    'llp', 'lp', 'fze', 'fzc', 'fzco', 'sarl', 'srl', 'spa', 'sdn', 'bhd', 'kg', 'oy', 'ab', 'as',
]);

const MIN_FUZZY_LENGTH = 10;     // below this, only exact / reordered can match
const MIN_PARTIAL_LENGTH = 10;
const FUZZY_THRESHOLD = 0.93;    // Jaro-Winkler on the normalised string
const MAX_POSTING = 3000;        // a word in more names than this identifies nothing
const MAX_CANDIDATES = 4000;
const SHORT_NAME = 6;            // an exact match on a name this short proves little
const COMMON_WORD = 40;          // a word in more listed names than this is a common word
const TOKEN_ALIGN = 0.8;         // each word of a fuzzy match must have a close counterpart

// Legal-form words, folded to one spelling each ("Ltd" = "Limited"). Two names that
// are identical apart from DIFFERENT legal forms ("Dubai Trading LLC" / "Dubai
// Trading Company") are different registered entities until a person says otherwise.
const FORM_CANON = new Map([
    ['ltd', 'ltd'], ['limited', 'ltd'], ['co', 'co'], ['company', 'co'], ['corp', 'corp'], ['corporation', 'corp'],
    ['inc', 'inc'], ['incorporated', 'inc'], ['pvt', 'pvt'], ['private', 'pvt'],
    ['llc', 'llc'], ['llp', 'llp'], ['lp', 'lp'], ['plc', 'plc'], ['gmbh', 'gmbh'], ['ag', 'ag'], ['sa', 'sa'],
    ['jsc', 'jsc'], ['ojsc', 'ojsc'], ['pjsc', 'pjsc'], ['ooo', 'ooo'], ['oao', 'oao'], ['zao', 'zao'],
    ['bv', 'bv'], ['nv', 'nv'], ['pte', 'pte'], ['fze', 'fze'], ['fzc', 'fzc'], ['fzco', 'fzco'],
    ['sarl', 'sarl'], ['srl', 'srl'], ['spa', 'spa'], ['sdn', 'sdn'], ['bhd', 'bhd'], ['kg', 'kg'],
    ['oy', 'oy'], ['ab', 'ab'], ['as', 'as'],
]);

/** True when the two forms strings clash: both have forms, and neither is contained in the other. */
function formsConflict(a, b) {
    if (!a || !b) return false;
    const x = new Set(a.split(' '));
    const y = new Set(b.split(' '));
    const aInB = [...x].every((f) => y.has(f));
    const bInA = [...y].every((f) => x.has(f));
    return !(aInB || bInA);   // {ltd} vs {co ltd} is the same company type; {llc} vs {co} is not
}

/** Canonical legal-form words in a name, as a sorted string ('' when it has none). */
function legalForms(name) {
    const folded = String(name || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const forms = new Set();
    for (const t of folded.split(/[^\p{L}\p{N}]+/u)) if (FORM_CANON.has(t)) forms.add(FORM_CANON.get(t));
    return [...forms].sort().join(' ');
}

function tokens(name) {
    const folded = String(name || '')
        .normalize('NFKD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/&/g, ' and ');
    const all = folded.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    const core = all.filter((t) => !FILLER.has(t));
    return core.length ? core : all;
}

function jaroWinkler(a, b) {
    if (a === b) return 1;
    const la = a.length;
    const lb = b.length;
    if (!la || !lb) return 0;
    const range = Math.max(0, Math.floor(Math.max(la, lb) / 2) - 1);
    const ma = new Array(la).fill(false);
    const mb = new Array(lb).fill(false);
    let matches = 0;
    for (let i = 0; i < la; i += 1) {
        const lo = Math.max(0, i - range);
        const hi = Math.min(lb - 1, i + range);
        for (let j = lo; j <= hi; j += 1) {
            if (!mb[j] && a[i] === b[j]) { ma[i] = true; mb[j] = true; matches += 1; break; }
        }
    }
    if (!matches) return 0;
    let t = 0;
    let k = 0;
    for (let i = 0; i < la; i += 1) {
        if (!ma[i]) continue;
        while (!mb[k]) k += 1;
        if (a[i] !== b[k]) t += 1;
        k += 1;
    }
    const jaro = (matches / la + matches / lb + (matches - t / 2) / matches) / 3;
    let prefix = 0;
    while (prefix < 4 && prefix < la && prefix < lb && a[prefix] === b[prefix]) prefix += 1;
    return jaro + prefix * 0.1 * (1 - jaro);
}

const push = (map, key, v) => { const l = map.get(key); if (l) l.push(v); else map.set(key, [v]); };

class PartyIndex {
    /** @param {object[]} parties rows shaped like compliance_sanctioned_parties */
    constructor(parties = []) {
        this.parties = parties;
        this.variants = [];           // { rec, name, key, sorted, toks, kind }
        this.exact = new Map();
        this.sortedKey = new Map();
        this.postings = new Map();

        parties.forEach((rec, rec_i) => {
            const meta = rec.metadata || {};
            this._add(rec_i, rec.name, 'name');
            for (const a of rec.aliases || []) this._add(rec_i, a, 'alias');
            for (const a of meta.weak_aliases || []) this._add(rec_i, a, 'weak');
        });
    }

    get length() { return this.parties.length; }

    _add(recIdx, name, kind) {
        const toks = tokens(name);
        if (!toks.length) return;
        const key = toks.join(' ');
        if (key.length < 2) return;
        const id = this.variants.length;
        this.variants.push({ recIdx, name, key, sorted: [...toks].sort().join(' '), toks, kind, forms: legalForms(name) });
        push(this.exact, key, id);
        if (toks.length >= 2) push(this.sortedKey, [...toks].sort().join(' '), id);
        for (const t of new Set(toks)) push(this.postings, t, id);
    }

    /**
     * @param {string} name
     * @param {{ country?: string }} [ctx]  the screened party's ISO-2 country, if known
     * @returns {Array<{ record, quality, score, matched_name, via }>} best hit per record, best first
     */
    match(name, ctx = {}) {
        const toks = tokens(name);
        if (!toks.length) return [];
        const key = toks.join(' ');
        if (key.length < 2) return [];
        const sorted = [...toks].sort().join(' ');
        const forms = legalForms(name);
        const best = new Map(); // recIdx -> hit

        const consider = (variantId, quality, score) => {
            const v = this.variants[variantId];
            let q = quality;
            let s = score;
            if (v.kind === 'weak') { q = 'weak'; s = Math.min(s, 0.7); }
            const rec = this.parties[v.recIdx];
            if (q === 'exact' || q === 'reordered') {
                q = this._grade(rec, q, ctx, key, toks);
                if ((q === 'exact' || q === 'reordered') && formsConflict(forms, v.forms)) q = 'legal_form_differs';
                if (q !== quality) s = Math.min(s, 0.9);
            }
            const hit = { record: rec, quality: q, score: s, matched_name: v.name, via: v.kind };
            const cur = best.get(v.recIdx);
            if (!cur || RANK[q] > RANK[cur.quality] || (RANK[q] === RANK[cur.quality] && s > cur.score)) best.set(v.recIdx, hit);
        };

        for (const id of this.exact.get(key) || []) consider(id, 'exact', 1);
        if (toks.length >= 2 && key.length >= 8) {
            for (const id of this.sortedKey.get(sorted) || []) consider(id, 'reordered', 0.97);
        }

        if (key.length >= MIN_FUZZY_LENGTH || key.length >= MIN_PARTIAL_LENGTH) {
            const candidates = new Set();
            for (const t of new Set(toks)) {
                const list = this.postings.get(t);
                if (!list || list.length > MAX_POSTING) continue;
                for (const id of list) { candidates.add(id); if (candidates.size >= MAX_CANDIDATES) break; }
            }
            const tokSet = new Set(toks);
            for (const id of candidates) {
                const v = this.variants[id];
                if (v.key === key) continue;
                // partial: every word of a multi-word listed name is present in the input
                if (v.toks.length >= 2 && v.key.length >= MIN_PARTIAL_LENGTH && v.toks.every((t) => tokSet.has(t)) && toks.length > v.toks.length) {
                    consider(id, 'partial', 0.75);
                    continue;
                }
                if (key.length >= MIN_FUZZY_LENGTH && v.key.length >= MIN_FUZZY_LENGTH && Math.abs(v.key.length - key.length) <= 3) {
                    const shared = v.toks.filter((t) => tokSet.has(t)).length;
                    if (shared * 2 < Math.min(v.toks.length, toks.length)) continue;
                    const jw = jaroWinkler(key, v.key);
                    if (jw >= FUZZY_THRESHOLD && this._aligned(toks, v.toks)) consider(id, 'fuzzy', jw);
                }
            }
        }

        return [...best.values()].sort((a, b) => RANK[b.quality] - RANK[a.quality] || b.score - a.score);
    }

    /**
     * Decide whether an exact/reordered name match is strong enough to block.
     * A name of a few letters, or one built only from very common words, is not
     * evidence on its own. An individual's name with a country that the listing
     * rules out is the classic false positive.
     */
    _grade(rec, quality, ctx, key, toks) {
        if (key.length < SHORT_NAME && toks.length === 1) return 'short_exact';
        if (toks.length <= 2 && this._rarest(toks) > COMMON_WORD) return 'common_name';
        if (rec.party_type === 'individual' && ctx.country) {
            const listed = (rec.metadata && rec.metadata.countries) || (rec.country ? [rec.country] : []);
            if (listed.length && !listed.includes(String(ctx.country).toUpperCase())) return 'exact_other_country';
        }
        return quality;
    }

    /** Size of the smallest posting list among the words: how rare the rarest word is. */
    _rarest(toks) {
        let min = Infinity;
        for (const t of toks) {
            const n = (this.postings.get(t) || []).length;
            if (n < min) min = n;
        }
        return min === Infinity ? 0 : min;
    }

    /** Every word on the shorter side has a close counterpart on the other. */
    _aligned(a, b) {
        const [short, long] = a.length <= b.length ? [a, b] : [b, a];
        const used = new Set();
        for (const t of short) {
            let bestJ = -1;
            let best = 0;
            long.forEach((u, j) => {
                if (used.has(j)) return;
                const sim = t === u ? 1 : jaroWinkler(t, u);
                if (sim > best) { best = sim; bestJ = j; }
            });
            if (best < TOKEN_ALIGN) return false;
            used.add(bestJ);
        }
        return true;
    }
}

// Higher wins when one record matches several ways.
const RANK = Object.freeze({
    exact: 9, reordered: 8, exact_other_country: 7, legal_form_differs: 6, common_name: 5, short_exact: 4, fuzzy: 3, partial: 2, weak: 1,
});
// What the screening engine should do with each grade.
const BLOCKING = Object.freeze(new Set(['exact', 'reordered']));

module.exports = { PartyIndex, tokens, jaroWinkler, BLOCKING, RANK, FILLER };
