import type { Config } from 'tailwindcss';
import baalvionDesign from '@baalvion/design/tailwind';

const config: Config = {
  presets: [baalvionDesign],
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ground: 'hsl(var(--ground))',
        surface: 'hsl(var(--surface))',
        'surface-2': 'hsl(var(--surface-2))',
        line: 'hsl(var(--line))',
        'line-strong': 'hsl(var(--line-strong))',
        foreground: 'hsl(var(--foreground))',
        muted: 'hsl(var(--muted))',
        'muted-2': 'hsl(var(--muted-2))',
        accent: 'hsl(var(--accent))',
        'accent-strong': 'hsl(var(--accent-strong))',
        'accent-soft': 'hsl(var(--accent-soft))',
        'on-accent': 'hsl(var(--on-accent))',
        ok: 'hsl(var(--ok))',
        warn: 'hsl(var(--warn))',
        danger: 'hsl(var(--danger))',
        // Celebration palette — see globals.css. Marketing surfaces, not the product UI.
        rose: 'hsl(var(--rose))',
        'rose-deep': 'hsl(var(--rose-deep))',
        'rose-soft': 'hsl(var(--rose-soft))',
        marigold: 'hsl(var(--marigold))',
        saffron: 'hsl(var(--saffron))',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-text)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        // Two named steps between Tailwind's `sm` and `lg`, because the reading sizes this
        // product actually uses fell between them and were being written as arbitrary
        // values (`text-[1.0625rem]`) in 34 places. Naming them makes the scale one thing.
        ui: ['0.9375rem', { lineHeight: '1.5rem' }],      // 15px — dense UI copy
        body: ['1.0625rem', { lineHeight: '1.75rem' }],   // 17px — long-form reading
      },
      spacing: {
        // The one vertical rhythm for a page section. Eight different `py-*` values were in
        // use with no rule; these two are the rule.
        section: '3rem',
        'section-lg': '5rem',
      },
      maxWidth: {
        site: '78rem',
        prose: '42rem',
      },
      borderRadius: {
        card: '0.625rem',
      },
      boxShadow: {
        // Restrained elevation. A support platform should feel steady, not animated.
        card: '0 1px 2px hsl(var(--foreground) / 0.04), 0 1px 3px hsl(var(--foreground) / 0.03)',
        lift: '0 4px 12px hsl(var(--foreground) / 0.07)',
      },
    },
  },
  plugins: [],
};

export default config;
