'use strict';
// Clustering with topic keys, offline (models stubbed in require.cache like the other tests here).
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');

let rows = [];
const stub = (rel, exports) => { require.cache[require.resolve(path.join(__dirname, rel))] = { id: rel, filename: rel, loaded: true, exports }; };
stub('../models', {
    CmsStorySignal: { findAll: async (q) => (q.attributes ? rows.map((r) => ({ title: r.title })) : rows.filter((r) => ['accepted', 'clustered'].includes(r.decision))) },
});
const { clusterSignals } = require('../service/editorial/clusterService');

const now = Date.now();
const sig = (over) => ({ id: over.title, websiteId: 'w', decision: 'accepted', publishedAt: new Date(now - 3600000), relevanceScore: 60, sourceType: 'rss', summary: '', clusterKey: null, topicKey: null, update: async function (p) { Object.assign(this, p); }, ...over });

test('items tied to one topic stay together even when their wording shares nothing', async () => {
    rows = [
        sig({ title: 'Adam Sandler', sourceName: 'Wikipedia', summary: 'American actor and comedian born in Brooklyn', topicKey: 'trend:Adam Sandler' }),
        sig({ title: 'New film featuring Sandler’s daughter released on Netflix', sourceName: 'UA.NEWS', topicKey: 'trend:Adam Sandler' }),
        sig({ title: 'How a comedy re-ignited my will to live as a cancer patient', sourceName: 'The Jerusalem Post', topicKey: 'trend:Adam Sandler' }),
        sig({ title: 'Sandler stars in streaming premiere this weekend', sourceName: 'Variety', topicKey: 'trend:Adam Sandler' }),
    ];
    const clusters = await clusterSignals('w', { dryRun: true });
    assert.strictEqual(clusters.length, 1);
    assert.strictEqual(clusters[0].size, 4);
    assert.strictEqual(clusters[0].sourceCount, 4, 'four distinct outlets, so the brief stage can corroborate');
    assert.match(clusters[0].clusterKey, /^\d{4}-\d{2}-\d{2}-adam-sandler$/);
});

test('two different trending topics never merge', async () => {
    rows = [
        sig({ title: 'Ed Sheeran', sourceName: 'Wikipedia', topicKey: 'trend:Ed Sheeran' }),
        sig({ title: 'Annette Bening', sourceName: 'Wikipedia', topicKey: 'trend:Annette Bening' }),
    ];
    assert.strictEqual((await clusterSignals('w', { dryRun: true })).length, 2);
});

test('signals with no topic key still cluster by similarity, as before', async () => {
    rows = [
        sig({ title: 'Regulator issues nationwide recall of contaminated eye drops after infections', sourceName: 'Reuters' }),
        sig({ title: 'Nationwide recall of contaminated eye drops issued by regulator after infections', sourceName: 'AP' }),
        sig({ title: 'Court rules on unrelated antitrust settlement in California', sourceName: 'Bloomberg' }),
    ];
    const clusters = await clusterSignals('w', { dryRun: true });
    assert.strictEqual(clusters.length, 2);
    assert.strictEqual(clusters[0].size, 2);
});

test('a real write records the cluster key and marks members clustered', async () => {
    rows = [sig({ title: 'Ed Sheeran', sourceName: 'Wikipedia', topicKey: 'trend:Ed Sheeran' })];
    await clusterSignals('w');
    assert.strictEqual(rows[0].decision, 'clustered');
    assert.match(rows[0].clusterKey, /ed-sheeran$/);
});
