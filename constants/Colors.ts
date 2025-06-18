import { Platform } from 'react-native';

// Color palette
const palette = {
  // Primary blues
  blue: {
    50: '#EBF5FF',
    100: '#D1E9FF',
    200: '#A8D3FF',
    300: '#7FB8FF',
    400: '#5A9EFA',
    500: '#3584F6', // Primary
    600: '#2370E2',
    700: '#1A5BBF',
    800: '#14499C',
    900: '#0F3778',
  },
  // Secondary greens
  green: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Good score
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  // Warning oranges
  orange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316', // Medium score
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  // Error reds
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444', // Bad score
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  // Purple accent
  purple: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },
  // Neutral grays
  gray: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
  },
};

export default {
  light: {
    primary: palette.blue[500],
    primaryDark: palette.blue[700],
    primaryLight: palette.blue[300],
    secondary: palette.purple[500],
    background: '#FFFFFF',
    backgroundSecondary: palette.gray[50],
    backgroundTertiary: palette.gray[100],
    text: palette.gray[900],
    textSecondary: palette.gray[600],
    textTertiary: palette.gray[400],
    border: palette.gray[200],
    borderStrong: palette.gray[300],
    goodScore: palette.green[500],
    mediumScore: palette.orange[500],
    badScore: palette.red[500],
    goodScoreBg: palette.green[50],
    mediumScoreBg: palette.orange[50],
    badScoreBg: palette.red[50],
    shadow: Platform.OS === 'android' ? '#000000' : palette.gray[900],
    shadowOpacity: Platform.OS === 'android' ? 0.15 : 0.1,
    notification: palette.red[500],
    tabIconDefault: palette.gray[400],
    tabIconSelected: palette.blue[500],
    // Add all palette colors for theme access
    ...palette
  },
  dark: {
    primary: palette.blue[400],
    primaryDark: palette.blue[600],
    primaryLight: palette.blue[200],
    secondary: palette.purple[400],
    background: palette.gray[900],
    backgroundSecondary: palette.gray[800],
    backgroundTertiary: palette.gray[700],
    text: palette.gray[50],
    textSecondary: palette.gray[300],
    textTertiary: palette.gray[500],
    border: palette.gray[700],
    borderStrong: palette.gray[600],
    goodScore: palette.green[400],
    mediumScore: palette.orange[400],
    badScore: palette.red[400],
    goodScoreBg: 'rgba(16, 185, 129, 0.1)',
    mediumScoreBg: 'rgba(249, 115, 22, 0.1)',
    badScoreBg: 'rgba(239, 68, 68, 0.1)',
    shadow: '#000000',
    shadowOpacity: 0.3,
    notification: palette.red[400],
    tabIconDefault: palette.gray[500],
    tabIconSelected: palette.blue[400],
    // Add all palette colors for theme access
    ...palette
  },
};