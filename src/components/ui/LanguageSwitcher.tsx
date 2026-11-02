import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useI18n } from '../../i18n';
import { colors, borderRadius, spacing } from '../../theme';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useI18n();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.pill, language === 'en' ? styles.pillActive : null]}
        onPress={() => setLanguage('en')}
        activeOpacity={0.7}
      >
        <Text style={[styles.text, language === 'en' ? styles.textActive : null]}>
          EN
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.pill, language === 'ne' ? styles.pillActive : null]}
        onPress={() => setLanguage('ne')}
        activeOpacity={0.7}
      >
        <Text style={[styles.text, language === 'ne' ? styles.textActive : null]}>
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
  pill: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.full,
  },
  pillActive: {
    backgroundColor: colors.gold,
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
