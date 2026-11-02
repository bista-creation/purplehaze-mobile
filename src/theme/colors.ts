export const colors = {
  // Brand Backgrounds
  background: '#130B1D',         // Deep obsidian purple dark base
  backgroundSecondary: '#190E26',
  surface: '#1F132B',            // Elevated card / sheet background
  surfaceElevated: '#281A36',    // High-elevation card surface
  surfaceBorder: '#372549',      // Border color for cards and inputs
  surfaceBorderLight: '#4C3466',

  // Gold Accents (Purple Haze Signature)
  gold: '#D4AF37',               // Primary brand gold
  goldLight: '#F3E5AB',          // Highlights, badges
  goldDark: '#B89628',           // Pressed states, active borders
  goldMuted: 'rgba(212, 175, 55, 0.15)',

  // Purple Highlights
  purple: '#7C3AED',             // Action purple
  purpleLight: '#9061F9',
  purpleDark: '#5B21B6',
  purpleMuted: 'rgba(124, 58, 237, 0.15)',
  purpleGlow: 'rgba(147, 51, 234, 0.3)',

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

export type ColorToken = keyof typeof colors;
