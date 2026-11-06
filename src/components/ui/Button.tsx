import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { colors, borderRadius, spacing } from '../../theme';
import { useTheme } from '../../stores/theme-store';

export type ButtonVariant = 'gold' | 'purple' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'gold',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  ...rest
}) => {
  const { colors: themeColors } = useTheme();

  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = styles.base;

    // Size
    if (size === 'sm') base = { ...base, ...styles.sizeSm };
    else if (size === 'lg') base = { ...base, ...styles.sizeLg };
    else base = { ...base, ...styles.sizeMd };

    // Variant
    if (variant === 'gold') base = { ...base, ...styles.variantGold };
    else if (variant === 'purple') base = { ...base, ...styles.variantPurple };
    else if (variant === 'outline') base = { ...base, ...styles.variantOutline };
    else if (variant === 'ghost') base = { ...base, ...styles.variantGhost };
    else if (variant === 'danger') base = { ...base, ...styles.variantDanger };

    if (disabled || loading) {
      base = { ...base, opacity: 0.5 };
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    let base: TextStyle = styles.textBase;

    if (size === 'sm') base = { ...base, fontSize: 13 };
    else if (size === 'lg') base = { ...base, fontSize: 16 };
    else base = { ...base, fontSize: 14 };

    if (variant === 'gold') base = { ...base, color: '#130B1D', fontWeight: '700' };
    else if (variant === 'purple') base = { ...base, color: '#FFFFFF', fontWeight: '600' };
    else if (variant === 'outline') base = { ...base, color: themeColors.goldText, fontWeight: '600' };
    else if (variant === 'ghost') base = { ...base, color: colors.textSecondary };
    else if (variant === 'danger') base = { ...base, color: '#FFFFFF', fontWeight: '600' };

    return base;
  };

  const getVariantOverride = (): ViewStyle => {
    if (variant === 'gold') return { backgroundColor: themeColors.gold };
    if (variant === 'purple') return { backgroundColor: themeColors.purpleDark };
    if (variant === 'outline') return { borderColor: themeColors.goldText };
    if (variant === 'danger') return { backgroundColor: '#B42318' };
    return {};
  };

  return (
    <TouchableOpacity
      style={[getContainerStyle(), getVariantOverride(), style]}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      activeOpacity={0.75}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'gold' ? '#130B1D' : themeColors.goldText}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' ? icon : null}
          <Text style={[getTextStyle(), icon && iconPosition === 'left' ? { marginLeft: 8 } : null, icon && iconPosition === 'right' ? { marginRight: 8 } : null, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' ? icon : null}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: borderRadius.md,
  },
  sizeSm: {
    paddingVertical: spacing.xs + 1,
    paddingHorizontal: spacing.md - 1,
  },
  sizeMd: {
    paddingVertical: spacing.sm + 3,
    paddingHorizontal: spacing.lg - 1,
  },
  sizeLg: {
    paddingVertical: spacing.md + 1,
    paddingHorizontal: spacing.xl - 1,
  },
  variantGold: {
    backgroundColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  variantPurple: {
    backgroundColor: colors.purple,
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  variantOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  variantGhost: {
    backgroundColor: 'transparent',
  },
  variantDanger: {
    backgroundColor: colors.error,
  },
  textBase: {
    letterSpacing: 0.3,
  },
});
