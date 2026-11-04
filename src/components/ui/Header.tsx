import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useI18n } from '../../i18n';
import { useTheme } from '../../stores/theme-store';
import { colors, spacing, borderRadius } from '../../theme';

export interface HeaderProps {
  showTagline?: boolean;
  showLocation?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  showTagline = false,
  showLocation = true,
  showBack = false,
  onBack,
  rightAction,
}) => {
  const { t } = useI18n();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.surfaceBorder,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
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
          <View style={[styles.logoWrapper, { borderColor: colors.gold }]}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.brandContainer}>
            <Text style={[styles.brandTitle, { color: colors.purple }]}>Purple Haze</Text>
            <Text style={[styles.brandSubtitle, { color: colors.gold }]}>Restro {'&'} Garden</Text>
            {showLocation && (
              <View style={styles.locationBadge}>
                <Text style={styles.locationPin}>📍</Text>
                <Text style={[styles.subCity, { color: colors.textMuted }]}>Airport Road, Biratnagar</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionsRow}>
          {rightAction}
          <LanguageSwitcher />
        </View>
      </View>

      {showTagline ? (
        <Text style={[styles.tagline, { color: colors.textMuted }]}>"{t.common.tagline}"</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
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
  brandContainer: {
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
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 1.5,
    marginTop: 0,
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
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tagline: {
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
