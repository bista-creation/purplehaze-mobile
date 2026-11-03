import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header, Card, Typography, Badge, Button, Input } from '../components/ui';
import { useTheme } from '../stores/theme-store';
import { useI18n } from '../i18n';
import { colors as defaultColors, ColorTheme, spacing, borderRadius } from '../theme';
import { api, type VenueDto } from '../services/api-client';

export const VenuesScreen: React.FC<any> = ({ navigation }) => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [venues, setVenues] = useState<VenueDto[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<VenueDto | null>(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('MainTabs', { screen: 'Home' });
    }
  };

  // Inquiry form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState('50');
  const [date, setDate] = useState(() => new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [eventType, setEventType] = useState('Wedding / Reception');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.venues.getVenues().then(setVenues).catch(() => {});
  }, []);

  const handleInquirySubmit = async () => {
    if (!name.trim() || !phone.trim() || !email.trim()) {
      Alert.alert(t.common.error, 'Please fill in name, email, and phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.venues.createEventBooking({
        venueId: selectedVenue?.id,
        name,
        email,
        phone,
        eventType,
        eventDate: new Date(`${date}T18:00:00`).toISOString(),
        guests: parseInt(guests, 10) || 50,
        message,
      });

      Alert.alert('Inquiry Sent!', 'Our Biratnagar event banquet manager will contact you within 24 hours.');
      setShowInquiryModal(false);
      setMessage('');
    } catch (e: any) {
      Alert.alert(t.common.error, e.message || 'Could not send inquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header showBack onBack={handleBack} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerTitleContainer}>
          <Typography variant="goldHeading">{t.venues.title}</Typography>
          <Typography variant="body" color={colors.textMuted} style={styles.subtitle}>
            {t.venues.subtitle}
          </Typography>
        </View>

        {venues.map((venue) => (
          <Card key={venue.id} variant="elevated" style={styles.venueCard}>
            {venue.images?.[0] ? (
              <Image source={{ uri: venue.images[0] }} style={styles.venueImage} resizeMode="cover" />
            ) : null}

            <View style={styles.venueBody}>
              <View style={styles.titleRow}>
                <Typography variant="h2" style={styles.venueName}>
                  {venue.name}
                </Typography>
                {venue.capacity ? (
                  <Badge
                    label={`${venue.capacity} ${t.venues.guestsCount}`}
                    variant="gold"
                    icon={<Ionicons name="people-outline" size={12} color={colors.gold} />}
                  />
                ) : null}
              </View>

              {venue.tagline ? (
                <Typography variant="bodySmall" color={colors.purpleLight} style={styles.venueTagline}>
                  {venue.tagline}
                </Typography>
              ) : null}

              {venue.description ? (
                <Typography variant="body" color={colors.textSecondary} style={styles.venueDesc}>
                  {venue.description}
                </Typography>
              ) : null}

              {venue.features && venue.features.length > 0 ? (
                <View style={styles.featuresRow}>
                  {venue.features.map((feat, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.gold} style={{ marginRight: 4 }} />
                      <Text style={styles.featureText}>{feat}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <Button
                title={t.venues.enquireNow}
                variant="outline"
                onPress={() => {
                  setSelectedVenue(venue);
                  setShowInquiryModal(true);
                }}
                style={styles.enquireButton}
              />
            </View>
          </Card>
        ))}

        {showInquiryModal ? (
          <Card variant="goldAccent" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Typography variant="h3" color={colors.gold}>
                Event Enquiry: {selectedVenue?.name}
              </Typography>
              <TouchableOpacity onPress={() => setShowInquiryModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Input
              label={t.reservations.name}
              value={name}
              onChangeText={setName}
              placeholder={t.auth.fullNamePlaceholder}
            />
            <Input
              label={t.auth.email}
              value={email}
              onChangeText={setEmail}
              placeholder={t.auth.emailPlaceholder}
              keyboardType="email-address"
            />
            <Input
              label={t.reservations.phone}
              value={phone}
              onChangeText={setPhone}
              placeholder={t.auth.phonePlaceholder}
              keyboardType="phone-pad"
            />

            <View style={styles.row}>
              <Input
                label="Event Date"
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                containerStyle={styles.halfInput}
              />
              <Input
                label="Expected Guests"
                value={guests}
                onChangeText={setGuests}
                placeholder="50"
                keyboardType="numeric"
                containerStyle={styles.halfInput}
              />
            </View>

            <Input
              label="Event Type"
              value={eventType}
              onChangeText={setEventType}
              placeholder="Wedding, Birthday, Corporate Meeting"
            />

            <Input
              label="Additional Notes / Menu Preferences"
              value={message}
              onChangeText={setMessage}
              placeholder="Catering style, sound setup, live music..."
              multiline
              numberOfLines={3}
              style={{ height: 60, textAlignVertical: 'top' }}
            />

            <Button
              title="Submit Banquet Enquiry"
              variant="gold"
              loading={isSubmitting}
              onPress={handleInquirySubmit}
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        ) : null}

        <View style={{ marginTop: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm, alignItems: 'center' }}>
          <Button
            title="Reserve a Dining Table Instead"
            variant="outline"
            onPress={() => navigation?.navigate?.('Reservations')}
            style={{ width: '100%' }}
          />
          <TouchableOpacity
            onPress={handleBack}
            style={{ padding: spacing.sm }}
            activeOpacity={0.7}
          >
            <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 14 }}>
              ← Return to Home Page
            </Text>
          </TouchableOpacity>
        </View>
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
  venueCard: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
    padding: 0,
  },
  venueImage: {
    width: '100%',
    height: 180,
  },
  venueBody: {
    padding: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  venueName: {
    color: colors.text,
    flex: 1,
  },
  venueTagline: {
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  venueDesc: {
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  featureText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  enquireButton: {
    width: '100%',
  },
  modalCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
});
