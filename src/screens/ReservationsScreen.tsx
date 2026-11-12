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
import { Header, Card, Typography, Input, Button } from '../components/ui';
import { useTheme } from '../stores/theme-store';
import { useAuthStore } from '../stores/auth-store';
import { useI18n } from '../i18n';
import { ColorTheme, spacing, borderRadius } from '../theme';
import { api } from '../services/api-client';
import { TIME_SLOTS } from '../shared/constants';

export const ReservationsScreen: React.FC<any> = ({ navigation }) => {
  const { t, isNepali } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuthStore();

  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('MainTabs', { screen: 'Bookings' });
    }
  };

  const [name, setName] = useState(() => user?.name || '');
  const [email, setEmail] = useState(() => user?.email || '');
  const [phone, setPhone] = useState(() => user?.phone || '');
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState<string>('7:00 PM');
  const [seatingPreference, setSeatingPreference] = useState<'cabin' | 'garden' | 'indoor'>('garden');
  const [occasion, setOccasion] = useState<'casual' | 'birthday' | 'anniversary' | 'business'>('casual');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdRef, setCreatedRef] = useState<string>('');

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 2) {
      Alert.alert(t.common.error, isNepali ? 'कृपया आफ्नो पूरा नाम प्रविष्ट गर्नुहोस्।' : 'Please enter your full name (at least 2 characters).');
      return;
    }

    const digitsOnly = trimmedPhone.replace(/\D/g, '');
    if (!trimmedPhone || digitsOnly.length < 7) {
      Alert.alert(t.common.error, isNepali ? 'कृपया कम्तिमा ७ अङ्कको मान्य फोन नम्बर प्रविष्ट गर्नुहोस्।' : 'Please enter a valid phone number (at least 7 digits).');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert(t.common.error, isNepali ? 'कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस्।' : 'Please enter a valid email address.');
      return;
    }

    if (!date) {
      Alert.alert(t.common.error, isNepali ? 'कृपया आरक्षण मिति रोज्नुहोस्।' : 'Please select a reservation date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.reservations.create({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        date: date.trim(),
        time: time.trim(),
        guests,
        occasion,
        notes: `${seatingPreference.toUpperCase()} seating. ${notes}`.trim(),
      });

      if (res?.id) {
        setCreatedRef(res.id.slice(-6).toUpperCase());
      }
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
              {createdRef ? <Text style={styles.summaryRef}>Ref: #{createdRef}</Text> : null}
            </View>
            <Button
              title={isNepali ? 'मेरो बुकिङहरूमा हेर्नुहोस्' : 'View in My Bookings'}
              variant="gold"
              onPress={() => navigation?.navigate?.('MainTabs', { screen: 'Bookings' })}
              style={{ marginTop: spacing.md }}
            />
            <Button
              title={isNepali ? 'अर्को टेबल बुक गर्नुहोस्' : 'Book Another Table'}
              variant="outline"
              onPress={() => {
                setIsSuccess(false);
                setNotes('');
              }}
              style={styles.anotherButton}
            />
            <Button
              title={isNepali ? 'खानाको मेनु हेर्नुहोस्' : 'Explore Food Menu'}
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
                { id: 'cabin', label: t.reservations.privateCabins, icon: 'shield-checkmark-outline' },
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

            {/* Date */}
            <Input
              label={t.reservations.date}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD (e.g. 2026-11-20)"
              leftIcon="calendar-outline"
            />

            {/* Time Slot Horizontal Chips */}
            <Typography variant="title" style={styles.sectionLabel}>
              {t.reservations.time}
            </Typography>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timeSlotsRow}
            >
              {TIME_SLOTS.map((slot) => {
                const isSelected = time === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.timeChip, isSelected && styles.timeChipActive]}
                    onPress={() => setTime(slot)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

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

            {/* Special Instructions */}
            <Input
              label={t.reservations.specialRequests}
              value={notes}
              onChangeText={setNotes}
              placeholder={isNepali ? 'खाना वा उत्सव सम्बन्धी कुनै विशेष अनुरोध भए लेख्नुहोस्...' : 'Tell us about special occasions, dietary needs or seating preferences...'}
              multiline
              numberOfLines={3}
              containerStyle={{ marginTop: spacing.sm }}
            />

            <Button
              title={isSubmitting ? t.common.loading : t.reservations.bookTable}
              variant="gold"
              size="lg"
              onPress={handleSubmit}
              loading={isSubmitting}
              style={styles.submitBtn}
            />
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
      paddingBottom: 90,
    },
    headerTitleContainer: {
      marginBottom: spacing.md,
    },
    subtitle: {
      marginTop: spacing.xs,
    },
    formCard: {
      padding: spacing.md,
    },
    sectionLabel: {
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      fontWeight: '600',
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    optionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      backgroundColor: colors.surface,
    },
    optionPillActive: {
      backgroundColor: colors.gold,
      borderColor: colors.gold,
    },
    optionText: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '500',
    },
    optionTextActive: {
      color: '#130B1D',
      fontWeight: '700',
    },
    counterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
      gap: spacing.md,
    },
    counterBtn: {
      width: 42,
      height: 42,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    counterValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      minWidth: 90,
      textAlign: 'center',
    },
    timeSlotsRow: {
      paddingVertical: spacing.xs,
      gap: 8,
      marginBottom: spacing.md,
    },
    timeChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      backgroundColor: colors.surface,
    },
    timeChipActive: {
      backgroundColor: colors.purple,
      borderColor: colors.gold,
    },
    timeChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    timeChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    submitBtn: {
      marginTop: spacing.lg,
    },
    successCard: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    successIconWrapper: {
      marginBottom: spacing.md,
    },
    successTitle: {
      marginBottom: spacing.xs,
    },
    successMessage: {
      marginBottom: spacing.lg,
    },
    summaryBox: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      gap: spacing.xs,
    },
    summaryText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    summaryRef: {
      color: colors.gold,
      fontSize: 13,
      fontWeight: '700',
      marginTop: 4,
    },
    anotherButton: {
      marginTop: spacing.sm,
      width: '100%',
    },
  });
