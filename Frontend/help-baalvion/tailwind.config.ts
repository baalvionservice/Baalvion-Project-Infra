import type { Config } from 'tailwindcss';

const config: Config = {
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
        'on-accent': 'hsl(var(--on-accent))',
        code: 'hsl(var(--code))',
        ok: 'hsl(var(--ok))',
        warn: 'hsl(var(--warn))',
        danger: 'hsl(var(--danger))',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-text)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SF Mono', 'monospace'],
      },
      maxWidth: {
        site: 'var(--container)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      typography: () => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': 'hsl(var(--foreground))',
            '--tw-prose-headings': 'hsl(var(--foreground))',
            '--tw-prose-links': 'hsl(var(--accent-strong))',
            '--tw-prose-bold': 'hsl(var(--foreground))',
            '--tw-prose-counters': 'hsl(var(--muted))',
            '--tw-prose-bullets': 'hsl(var(--line-strong))',
            '--tw-prose-hr': 'hsl(var(--line))',
            '--tw-prose-quotes': 'hsl(var(--foreground))',
            '--tw-prose-quote-borders': 'hsl(var(--accent))',
            '--tw-prose-code': 'hsl(var(--foreground))',
            '--tw-prose-th-borders': 'hsl(var(--line))',
            '--tw-prose-td-borders': 'hsl(var(--line))',
            maxWidth: 'none',
            code: { fontWeight: '500' },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            a: { textDecoration: 'none', fontWeight: '600' },
            'a:hover': { textDecoration: 'underline' },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
