#!/usr/bin/env node
/**
 * Issue one invitation to one named investor.
 *
 *   pnpm invite:new "Amit Shah" amit@example.com
 *   pnpm invite:new "Amit Shah" amit@example.com --expires 2027-03-31
 *
 * Prints the link to send that person, and the JSON entry to append to
 * IR_INVEST_INVITES in Vercel. Only the SHA-256 goes into configuration — the code itself is
 * shown once, here, and is not recoverable afterwards. If it is lost, issue a new one and drop
 * the old entry; that is the whole point of per-person invitations.
 *
 * See src/lib/invite-gate.ts for the Companies Act s.42 constraint this serves.
 */
import { randomBytes, createHash } from 'node:crypto';

const args = process.argv.slice(2);
const flagAt = args.indexOf('--expires');
const expires = flagAt !== -1 ? args[flagAt + 1] : null;
const positional = flagAt !== -1 ? args.slice(0, flagAt) : args;
const [name, email] = positional;

if (!name || !email) {
  console.error('usage: pnpm invite:new "Full Name" email@example.com [--expires YYYY-MM-DD]');
  process.exit(1);
}
if (expires !== null && !/^\d{4}-\d{2}-\d{2}$/.test(expires)) {
  console.error(`--expires must be YYYY-MM-DD, got "${expires}"`);
  process.exit(1);
}

// Unambiguous alphabet: no O/0, I/l/1. These get read aloud and retyped from emails.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const code = Array.from(randomBytes(20))
  // Rejection-free bias is irrelevant at 20 chars of a 31-symbol alphabet (~99 bits); the modulo
  // skew here is far below any practical guessing advantage.
  .map((b) => ALPHABET[b % ALPHABET.length])
  .join('')
  .replace(/(.{5})(?=.)/g, '$1-');

const sha256 = createHash('sha256').update(code).digest('hex');

const slug = name
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 32);
const id = `inv_${slug}_${randomBytes(3).toString('hex')}`;

const entry = { id, label: `${name} <${email}>`, sha256, expires };
const base = process.env.IR_BASE_URL || 'https://ir.baalvion.com';

console.log(`
Invitation for ${name} <${email}>

  Send them this link (it works once, then becomes a cookie):

    ${base}/invest?code=${code}

  Append this to IR_INVEST_INVITES in Vercel (Production):

    ${JSON.stringify(entry)}

  The code is shown ONCE. Configuration only ever holds the hash, so it cannot be
  recovered from Vercel — if it is lost, issue a new invitation and delete this entry.
  To revoke access for this person, remove the entry; nobody else is affected.
`);
