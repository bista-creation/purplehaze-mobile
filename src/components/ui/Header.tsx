import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useI18n } from '../../i18n';
import { colors, spacing } from '../../theme';

export interface HeaderProps {
  showTagline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ showTagline = true }) => {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>PURPLE HAZE</Text>
          <Text style={styles.subCity}>RESTRO & GARDEN • BIRATNAGAR</Text>
        </View>
        <LanguageSwitcher />
      </View>

      {showTagline ? (
        <Text style={styles.tagline}>"{t.common.tagline}"</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.gold,
    letterSpacing: 1.5,
  },
  subCity: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.purpleLight,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  tagline: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
