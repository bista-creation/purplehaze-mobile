import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header, Card, Typography, Input, Button, Badge } from '../components/ui';
import { useTheme } from '../stores/theme-store';
import { useI18n } from '../i18n';
import { colors as defaultColors, ColorTheme, spacing, borderRadius } from '../theme';
import { api } from '../services/api-client';

export const ReservationsScreen: React.FC<any> = ({ navigation }) => {
  const { t } = useI18n();
  const { colors } = useTheme();

  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('MainTabs', { screen: 'Home' });
    }
  };

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('19:00');
  const [seatingPreference, setSeatingPreference] = useState<'rooftop' | 'garden' | 'indoor'>('rooftop');
  const [occasion, setOccasion] = useState<'casual' | 'birthday' | 'anniversary' | 'business'>('casual');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !email.trim()) {
      Alert.alert(t.common.error, 'Please fill in your name, email, and phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const reservationDate = new Date(`${date}T${time}:00`).toISOString();
      await api.reservations.create({
        name,
        email,
        phone,
        date: reservationDate,
        guests,
        occasion,
        notes: `${seatingPreference.toUpperCase()} seating. ${notes}`.trim(),
      });
      setIsSuccess(true);
    } catch (e: any) {
      Alert.alert(t.common.error, e.message || 'Could not place reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header showBack onBack={handleBack} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerTitleContainer}>
          <Typography variant="goldHeading">{t.reservations.title}</Typography>
          <Typography variant="body" color={colors.textMuted} style={styles.subtitle}>
            {t.reservations.subtitle}
          </Typography>
        </View>

        {isSuccess ? (
          <Card variant="goldAccent" style={styles.successCard}>
            <View style={styles.successIconWrapper}>
              <Ionicons name="checkmark-circle" size={54} color={colors.gold} />
            </View>
            <Typography variant="h2" align="center" style={styles.successTitle}>
              {t.reservations.successTitle}
            </Typography>
            <Typography variant="body" align="center" color={colors.textSecondary} style={styles.successMessage}>
              {t.reservations.successMessage}
            </Typography>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>👤 {name} ({guests} {t.venues.guestsCount})</Text>
              <Text style={styles.summaryText}>📅 {date} at {time}</Text>
              <Text style={styles.summaryText}>✨ {seatingPreference.toUpperCase()} Dining</Text>
            </View>
            <Button
              title="Book Another Table"
              variant="outline"
              onPress={() => {
                setIsSuccess(false);
                setNotes('');
              }}
              style={styles.anotherButton}
            />
            <Button
              title="Back to Home"
              variant="gold"
              onPress={() => navigation?.navigate?.('MainTabs', { screen: 'Home' })}
              style={{ marginTop: spacing.sm }}
            />
            <Button
              title="Explore Food Menu"
              variant="ghost"
              onPress={() => navigation?.navigate?.('MainTabs', { screen: 'Menu' })}
              style={{ marginTop: spacing.xs }}
            />
          </Card>
        ) : (
          <Card variant="elevated" style={styles.formCard}>
            {/* Seating Preference Selector */}
            <Typography variant="title" style={styles.sectionLabel}>
              {t.reservations.seatingPreference}
            </Typography>
            <View style={styles.pillRow}>
              {[
                { id: 'rooftop', label: t.reservations.rooftop, icon: 'cloudy-night-outline' },
                { id: 'garden', label: t.reservations.garden, icon: 'leaf-outline' },
                { id: 'indoor', label: t.reservations.indoor, icon: 'restaurant-outline' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.optionPill,
                    seatingPreference === opt.id ? styles.optionPillActive : null,
                  ]}
                  onPress={() => setSeatingPreference(opt.id as any)}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={16}
                    color={seatingPreference === opt.id ? '#130B1D' : colors.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      seatingPreference === opt.id ? styles.optionTextActive : null,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Guest Counter */}
            <Typography variant="title" style={styles.sectionLabel}>
              {t.reservations.guests}
            </Typography>
            <View style={styles.counterRow}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setGuests(Math.max(1, guests - 1))}
              >
                <Ionicons name="remove" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.counterValue}>
                {guests} {t.venues.guestsCount}
              </Text>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => setGuests(Math.min(20, guests + 1))}
              >
                <Ionicons name="add" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Date & Time selection */}
            <View style={styles.row}>
              <Input
                label={t.reservations.date}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                leftIcon="calendar-outline"
                containerStyle={styles.halfInput}
              />
              <Input
                label={t.reservations.time}
                value={time}
                onChangeText={setTime}
                placeholder="HH:MM (e.g. 19:30)"
                leftIcon="time-outline"
                containerStyle={styles.halfInput}
              />
            </View>

            {/* Guest Details */}
            <Input
              label={t.reservations.name}
              value={name}
              onChangeText={setName}
              placeholder={t.auth.fullNamePlaceholder}
              leftIcon="person-outline"
            />
            <Input
              label={t.auth.email}
              value={email}
              onChangeText={setEmail}
              placeholder={t.auth.emailPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />
            <Input
              label={t.reservations.phone}
              value={phone}
              onChangeText={setPhone}
              placeholder={t.auth.phonePlaceholder}
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />

            {/* Special Occasion */}
            <Typography variant="title" style={styles.sectionLabel}>
              {t.reservations.occasion}
            </Typography>
            <View style={styles.pillRow}>
              {[
                { id: 'casual', label: t.reservations.casual },
                { id: 'birthday', label: t.reservations.birthday },
                { id: 'anniversary', label: t.reservations.anniversary },
                { id: 'business', label: t.reservations.business },
              ].map((occ) => (
                <TouchableOpacity
                  key={occ.id}
                  style={[
                    styles.optionPill,
                    occasion === occ.id ? styles.optionPillActive : null,
                  ]}
                  onPress={() => setOccasion(occ.id as any)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      occasion === occ.id ? styles.optionTextActive : null,
                    ]}
                  >
                    {occ.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label={t.reservations.specialRequests}
              value={notes}
              onChangeText={setNotes}
              placeholder="Allergies, high chair, birthday cake surprise..."
              multiline
              numberOfLines={3}
              style={{ height: 70, textAlignVertical: 'top' }}
            />

            <Button
              title={t.reservations.bookTable}
              variant="gold"
              size="lg"
              loading={isSubmitting}
              onPress={handleSubmit}
              style={styles.submitButton}
            />

            <TouchableOpacity
              onPress={handleBack}
              style={{ marginTop: spacing.md, alignItems: 'center', padding: spacing.sm }}
              activeOpacity={0.7}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>
                Cancel & Return Home
              </Text>
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ColorTheme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.huge,
  },
  headerTitleContainer: {
    marginBottom: spacing.md,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  formCard: {
    padding: spacing.lg,
  },
  sectionLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: borderRadius.full,
  },
  optionPillActive: {
    backgroundColor: colors.gold,
    borderColor: colors.goldDark,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  optionTextActive: {
    color: '#130B1D',
    fontWeight: '700',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.goldText,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  successCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  successIconWrapper: {
    marginBottom: spacing.md,
  },
  successTitle: {
    color: colors.goldText,
    marginBottom: spacing.sm,
  },
  successMessage: {
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  summaryBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: '100%',
    marginBottom: spacing.lg,
    gap: 6,
  },
  summaryText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  anotherButton: {
    width: '100%',
  },
});
