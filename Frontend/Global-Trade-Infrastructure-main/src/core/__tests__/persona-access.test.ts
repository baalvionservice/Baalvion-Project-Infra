import { describe, it, expect } from 'vitest';
import { PERSONAS, personaAllowsPath, getPersona, type PersonaDef } from '../personas';

/**
 * Persona access matrix.
 *
 * The (dashboard) RouteGuard was written but never mounted — no page imported it — so for a
 * long time any signed-in user could reach every operational surface here by typing the URL.
 * It is mounted now, which makes personaAllowsPath the thing that decides authority for all
 * 173 dashboard pages. These assertions pin that behaviour across every persona, because a
 * browser test can only realistically cover two or three of them.
 */

/** Surfaces where wrongly granting access is materially worse than wrongly denying it. */
const SENSITIVE_PATHS = [
  '/payments',
  '/escrow',
  '/finance-settlement',
  '/sanctions-screening',
  '/governance',
  '/governance/platform-admin',
  '/governance/audit-logs',
  '/oversight',
  '/organization',
];

const godViews = PERSONAS.filter((p) => p.godView);
const scoped = PERSONAS.filter((p) => !p.godView);

describe('persona catalogue', () => {
  it('defines at least one persona and each has a home and a nav allowlist', () => {
    expect(PERSONAS.length).toBeGreaterThan(0);
    for (const p of PERSONAS) {
      expect(p.home, `${p.id} must declare a home`).toBeTruthy();
      expect(Array.isArray(p.nav), `${p.id} must declare nav`).toBe(true);
      expect(p.nav.length, `${p.id} nav must not be empty`).toBeGreaterThan(0);
    }
  });

  it('every persona id is unique', () => {
    const ids = PERSONAS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only god-view personas carry the "*" wildcard', () => {
    for (const p of PERSONAS) {
      if (p.nav.includes('*')) {
        expect(p.godView, `${p.id} grants "*" but is not marked godView`).toBe(true);
      }
    }
  });
});

describe('every persona can reach its own home', () => {
  it.each(PERSONAS.map((p) => [p.id, p] as [string, PersonaDef]))(
    '%s',
    (_id, persona) => {
      // A persona that cannot open its own landing page is locked out of the product.
      expect(personaAllowsPath(persona, persona.home)).toBe(true);
    },
  );
});

describe('god-view personas reach everything', () => {
  it.each(godViews.map((p) => [p.id, p] as [string, PersonaDef]))('%s', (_id, persona) => {
    for (const path of SENSITIVE_PATHS) {
      expect(personaAllowsPath(persona, path), `${persona.id} should reach ${path}`).toBe(true);
    }
  });
});

describe('scoped personas are confined to their allowlist', () => {
  it.each(scoped.map((p) => [p.id, p] as [string, PersonaDef]))('%s', (_id, persona) => {
    for (const path of SENSITIVE_PATHS) {
      const allowed = personaAllowsPath(persona, path);
      if (!allowed) continue;
      // Access is only acceptable when the allowlist names that prefix explicitly.
      const explicit = persona.nav.some((a) => path === a || path.startsWith(`${a}/`));
      expect(explicit, `${persona.id} reaches ${path} without an explicit grant`).toBe(true);
    }
  });
});

describe('prefix matching cannot be tricked', () => {
  const persona: PersonaDef = { ...PERSONAS[0], nav: ['/payments'], godView: false };

  it('grants the exact path and real children', () => {
    expect(personaAllowsPath(persona, '/payments')).toBe(true);
    expect(personaAllowsPath(persona, '/payments/settlements')).toBe(true);
  });

  it('does NOT grant a sibling that merely shares a prefix', () => {
    // '/payments-admin' starts with '/payments' as a STRING but is a different surface.
    expect(personaAllowsPath(persona, '/payments-admin')).toBe(false);
    expect(personaAllowsPath(persona, '/payments-internal/keys')).toBe(false);
  });

  it('does not grant an unrelated surface', () => {
    expect(personaAllowsPath(persona, '/governance')).toBe(false);
  });
});

describe('unknown roles fall back to a persona rather than crashing', () => {
  it('returns a persona for a role nobody defined', () => {
    const p = getPersona('not_a_real_role' as never);
    expect(p).toBeTruthy();
    expect(p.home).toBeTruthy();
  });

  it('the fallback persona is not a god view', () => {
    // An unrecognised role must never inherit platform-wide authority.
    const p = getPersona('not_a_real_role' as never);
    expect(p.godView ?? false).toBe(false);
    expect(p.nav.includes('*')).toBe(false);
  });
});
