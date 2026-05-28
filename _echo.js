// Test backend for Phase 6E-4: echoes the request headers the gateway forwards.
const http = require('http');
const PORT = process.env.ECHO_PORT || 4100;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, method: req.method, url: req.url, headers: req.headers }));
}).listen(PORT, '0.0.0.0', () => console.log('[echo] listening on', PORT));
