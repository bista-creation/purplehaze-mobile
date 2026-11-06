import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { borderRadius, spacing } from '../../theme';
import { useTheme } from '../../stores/theme-store';

export type BadgeVariant =
  | 'gold'
  | 'purple'
  | 'veg'
  | 'nonVeg'
  | 'success'
  | 'warning'
  | 'error'
  | 'muted'
  | 'outline';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'gold',
  style,
  textStyle,
  icon,
}) => {
  const { colors } = useTheme();

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'purple':
        return { backgroundColor: colors.purpleMuted, borderColor: colors.purpleText };
      case 'veg':
        return { backgroundColor: 'rgba(34, 197, 94, 0.15)', borderColor: colors.veg };
      case 'nonVeg':
        return { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: colors.nonVeg };
      case 'success':
        return { backgroundColor: colors.successMuted, borderColor: colors.success };
      case 'warning':
        return { backgroundColor: colors.warningMuted, borderColor: colors.warning };
      case 'error':
        return { backgroundColor: colors.errorMuted, borderColor: colors.error };
      case 'muted':
        return { backgroundColor: 'rgba(148, 163, 184, 0.1)', borderColor: colors.textDisabled };
      case 'outline':
        return { backgroundColor: 'transparent', borderColor: colors.goldDark };
      case 'gold':
      default:
        return { backgroundColor: colors.goldMuted, borderColor: colors.goldDark };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'purple':
        return { color: colors.purpleText };
      case 'veg':
        return { color: colors.veg };
      case 'nonVeg':
        return { color: colors.nonVeg };
      case 'success':
        return { color: colors.success };
      case 'warning':
        return { color: colors.warning };
      case 'error':
        return { color: colors.error };
      case 'muted':
        return { color: colors.textMuted };
      case 'outline':
        return { color: colors.goldDark };
      case 'gold':
      default:
        return { color: colors.goldText };
    }
  };

  return (
    <View style={[styles.base, getContainerStyle(), style]}>
      {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
      <Text style={[styles.text, getTextStyle(), textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  iconWrapper: {
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
