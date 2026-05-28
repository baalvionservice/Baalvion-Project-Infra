require('dotenv').config({ path: '.env' });
const http = require('http');

async function request(path, token) {
  return new Promise((resolve) => {
    const opts = {
      hostname: 'localhost', port: 4000,
      path: '/v1/' + path,
      headers: { 'Authorization': 'Bearer ' + token, 'X-Org-Id': 'a0000000-0000-0000-0000-000000000001' }
    };
    http.get(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          const arr = j.data?.data ?? j.data;
          const count = Array.isArray(arr) ? arr.length : (typeof arr === 'object' ? 'obj' : '?');
          resolve(count);
        } catch (e) { resolve('parse_err'); }
      });
    }).on('error', () => resolve('conn_err'));
  });
}

async function main() {
  // Login first
  const loginData = JSON.stringify({ email: 'platform@baalvion.com', password: 'Baalvion123!' });
  const token = await new Promise((resolve) => {
    const req = http.request({ hostname: 'localhost', port: 4000, path: '/v1/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d).data.token); } catch { resolve(null); } });
    });
    req.write(loginData); req.end();
  });

  if (!token) { console.log('Login failed'); process.exit(1); }
  console.log('Token:', token.slice(0, 30) + '...');

  const eps = ['admin/dashboard', 'admin/tenants', 'admin/users', 'admin/providers', 'admin/feature-flags', 'admin/abuse/logs', 'admin/system/services', 'admin/system/metrics', 'admin/routing-rules', 'admin/audit-logs', 'billing/plans'];
  for (const ep of eps) {
    const result = await request(ep, token);
    console.log(ep + ' → ' + result);
  }
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
