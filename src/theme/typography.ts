import { TextStyle, Platform } from 'react-native';
import { colors } from './colors';

export const displayFontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
});

export const sansFontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
});

export const typography = {
  h1: {
    fontFamily: displayFontFamily,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  } as TextStyle,
  h2: {
    fontFamily: displayFontFamily,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  } as TextStyle,
  h3: {
    fontFamily: displayFontFamily,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  } as TextStyle,
  title: {
    fontFamily: sansFontFamily,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.1,
  } as TextStyle,
  body: {
    fontFamily: sansFontFamily,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
    color: colors.textSecondary,
  } as TextStyle,
  bodySmall: {
    fontFamily: sansFontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: colors.textMuted,
  } as TextStyle,
  caption: {
    fontFamily: sansFontFamily,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.3,
  } as TextStyle,
  goldHeading: {
    fontFamily: displayFontFamily,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    color: colors.goldText,
    letterSpacing: -0.2,
  } as TextStyle,
  button: {
    fontFamily: sansFontFamily,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 0.1,
  } as TextStyle,
} as const;
