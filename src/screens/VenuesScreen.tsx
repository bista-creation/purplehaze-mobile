import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { ColorTheme, spacing, borderRadius } from '../theme';
import { api, type VenueDto } from '../services/api-client';

export const VenuesScreen: React.FC<any> = ({ navigation }) => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [venues, setVenues] = useState<VenueDto[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<VenueDto | null>(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const scrollViewRef = useRef<any>(null);
  const venueLayouts = useRef<{ [key: string]: number }>({});

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
    api.venues.getVenues().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setVenues(data);
      }
    }).catch(() => {});
  }, []);

  const handleSelectVenue = (venue: VenueDto) => {
    setSelectedVenue(venue);
    if (venue.capacity === 300) {
      setGuests('150');
      setEventType('Wedding / Reception');
    } else if (venue.capacity === 100) {
      setGuests('60');
      setEventType('Corporate Meeting / Seminar');
    } else if (venue.capacity === 50) {
      setGuests('30');
      setEventType('Workshop / Private Gathering');
    } else {
      setGuests('80');
      setEventType('Outdoor Celebration / Music Event');
    }
    setShowInquiryModal(true);
  };

  const handleScrollToVenue = (venueId: string) => {
    const y = venueLayouts.current[venueId];
    if (y !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: Math.max(0, y - 20), animated: true });
    }
  };

  const handleInquirySubmit = async () => {
    if (!name.trim() || !phone.trim() || !email.trim()) {
      Alert.alert(t.common.error, 'Please fill in name, email, and phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.venues.createEventBooking({
        venueId: selectedVenue?.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        eventType,
        eventDate: new Date(`${date}T18:00:00`).toISOString(),
        guests: parseInt(guests, 10) || (selectedVenue?.capacity ?? 50),
        message: message.trim() || undefined,
      });

      Alert.alert(
        'Enquiry Received!',
        `Thank you ${name.trim()}! Our Biratnagar events coordinator will contact you at ${phone.trim()} to discuss details and arrangements for ${selectedVenue?.name}.`
      );
      setShowInquiryModal(false);
      setMessage('');
    } catch (e: any) {
      Alert.alert(t.common.error, e.message || 'Could not send enquiry. Please call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header showBack onBack={handleBack} />
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Header */}
        <View style={styles.headerTitleContainer}>
          <Typography variant="goldHeading">{t.venues.title}</Typography>
          <Typography variant="body" color={colors.textMuted} style={styles.subtitle}>
            Explore our four dedicated event spaces on Airport Road, Biratnagar.
          </Typography>
        </View>

        {/* Quick Comparison Selector */}
        <View style={styles.comparisonContainer}>
          <Text style={styles.comparisonHeader}>Quick Space Comparison</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {venues.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={styles.chipButton}
                onPress={() => handleScrollToVenue(v.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={v.capacity ? 'business-outline' : 'leaf-outline'}
                  size={14}
                  color={colors.gold}
                  style={{ marginRight: 5 }}
                />
                <Text style={styles.chipText}>
                  {v.name} {v.capacity ? `(${v.capacity})` : '(Outdoor)'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Venue Cards */}
        {venues.map((venue) => {
          const mainImage = venue.images?.[0] || venue.image;
          const thumbnails = venue.images && venue.images.length > 1 ? venue.images.slice(0, 4) : [];

          return (
            <View
              key={venue.id}
              onLayout={(e) => {
                venueLayouts.current[venue.id] = e.nativeEvent.layout.y;
              }}
            >
              <Card variant="elevated" style={styles.venueCard}>
                {mainImage ? (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: mainImage }} style={styles.venueImage} resizeMode="cover" />
                    <View style={styles.imageBadge}>
                      <Badge
                        label={venue.capacity ? `Up to ${venue.capacity} guests` : 'Flexible layout'}
                        variant={venue.capacity ? 'gold' : 'purple'}
                        icon={<Ionicons name="people-outline" size={12} color={colors.gold} />}
                      />
                    </View>
                  </View>
                ) : null}

                {/* Thumbnails Row */}
                {thumbnails.length > 1 ? (
                  <View style={styles.thumbnailRow}>
                    {thumbnails.map((thumbUri, idx) => (
                      <View key={idx} style={styles.thumbnailWrapper}>
                        <Image source={{ uri: thumbUri }} style={styles.thumbnailImage} resizeMode="cover" />
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.venueBody}>
                  <View style={styles.titleRow}>
                    <Typography variant="h2" style={styles.venueName}>
                      {venue.name}
                    </Typography>
                    <Badge
                      label={venue.capacity ? `${venue.capacity} Guests` : 'Outdoor space'}
                      variant={venue.capacity ? 'gold' : 'outline'}
                    />
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

                  {/* Highlights / Features */}
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
                    title={`Enquire / Book ${venue.name}`}
                    variant="gold"
                    onPress={() => handleSelectVenue(venue)}
                    style={styles.enquireButton}
                  />
                </View>
              </Card>
            </View>
          );
        })}

        {/* Modal / Inline Booking Form */}
        {showInquiryModal ? (
          <Card variant="goldAccent" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Typography variant="h3" color={colors.goldText}>
                  Enquire: {selectedVenue?.name}
                </Typography>
                <Text style={styles.modalSubtitle}>
                  {selectedVenue?.capacity ? `Capacity: up to ${selectedVenue.capacity} guests` : 'Open garden layout on enquiry'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowInquiryModal(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
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
              autoCapitalize="none"
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
                label="Estimated Guests"
                value={guests}
                onChangeText={setGuests}
                placeholder="e.g. 100"
                keyboardType="numeric"
                containerStyle={styles.halfInput}
              />
            </View>

            <Input
              label="Event Type"
              value={eventType}
              onChangeText={setEventType}
              placeholder="e.g. Wedding, Seminar, Birthday, Music Night"
            />

            <Input
              label="Special Notes or Catering Preferences"
              value={message}
              onChangeText={setMessage}
              placeholder="Tell us about your timing, food preferences or staging requirements..."
              multiline
              numberOfLines={3}
              style={{ height: 68, textAlignVertical: 'top' }}
            />

            <Button
              title="Submit Event Enquiry"
              variant="gold"
              loading={isSubmitting}
              onPress={handleInquirySubmit}
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        ) : null}

        {/* Footer Navigation */}
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
            <Text style={{ color: colors.goldText, fontWeight: '700', fontSize: 14 }}>
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
      marginBottom: spacing.sm,
    },
    subtitle: {
      marginTop: spacing.xs,
      lineHeight: 20,
    },
    comparisonContainer: {
      marginBottom: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    comparisonHeader: {
      color: colors.goldText,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 6,
      marginLeft: 4,
    },
    chipsRow: {
      gap: spacing.xs,
      paddingRight: spacing.sm,
    },
    chipButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceBorder,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: borderRadius.full,
    },
    chipText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600',
    },
    venueCard: {
      marginBottom: spacing.lg,
      overflow: 'hidden',
      padding: 0,
    },
    imageContainer: {
      position: 'relative',
      width: '100%',
      height: 200,
      backgroundColor: '#1a1025',
    },
    venueImage: {
      width: '100%',
      height: '100%',
    },
    imageBadge: {
      position: 'absolute',
      top: 10,
      left: 10,
    },
    thumbnailRow: {
      flexDirection: 'row',
      gap: 6,
      padding: 8,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
    },
    thumbnailWrapper: {
      flex: 1,
      aspectRatio: 4 / 3,
      borderRadius: borderRadius.sm,
      overflow: 'hidden',
      backgroundColor: '#110c1c',
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
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
      fontSize: 20,
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
      paddingVertical: 5,
      borderRadius: borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    featureText: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    enquireButton: {
      width: '100%',
    },
    modalCard: {
      marginTop: spacing.md,
      marginBottom: spacing.lg,
      padding: spacing.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    modalSubtitle: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    halfInput: {
      flex: 1,
    },
  });
