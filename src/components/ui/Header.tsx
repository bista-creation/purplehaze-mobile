import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useI18n } from '../../i18n';
import { useTheme } from '../../stores/theme-store';
import { useCartStore } from '../../stores/cart-store';
import { colors, spacing } from '../../theme';

export interface HeaderProps {
  showTagline?: boolean;
  showLocation?: boolean;
  showBack?: boolean;
  showDynamicGreeting?: boolean;
  onBack?: () => void;
  onCartPress?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  showTagline = false,
  showLocation = true,
  showBack = false,
  showDynamicGreeting,
  onBack,
  onCartPress,
  rightAction,
}) => {
  const { t } = useI18n();
  const { colors, isDark, toggleTheme } = useTheme();
  const navigation = useNavigation<any>();
  const cartItemCount = useCartStore((s) => s.getItemCount());
  const { width } = useWindowDimensions();
  const isCompactHeader = width < 400;
  const isGreetingVisible = showDynamicGreeting ?? !showBack;

  const currentHour = new Date().getHours();
  const dynamicGreeting = useMemo(() => {
    if (currentHour >= 17 && currentHour < 23) {
      return t.home.eveningGreeting;
    }
    if (currentHour >= 11 && currentHour < 16) {
      return t.home.afternoonGreeting;
    }
    return t.home.defaultGreeting;
  }, [currentHour, t.home]);

  return (
    <View
      style={[
        styles.container,
        isCompactHeader && styles.containerCompact,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.surfaceBorder,
        },
      ]}
    >
      <View style={[styles.topRow, isCompactHeader && styles.topRowCompact]}>
        <View style={[styles.brandRow, isCompactHeader && styles.brandRowCompact]}>
          {showBack && onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={[
                styles.backBtn,
                {
                  borderColor: colors.surfaceBorder,
                  backgroundColor: colors.background,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
          ) : null}

          {/* Official Round Purple Haze Logo */}
          <View style={[styles.logoWrapper, isCompactHeader && styles.logoWrapperCompact, { borderColor: colors.gold }]}>
            <Image
              source={require('../../../assets/logo.png')}
              style={[styles.logo, isCompactHeader && styles.logoCompact]}
              resizeMode="contain"
            />
          </View>

          <View style={styles.brandContainer}>
            <Text
              style={[styles.brandTitle, isCompactHeader && styles.brandTitleCompact, { color: colors.purpleText }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              Purple Haze
            </Text>
            <Text style={[styles.brandSubtitle, isCompactHeader && styles.brandSubtitleCompact, { color: colors.goldText }]} numberOfLines={1}>
              Restro {'&'} Garden
            </Text>
            {showLocation && (
              <View style={styles.locationBadge}>
                <Text style={styles.locationPin}>📍</Text>
                <Text
                  style={[styles.subCity, isCompactHeader && styles.subCityCompact, { color: colors.textMuted }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Airport Road, Biratnagar
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.actionsRow, isCompactHeader && styles.actionsRowCompact]}>
          {rightAction}
          <TouchableOpacity
            onPress={() => {
              if (onCartPress) {
                onCartPress();
              } else {
                try {
                  navigation?.navigate?.('Cart');
                } catch {
                  // Fallback
                }
              }
            }}
            style={[styles.cartToggle, isCompactHeader && styles.cartToggleCompact, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}
            accessibilityRole="button"
            accessibilityLabel={`Shopping cart with ${cartItemCount} items`}
            activeOpacity={0.75}
            hitSlop={8}
          >
            <Ionicons name="bag-handle-outline" size={17} color={colors.purple} />
            {cartItemCount > 0 ? (
              <View style={[styles.cartBadge, { backgroundColor: colors.gold }]}>
                <Text style={styles.cartBadgeText}>{cartItemCount > 99 ? '99+' : cartItemCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { void toggleTheme(); }}
            style={[styles.themeToggle, isCompactHeader && styles.themeToggleCompact, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}
            accessibilityRole="switch"
            accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            accessibilityHint="Changes the app appearance"
            accessibilityState={{ checked: isDark }}
            activeOpacity={0.75}
            hitSlop={8}
          >
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={17} color={colors.purple} />
          </TouchableOpacity>
          <LanguageSwitcher compact={isCompactHeader} />
        </View>
      </View>

      {isGreetingVisible ? (
        <View
          style={[
            styles.greetingBanner,
            {
              backgroundColor: isDark ? 'rgba(168, 85, 247, 0.08)' : 'rgba(126, 34, 206, 0.05)',
              borderColor: isDark ? 'rgba(216, 173, 104, 0.22)' : 'rgba(216, 173, 104, 0.32)',
            },
          ]}
        >
          <Text style={[styles.greetingBannerText, { color: colors.goldText }]} numberOfLines={1}>
            {dynamicGreeting}
          </Text>
        </View>
      ) : null}

      {showTagline ? (
        <Text style={[styles.tagline, { color: colors.textMuted }]}>
          {'"'}{t.common.tagline}{'"'}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.screenTop,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  containerCompact: {
    paddingHorizontal: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topRowCompact: {
    gap: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandRowCompact: {
    minWidth: 0,
    gap: 7,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.gold,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: 40,
    height: 40,
  },
  logoWrapperCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  logoCompact: {
    width: 36,
    height: 36,
  },
  brandContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: Platform.select({
      web: "'Dancing Script', cursive",
      default: 'DancingScript-Bold',
    }),
    fontSize: 22,
    fontWeight: '700',
    color: colors.purple,
    letterSpacing: 0.2,
    lineHeight: 25,
  },
  brandTitleCompact: {
    fontSize: 19,
    lineHeight: 22,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.goldText,
    letterSpacing: 1.5,
    marginTop: 0,
  },
  brandSubtitleCompact: {
    fontSize: 8,
    letterSpacing: 1,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 2,
  },
  locationPin: {
    fontSize: 10,
  },
  subCity: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  subCityCompact: {
    fontSize: 9,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionsRowCompact: {
    flexShrink: 0,
    gap: spacing.xs,
  },
  themeToggle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleCompact: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  cartToggle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartToggleCompact: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#130B1D',
  },
  greetingBanner: {
    marginTop: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingBannerText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  tagline: {
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
