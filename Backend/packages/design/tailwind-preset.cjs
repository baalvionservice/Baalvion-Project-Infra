/**
 * The shared Baalvion quality bar, as a Tailwind preset.
 *
 * WHAT THIS IS NOT: a skin. It sets no palette. Every property keeps its own
 * colours, fonts and personality — Amarisé stays luxury, market-underworld
 * stays terminal-green, GTI stays institutional. What it standardises is the
 * stuff that reads as amateur when each site improvises it: type that doesn't
 * scale with the viewport, spacing with no rhythm, stock `shadow-md`, and
 * motion with no shared easing.
 *
 * Everything is namespaced `bv-` (or a distinct name like `lift-2`) so it can
 * never collide with a site's existing tokens. Adopting it breaks nothing; a
 * site opts in class by class.
 *
 * Usage — in the app's tailwind.config.ts:
 *   presets: [require('@baalvion/design/tailwind')]
 */

/** Shadows tint toward the site's own hue rather than pure black, which is what
 *  separates a considered surface from a default Bootstrap card. Sites override
 *  by setting --bv-shadow-rgb; the fallback is a neutral slate. */
const shadowRgb = 'var(--bv-shadow-rgb, 15 23 42)';
const s = (alpha) => `rgb(${shadowRgb} / ${alpha})`;

/** A hairline that survives dark mode, where a solid border reads too heavy. */
const hairline = `inset 0 0 0 1px rgb(${shadowRgb} / 0.06)`;

module.exports = {
  theme: {
    extend: {
      /* ---- Type: one fluid modular scale, so headings breathe on a phone
             and hold proportion on a 27" display without per-breakpoint classes. */
      fontSize: {
        'bv-display':  ['clamp(2.75rem, 1.9rem + 4.2vw, 5.5rem)',    { lineHeight: '0.95', letterSpacing: '-0.032em', fontWeight: '600' }],
        'bv-h1':       ['clamp(2.25rem, 1.7rem + 2.6vw, 3.75rem)',   { lineHeight: '1.05', letterSpacing: '-0.026em', fontWeight: '600' }],
        'bv-h2':       ['clamp(1.75rem, 1.45rem + 1.5vw, 2.75rem)',  { lineHeight: '1.12', letterSpacing: '-0.021em', fontWeight: '600' }],
        'bv-h3':       ['clamp(1.375rem, 1.2rem + 0.85vw, 2rem)',    { lineHeight: '1.2',  letterSpacing: '-0.016em', fontWeight: '600' }],
        'bv-h4':       ['clamp(1.125rem, 1.05rem + 0.4vw, 1.5rem)',  { lineHeight: '1.3',  letterSpacing: '-0.011em', fontWeight: '600' }],
        'bv-lead':     ['clamp(1.0625rem, 1rem + 0.35vw, 1.375rem)', { lineHeight: '1.55', letterSpacing: '-0.006em' }],
        'bv-body':     ['1rem',      { lineHeight: '1.65' }],
        'bv-small':    ['0.875rem',  { lineHeight: '1.55' }],
        'bv-caption':  ['0.8125rem', { lineHeight: '1.45' }],
        'bv-overline': ['0.6875rem', { lineHeight: '1.2', letterSpacing: '0.12em', fontWeight: '600' }],
      },

      /* ---- Rhythm: section spacing that scales with the viewport. A 96px gap
             is generous on desktop and absurd on a phone; these do both. */
      spacing: {
        'bv-section':    'clamp(3.5rem, 2rem + 6vw, 8rem)',
        'bv-section-sm': 'clamp(2.5rem, 1.6rem + 3.6vw, 5rem)',
        'bv-gutter':     'clamp(1.25rem, 0.9rem + 1.6vw, 2.5rem)',
        'bv-stack':      'clamp(1rem, 0.85rem + 0.7vw, 1.75rem)',
      },

      maxWidth: {
        'bv-prose': '68ch',   // measure that stays readable, not full-bleed text
        'bv-page':  '80rem',
      },

      /* ---- Elevation: layered + tinted. A single shadow always looks pasted on;
             two casts (a tight contact shadow plus a soft ambient one) is what
             real depth is made of. */
      boxShadow: {
        'lift-1':    `${hairline}, 0 1px 2px -1px ${s(0.10)}, 0 1px 3px ${s(0.06)}`,
        'lift-2':    `${hairline}, 0 2px 4px -2px ${s(0.10)}, 0 4px 10px -2px ${s(0.07)}`,
        'lift-3':    `${hairline}, 0 4px 8px -4px ${s(0.12)}, 0 12px 24px -6px ${s(0.09)}`,
        'lift-4':    `${hairline}, 0 8px 16px -8px ${s(0.14)}, 0 24px 48px -12px ${s(0.11)}`,
        'lift-hair': hairline,
        'bv-inset':  `inset 0 1px 2px ${s(0.08)}`,
      },

      /* ---- Motion: one vocabulary. `standard` for most things, `entrance` for
             things arriving (decelerate), `exit` for things leaving (accelerate). */
      transitionTimingFunction: {
        'bv-standard': 'cubic-bezier(0.2, 0, 0, 1)',
        'bv-entrance': 'cubic-bezier(0.05, 0.7, 0.1, 1)',
        'bv-exit':     'cubic-bezier(0.3, 0, 0.8, 0.15)',
        'bv-spring':   'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        'bv-fast':       '120ms',
        'bv-base':       '200ms',
        'bv-slow':       '320ms',
        'bv-deliberate': '500ms',
      },

      keyframes: {
        'bv-shimmer': { '100%': { transform: 'translateX(100%)' } },
        'bv-rise':    { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        'bv-fade':    { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        'bv-rise': 'bv-rise 320ms cubic-bezier(0.05, 0.7, 0.1, 1) both',
        'bv-fade': 'bv-fade 200ms cubic-bezier(0.2, 0, 0, 1) both',
      },
    },
  },

  plugins: [
    function bvUtilities({ addUtilities, addComponents }) {
      addUtilities({
        /* Small-caps label used above headings. Bundled because it is always the
           same four declarations and every site was rewriting them by hand. */
        '.bv-overline': {
          fontSize: '0.6875rem',
          lineHeight: '1.2',
          letterSpacing: '0.12em',
          fontWeight: '600',
          textTransform: 'uppercase',
        },
        /* Headings that never leave one orphaned word on the last line. */
        '.bv-balance': { textWrap: 'balance' },
        '.bv-pretty':  { textWrap: 'pretty' },
        /* Anchors that don't land under a sticky header. */
        '.bv-anchor':  { scrollMarginTop: '6rem' },
        /* Numerals that line up in tables and stat blocks. */
        '.bv-tnum':    { fontVariantNumeric: 'tabular-nums' },
        /* The 44px minimum touch target, which desktop-first work always misses. */
        '.bv-tap':     { minHeight: '44px', minWidth: '44px' },
      });

      addComponents({
        /* A focus ring that is visible on any background and only shows for
           keyboard users. Missing focus styles are the most common a11y failure
           in this repo. */
        '.bv-focus': {
          '&:focus-visible': {
            outline: '2px solid currentColor',
            outlineOffset: '2px',
            borderRadius: 'inherit',
          },
        },
        /* Loading placeholder. Sites had none, so navigation flashed blank. */
        '.bv-skeleton': {
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: `rgb(${shadowRgb} / 0.07)`,
          borderRadius: '0.375rem',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: '0',
            transform: 'translateX(-100%)',
            backgroundImage: `linear-gradient(90deg, transparent, rgb(${shadowRgb} / 0.06), transparent)`,
            animation: 'bv-shimmer 1.6s infinite',
          },
        },
        '@media (prefers-reduced-motion: reduce)': {
          '.bv-skeleton::after': { animation: 'none' },
        },
      });
    },
  ],
};
