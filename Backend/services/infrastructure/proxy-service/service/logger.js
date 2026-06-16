// Simple logger. String args are stripped of CR/LF to prevent log injection
// (forged/multi-line log entries) from user-controlled values.
const clean = (v) => (typeof v === 'string' ? v.replace(/[\r\n]/g, ' ') : v);
const sanitize = (args) => args.map(clean);
module.exports = {
  info: (...args) => console.log('[INFO]', ...sanitize(args)),
  warn: (...args) => console.warn('[WARN]', ...sanitize(args)),
  error: (...args) => console.error('[ERROR]', ...sanitize(args)),
  success: (...args) => console.log('[SUCCESS]', ...sanitize(args)),
};