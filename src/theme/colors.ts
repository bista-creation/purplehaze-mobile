export const brand = {
  primaryPurple: '#5B21B6',
  darkPurple: '#3B0764',
  lightPurple: '#EDE9FE',
  gold: '#F5B942',
  goldLight: '#FFF1CC',
  goldDark: '#9A6700',
  goldText: '#8A5A00',
  goldMuted: 'rgba(245, 185, 66, 0.16)',
  purple: '#5B21B6',
  purpleText: '#5B21B6',
  purpleDark: '#3B0764',
  purpleLight: '#EDE9FE',
  purpleMuted: 'rgba(91, 33, 182, 0.12)',
  purpleGlow: 'rgba(91, 33, 182, 0.25)',
} as const;

export const lightColors = {
  // Brand Backgrounds & Surfaces ("Purple Haze garden dining at dusk")
  background: '#FAF8FF',
  backgroundSecondary: '#F3EFFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceBorder: '#E5DCF6',
  surfaceBorderLight: '#F4EFFB',

  // Champagne-Gold Accents (Refined & Restrained)
  gold: '#F5B942',
  goldLight: '#FFF1CC',
  goldDark: '#9A6700',
  goldText: '#8A5A00',
  goldMuted: 'rgba(245, 185, 66, 0.16)',

  // Deep Aubergine / Dusk Plum (Primary Brand Color)
  purple: '#5B21B6',
  purpleText: '#5B21B6',
  purpleLight: '#EDE9FE',
  purpleDark: '#3B0764',
  purpleMuted: 'rgba(91, 33, 182, 0.08)',
  purpleGlow: 'rgba(91, 33, 182, 0.22)',

  // Typography (Editorial Dusk Charcoal)
  text: '#1A1025',
  textSecondary: '#514760',
  textMuted: '#655C72',
  textDisabled: '#756C82',

  // Status & Alerts
  success: '#047857',
  successMuted: 'rgba(4, 120, 87, 0.10)',
  warning: '#8A4B08',
  warningMuted: 'rgba(138, 75, 8, 0.10)',
  error: '#B42318',
  errorMuted: 'rgba(180, 35, 24, 0.10)',
  info: '#1D4ED8',
  infoMuted: 'rgba(29, 78, 216, 0.10)',

  // Dietary Indicators
  veg: '#15803D',
  nonVeg: '#B91C1C',
  halal: '#0E7490',

  // Semantic Aliases & Fallbacks
  primary: '#5B21B6',
  textPrimary: '#1A1025',
  border: '#E5DCF6',
} as const;

export const darkColors = {
  // Brand Backgrounds (Dark Obsidian Mode)
  background: '#130B1D',
  backgroundSecondary: '#1A1029',
  surface: '#1E132C',
  surfaceElevated: '#211530',
  surfaceBorder: '#352347',
  surfaceBorderLight: '#49335D',

  // Gold Accents
  gold: '#F5B942',
  goldLight: '#FFF1CC',
  goldDark: '#B98115',
  goldText: '#F5B942',
  goldMuted: 'rgba(245, 185, 66, 0.18)',

  // Purple Highlights
  purple: '#8B5CF6',
  purpleText: '#C4B5FD',
  purpleLight: '#EDE9FE',
  purpleDark: '#5B21B6',
  purpleMuted: 'rgba(139, 92, 246, 0.15)',
  purpleGlow: 'rgba(139, 92, 246, 0.3)',

  // Typography
  text: '#F7F2FF',
  textSecondary: '#E2D9F0',
  textMuted: '#B9AEC8',
  textDisabled: '#8F829F',

  // Status & Alerts
  success: '#34D399',
  successMuted: 'rgba(52, 211, 153, 0.15)',
  warning: '#FBBF24',
  warningMuted: 'rgba(251, 191, 36, 0.15)',
  error: '#F87171',
  errorMuted: 'rgba(248, 113, 113, 0.15)',
  info: '#60A5FA',
  infoMuted: 'rgba(96, 165, 250, 0.15)',

  // Dietary Indicators
  veg: '#4ADE80',
  nonVeg: '#F87171',
  halal: '#67E8F9',

  // Semantic Aliases & Fallbacks
  primary: '#8B5CF6',
  textPrimary: '#F7F2FF',
  border: '#352347',
} as const;

export type ColorTheme = { [K in keyof typeof lightColors]: string };
export type ColorToken = keyof typeof lightColors;

// Default exported mutable colors object so imports of `colors` receive updates immediately
export const colors: ColorTheme = { ...lightColors };
