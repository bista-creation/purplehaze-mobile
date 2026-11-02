import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle } from 'react-native';
import { typography, colors } from '../../theme';

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
  const getStyle = (): TextStyle => {
    const base = { ...typography[variant] };
    if (color) base.color = color;
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
