/* Dev seed: mint a super-admin RS256 token and create a `news` content item for the
   Imperialpedia CMS website via the real API. Prints the created content id.
   Usage: node scripts/_seedNews.cjs <websiteId> */
const fs = require('fs');
const path = require('path');
const http = require('http');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Strip CR/LF/tab from values that originate outside this script before logging,
// so network-derived text cannot forge or split log lines (log injection).
const sanitizeForLog = (v) => String(v).replace(/[\r\n\t]/g, ' ');

// Resolve the fixed output file to a constant path inside this script directory and
// reject anything that escapes it, so a tainted value can never redirect the write.
const OUT_FILE = (() => {
  const resolved = path.resolve(__dirname, '_seed_news_out.txt');
  if (resolved !== path.join(__dirname, '_seed_news_out.txt')) {
    throw new Error('Unexpected output path');
  }
  return resolved;
})();

// argv: <websiteId> [contentType] [title] [slug]
const websiteId = process.argv[2];
const argType = process.argv[3];
const argTitle = process.argv[4];
const argSlug = process.argv[5];
const privateKey = fs.readFileSync(path.resolve(__dirname, '../../../identity/.keys/jwt_private.pem'), 'utf8');

const token = jwt.sign(
  { sub: '67', org_id: '52c76e5c-0668-4492-ba20-23e7ee16f49b', sid: 'seed-news-sid', jti: crypto.randomUUID(), roles: ['super_admin'], permissions: [] },
  privateKey,
  { algorithm: 'RS256', keyid: 'IZVFqgw_bfdxUk8R', issuer: 'baalvion-auth', audience: 'baalvion-platform', expiresIn: '15m' },
);

const payload = {
  title: argTitle || 'Baalvion Launches Unified Imperialpedia CMS Pipeline',
  slug: argSlug || 'baalvion-unified-cms-pipeline',
  contentType: argType || 'news',
  excerpt: 'Editorial content authored in the Baalvion admin platform now publishes straight to the Imperialpedia website through a single multi-site CMS.',
  featuredImage: 'https://picsum.photos/seed/baalvion-cms-news/1200/675',
  contentBlocks: [
    { id: 'b0', type: 'paragraph', order: 0, content: { text: 'Baalvion today flipped on a unified content pipeline that lets editors publish to the Imperialpedia knowledge site directly from the central admin platform, with no engineering hand-off.' } },
    { id: 'b1', type: 'heading', order: 1, content: { text: 'One console, many sites', level: 2 } },
    { id: 'b2', type: 'paragraph', order: 2, content: { text: 'Imperialpedia is registered as a website inside the shared CMS. Articles and news authored there flow through a draft → review → publish workflow and appear on the public site the moment they go live.' } },
    { id: 'b3', type: 'quote', order: 3, content: { text: 'Publishing should be a button, not a deploy. That is exactly what this delivers.', cite: 'Baalvion Platform Team' } },
    { id: 'b4', type: 'callout', order: 4, content: { text: 'Structured data (companies, markets, calculators) stays in the dedicated imperialpedia-service; the CMS owns the editorial layer.', variant: 'info' } },
    { id: 'b5', type: 'paragraph', order: 5, content: { text: 'The same pipeline is being rolled out across the rest of the Baalvion network of sites.' } },
  ],
  seoMetadata: { title: 'Baalvion Launches Unified Imperialpedia CMS Pipeline', description: 'How Baalvion publishes editorial content to Imperialpedia from one console.' },
};

const body = JSON.stringify(payload);
const req = http.request(
  {
    host: '127.0.0.1', port: 3018,
    path: `/api/v1/cms/websites/${websiteId}/content`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), Authorization: `Bearer ${token}` },
  },
  (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      const out = `HTTP ${res.statusCode}\n${data}\n`;
      fs.writeFileSync(OUT_FILE, out);
      console.log(out);
    });
  },
);
req.on('error', (e) => { const msg = sanitizeForLog(e.message); fs.writeFileSync(OUT_FILE, `ERR ${msg}\n`); console.error('ERR', msg); process.exit(1); });
req.write(body);
req.end();
