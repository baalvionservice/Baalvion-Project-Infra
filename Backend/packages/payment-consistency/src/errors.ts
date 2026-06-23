/** Typed errors so callers can distinguish a bad event from an infrastructure failure. */

export class PclError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** The event failed schema/shape validation — a programming/adapter bug, never retried. */
export class PclValidationError extends PclError {
  constructor(
    message: string,
    readonly issues?: unknown,
  ) {
    super(message);
  }
}
