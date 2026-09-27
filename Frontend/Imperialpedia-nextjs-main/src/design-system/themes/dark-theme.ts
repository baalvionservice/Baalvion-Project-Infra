import { colors } from '../tokens/colors';
import { ThemeType } from './light-theme';

export const darkTheme: ThemeType = {
  name: 'dark',
  colors: {
    background: colors.background.dark,
    foreground: colors.neutral[50],
    card: '#1e293b', // colors.neutral[800]
    cardForeground: colors.neutral[50],
    popover: colors.background.dark,
    popoverForeground: colors.neutral[50],
    primary: colors.primary[400],
    primaryForeground: colors.foreground.inverse,
    secondary: colors.secondary[400],
    secondaryForeground: colors.neutral[900],
    muted: '#334155', // colors.neutral[700]
    mutedForeground: colors.neutral[400],
    accent: colors.secondary[500],
    accentForeground: colors.neutral[50],
    destructive: colors.error.dark,
    destructiveForeground: colors.neutral[50],
    border: '#334155',
    input: '#334155',
    ring: colors.primary[400],
  },
};
