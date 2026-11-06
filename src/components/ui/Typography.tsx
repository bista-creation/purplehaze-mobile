import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { typography } from '../../theme';
import { useTheme } from '../../stores/theme-store';

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'goldHeading';

export interface TypographyProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  color,
  align,
  bold,
  style,
  ...rest
}) => {
  const { colors } = useTheme();

  const getDefaultColor = (): string => {
    switch (variant) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'title':
        return colors.text;
      case 'body':
        return colors.textSecondary;
      case 'bodySmall':
      case 'caption':
        return colors.textMuted;
      case 'goldHeading':
        return colors.goldText;
      default:
        return colors.text;
    }
  };

  const getStyle = (): TextStyle => {
    const base = { ...typography[variant] };
    base.color = color || getDefaultColor();
    if (align) base.textAlign = align;
    if (bold) base.fontWeight = '700';
    return base;
  };

  return (
    <RNText style={[getStyle(), style]} {...rest}>
      {children}
    </RNText>
  );
};
