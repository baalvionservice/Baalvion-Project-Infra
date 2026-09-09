import type { Config } from 'tailwindcss';

/**
 * The shared Baalvion quality bar as a Tailwind preset.
 *
 * Typed as a partial Config because a preset supplies only the slices it owns —
 * type scale, spacing rhythm, elevation, motion — and never a palette or content globs.
 */
declare const preset: Partial<Config>;
export = preset;
