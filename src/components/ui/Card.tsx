import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../../stores/theme-store';
import { colors, borderRadius, spacing } from '../../theme';

export interface CardProps extends ViewProps {
  variant?: 'surface' | 'elevated' | 'outlined' | 'goldAccent';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'surface',
  style,
  ...rest
}) => {
  const { colors } = useTheme();

  const getStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.surfaceElevated,
          borderWidth: 1,
          borderColor: colors.surfaceBorderLight,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.surfaceBorder,
        };
      case 'goldAccent':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.gold,
        };
      default:
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.surfaceBorder,
        };
    }
  };

  return (
    <View style={[styles.base, getStyle(), style]} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  surface: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  elevated: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  goldAccent: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.goldDark,
  },
});
