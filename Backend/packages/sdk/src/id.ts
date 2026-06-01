import { randomUUID } from 'node:crypto';

/**
 * Platform id / correlation generator. Uses the Node built-in so the SDK carries
 * zero runtime npm dependencies (no `uuid`).
 */
export const newId = (): string => randomUUID();
