'use strict';
// Test fixture: a minimal HTTP server wired with the built graceful-shutdown module.
// The parent test drives shutdown by writing a line to stdin (the fixture re-emits
// SIGTERM), which exercises the exact listener initGracefulShutdown attaches —
// deterministic and cross-platform (no reliance on OS signal delivery semantics).
const http = require('http');
const { initGracefulShutdown, registerShutdown } = require('../../index.js');

const server = http.createServer((_req, res) => res.end('ok'));

registerShutdown('handler-a', async () => { process.stdout.write('CLEAN:handler-a\n'); });
registerShutdown('handler-b', async () => { process.stdout.write('CLEAN:handler-b\n'); });

server.listen(0, () => {
  process.stdout.write('LISTENING\n');
  initGracefulShutdown(server, { timeout: 500 });
});

// Trigger: any stdin input re-emits SIGTERM, invoking the registered listener.
process.stdin.on('data', () => { process.emit('SIGTERM'); });
