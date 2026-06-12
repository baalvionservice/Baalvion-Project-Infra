'use strict';

/**
 * Circuit breaker states.
 * @enum {string}
 */
const STATES = Object.freeze({ CLOSED: 'closed', OPEN: 'open', HALF_OPEN: 'half_open' });

/**
 * Thrown when a call is rejected because the breaker is OPEN (fail-fast).
 * Carries `code`/`statusCode` so the central error boundary maps it to 503.
 */
class CircuitOpenError extends Error {
  constructor(name) {
    super(`Circuit "${name}" is open — failing fast`);
    this.name = 'CircuitOpenError';
    this.code = 'CIRCUIT_OPEN';
    this.statusCode = 503;
  }
}

/**
 * Transport-agnostic circuit breaker (closed → open → half-open).
 *
 * Wrap ANY async operation — a DB query, a vendor SDK call, a queue publish,
 * an outbound HTTP request — so a failing dependency fails fast instead of
 * piling up latency and exhausting connection pools / event-loop capacity.
 *
 * The clock is injectable (`opts.now`) so the breaker is deterministically
 * testable without real timers.
 */
class CircuitBreaker {
  /**
   * @param {object} [opts]
   * @param {string} [opts.name]
   * @param {number} [opts.failureThreshold] consecutive failures before tripping (default 5)
   * @param {number} [opts.resetTimeoutMs] how long to stay OPEN before probing (default 15000)
   * @param {number} [opts.halfOpenMax] concurrent probe calls allowed in HALF_OPEN (default 1)
   * @param {(err: unknown) => boolean} [opts.isFailure] which errors count as failures
   * @param {(t: {name: string, from: string, to: string}) => void} [opts.onStateChange]
   * @param {() => number} [opts.now] injectable clock (defaults to Date.now)
   */
  constructor(opts = {}) {
    this.name = opts.name || 'circuit';
    this.failureThreshold = opts.failureThreshold ?? 5;
    this.resetTimeoutMs = opts.resetTimeoutMs ?? 15000;
    this.halfOpenMax = opts.halfOpenMax ?? 1;
    this.isFailure = opts.isFailure || (() => true);
    this.onStateChange = opts.onStateChange || (() => {});
    this._now = opts.now || (() => Date.now());

    this._state = STATES.CLOSED;
    this._failures = 0;
    this._nextAttempt = 0;
    this._halfOpenActive = 0;
  }

  /**
   * Current *effective* state. Pure — reading it never mutates or fires
   * onStateChange (so metrics/health scrapes are side-effect free). Once the
   * reset window has elapsed it reports HALF_OPEN; the actual transition (and
   * the onStateChange event) happens on the next `exec`, i.e. the real probe.
   */
  get state() {
    if (this._state === STATES.OPEN && this._now() >= this._nextAttempt) {
      return STATES.HALF_OPEN;
    }
    return this._state;
  }

  /** Point-in-time snapshot for metrics / dashboards. */
  get stats() {
    return {
      name: this.name,
      state: this.state,
      failures: this._failures,
      nextAttempt: this._nextAttempt,
    };
  }

  /**
   * Run `fn` under the breaker.
   * @template T
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   */
  async exec(fn) {
    this._maybeHalfOpen(); // perform the real OPEN → HALF_OPEN transition (fires onStateChange once)
    const state = this._state;
    if (state === STATES.OPEN) throw new CircuitOpenError(this.name);
    if (state === STATES.HALF_OPEN) {
      if (this._halfOpenActive >= this.halfOpenMax) throw new CircuitOpenError(this.name);
      this._halfOpenActive++;
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (err) {
      this._onError(err);
      throw err;
    }
  }

  _onSuccess() {
    if (this._state === STATES.HALF_OPEN) {
      this._halfOpenActive = Math.max(0, this._halfOpenActive - 1);
      this._transition(STATES.CLOSED); // probe succeeded — recover
    } else {
      this._failures = 0;
    }
  }

  _onError(err) {
    if (this._state === STATES.HALF_OPEN) {
      this._halfOpenActive = Math.max(0, this._halfOpenActive - 1);
    }
    if (!this.isFailure(err)) return; // e.g. a 4xx validation error is not a dependency failure
    this._failures++;
    if (this._state === STATES.HALF_OPEN || this._failures >= this.failureThreshold) {
      this._nextAttempt = this._now() + this.resetTimeoutMs;
      this._transition(STATES.OPEN);
    }
  }

  _maybeHalfOpen() {
    if (this._state === STATES.OPEN && this._now() >= this._nextAttempt) {
      this._transition(STATES.HALF_OPEN);
    }
  }

  _transition(next) {
    if (this._state === next) return;
    const from = this._state;
    this._state = next;
    if (next === STATES.CLOSED) {
      this._failures = 0;
      this._halfOpenActive = 0;
    }
    if (next === STATES.HALF_OPEN) this._halfOpenActive = 0;
    this.onStateChange({ name: this.name, from, to: next });
  }
}

module.exports = { CircuitBreaker, CircuitOpenError, CIRCUIT_STATES: STATES };
