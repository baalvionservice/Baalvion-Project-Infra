/**
 * Realtime WebSocket support for ledger updates
 */
const { Server: IOServer } = require('socket.io');

let io;

function initRealtime(httpServer) {
  io = new IOServer(httpServer, {
    path: '/ws',
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || '*',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[realtime] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[realtime] Client disconnected: ${socket.id}`);
    });

    // Placeholder: In production, subscribe to ledger events
    // socket.on('subscribe:account', (accountId) => { ... })
  });

  console.log('[ledger-service] Realtime WebSocket initialized at /ws');
  return io;
}

function emitLedgerEvent(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

module.exports = {
  initRealtime,
  emitLedgerEvent,
};
