import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'hsl(var(--ink))',
        'ink-deep': 'hsl(var(--ink-deep))',
        surface: 'hsl(var(--surface))',
        'surface-2': 'hsl(var(--surface-2))',
        concrete: 'hsl(var(--concrete))',
        line: 'hsl(var(--line))',
        'line-strong': 'hsl(var(--line-strong))',
        foreground: 'hsl(var(--foreground))',
        paper: 'hsl(var(--paper))',
        muted: 'hsl(var(--muted))',
        'muted-2': 'hsl(var(--muted-2))',
        accent: 'hsl(var(--accent))',
        'accent-ink': 'hsl(var(--accent-ink))',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['var(--font-text)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SF Mono', 'monospace'],
      },
      maxWidth: {
        site: 'var(--container)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
