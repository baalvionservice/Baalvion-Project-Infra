import { colors } from '../tokens/colors';

export const lightTheme = {
  name: 'light',
  colors: {
    background: colors.neutral[50],
    foreground: colors.neutral[900],
    card: colors.neutral[100],
    cardForeground: colors.neutral[900],
    popover: colors.neutral[50],
    popoverForeground: colors.neutral[900],
    primary: colors.primary[500],
    primaryForeground: colors.foreground.inverse,
    secondary: colors.secondary[500],
    secondaryForeground: colors.foreground.inverse,
    muted: colors.neutral[200],
    mutedForeground: colors.neutral[500],
    accent: colors.secondary[400],
    accentForeground: colors.neutral[900],
    destructive: colors.error.main,
    destructiveForeground: colors.foreground.inverse,
    border: colors.neutral[200],
    input: colors.neutral[200],
    ring: colors.primary[500],
  },
};

export type ThemeType = typeof lightTheme;
