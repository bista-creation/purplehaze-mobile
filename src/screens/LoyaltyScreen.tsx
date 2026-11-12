import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header, Card, Typography, LoyaltyRewardsCard } from '../components/ui';
import { useAuthStore } from '../stores/auth-store';
import { useTheme } from '../stores/theme-store';
import { useI18n } from '../i18n';
import { api } from '../services/api';
import type { LoyaltySummaryDto } from '../shared/types';
import { spacing } from '../theme';

const EMPTY_SUMMARY: LoyaltySummaryDto = {
  pointsBalance: 0,
  lifetimePoints: 0,
  pointsToNextReward: 200,
  redemptionPoints: 200,
  redemptionPercent: 10,
  earningRate: 1,
  rupeesPerPoint: 100,
  transactions: [],
};

export default function LoyaltyScreen({ navigation }: any) {
  const { user, isAuthenticated } = useAuthStore();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { data: summary = EMPTY_SUMMARY, isLoading: loading } = useQuery({
    queryKey: ['loyalty', user?.id],
    queryFn: () => api.get<LoyaltySummaryDto>('/loyalty'),
    enabled: Boolean(isAuthenticated && user?.id),
    staleTime: 30_000,
  });
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Typography variant="goldHeading">{t.loyalty.title}</Typography>
        <Typography variant="bodySmall" color={colors.textMuted} style={styles.subtitle}>
          {t.loyalty.earnRate}
        </Typography>

        {loading ? (
          <ActivityIndicator color={colors.gold} style={styles.loader} />
        ) : (
          <LoyaltyRewardsCard
            summary={summary}
            onAction={!isAuthenticated ? () => navigation.navigate('LoginModal') : undefined}
            actionLabel={!isAuthenticated ? t.loyalty.signInToRedeem : undefined}
          />
        )}

        {isAuthenticated ? (
          <Card variant="surface" style={styles.lifetimeCard}>
            <View style={styles.lifetimeRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="trophy-outline" size={20} color={colors.gold} />
              </View>
              <View style={styles.lifetimeText}>
                <Text style={styles.lifetimeLabel}>{t.loyalty.lifetimeEarned}</Text>
                <Text style={styles.lifetimeValue}>{summary.lifetimePoints} {t.loyalty.points}</Text>
              </View>
              {loading ? <ActivityIndicator size="small" color={colors.gold} /> : null}
            </View>
          </Card>
        ) : null}

        <Typography variant="title" style={styles.sectionTitle}>{t.loyalty.activity}</Typography>
        {summary.transactions.length === 0 ? (
          <Card variant="surface" style={styles.emptyCard}>
            <Ionicons name="sparkles-outline" size={30} color={colors.gold} />
            <Text style={styles.emptyText}>{isAuthenticated ? t.loyalty.noActivity : t.loyalty.signInToRedeem}</Text>
            <Text style={styles.pendingText}>{t.loyalty.pointsPending}</Text>
          </Card>
        ) : (
          <View style={styles.transactions}>
            {summary.transactions.map((item) => {
              const positive = item.pointsDelta > 0;
              const label = item.kind === 'REDEEM'
                ? t.loyalty.redeemed
                : item.kind === 'REFUND'
                  ? t.loyalty.returned
                  : t.loyalty.earned;
              return (
                <Card key={item.id} variant="surface" style={styles.transactionCard}>
                  <Ionicons
                    name={item.kind === 'REDEEM' ? 'pricetag-outline' : positive ? 'add-circle-outline' : 'refresh-circle-outline'}
                    size={20}
                    color={positive ? '#22C55E' : colors.gold}
                  />
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionLabel}>{label}</Text>
                    <Text style={styles.transactionDescription} numberOfLines={2}>{item.description}</Text>
                  </View>
                  <Text style={[styles.transactionPoints, { color: positive ? '#22C55E' : colors.text }]}>
                    {positive ? '+' : ''}{item.pointsDelta}
                  </Text>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.huge, gap: spacing.md },
  subtitle: { marginTop: -spacing.sm },
  loader: { padding: spacing.xl },
  lifetimeCard: { marginTop: spacing.xs },
  lifetimeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(247,189,66,0.12)', alignItems: 'center', justifyContent: 'center' },
  lifetimeText: { flex: 1, gap: 3 },
  lifetimeLabel: { color: colors.textMuted, fontSize: 12 },
  lifetimeValue: { color: colors.text, fontSize: 16, fontWeight: '800' },
  sectionTitle: { marginTop: spacing.sm },
  emptyCard: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { color: colors.text, fontWeight: '700', textAlign: 'center' },
  pendingText: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  transactions: { gap: spacing.sm },
  transactionCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  transactionInfo: { flex: 1, gap: 3 },
  transactionLabel: { color: colors.text, fontSize: 13, fontWeight: '700' },
  transactionDescription: { color: colors.textMuted, fontSize: 11 },
  transactionPoints: { fontSize: 15, fontWeight: '800' },
});
