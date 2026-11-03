import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useI18n } from '../../i18n';
import { colors, spacing, borderRadius } from '../../theme';

export interface HeaderProps {
  showTagline?: boolean;
  showLocation?: boolean;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  showTagline = false,
  showLocation = true,
  rightAction,
}) => {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          {/* Official Round Purple Haze Logo */}
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.brandContainer}>
            <Text style={styles.brandTitle}>PURPLE HAZE</Text>
            <Text style={styles.brandSubtitle}>RESTRO {'&'} GARDEN</Text>
            {showLocation && (
              <View style={styles.locationBadge}>
                <Text style={styles.locationPin}>📍</Text>
                <Text style={styles.subCity}>Airport Road, Biratnagar</Text>
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
        <Text style={styles.tagline}>"{t.common.tagline}"</Text>
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
    fontSize: 16,
    fontWeight: '900',
    color: colors.purple,
    letterSpacing: 1.2,
    lineHeight: 18,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 1.5,
    marginTop: 1,
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
