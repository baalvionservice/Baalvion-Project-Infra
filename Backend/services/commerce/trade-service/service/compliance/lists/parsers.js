'use strict';
/**
 * Parsers for the three official sanctions-list exports.
 *
 *   OFAC  SDN list        https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.XML
 *   UN    consolidated    https://scsanctions.un.org/resources/xml/en/consolidated.xml
 *   EU    financial sanctions (FSF)  https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content
 *
 * Each parser turns one file into the same record shape and also reports what the
 * publisher says the file contains (`declared_count`, where it gives one) so the
 * importer can tell a complete download from a truncated one.
 *
 * Aliases are split by strength. A "weak" alias (OFAC category "weak", UN quality
 * "Low", EU strong="false") is a broad or low-confidence name that publishers
 * themselves warn produces false matches; it is kept for analyst review but never
 * drives an automatic hit.
 */

const x = require('./xmlLite');
const { toIso2 } = require('./countries');

const SEVERITY = 'critical';

function dedupe(names, exclude = '') {
    const seen = new Set([String(exclude).toLowerCase()]);
    const out = [];
    for (const n of names) {
        const v = String(n || '').replace(/\s+/g, ' ').trim();
        const k = v.toLowerCase();
        if (!v || seen.has(k)) continue;
        seen.add(k);
        out.push(v);
    }
    return out;
}

function isoSet(namesOrCodes) {
    const iso = [];
    const unmapped = [];
    for (const c of namesOrCodes) {
        if (!c) continue;
        const code = toIso2(c);
        if (code) { if (!iso.includes(code)) iso.push(code); } else if (!unmapped.includes(c)) unmapped.push(c);
    }
    return { iso, unmapped };
}

const join = (...parts) => parts.map((p) => String(p || '').trim()).filter(Boolean).join(' ');

// ── OFAC ─────────────────────────────────────────────────────────────────────

const OFAC_TYPE = { Individual: 'individual', Entity: 'entity', Vessel: 'vessel', Aircraft: 'entity' };

function parseOfac(xml) {
    const pub = x.text(xml, 'Publish_Date'); // MM/DD/YYYY
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(pub);
    const listDate = m ? `${m[3]}-${m[1]}-${m[2]}` : null;
    const declared = Number(x.text(xml, 'Record_Count')) || null;

    const parties = [];
    for (const b of x.blocks(xml, 'sdnEntry')) {
        const uid = x.text(b, 'uid');
        const sdnType = x.text(b, 'sdnType');
        const name = join(x.text(b, 'firstName'), x.text(b, 'lastName'));
        if (!uid || !name) continue;

        const strong = [];
        const weak = [];
        for (const a of x.blocks(b, 'aka')) {
            const alias = join(x.text(a, 'firstName'), x.text(a, 'lastName'));
            (x.text(a, 'category') === 'weak' ? weak : strong).push(alias);
        }

        const addresses = x.blocks(b, 'address');
        const { iso, unmapped } = isoSet(addresses.map((a) => x.text(a, 'country')));
        const programs = x.texts(b, 'program');

        parties.push({
            source_id: uid,
            party_type: OFAC_TYPE[sdnType] || 'entity',
            name,
            aliases: dedupe(strong, name),
            country: iso[0] || null,
            program: programs.join('; ') || null,
            severity: SEVERITY,
            notes: x.text(b, 'remarks') || null,
            metadata: {
                subtype: sdnType.toLowerCase(),
                weak_aliases: dedupe(weak, name),
                countries: iso,
                countries_unmapped: unmapped,
                programs,
                title: x.text(b, 'title') || null,
                dates_of_birth: x.texts(b, 'dateOfBirth'),
                ids: x.blocks(b, 'id').map((i) => ({ type: x.text(i, 'idType'), number: x.text(i, 'idNumber'), country: x.text(i, 'idCountry') })).filter((i) => i.number),
            },
        });
    }
    return { list_source: 'OFAC', list_date: listDate, declared_count: declared, parties };
}

// ── UN Security Council consolidated list ────────────────────────────────────

function parseUn(xml) {
    const gen = /<CONSOLIDATED_LIST\b[^>]*\bdateGenerated="([^"]+)"/.exec(xml);
    const listDate = gen ? gen[1].slice(0, 10) : null;

    const parties = [];
    const read = (kind, partyType) => {
        for (const b of x.blocks(xml, kind)) {
            const id = x.text(b, 'REFERENCE_NUMBER') || x.text(b, 'DATAID');
            const name = join(x.text(b, 'FIRST_NAME'), x.text(b, 'SECOND_NAME'), x.text(b, 'THIRD_NAME'), x.text(b, 'FOURTH_NAME'));
            if (!id || !name) continue;

            const strong = [];
            const weak = [];
            for (const a of x.blocks(b, `${kind}_ALIAS`)) {
                const alias = x.text(a, 'ALIAS_NAME');
                if (!alias) continue;
                (/^low$/i.test(x.text(a, 'QUALITY')) ? weak : strong).push(alias);
            }
            const countries = [
                ...x.texts(b, 'COUNTRY'),
                ...x.blocks(b, 'NATIONALITY').flatMap((n) => x.texts(n, 'VALUE')),
            ];
            const { iso, unmapped } = isoSet(countries);

            parties.push({
                source_id: id,
                party_type: partyType,
                name,
                aliases: dedupe(strong, name),
                country: iso[0] || null,
                program: x.text(b, 'UN_LIST_TYPE') || null,
                severity: SEVERITY,
                notes: x.text(b, 'COMMENTS1') || null,
                metadata: {
                    subtype: kind.toLowerCase(),
                    weak_aliases: dedupe(weak, name),
                    countries: iso,
                    countries_unmapped: unmapped,
                    programs: [x.text(b, 'UN_LIST_TYPE')].filter(Boolean),
                    listed_on: x.text(b, 'LISTED_ON') || null,
                    un_data_id: x.text(b, 'DATAID') || null,
                    dates_of_birth: x.blocks(b, `${kind}_DATE_OF_BIRTH`).map((d) => x.text(d, 'DATE') || x.text(d, 'YEAR')).filter(Boolean),
                },
            });
        }
    };
    read('INDIVIDUAL', 'individual');
    read('ENTITY', 'entity');
    return { list_source: 'UN', list_date: listDate, declared_count: null, parties };
}

// ── EU consolidated financial sanctions ──────────────────────────────────────

function parseEu(xml) {
    const gen = /<export\b[^>]*\bgenerationDate="([^"]+)"/.exec(xml);
    const listDate = gen ? gen[1].slice(0, 10) : null;

    const parties = [];
    for (const b of x.blocks(xml, 'sanctionEntity')) {
        const root = x.rootAttributes(b);
        const id = root.logicalId;
        if (!id) continue;

        const subject = (x.openTags(b, 'subjectType')[0] || {}).code || '';
        const partyType = subject === 'person' ? 'individual' : 'entity';

        const names = x.openTags(b, 'nameAlias').map((a) => ({
            name: a.wholeName || join(a.firstName, a.middleName, a.lastName),
            strong: a.strong !== 'false',
        })).filter((n) => n.name);
        if (!names.length) continue;
        const primary = names[0].name;

        const countries = [
            ...x.openTags(b, 'citizenship').map((c) => c.countryIso2Code),
            ...x.openTags(b, 'address').map((c) => c.countryIso2Code),
            ...x.openTags(b, 'birthdate').map((c) => c.countryIso2Code),
        ].filter((c) => c && c !== '00');
        const { iso, unmapped } = isoSet(countries);
        const programmes = [...new Set(x.openTags(b, 'regulation').map((r) => r.programme).filter(Boolean))];

        parties.push({
            source_id: id,
            party_type: partyType,
            name: primary,
            aliases: dedupe(names.slice(1).filter((n) => n.strong).map((n) => n.name), primary),
            country: iso[0] || null,
            program: programmes.join('; ') || null,
            severity: SEVERITY,
            notes: x.text(b, 'remark') || null,
            metadata: {
                subtype: subject || null,
                weak_aliases: dedupe(names.slice(1).filter((n) => !n.strong).map((n) => n.name), primary),
                countries: iso,
                countries_unmapped: unmapped,
                programs: programmes,
                eu_reference_number: root.euReferenceNumber || null,
                un_id: root.unitedNationId || null,
                dates_of_birth: x.openTags(b, 'birthdate').map((d) => d.birthdate).filter(Boolean),
            },
        });
    }
    return { list_source: 'EU', list_date: listDate, declared_count: null, parties };
}

const PARSERS = Object.freeze({ OFAC: parseOfac, UN: parseUn, EU: parseEu });

module.exports = { parseOfac, parseUn, parseEu, PARSERS };
