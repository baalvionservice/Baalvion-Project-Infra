'use strict';

// Wikimedia asks every client to identify itself; Google's feed is fine with any honest agent.
const UA = 'LawEliteNetwork-trends/1.0 (+https://lawelitenetwork.com; contact infra.baalvion@gmail.com)';

async function request(url, accept) {
    const res = await fetch(url, { headers: { 'user-agent': UA, accept }, redirect: 'follow', signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).host}`);
    return res;
}
const getJson = async (url) => (await request(url, 'application/json')).json();
const getText = async (url) => (await request(url, 'application/rss+xml, text/xml, */*')).text();

module.exports = { getJson, getText, UA };
