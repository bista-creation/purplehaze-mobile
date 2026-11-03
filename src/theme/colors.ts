export const brand = {
  primaryPurple: '#54266D',
  darkPurple: '#32183F',
  lightPurple: '#F0E7F4',
  gold: '#D8AD68',
  goldLight: '#F3E5AB',
  goldDark: '#B89628',
  goldMuted: 'rgba(216, 173, 104, 0.15)',
  purple: '#54266D',
  purpleDark: '#32183F',
  purpleLight: '#F0E7F4',
  purpleMuted: 'rgba(84, 38, 109, 0.12)',
  purpleGlow: 'rgba(84, 38, 109, 0.25)',
} as const;

export const lightColors = {
  // Brand Backgrounds & Surfaces (User Requested Spec)
  background: '#FAF8FB',
  backgroundSecondary: '#F3EEF6',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceBorder: '#EFE7F3',
  surfaceBorderLight: '#F7F2F9',

  // Gold Accents (Purple Haze Signature)
  gold: '#D8AD68',
  goldLight: '#F3E5AB',
  goldDark: '#B89628',
  goldMuted: 'rgba(216, 173, 104, 0.15)',

  // Purple Highlights
  purple: '#54266D',
  purpleLight: '#F0E7F4',
  purpleDark: '#32183F',
  purpleMuted: 'rgba(84, 38, 109, 0.12)',
  purpleGlow: 'rgba(84, 38, 109, 0.25)',

  // Typography (User Requested Spec)
  text: '#211827',
  textSecondary: '#4D3F54',
  textMuted: '#827889',
  textDisabled: '#B3ABB9',

  // Status & Alerts
  success: '#10B981',
  successMuted: 'rgba(16, 185, 129, 0.12)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.12)',
  error: '#EF4444',
  errorMuted: 'rgba(239, 68, 68, 0.12)',
  info: '#3B82F6',
  infoMuted: 'rgba(59, 130, 246, 0.12)',

  // Dietary Indicators
  veg: '#16A34A',
  nonVeg: '#DC2626',
  halal: '#0891B2',
} as const;

export const darkColors = {
  // Brand Backgrounds (Dark Obsidian Mode)
  background: '#130B1D',
  backgroundSecondary: '#190E26',
  surface: '#1F132B',
  surfaceElevated: '#281A36',
  surfaceBorder: '#372549',
  surfaceBorderLight: '#4C3466',

  // Gold Accents
  gold: '#D8AD68',
  goldLight: '#F3E5AB',
  goldDark: '#B89628',
  goldMuted: 'rgba(216, 173, 104, 0.18)',

  // Purple Highlights
  purple: '#9061F9',
  purpleLight: '#F0E7F4',
  purpleDark: '#54266D',
  purpleMuted: 'rgba(144, 97, 249, 0.15)',
  purpleGlow: 'rgba(144, 97, 249, 0.3)',

  // Typography
  text: '#FFFFFF',
  textSecondary: '#E2E8F0',
  textMuted: '#94A3B8',
  textDisabled: '#64748B',

  // Status & Alerts
  success: '#10B981',
  successMuted: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.15)',
  error: '#EF4444',
  errorMuted: 'rgba(239, 68, 68, 0.15)',
  info: '#3B82F6',
  infoMuted: 'rgba(59, 130, 246, 0.15)',

  // Dietary Indicators
  veg: '#22C55E',
  nonVeg: '#EF4444',
  halal: '#06B6D4',
} as const;

// Default exported colors object for compatibility (Light theme per spec)
export const colors = lightColors;

export type ColorTheme = { [K in keyof typeof lightColors]: string };
export type ColorToken = keyof typeof lightColors;
