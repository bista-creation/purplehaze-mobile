import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../i18n';
import { useTheme } from '../../stores/theme-store';
import type { LoyaltySummaryDto } from '../../shared/types';

type Props = {
  summary: LoyaltySummaryDto;
  onAction?: () => void;
  actionLabel?: string;
  actionDisabled?: boolean;
  helperText?: string;
};

export function LoyaltyRewardsCard({
  summary,
  onAction,
  actionLabel,
  actionDisabled = false,
  helperText,
}: Props) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const progress = Math.min(100, (summary.pointsBalance / summary.redemptionPoints) * 100);
  const pointsMessage = summary.pointsBalance >= summary.redemptionPoints
    ? t.loyalty.rewardUnlocked
    : t.loyalty.pointsToReward.replace('{points}', String(summary.pointsToNextReward));

  return (
    <View style={[styles.card, { backgroundColor: colors.purpleDark, borderColor: colors.purple }]}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="gift-outline" size={18} color="#FFFFFF" />
          <Text style={styles.title}>{t.loyalty.title}</Text>
        </View>
        <View style={styles.memberBadge}>
          <Text style={styles.memberText}>{t.loyalty.member}</Text>
        </View>
      </View>

      <View style={styles.balanceRow}>
        <Text style={styles.balance}>{summary.pointsBalance}</Text>
        <Text style={styles.pointsLabel}>{t.loyalty.points}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <View style={styles.progressMeta}>
        <Text style={styles.progressText}>
          {t.loyalty.progress
            .replace('{balance}', String(Math.min(summary.pointsBalance, summary.redemptionPoints)))
            .replace('{required}', String(summary.redemptionPoints))}
        </Text>
        <Text style={styles.progressText}>{summary.redemptionPercent}%</Text>
      </View>
      <Text style={styles.pointsMessage}>{pointsMessage}</Text>

      {onAction && actionLabel ? (
        <TouchableOpacity
          style={[styles.actionButton, actionDisabled && styles.actionDisabled]}
          onPress={onAction}
          disabled={actionDisabled}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Ionicons name="sparkles-outline" size={16} color="#35105F" />
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
      <Text style={styles.earnRate}>{t.loyalty.earnRate}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    overflow: 'hidden',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  memberBadge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.14)' },
  memberText: { color: '#F3E8FF', fontSize: 10, fontWeight: '700' },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 10 },
  balance: { color: '#FFFFFF', fontSize: 30, fontWeight: '900' },
  pointsLabel: { color: '#E9D5FF', fontSize: 14, fontWeight: '700' },
  progressTrack: { height: 8, backgroundColor: 'rgba(20, 5, 38, 0.5)', borderRadius: 10, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#F7BD42', borderRadius: 10 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  progressText: { color: '#E9D5FF', fontSize: 11, fontWeight: '600' },
  pointsMessage: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginTop: 8 },
  actionButton: { minHeight: 42, borderRadius: 22, backgroundColor: '#F7BD42', marginTop: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionDisabled: { opacity: 0.5 },
  actionText: { color: '#35105F', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  helper: { color: '#F3E8FF', fontSize: 11, lineHeight: 16, marginTop: 8 },
  earnRate: { color: '#E9D5FF', fontSize: 11, marginTop: 10 },
});
