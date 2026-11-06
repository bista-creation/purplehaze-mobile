import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useI18n } from '../../i18n';
import { colors, borderRadius, spacing } from '../../theme';
import { useTheme } from '../../stores/theme-store';

export const LanguageSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, setLanguage } = useI18n();
  const { colors: themeColors } = useTheme();

  return (
    <View style={[styles.container, compact && styles.containerCompact, { backgroundColor: themeColors.surface, borderColor: themeColors.surfaceBorder }]}>
      <TouchableOpacity
        style={[styles.pill, compact && styles.pillCompact, language === 'en' ? styles.pillActive : null]}
        onPress={() => setLanguage('en')}
        activeOpacity={0.7}
        accessibilityRole="radio"
        accessibilityLabel="English"
        accessibilityState={{ selected: language === 'en' }}
      >
        <Text style={[styles.text, compact && styles.textCompact, { color: language === 'en' ? '#130B1D' : themeColors.textMuted }, language === 'en' ? styles.textActive : null]}>
          EN
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.pill, compact && styles.pillCompact, language === 'ne' ? styles.pillActive : null]}
        onPress={() => setLanguage('ne')}
        activeOpacity={0.7}
        accessibilityRole="radio"
        accessibilityLabel="नेपाली"
        accessibilityState={{ selected: language === 'ne' }}
      >
        <Text style={[styles.text, compact && styles.textCompact, { color: language === 'ne' ? '#130B1D' : themeColors.textMuted }, language === 'ne' ? styles.textActive : null]}>
          नेपाली
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  containerCompact: {
    padding: 2,
  },
  pill: {
    minHeight: 44,
    minWidth: 44,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillCompact: {
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  pillActive: {
    backgroundColor: colors.gold,
  },
  textCompact: {
    fontSize: 11,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  textActive: {
    color: '#130B1D',
    fontWeight: '700',
  },
});
