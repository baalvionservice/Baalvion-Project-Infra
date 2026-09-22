import { test } from 'node:test';
import assert from 'node:assert/strict';
import { credentialStatus, credentialNotice } from './author-credentials';

const c = (credentials: string) => ({ credentials });

test('CMS credential strings are recognised as supplied, not as "none on file"', () => {
  for (const s of [
    'LL.M. Corporate Law · 12+ years covering company and securities law',
    'J.D. · 10+ years in technology, IP, and privacy law',
    'LL.M. Family Law · 14+ years writing on family and matrimonial law',
    'LL.B. · Employment and workplace-rights writer',
    'BSc · LLB (Hons) · Graduate Diploma in Applied Finance · GAICD · AGIA',
    'Master’s degree, Boston University School of Law · Admitted, New York State Bar',
  ]) assert.equal(credentialStatus(c(s)), 'supplied', s);
});

test('a desk or role line is not a credential', () => {
  for (const s of ['Corporate & Securities desk, Law Elite Network', 'Contributor, Law Elite Network', '']) {
    assert.equal(credentialStatus(c(s)), 'none', s);
  }
});

test('education or certifications fields count as supplied', () => {
  assert.equal(credentialStatus({ credentials: 'Contributor', education: ['B.A. — Example'] }), 'supplied');
});

test('the notice never claims verification', () => {
  assert.match(credentialNotice('supplied'), /not been independently verified/);
  assert.doesNotMatch(credentialNotice('supplied'), /\bverified by\b|confirmed/i);
  assert.match(credentialNotice('none'), /Not documented/);
});
