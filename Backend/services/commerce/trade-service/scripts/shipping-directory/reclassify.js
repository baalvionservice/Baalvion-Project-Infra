'use strict';
/**
 * Stage I — recover a vessel type for hulls Wikidata types only as "ship".
 *
 * THE PROBLEM, MEASURED. 58,086 of 95,871 vessels classify as `other`. That is not a bug
 * in classify.js: 57,268 of them (97.7%) carry exactly one P31 value, Q11446 "ship". The
 * source states no type, so no amount of label-matching against P31 can produce one.
 *
 * WHAT CAN HONESTLY BE RECOVERED, and from where:
 *
 *   1. The Wikipedia lead sentence. "The ONE Apus is a 14,000 TEU container ship" is a
 *      STATED classification in a cited source, not an inference — the same standing as
 *      the P31 value we would otherwise have used. Only the first sentence is read, and
 *      only the predicate after "is/was a(n)", because later sentences routinely mention
 *      other vessels ("sister ship of X, a bulk carrier") and would misclassify this one.
 *   2. The ship class (P289). "Supramax" is a type statement.
 *   3. The unit of its stated capacity. A capacity denominated in TEU means a container
 *      ship; one denominated in passengers means a passenger vessel.
 *   4. The long tail of P31 values classify.js has no rule for yet — motor ship, pilot
 *      boat, livestock carrier, cruiseferry and so on.
 *
 * WHAT IS NOT DONE HERE, deliberately: nothing is inferred from tonnage, dimensions, name
 * or fleet-mates. "It is 32,540 GT and Norwegian so it is probably a bulk carrier" would
 * be a guess presented as a fact, and a wrong one often enough to matter — the whole
 * point of this directory is that a stated figure and an inferred one are never mixed.
 *
 * Every recovered type is written with the evidence that produced it, so any row can be
 * traced back to the sentence or the property it came from.
 *
 *   node scripts/shipping-directory/reclassify.js [--apply] [--sample=30]
 */
const fs = require('fs');
const path = require('path');
const db = require('../../models');
const { RULES } = require('./classify');

const CACHE = path.join(__dirname, '.cache');

/**
 * The Wikipedia infobox `| type =` field, keyed by the vessel's Wikidata QID.
 *
 * This is the single most explicit type statement available anywhere in the free sources:
 * "Crude oil tanker", "Cruise ship", "Container ship", written as a field whose only
 * purpose is to state the type. It outranks the lead sentence, which has to be parsed out
 * of a clause and can describe a sister ship.
 */
function loadInfoboxTypes() {
    const f = path.join(CACHE, 'infoboxes.json');
    if (!fs.existsSync(f)) return {};
    const raw = JSON.parse(fs.readFileSync(f));
    const byQid = {};
    for (const [qid, row] of Object.entries(raw)) if (row && row.type) byQid[qid] = row.type;
    return byQid;
}

const q = (sql, bind) => db.sequelize.query(sql, { bind, logging: false });

/**
 * The predicate of the lead sentence — the part that states what the thing IS.
 *
 * Anchored on the copula so a later clause cannot supply the type. Returns null rather
 * than falling back to the whole summary: a loose match over a paragraph is exactly how a
 * ship gets classified by its sister's type.
 */
function leadPredicate(summary) {
    if (!summary) return null;
    const firstSentence = String(summary).split(/(?<=\.)\s/)[0] || '';
    // "X is a bulk carrier", "The Y was an oil tanker", "Z is a Panamax-class container ship"
    const m = /\b(?:is|was|are|were)\s+(?:a|an|the)?\s*(.{0,120})/i.exec(firstSentence);
    return m ? m[1].toLowerCase() : null;
}

/** Phrases that appear in prose but not in Wikidata class labels. */
const PROSE_RULES = [
    // Ordered BEFORE everything else, because these phrases contain words that the
    // general rules would grab first and get wrong. A "cruise ferry" is a ferry, not a
    // cruise ship; a "ro-pax ferry" carries passengers and is a ferry, while a "ro-ro
    // cargo ship" is not. The generic /cruise/ and /ro-ro/ rules cannot tell them apart.
    [/\bcruise ?ferry\b|\bcruiseferry\b|\bro-?pax\b|\bropax\b|roll-on\/roll-off ferry|ro-?ro ferry/, 'ferry'],
    [/\bfsru\b|floating storage and regasification/, 'lng_carrier'],
    [/\bfpso\b|floating production storage/, 'rig'],
    [/\bfso\b|floating storage(?: and offloading)?\b/, 'tanker'],
    [/\bvlcc\b|very large crude carrier|ultra large crude/, 'oil_tanker'],
    [/\bvlgc\b|very large gas carrier/, 'lpg_carrier'],
    [/\bcape ?size\b|\bpanamax\b|\bsupramax\b|\bhandysize\b|\bhandymax\b|\bkamsarmax\b|\bnewcastlemax\b/, 'bulk_carrier'],
    [/\bulcv\b|\bneopanamax\b|\bpost-panamax\b/, 'container'],
    [/\baframax\b|\bsuezmax\b|\bmedium range tanker\b|\bmr tanker\b/, 'oil_tanker'],
    [/\bcon-?ro\b/, 'roro'],
    [/\bpctc\b|pure car(?: and truck)? carrier/, 'car_carrier'],
];

function classifyFromText(text) {
    if (!text) return null;
    for (const [re, type] of PROSE_RULES) if (re.test(text)) return type;
    // The existing P31 label rules work unchanged on prose — they match the same phrases.
    for (const [re, type] of RULES) if (re.test(text)) return type;
    return null;
}

/** A capacity unit that only one kind of ship is measured in. */
const UNIT_TO_TYPE = {
    TEU: 'container',
    passengers: 'passenger',
    persons: 'passenger',
    'lane metres': 'roro',
    'motor cars': 'car_carrier',
};

async function main() {
    const apply = process.argv.includes('--apply');
    const sampleSize = Number((process.argv.find((a) => a.startsWith('--sample=')) || '').replace('--sample=', '')) || 20;

    const [rows] = await q(`
        SELECT id, slug, name, imo_number, wikidata_qid, summary, vessel_class, capacity_unit, designed_to_carry
          FROM tradeops.vessels
         WHERE vessel_type = 'other'`);
    const infoboxTypes = loadInfoboxTypes();
    console.log(`[reclassify] ${Object.keys(infoboxTypes).length} infobox type statements available`);
    console.log(`[reclassify] ${rows.length} vessels currently unclassified`);

    const proposals = [];
    for (const v of rows) {
        let type = null;
        let evidence = null;

        // The infobox type field first — it is a stated classification, not a parse.
        const ibType = v.wikidata_qid ? infoboxTypes[v.wikidata_qid] : null;
        if (ibType) {
            const fromInfobox = classifyFromText(ibType.toLowerCase());
            if (fromInfobox) { type = fromInfobox; evidence = `Wikipedia infobox type: "${ibType.slice(0, 60)}"`; }
        }

        const predicate = !type ? leadPredicate(v.summary) : null;
        if (predicate) {
            const fromProse = classifyFromText(predicate);
            if (fromProse) { type = fromProse; evidence = `Wikipedia lead sentence: "…${predicate.slice(0, 70).trim()}…"`; }
        }
        if (!type && v.vessel_class) {
            const fromClass = classifyFromText(v.vessel_class.toLowerCase());
            if (fromClass) { type = fromClass; evidence = `ship class "${v.vessel_class}"`; }
        }
        if (!type && v.designed_to_carry) {
            const fromCargo = classifyFromText(v.designed_to_carry.toLowerCase());
            if (fromCargo) { type = fromCargo; evidence = `designed to carry "${v.designed_to_carry}"`; }
        }
        if (!type && v.capacity_unit && UNIT_TO_TYPE[v.capacity_unit]) {
            type = UNIT_TO_TYPE[v.capacity_unit];
            evidence = `stated capacity in ${v.capacity_unit}`;
        }

        if (type) proposals.push({ id: v.id, slug: v.slug, name: v.name, type, evidence });
    }

    const byType = {};
    for (const p of proposals) byType[p.type] = (byType[p.type] || 0) + 1;

    console.log(`\n[reclassify] ${proposals.length} of ${rows.length} can be typed from a stated source (${(100 * proposals.length / rows.length).toFixed(1)}%)`);
    console.log('  by type:', Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t}:${n}`).join(' '));
    console.log(`\n  sample for manual check (evidence shown so every call is traceable):`);
    for (const p of proposals.slice(0, sampleSize)) {
        console.log(`   ${p.name.padEnd(28).slice(0, 28)} -> ${p.type.padEnd(15)} ${p.evidence}`);
    }

    if (!apply) {
        console.log('\n[reclassify] dry run — pass --apply to write these types');
        return;
    }

    let written = 0;
    for (let i = 0; i < proposals.length; i += 500) {
        const chunk = proposals.slice(i, i + 500);
        // The evidence travels with the value into metadata, so a reader (or a later
        // maintainer) can see this type was read off prose rather than off P31.
        await q(`
            UPDATE tradeops.vessels v
               SET vessel_type = c.type,
                   metadata = COALESCE(v.metadata, '{}'::jsonb)
                              || jsonb_build_object('type_recovered_from', c.evidence)
              FROM (SELECT * FROM jsonb_to_recordset($rows::jsonb)
                          AS x(id uuid, type text, evidence text)) c
             WHERE v.id = c.id`,
            { rows: JSON.stringify(chunk.map((p) => ({ id: p.id, type: p.type, evidence: p.evidence }))) });
        written += chunk.length;
    }
    console.log(`\n[reclassify] PASS — ${written} vessels retyped from a stated source`);

    const [[after]] = await q(`SELECT COUNT(*) FILTER (WHERE vessel_type = 'other')::int AS other,
                                     COUNT(*)::int AS total FROM tradeops.vessels`);
    console.log(`[reclassify] unclassified now ${after.other} of ${after.total} (${(100 * after.other / after.total).toFixed(1)}%)`);
}

if (require.main === module) {
    main()
        .then(() => db.sequelize.close().then(() => process.exit(0)))
        .catch((e) => { console.error('[reclassify] FAIL —', e.message); process.exit(1); });
}
module.exports = { leadPredicate, classifyFromText, PROSE_RULES };
