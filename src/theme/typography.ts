import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  h1: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.3,
  } as TextStyle,
  h2: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.2,
  } as TextStyle,
  h3: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.text,
  } as TextStyle,
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.text,
  } as TextStyle,
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    color: colors.textSecondary,
  } as TextStyle,
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: colors.textMuted,
  } as TextStyle,
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 0.5,
  } as TextStyle,
  goldHeading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 0.8,
  } as TextStyle,
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.3,
  } as TextStyle,
} as const;
