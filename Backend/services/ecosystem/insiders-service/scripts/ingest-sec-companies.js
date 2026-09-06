'use strict';
/**
 * The other half of Form D: the operating companies actually raising the money, and the people
 * named on their filings. Where the investor ingest keeps pooled funds, this keeps everything
 * that is NOT a fund — the startups, and their executives, directors and promoters.
 *
 *   node scripts/ingest-sec-companies.js [--quarters=8] [--dry]
 *
 * Identity is the CIK here, and unlike the fund side that is correct: an operating company files
 * under one registrant across all its rounds, so its CIK is stable and its filings genuinely
 * belong to one business. No name-normalisation guessing is needed or wanted.
 *
 * Not invented: Form D reports no description, website, sector taxonomy or headcount. The
 * industry group and revenue range are as filed; everything else stays null.
 */
const path = require('path');
const db = require('../models');
const { resolvePlace } = require('../data/gazetteer');
const F = require('../lib/formd');

const arg = (k, d) => {
    const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
    return hit ? hit.split('=')[1] : d;
};
const DRY = process.argv.includes('--dry');
const QUARTERS = Number(arg('quarters', 8));

// Not every non-fund filer is a business with founders. Insurance separate accounts, collective
// investment trusts and BDC-style conglomerates pass the "not a pooled fund" checkbox but are
// financial vehicles — they would top every raise-sorted page and make the directory look like
// something a founder cannot use. Same call as dropping "Other Investment Fund" on the fund side.
const EXCLUDED_INDUSTRIES = new Set(
    String(arg('exclude', 'Investing,Insurance')).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
);
const VEHICLE_NAME = /\b(separate account|collective trust|collective investment trust|conglomerate|master trust|unit trust|statutory trust)\b|\btrust$/i;


// Administrator and registered-agent addresses are not locations. The upsert above writes city
// straight from the filing, so this must run after every ingest or the false geography returns.
async function flagServiceAddresses() {
    const schema = db.sequelize.options.define?.schema || 'insiders';
    for (const t of ['investors', 'companies']) {
        await db.sequelize.query(`
            WITH hubs AS (
              SELECT lower(regexp_replace(street, '[^a-z0-9]+', '', 'gi')) k, city
                FROM "${schema}"."${t}" WHERE street IS NOT NULL AND city IS NOT NULL
               GROUP BY 1,2 HAVING COUNT(*) >= 100
            )
            UPDATE "${schema}"."${t}" x
               SET address_is_service = TRUE, city = NULL, city_slug = NULL, state = NULL, state_slug = NULL
              FROM hubs h
             WHERE lower(regexp_replace(x.street, '[^a-z0-9]+', '', 'gi')) = h.k AND x.city = h.city`);
    }
}

(async () => {
    const companies = new Map();   // cik -> accumulator
    let filings = 0, skipped = 0, loaded = 0;

    for (const qtr of F.recentQuarters(QUARTERS + 2)) {
        if (loaded >= QUARTERS) break;
        const dir = F.fetchQuarter(qtr);
        if (!dir) { console.log(`[companies] ${qtr}: not published yet, skipped`); continue; }
        loaded++;

        const subs = new Map(F.readTsv(path.join(dir, 'FORMDSUBMISSION.tsv')).map((r) => [r.ACCESSIONNUMBER, r]));
        const issuers = new Map();
        for (const r of F.readTsv(path.join(dir, 'ISSUERS.tsv'))) {
            if (r.IS_PRIMARYISSUER_FLAG === 'YES') issuers.set(r.ACCESSIONNUMBER, r);
        }
        const people = new Map();
        for (const r of F.readTsv(path.join(dir, 'RELATEDPERSONS.tsv'))) {
            if (!people.has(r.ACCESSIONNUMBER)) people.set(r.ACCESSIONNUMBER, []);
            people.get(r.ACCESSIONNUMBER).push(r);
        }

        let qCount = 0;
        for (const off of F.readTsv(path.join(dir, 'OFFERING.tsv'))) {
            // Funds are the investor side; everything else is a business raising money.
            const pooled = String(off.ISPOOLEDINVESTMENTFUNDTYPE).trim().toLowerCase() === 'true';
            if (pooled || off.INVESTMENTFUNDTYPE) { skipped++; continue; }
            if (EXCLUDED_INDUSTRIES.has(String(off.INDUSTRYGROUPTYPE || '').toLowerCase())) { skipped++; continue; }

            const acc = off.ACCESSIONNUMBER;
            const iss = issuers.get(acc);
            const cik = String(iss?.CIK || '').replace(/^0+/, '');
            if (!iss || !iss.ENTITYNAME || !cik) { skipped++; continue; }
            if (VEHICLE_NAME.test(iss.ENTITYNAME)) { skipped++; continue; }
            // A series-LLC vehicle is a fund, whatever the pooled-fund checkbox says. 203 of these
            // reached the companies table because the filer left the box unticked.
            if (/\ba series of\b/i.test(iss.ENTITYNAME)) { skipped++; continue; }

            const filingDate = F.isoDate(subs.get(acc)?.FILING_DATE);
            const city = F.titleCase(iss.CITY, iss.CITY);
            const region = F.titleCase(iss.STATEORCOUNTRYDESCRIPTION, iss.STATEORCOUNTRYDESCRIPTION);
            const sold = F.num(off.TOTALAMOUNTSOLD);

            if (!companies.has(cik)) {
                companies.set(cik, {
                    cik,
                    name: F.titleCase(iss.ENTITYNAME.trim(), iss.ENTITYNAME.trim()),
                    city, region,
                    // Filed business contact — see the note in ingest-sec-formd.js.
                    street: [iss.STREET1, iss.STREET2].map((x) => String(x || '').trim()).filter(Boolean).join(', ') || null,
                    postal_code: iss.ZIPCODE || null,
                    phone: iss.ISSUERPHONENUMBER || null,
                    entity_type: iss.ENTITYTYPE || null,
                    jurisdiction: iss.JURISDICTIONOFINC || null,
                    year_founded: F.intOr(iss.YEAROFINC_VALUE_ENTERED),
                    industry_group: off.INDUSTRYGROUPTYPE || null,
                    revenue_range: off.REVENUERANGE || null,
                    filings: [], people: new Map(),
                    total: 0, largest: 0,
                    first: filingDate, last: filingDate,
                    lastAcc: acc,
                });
            }
            const c = companies.get(cik);
            // The most recent filing is the current truth about name, address and revenue band.
            if (filingDate && (!c.last || filingDate >= c.last)) {
                c.last = filingDate;
                c.name = F.titleCase(iss.ENTITYNAME.trim(), iss.ENTITYNAME.trim());
                c.city = city || c.city;
                c.region = region || c.region;
                c.street = [iss.STREET1, iss.STREET2].map((x) => String(x || '').trim()).filter(Boolean).join(', ') || c.street;
                c.postal_code = iss.ZIPCODE || c.postal_code;
                c.phone = iss.ISSUERPHONENUMBER || c.phone;
                c.industry_group = off.INDUSTRYGROUPTYPE || c.industry_group;
                c.revenue_range = off.REVENUERANGE || c.revenue_range;
                c.entity_type = iss.ENTITYTYPE || c.entity_type;
                c.lastAcc = acc;
            }
            if (filingDate && (!c.first || filingDate < c.first)) c.first = filingDate;
            if (!c.year_founded) c.year_founded = F.intOr(iss.YEAROFINC_VALUE_ENTERED);
            if (sold) { c.total += sold; if (sold > c.largest) c.largest = sold; }

            c.filings.push({
                accession_number: acc,
                cik,
                entity_name: iss.ENTITYNAME.trim(),
                industry_group: off.INDUSTRYGROUPTYPE || null,
                revenue_range: off.REVENUERANGE || null,
                entity_type: iss.ENTITYTYPE || null,
                jurisdiction: iss.JURISDICTIONOFINC || null,
                year_of_inc: F.intOr(iss.YEAROFINC_VALUE_ENTERED),
                total_offering_usd: F.num(off.TOTALOFFERINGAMOUNT),
                total_sold_usd: sold,
                remaining_usd: F.num(off.TOTALREMAINING),
                min_investment_usd: F.num(off.MINIMUMINVESTMENTACCEPTED),
                investor_count: F.intOr(off.TOTALNUMBERALREADYINVESTED),
                has_non_accredited: String(off.HASNONACCREDITEDINVESTORS).trim().toLowerCase() === 'true',
                first_sale_date: F.isoDate(off.SALE_DATE),
                filing_date: filingDate,
                is_amendment: String(off.ISAMENDMENT).trim().toLowerCase() === 'true',
                city, state_or_country: region,
                source_url: F.edgarUrl(cik, acc),
            });

            for (const p of people.get(acc) || []) {
                const full = F.normalizePersonName([p.FIRSTNAME, p.MIDDLENAME, p.LASTNAME].map((x) => String(x || '').trim()).filter(Boolean).join(' '));
                if (!F.isPersonName(full)) continue;
                const rels = [p.RELATIONSHIP_1, p.RELATIONSHIP_2, p.RELATIONSHIP_3].filter(Boolean);
                const prev = c.people.get(full);
                if (prev) {
                    prev.filings_count++;
                    prev.relationships = [...new Set([...prev.relationships, ...rels])];
                    if (filingDate && (!prev.last_seen || filingDate > prev.last_seen)) prev.last_seen = filingDate;
                    if (filingDate && (!prev.first_seen || filingDate < prev.first_seen)) prev.first_seen = filingDate;
                } else {
                    c.people.set(full, {
                        full_name: full, relationships: rels,
                        city: F.titleCase(p.CITY, p.CITY), state_or_country: F.titleCase(p.STATEORCOUNTRYDESCRIPTION, p.STATEORCOUNTRYDESCRIPTION),
                        filings_count: 1, first_seen: filingDate, last_seen: filingDate,
                    });
                }
            }
            filings++; qCount++;
        }
        console.log(`[companies] ${qtr}: ${qCount} company filings`);
    }

    console.log(`\n[companies] ${filings} filings -> ${companies.size} companies (${skipped} rows skipped: funds)`);
    if (DRY) {
        for (const c of [...companies.values()].sort((a, b) => b.total - a.total).slice(0, 12)) {
            console.log(`   ${c.name.slice(0, 44).padEnd(44)} ${String(c.filings.length).padStart(2)}f  $${Math.round(c.total).toLocaleString().padStart(14)}  ${c.industry_group || '-'}  ${c.city}, ${c.region}  people=${c.people.size}`);
        }
        process.exit(0);
    }

    const now = new Date();
    const shaped = [...companies.values()].map((c) => {
        const loc = [c.city, c.region].filter(Boolean).join(', ') || null;
        return {
            c,
            values: {
                name: c.name,
                cik: c.cik,
                source: 'sec_form_d',
                source_id: c.cik,
                source_url: F.edgarUrl(c.cik, c.lastAcc),
                entity_type: c.entity_type,
                jurisdiction: c.jurisdiction,
                year_founded: c.year_founded,
                industry_group: c.industry_group,
                revenue_range: c.revenue_range,
                street: c.street,
                postal_code: c.postal_code || null,
                phone: c.phone || null,
                location: loc,
                filing_count: c.filings.length,
                total_raised_usd: Math.round(c.total) || null,
                largest_round_usd: Math.round(c.largest) || null,
                first_filing_date: c.first,
                last_filing_date: c.last,
                last_verified_at: now,
                ...resolvePlace(loc),
            },
        };
    });

    const existing = new Map(
        (await db.Company.findAll({ where: { source: 'sec_form_d' }, attributes: ['id', 'source_id'] }))
            .map((r) => [r.source_id, r.id]),
    );
    const toCreate = shaped.filter((x) => !existing.has(x.values.source_id));
    const toUpdate = shaped.filter((x) => existing.has(x.values.source_id));

    for (const part of F.chunk(toCreate, 500)) {
        const made = await db.Company.bulkCreate(part.map((x) => x.values), { hooks: false, returning: true });
        made.forEach((row, i) => { part[i].id = row.id; existing.set(part[i].values.source_id, row.id); });
    }
    for (const part of F.chunk(toUpdate, 100)) {
        await Promise.all(part.map((x) => {
            x.id = existing.get(x.values.source_id);
            return db.Company.update(x.values, { where: { id: x.id }, hooks: false });
        }));
    }

    const filingRows = shaped.flatMap((x) => x.c.filings.map((f) => ({ ...f, company_id: x.id })));
    const peopleRows = shaped.flatMap((x) => [...x.c.people.values()].map((p) => ({ ...p, company_id: x.id })));
    let fIn = 0, pIn = 0;
    for (const part of F.chunk(filingRows, 1000)) fIn += (await db.CompanyFiling.bulkCreate(part, { ignoreDuplicates: true, hooks: false })).length;
    for (const part of F.chunk(peopleRows, 1000)) pIn += (await db.CompanyPerson.bulkCreate(part, { ignoreDuplicates: true, hooks: false })).length;

    console.log(`[companies] +${toCreate.length} new, ${toUpdate.length} updated | filings ${fIn}/${filingRows.length} | people ${pIn}/${peopleRows.length}`);
    await flagServiceAddresses();
    process.exit(0);
})().catch((e) => { console.error('[companies] failed:', e); process.exit(1); });
