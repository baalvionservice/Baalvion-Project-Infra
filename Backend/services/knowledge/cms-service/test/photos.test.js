'use strict';
// Licensed photos, offline: Commons responses are fixtures, models + media storage are stubbed in require.cache.
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'photos-'));
const art = [];
const stub = (rel, exports) => { require.cache[require.resolve(path.join(__dirname, rel))] = { id: rel, filename: rel, loaded: true, exports }; };
stub('../models', {
    CmsArticleDraft: { findOne: async ({ where }) => (where.id === 'draft-1' && where.websiteId === 'site-1' ? { id: 'draft-1' } : null) },
    CmsArticleArt: {
        update: async (patch, { where }) => { art.filter((a) => a.draftId === where.draftId && a.isPrimary).forEach((a) => Object.assign(a, patch)); },
        create: async (row) => { art.push(row); return row; },
        findAll: async () => art,
    },
});
stub('../service/mediaService.js', { UPLOAD_DIR: tmp, PUBLIC_BASE: 'https://cms.test' });

const { isAllowedLicense, searchCommons, commonsFile } = require('../service/editorial/photoCommons');
const { attachCommonsPhoto, listArt } = require('../service/editorial/photoService');

const page = (over = {}) => ({
    title: 'File:Adam Sandler 2019.jpg', index: 1,
    imageinfo: [{ mime: 'image/jpeg', thumburl: 'https://upload.wikimedia.org/thumb/x.jpg', thumbwidth: 1200, thumbheight: 800, descriptionurl: 'https://commons.wikimedia.org/wiki/File:Adam_Sandler_2019.jpg',
        extmetadata: { LicenseShortName: { value: 'CC BY-SA 4.0' }, LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0' }, Artist: { value: '<a href="x">Jane Doe</a>' }, ImageDescription: { value: 'Adam Sandler at a premiere' }, Restrictions: { value: '' } }, ...over }],
});
const fake = (pages) => async () => ({ query: { pages: Object.fromEntries(pages.map((p, i) => [String(i), p])) } });

test('only licences that allow commercial reuse with credit are accepted', () => {
    for (const ok of ['CC0', 'Public domain', 'CC BY 4.0', 'CC BY-SA 3.0', 'CC BY 2.0']) assert.ok(isAllowedLicense(ok), ok);
    for (const no of ['CC BY-NC 4.0', 'CC BY-ND 2.0', 'CC BY-NC-SA 3.0', 'Fair use', 'Non-free media', 'All rights reserved', '', 'GFDL-only']) assert.ok(!isAllowedLicense(no), no);
});

test('search returns credited candidates and drops non-free files and non-photos', async () => {
    const pages = [page(), page({ extmetadata: { LicenseShortName: { value: 'CC BY-NC 4.0' } } }), page({ mime: 'image/svg+xml' })];
    const out = await searchCommons('adam sandler', { getJson: fake(pages) });
    assert.strictEqual(out.length, 1);
    assert.strictEqual(out[0].credit, 'Jane Doe / Wikimedia Commons, CC BY-SA 4.0');
    assert.strictEqual(out[0].personalityRights, false);
});

test('an exact-name search comes first and looser matches only fill in when there are few', async () => {
    const calls = [];
    const getJson = async (url) => {
        calls.push(decodeURIComponent(url));
        return calls.length === 1
            ? { query: { pages: { a: page({ }) } } }
            : { query: { pages: { b: { ...page(), title: 'File:Unrelated.jpg', index: 1 } } } };
    };
    const out = await searchCommons('Taylor Tomlinson', { getJson });
    assert.match(calls[0], /gsrsearch="Taylor Tomlinson" filetype:bitmap/);
    assert.deepStrictEqual(out.map((c) => c.title), ['File:Adam Sandler 2019.jpg', 'File:Unrelated.jpg']);
    calls.length = 0;
    const many = await searchCommons('Adam Sandler', { getJson: async (u) => { calls.push(u); return { query: { pages: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [String(i), { ...page(), title: `File:x${i}.jpg`, index: i }])) } }; } });
    assert.strictEqual(calls.length, 1, 'enough exact matches, so no loose search');
    assert.strictEqual(many.length, 8);
});

test('a file is re-read from Commons by title, so a client cannot attach a non-free image', async () => {
    assert.strictEqual(await commonsFile('not a file title', { getJson: fake([]) }), null);
    const bad = page({ extmetadata: { LicenseShortName: { value: 'CC BY-NC 4.0' } } });
    assert.strictEqual(await commonsFile('File:Whatever.jpg', { getJson: fake([bad]) }), null);
});

test('attaching stores our own copy with provenance, and the flag is true only when the editor confirms', async () => {
    art.length = 0;
    const bytes = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(4096, 7)]); // a real JPEG signature
    const run = (extra) => attachCommonsPhoto('site-1', 'draft-1', { title: 'File:Adam Sandler 2019.jpg', subject: 'Adam Sandler', ...extra }, { getJson: fake([page()]), download: async () => ({ mime: 'image/jpeg', bytes }) });
    const a = await run({ confirmedDepictsSubject: true });
    assert.strictEqual(a.provider, 'wikimedia-commons');
    assert.strictEqual(a.licenseName, 'CC BY-SA 4.0');
    assert.strictEqual(a.attribution, 'Jane Doe / Wikimedia Commons, CC BY-SA 4.0');
    assert.strictEqual(a.depictsNamedSubject, true);
    assert.strictEqual(a.status, 'approved');
    assert.ok(a.url.startsWith('https://cms.test/uploads/licensed-art/'));
    assert.ok(fs.existsSync(path.join(tmp, 'licensed-art', a.url.split('/').pop())), 'the file is stored by us, not hotlinked');
    const b = await run({});
    assert.strictEqual(b.depictsNamedSubject, false, 'never inferred');
    assert.strictEqual(art.filter((x) => x.isPrimary).length, 1, 'a new photo replaces the old primary');
});

test('refuses a non-free file, an unknown draft, a missing subject and a non-image download', async () => {
    const deps = (pages, dl) => ({ getJson: fake(pages), download: dl || (async () => ({ mime: 'image/jpeg', bytes: Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(4096)]) })) });
    const nc = page({ extmetadata: { LicenseShortName: { value: 'CC BY-NC 4.0' } } });
    await assert.rejects(attachCommonsPhoto('site-1', 'draft-1', { title: 'File:x.jpg', subject: 's' }, deps([nc])), /licence does not allow/);
    await assert.rejects(attachCommonsPhoto('site-1', 'nope', { title: 'File:x.jpg', subject: 's' }, deps([page()])), /Draft not found/);
    await assert.rejects(attachCommonsPhoto('other-site', 'draft-1', { title: 'File:x.jpg', subject: 's' }, deps([page()])), /Draft not found/);
    await assert.rejects(attachCommonsPhoto('site-1', 'draft-1', { title: 'File:x.jpg', subject: '' }, deps([page()])), /subject/);
    await assert.rejects(attachCommonsPhoto('site-1', 'draft-1', { title: 'File:x.jpg', subject: 's' }, deps([page()], async () => ({ mime: 'text/html', bytes: Buffer.alloc(4096) }))), /Unsupported image/);
    await assert.rejects(listArt('other-site', 'draft-1'), /Draft not found/);
});

test('a download that claims to be an image but is not one is refused before anything is written', async () => {
    const before = fs.existsSync(path.join(tmp, 'licensed-art')) ? fs.readdirSync(path.join(tmp, 'licensed-art')).length : 0;
    const html = Buffer.from('<html>' + 'x'.repeat(4096) + '</html>');
    await assert.rejects(attachCommonsPhoto('site-1', 'draft-1', { title: 'File:x.jpg', subject: 's' }, { getJson: fake([page()]), download: async () => ({ mime: 'image/jpeg', bytes: html }) }), /not a real image/);
    const after = fs.existsSync(path.join(tmp, 'licensed-art')) ? fs.readdirSync(path.join(tmp, 'licensed-art')).length : 0;
    assert.strictEqual(after, before);
});

test('descriptions are stripped of markup and entities are decoded once, not twice', () => {
    const { stripHtml } = require('../service/editorial/photoCommons');
    assert.strictEqual(stripHtml('Tom &amp; Jerry'), 'Tom & Jerry');
    assert.strictEqual(stripHtml('&amp;quot;'), '&quot;', 'must not become a quotation mark');
    assert.ok(!/[<>]/.test(stripHtml('<<b>script>alert(1)</b> ok')));
});
