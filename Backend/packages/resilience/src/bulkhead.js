'use strict';

const { AbortError } = require('./retry');

/**
 * Thrown when a bulkhead is saturated and its waiting queue is full.
 * This is intentional load-shedding — maps to 429 at the boundary.
 */
class BulkheadFullError extends Error {
  constructor(name) {
    super(`Bulkhead "${name}" is full — shedding load`);
    this.name = 'BulkheadFullError';
    this.code = 'BULKHEAD_FULL';
    this.statusCode = 429;
  }
}

/**
 * Concurrency limiter (a.k.a. bulkhead). Caps the number of in-flight calls to
 * a dependency so one slow/struggling dependency cannot consume the entire
 * connection pool or saturate the event loop and take the whole service down.
 *
 * Calls beyond `maxConcurrent` wait in a bounded queue; once the queue is full,
 * further calls are rejected immediately (back-pressure / fail-fast).
 */
class Bulkhead {
  /**
   * @param {object} [opts]
   * @param {string} [opts.name]
   * @param {number} [opts.maxConcurrent] in-flight cap (default 10)
   * @param {number} [opts.maxQueue] waiting-room cap (default Infinity — never sheds)
   */
  constructor(opts = {}) {
    this.name = opts.name || 'bulkhead';
    this.maxConcurrent = opts.maxConcurrent ?? 10;
    this.maxQueue = opts.maxQueue ?? Infinity;
    this._active = 0;
    this._queue = [];
  }

  get active() {
    return this._active;
  }

  get queued() {
    return this._queue.length;
  }

  /**
   * @template T
   * @param {() => Promise<T>} fn
   * @param {object} [opts]
   * @param {AbortSignal} [opts.signal] aborting while queued removes us from the
   *   waiting room and rejects with AbortError — no slot is consumed, no wasted work.
   * @returns {Promise<T>}
   */
  async exec(fn, opts = {}) {
    const signal = opts.signal;
    if (signal && signal.aborted) throw new AbortError();

    if (this._active >= this.maxConcurrent) {
      if (this._queue.length >= this.maxQueue) throw new BulkheadFullError(this.name);
      // Wait for a slot to be handed off. We do NOT increment _active here;
      // the completing call passes its slot directly to us (see _release).
      await this._waitForSlot(signal);
    } else {
      this._active++;
    }

    try {
      return await fn();
    } finally {
      this._release();
    }
  }

  _waitForSlot(signal) {
    return new Promise((resolve, reject) => {
      const entry = { resolve, signal };
      entry.onAbort = () => {
        const i = this._queue.indexOf(entry);
        if (i !== -1) this._queue.splice(i, 1); // never received a slot — just leave the queue
        reject(new AbortError());
      };
      this._queue.push(entry);
      if (signal) signal.addEventListener('abort', entry.onAbort, { once: true });
    });
  }

  _release() {
    const next = this._queue.shift();
    if (next) {
      if (next.signal) next.signal.removeEventListener('abort', next.onAbort);
      next.resolve(); // hand the slot off — _active stays constant
    } else {
      this._active--; // no waiter — free the slot
    }
  }
}

module.exports = { Bulkhead, BulkheadFullError };
