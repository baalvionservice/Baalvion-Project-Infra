'use strict';
/**
 * Real sanctions lists — verification harness.
 *
 * Proves, without network access:
 *   - each publisher format is read correctly (names, aliases, weak aliases,
 *     countries, ids, publication date, declared count);
 *   - the importer refuses a truncated file, a count that does not add up, and an
 *     implausible shrink;
 *   - the matcher blocks only what deserves blocking and sends the rest to a person;
 *   - a listed name is never silently passed;
 *   - the rules engine turns those grades into block / review decisions.
 *
 * With SANCTIONS_TEST_DB set (a Postgres URL for a throwaway database that has
 * migrations 014 + 088 applied) it also runs the import lifecycle for real:
 * load, idempotent re-run, delisting, re-listing, and a refused run.
 *
 *   node tests/compliance-lists.verify.js
 *   SANCTIONS_TEST_DB=postgres://user:pw@localhost:5432/scratch node tests/compliance-lists.verify.js
 */
const assert = require('assert');

const x = require('../service/compliance/lists/xmlLite');
const { toIso2 } = require('../service/compliance/lists/countries');
const { parseOfac, parseUn, parseEu } = require('../service/compliance/lists/parsers');
const { assertPlausible, ImportRefused, MIN_RECORDS } = require('../service/compliance/lists/importer');
const { PartyIndex, jaroWinkler } = require('../service/compliance/lists/partyIndex');
const rules = require('../service/compliance/rules');
const report = require('../service/compliance/report');
const severity = require('../service/compliance/severity');

let pass = 0;
let fail = 0;
const failures = [];
async function t(name, fn) {
    try { await fn(); pass += 1; console.log(`  ✓ ${name}`); }
    catch (err) { fail += 1; failures.push({ name, message: err.message }); console.log(`  ✗ ${name}\n      ${err.message}`); }
}
const section = (s) => console.log(`\n${s}`);

// ── Fixtures in the publishers' real shapes ──────────────────────────────────

const OFAC_XML = `<?xml version="1.0" standalone="yes"?>
<sdnList xmlns="https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/XML">
  <publshInformation><Publish_Date>10/09/2026</Publish_Date><Record_Count>3</Record_Count></publshInformation>
  <sdnEntry><uid>36</uid><lastName>AEROCARIBBEAN AIRLINES</lastName><sdnType>Entity</sdnType>
    <programList><program>CUBA</program></programList>
    <akaList><aka><uid>12</uid><type>a.k.a.</type><category>strong</category><lastName>AERO-CARIBBEAN</lastName></aka>
             <aka><uid>13</uid><type>a.k.a.</type><category>weak</category><lastName>ACA</lastName></aka></akaList>
    <addressList><address><uid>25</uid><city>Havana</city><country>Cuba</country></address></addressList></sdnEntry>
  <sdnEntry><uid>900</uid><firstName>Ivan</firstName><lastName>PETROV</lastName><sdnType>Individual</sdnType>
    <programList><program>RUSSIA-EO14024</program><program>CYBER2</program></programList>
    <addressList><address><uid>1</uid><country>Region: Gaza</country></address><address><uid>2</uid><country>Russia</country></address></addressList></sdnEntry>
  <sdnEntry><uid>901</uid><lastName>NEPTUNE &amp; SONS SHIPPING</lastName><sdnType>Vessel</sdnType>
    <programList><program>IRAN</program></programList></sdnEntry>
</sdnList>`;

const UN_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<CONSOLIDATED_LIST dateGenerated="2026-10-10T23:00:02.187Z">
  <INDIVIDUALS>
    <INDIVIDUAL><DATAID>1</DATAID><FIRST_NAME>ERIC</FIRST_NAME><SECOND_NAME>BADEGE</SECOND_NAME><UN_LIST_TYPE>DRC</UN_LIST_TYPE>
      <REFERENCE_NUMBER>CDi.001</REFERENCE_NUMBER><LISTED_ON>2012-12-31</LISTED_ON>
      <NATIONALITY><VALUE>Democratic Republic of the Congo</VALUE></NATIONALITY>
      <INDIVIDUAL_ALIAS><QUALITY>Good</QUALITY><ALIAS_NAME>Eric Badege Mukwege</ALIAS_NAME></INDIVIDUAL_ALIAS>
      <INDIVIDUAL_ALIAS><QUALITY>Low</QUALITY><ALIAS_NAME>E B</ALIAS_NAME></INDIVIDUAL_ALIAS>
      <INDIVIDUAL_ALIAS><QUALITY/><ALIAS_NAME/></INDIVIDUAL_ALIAS>
      <INDIVIDUAL_ADDRESS><COUNTRY>Rwanda</COUNTRY></INDIVIDUAL_ADDRESS>
    </INDIVIDUAL>
  </INDIVIDUALS>
  <ENTITIES>
    <ENTITY><DATAID>2</DATAID><FIRST_NAME>ADF</FIRST_NAME><UN_LIST_TYPE>DRC</UN_LIST_TYPE><REFERENCE_NUMBER>CDe.001</REFERENCE_NUMBER>
      <ENTITY_ALIAS><QUALITY>a.k.a.</QUALITY><ALIAS_NAME>Allied Democratic Forces</ALIAS_NAME></ENTITY_ALIAS>
      <ENTITY_ADDRESS><COUNTRY>Democratic Republic of the Congo</COUNTRY></ENTITY_ADDRESS>
    </ENTITY>
  </ENTITIES>
</CONSOLIDATED_LIST>`;

const EU_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<export xmlns="http://eu.europa.ec/fpi/fsd/export" generationDate="2026-10-12T12:27:34.779+02:00">
  <sanctionEntity designationDetails="" unitedNationId="" euReferenceNumber="EU.27.28" logicalId="13">
    <remark>UNSC RESOLUTION 1483</remark>
    <regulation programme="IRQ" logicalId="348"><publicationUrl>http://example/</publicationUrl></regulation>
    <subjectType code="person" classificationCode="P"/>
    <nameAlias firstName="Saddam" middleName="" lastName="Hussein Al-Tikriti" wholeName="Saddam Hussein Al-Tikriti" strong="true" logicalId="17"/>
    <nameAlias firstName="" middleName="" lastName="" wholeName="Abu Ali" strong="true" logicalId="19"/>
    <nameAlias firstName="" middleName="" lastName="" wholeName="S H" strong="false" logicalId="20"/>
    <citizenship region="" countryIso2Code="IQ" countryDescription="IRAQ" logicalId="1"/>
    <birthdate circa="false" birthdate="1937-04-28" countryIso2Code="00" logicalId="2"/>
  </sanctionEntity>
  <sanctionEntity euReferenceNumber="EU.1.1" logicalId="14">
    <regulation programme="SYR" logicalId="1"/>
    <subjectType code="enterprise" classificationCode="E"/>
    <nameAlias wholeName="Damascus Trading Company" strong="true" logicalId="5"/>
    <address countryIso2Code="SY" logicalId="9"/>
  </sanctionEntity>
</export>`;

(async () => {
    section('XML reading');
    await t('unescapes named and numeric entities', () => {
        assert.strictEqual(x.unescapeXml('A &amp; B &lt;c&gt; &#233; &#x41;'), 'A & B <c> é A');
    });
    await t('does not treat <INDIVIDUALS> as an <INDIVIDUAL> record', () => {
        assert.strictEqual(x.blocks(UN_XML, 'INDIVIDUAL').length, 1);
    });

    section('Countries');
    await t('maps each publisher spelling to ISO-2', () => {
        const cases = { 'Korea, North': 'KP', "Democratic People's Republic of Korea": 'KP', Russia: 'RU', 'Russian Federation': 'RU', 'Region: Gaza': 'PS', "Cote d'Ivoire": 'CI', 'Iran (Islamic Republic of)': 'IR', iq: 'IQ' };
        for (const [name, iso] of Object.entries(cases)) assert.strictEqual(toIso2(name), iso, name);
    });
    await t('does not guess an unknown name', () => {
        assert.strictEqual(toIso2('Atlantis'), null);
        assert.strictEqual(toIso2('former Soviet Union'), null);
    });

    section('OFAC parser');
    const ofac = parseOfac(OFAC_XML);
    await t('reads date, declared count and every entry', () => {
        assert.strictEqual(ofac.list_date, '2026-10-09');
        assert.strictEqual(ofac.declared_count, 3);
        assert.strictEqual(ofac.parties.length, 3);
        assert.strictEqual(ofac.list_source, 'OFAC');
    });
    await t('splits strong from weak aliases and keeps programs and country', () => {
        const a = ofac.parties.find((p) => p.source_id === '36');
        assert.deepStrictEqual(a.aliases, ['AERO-CARIBBEAN']);
        assert.deepStrictEqual(a.metadata.weak_aliases, ['ACA']);
        assert.strictEqual(a.country, 'CU');
        assert.strictEqual(a.program, 'CUBA');
        assert.strictEqual(a.party_type, 'entity');
    });
    await t('composes individual names, maps vessels, unescapes, and maps "Region:" countries', () => {
        const p = ofac.parties.find((q) => q.source_id === '900');
        assert.strictEqual(p.name, 'Ivan PETROV');
        assert.strictEqual(p.party_type, 'individual');
        assert.deepStrictEqual(p.metadata.countries.sort(), ['PS', 'RU']);
        assert.strictEqual(p.program, 'RUSSIA-EO14024; CYBER2');
        const v = ofac.parties.find((q) => q.source_id === '901');
        assert.strictEqual(v.party_type, 'vessel');
        assert.strictEqual(v.name, 'NEPTUNE & SONS SHIPPING');
    });

    section('UN parser');
    const un = parseUn(UN_XML);
    await t('reads individuals and entities with reference numbers and date', () => {
        assert.strictEqual(un.list_date, '2026-10-10');
        assert.deepStrictEqual(un.parties.map((p) => p.source_id), ['CDi.001', 'CDe.001']);
        assert.strictEqual(un.parties[0].name, 'ERIC BADEGE');
        assert.strictEqual(un.parties[0].party_type, 'individual');
        assert.strictEqual(un.parties[1].party_type, 'entity');
    });
    await t('quality "Low" is a weak alias; empty aliases are ignored; countries come from nationality and address', () => {
        const p = un.parties[0];
        assert.deepStrictEqual(p.aliases, ['Eric Badege Mukwege']);
        assert.deepStrictEqual(p.metadata.weak_aliases, ['E B']);
        assert.deepStrictEqual(p.metadata.countries.sort(), ['CD', 'RW']);
    });

    section('EU parser');
    const eu = parseEu(EU_XML);
    await t('reads ids, subject types, programme and generation date', () => {
        assert.strictEqual(eu.list_date, '2026-10-12');
        assert.deepStrictEqual(eu.parties.map((p) => p.source_id), ['13', '14']);
        assert.strictEqual(eu.parties[0].party_type, 'individual');
        assert.strictEqual(eu.parties[1].party_type, 'entity');
        assert.strictEqual(eu.parties[0].program, 'IRQ');
    });
    await t('first name is primary, strong=false is weak, country "00" is ignored', () => {
        const p = eu.parties[0];
        assert.strictEqual(p.name, 'Saddam Hussein Al-Tikriti');
        assert.deepStrictEqual(p.aliases, ['Abu Ali']);
        assert.deepStrictEqual(p.metadata.weak_aliases, ['S H']);
        assert.deepStrictEqual(p.metadata.countries, ['IQ']);
        assert.strictEqual(eu.parties[1].country, 'SY');
    });

    section('Import safety checks');
    await t('refuses a file below the floor for that list', () => {
        assert.throws(() => assertPlausible({ source: 'OFAC', parsed: MIN_RECORDS.OFAC - 1, declared: null, existingActive: 0 }), ImportRefused);
    });
    await t('refuses when the publisher\'s declared count does not match what was read', () => {
        assert.throws(() => assertPlausible({ source: 'OFAC', parsed: 19000, declared: 19416, existingActive: 0 }), /declares 19416/);
    });
    await t('refuses an implausible shrink, but allows it with force', () => {
        assert.throws(() => assertPlausible({ source: 'OFAC', parsed: 12000, declared: null, existingActive: 19000 }), /shrink/);
        assert.doesNotThrow(() => assertPlausible({ source: 'OFAC', parsed: 12000, declared: null, existingActive: 19000, force: true }));
    });
    await t('accepts a normal update', () => {
        assert.doesNotThrow(() => assertPlausible({ source: 'OFAC', parsed: 19416, declared: 19416, existingActive: 19300 }));
    });

    section('Matcher grading');
    // Padding so that "dubai" and "trading" are common words in the index, as in the real lists.
    const pad = Array.from({ length: 60 }, (_, i) => ({ name: `Trading House ${i} Dubai Imports`, party_type: 'entity', aliases: [], metadata: {} }));
    const listed = [
        { name: 'ACME INDUSTRIAL CHEMICALS CO LTD', party_type: 'entity', aliases: ['Acme Chem'], program: 'IRAN', list_source: 'OFAC', source_id: '1', metadata: {} },
        { name: 'Mohammed Hassan Ali', party_type: 'individual', country: 'IR', aliases: [], metadata: { countries: ['IR'], weak_aliases: ['M Ali'] } },
        { name: 'DUBAI TRADING COMPANY', party_type: 'entity', aliases: [], metadata: {} },
        { name: 'CEC LIMITED', party_type: 'entity', aliases: [], metadata: {} },
        { name: 'NATIONAL BANK OF CUBA', party_type: 'entity', aliases: [], metadata: {} },
        { name: 'Zhong Tai Energy Group', party_type: 'entity', aliases: [], metadata: {} },
        ...pad,
    ];
    const idx = new PartyIndex(listed);
    const top = (n, ctx) => (idx.match(n, ctx)[0] || {}).quality || null;

    await t('identical names block, whatever the legal-form spelling', () => {
        assert.strictEqual(top('Acme Industrial Chemicals Limited'), 'exact');
        assert.strictEqual(top('acme industrial chemicals co., ltd.'), 'exact');
    });
    await t('the same words in another order block', () => {
        assert.strictEqual(top('Ali Hassan Mohammed'), 'reordered');
    });
    await t('an alias counts', () => {
        assert.strictEqual(top('Acme Chem'), 'exact');
    });
    await t('an individual with a country the listing rules out goes to review, not block', () => {
        assert.strictEqual(top('Mohammed Hassan Ali', { country: 'IN' }), 'exact_other_country');
        assert.strictEqual(top('Mohammed Hassan Ali', { country: 'IR' }), 'exact');
        assert.strictEqual(top('Mohammed Hassan Ali'), 'exact');
    });
    await t('same name with a different legal form goes to review', () => {
        assert.strictEqual(top('Acme Industrial Chemicals LLC'), 'legal_form_differs');
        assert.strictEqual(top('Acme Industrial Chemicals'), 'exact');   // no form stated: compatible
        assert.ok(['common_name', 'legal_form_differs'].includes(top('Dubai Trading LLC')));
    });
    await t('a name of a few letters is review, not block', () => {
        assert.strictEqual(top('CEC Ltd'), 'short_exact');
    });
    await t('a close spelling is review', () => {
        assert.strictEqual(top('Zhong Tai EnerGy Grup'), 'fuzzy');
    });
    await t('a near-miss with a DIFFERENT word is not matched ("Dubai" is not "Cuba")', () => {
        assert.strictEqual(top('National Bank of Dubai'), null);
    });
    await t('a listed name inside a longer name is review', () => {
        assert.strictEqual(top('Zhong Tai Energy Group International Holdings'), 'partial');
    });
    await t('a weak alias alone is review', () => {
        assert.strictEqual(top('M Ali'), 'weak');
    });
    await t('ordinary unrelated businesses produce nothing', () => {
        for (const n of ['Maersk Line A/S', 'Tata Steel Limited', 'Siemens AG', 'Blue Ocean Logistics', 'Kenya Tea Exporters']) assert.strictEqual(top(n), null, n);
    });
    await t('every listed name finds itself (a listed party is never silently passed)', () => {
        for (const p of listed) assert.ok(idx.match(p.name, { country: p.country }).length > 0, p.name);
    });
    await t('Jaro-Winkler basics', () => {
        assert.strictEqual(jaroWinkler('abc', 'abc'), 1);
        assert.ok(jaroWinkler('martha', 'marhta') > 0.96);
        assert.ok(jaroWinkler('dubai', 'cuba') < 0.8);
    });

    section('Rules engine integration');
    const REF = { sanctionedCountries: [], namedParties: idx, controlledGoods: [], tradeBans: [] };
    const screen = (parties) => rules.run(report.normalizeSubject({ parties }), REF, {});
    const decide = (v) => severity.score(v.violations).decision;

    await t('an exact listed entity blocks, citing source id and match quality', () => {
        const r = screen([{ name: 'Acme Industrial Chemicals Ltd', role: 'consignee' }]);
        assert.strictEqual(r.violations.length, 1);
        const v = r.violations[0];
        assert.strictEqual(v.code, 'SANCTIONED_PARTY_MATCH');
        assert.strictEqual(v.severity, 'critical');
        assert.strictEqual(v.details.match_quality, 'exact');
        assert.strictEqual(v.details.source_id, '1');
        assert.strictEqual(decide(r), 'block');
    });
    await t('a near match is a review, never a block', () => {
        const r = screen([{ name: 'Zhong Tai EnerGy Grup' }]);
        assert.strictEqual(r.violations[0].code, 'SANCTIONED_PARTY_POTENTIAL_MATCH');
        assert.strictEqual(r.violations[0].severity, 'medium');
        assert.strictEqual(decide(r), 'review');
    });
    await t('an individual\'s country is passed through and can downgrade a common-name hit', () => {
        const r = screen([{ name: 'Mohammed Hassan Ali', country: 'India' }]);
        assert.strictEqual(r.violations[0].details.match_quality, 'exact_other_country');
        assert.strictEqual(decide(r), 'review');
    });
    await t('a clean party produces no violation', () => {
        assert.strictEqual(screen([{ name: 'Siemens AG' }]).violations.length, 0);
    });
    await t('the small curated array still works (no index)', () => {
        const r = rules.run(report.normalizeSubject({ parties: [{ name: 'Acme Industrial Chemicals' }] }),
            { namedParties: [{ name: 'Acme Industrial Chemicals', aliases: [], party_type: 'entity', program: 'IRAN', list_source: 'OFAC' }] }, {});
        assert.strictEqual(r.violations[0].code, 'SANCTIONED_PARTY_MATCH');
    });

    // ── Optional: real database lifecycle ────────────────────────────────────
    if (process.env.SANCTIONS_TEST_DB) {
        section('Import lifecycle (real Postgres)');
        const { Sequelize } = require('sequelize');
        const { importList } = require('../service/compliance/lists/importer');
        const sequelize = new Sequelize(process.env.SANCTIONS_TEST_DB, { logging: false });
        const count = async (where) => (await sequelize.query(`SELECT count(*)::int n FROM tradeops.compliance_sanctioned_parties WHERE list_source='UN' ${where}`))[0][0].n;
        try {
            await sequelize.query("DELETE FROM tradeops.compliance_sanctioned_parties WHERE list_source='UN'");
            await sequelize.query("DELETE FROM tradeops.compliance_list_imports WHERE list_source='UN'");
            // The UN fixture has 2 records, below the real floor, so lower it for this file only.
            const run = (xml, extra = {}) => importList({ sequelize, source: 'UN', xml, sourceUrl: 'fixture', minRecords: 1, ...extra });

            await t('first import adds every record with provenance', async () => {
                const r = await run(UN_XML);
                assert.strictEqual(r.status, 'succeeded');
                assert.strictEqual(r.added, 2);
                assert.strictEqual(await count("AND active AND source_id IS NOT NULL AND source_list_date='2026-10-10' AND last_seen_at IS NOT NULL"), 2);
            });
            await t('the same file again changes nothing', async () => {
                assert.strictEqual((await run(UN_XML)).status, 'unchanged');
            });
            await t('a party the publisher removes is deactivated, not deleted', async () => {
                const without = UN_XML.replace(/<ENTITIES>[\s\S]*<\/ENTITIES>/, '<ENTITIES></ENTITIES>');
                const r = await run(without, { force: true });
                assert.strictEqual(r.delisted, 1);
                assert.strictEqual(await count("AND NOT active AND delisted_at IS NOT NULL"), 1);
                assert.strictEqual(await count(''), 2);
            });
            await t('a party listed again is reactivated', async () => {
                const r = await run(UN_XML);
                assert.strictEqual(r.status, 'succeeded');
                assert.strictEqual(await count('AND active AND delisted_at IS NULL'), 2);
            });
            await t('an implausible shrink is refused, recorded, and changes nothing', async () => {
                const tiny = UN_XML.replace(/<INDIVIDUALS>[\s\S]*<\/INDIVIDUALS>/, '<INDIVIDUALS></INDIVIDUALS>').replace(/<ENTITIES>[\s\S]*<\/ENTITIES>/, '<ENTITIES></ENTITIES>');
                await assert.rejects(() => run(tiny), ImportRefused);
                assert.strictEqual(await count('AND active'), 2);
                const [[row]] = await sequelize.query("SELECT status FROM tradeops.compliance_list_imports WHERE list_source='UN' ORDER BY started_at DESC LIMIT 1");
                assert.strictEqual(row.status, 'refused');
            });
        } finally {
            await sequelize.close();
        }
    } else {
        console.log('\n(database lifecycle tests skipped — set SANCTIONS_TEST_DB to run them)');
    }

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) {
        console.log('\nFailures:');
        failures.forEach((f) => console.log(`  • ${f.name}: ${f.message}`));
        process.exit(1);
    }
})().catch((err) => { console.error(err); process.exit(1); });
