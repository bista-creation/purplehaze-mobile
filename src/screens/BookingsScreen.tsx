import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Header, Card, Typography, Badge, Button } from '../components/ui';
import { useAuthStore } from '../stores/auth-store';
import { useTheme } from '../stores/theme-store';
import { useI18n } from '../i18n';
import { ColorTheme, spacing, borderRadius } from '../theme';
import { api } from '../services/api-client';

interface BookingsScreenProps {
  navigation: any;
}

export const BookingsScreen: React.FC<BookingsScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const { t, isNepali } = useI18n();
  const { isAuthenticated } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'tables' | 'events'>('tables');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const {
    data: tableReservations = [],
    isLoading: isLoadingTables,
    refetch: refetchTables,
  } = useQuery({
    queryKey: ['user-reservations', isAuthenticated],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const res = await api.reservations.getAll();
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60_000,
  });

  const {
    data: eventBookings = [],
    isLoading: isLoadingEvents,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ['user-event-bookings', isAuthenticated],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const res = await api.venues.getEventBookings();
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60_000,
  });

  const isLoading = isLoadingTables || isLoadingEvents;

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.allSettled([refetchTables(), refetchEvents()]);
    setIsRefreshing(false);
  };

  const handleCall = (phone = '+9779851150987') => {
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  const renderStatusBadge = (status: string) => {
    const s = (status || 'PENDING').toUpperCase();
    let badgeVariant: 'warning' | 'purple' | 'success' | 'error' = 'warning';
    let label = isNepali ? 'प्रतीक्षारत' : 'Pending Confirmation';

    if (s === 'CONFIRMED') {
      badgeVariant = 'purple';
      label = isNepali ? 'पुष्टि भयो' : 'Confirmed';
    } else if (s === 'COMPLETED') {
      badgeVariant = 'success';
      label = isNepali ? 'सम्पन्न' : 'Completed';
    } else if (s === 'CANCELLED') {
      badgeVariant = 'error';
      label = isNepali ? 'रद्द गरियो' : 'Cancelled';
    }

    return (
      <Badge variant={badgeVariant} label={label} />
    );
  };

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.purple}
            colors={[colors.purple, colors.gold]}
          />
        }
      >
        {/* Title & Tagline */}
        <View style={styles.titleSection}>
          <Typography variant="goldHeading">
            {isNepali ? 'तपाईंको बुकिङहरू' : 'Bookings & Experiences'}
          </Typography>
          <Typography variant="body" color={colors.textMuted} style={styles.subtitle}>
            {isNepali
              ? 'बगैंचा र क्याबिन टेबलहरू तथा पार्टी ब्याङ्क्वेट व्यवस्थापन'
              : 'Private Cabins, Lush Garden Tables & Grand Banquet Enquiries'}
          </Typography>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'tables' && styles.tabButtonActive]}
            onPress={() => setActiveTab('tables')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === 'tables' ? 'restaurant' : 'restaurant-outline'}
              size={18}
              color={activeTab === 'tables' ? '#FFFFFF' : colors.textMuted}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'tables' && styles.tabButtonTextActive]}
            >
              {isNepali ? 'टेबल आरक्षण' : 'Table Reservations'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'events' && styles.tabButtonActive]}
            onPress={() => setActiveTab('events')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === 'events' ? 'sparkles' : 'sparkles-outline'}
              size={18}
              color={activeTab === 'events' ? '#FFFFFF' : colors.textMuted}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'events' && styles.tabButtonTextActive]}
            >
              {isNepali ? 'पार्टी र ब्याङ्क्वेट' : 'Banquets & Events'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action CTA Card */}
        {activeTab === 'tables' ? (
          <Card variant="goldAccent" style={styles.ctaCard}>
            <View style={styles.ctaHeaderRow}>
              <View style={styles.ctaIconContainer}>
                <Ionicons name="calendar" size={24} color={colors.gold} />
              </View>
              <View style={styles.ctaTextContainer}>
                <Typography variant="h3" style={{ color: colors.text }}>
                  {isNepali ? 'नयाँ टेबल बुक गर्नुहोस्' : 'Reserve a Table'}
                </Typography>
                <Typography variant="caption" color={colors.textMuted}>
                  {isNepali
                    ? 'शान्त बगैंचा वा निजी पारिवारिक क्याबिन रोज्नुहोस्'
                    : 'Lush Garden or Private Cabins · Open 9 AM – 10 PM daily'}
                </Typography>
              </View>
            </View>

            <Button
              title={isNepali ? 'टेबल आरक्षण गर्नुहोस्' : 'Book Garden or Cabin Table'}
              variant="gold"
              size="md"
              icon={<Ionicons name="add-circle-outline" size={18} color="#000" />}
              onPress={() => navigation.navigate('Reservations')}
              style={styles.ctaButton}
            />
          </Card>
        ) : (
          <Card variant="goldAccent" style={styles.ctaCard}>
            <View style={styles.ctaHeaderRow}>
              <View style={styles.ctaIconContainer}>
                <Ionicons name="sparkles" size={24} color={colors.gold} />
              </View>
              <View style={styles.ctaTextContainer}>
                <Typography variant="h3" style={{ color: colors.text }}>
                  {isNepali ? 'विशेष उत्सव योजना बनाउनुहोस्' : 'Plan a Banquet or Event'}
                </Typography>
                <Typography variant="caption" color={colors.textMuted}>
                  {isNepali
                    ? 'विवाह, रिसेप्सन वा सेमिनारका लागि ३००+ क्षमताको स्थान'
                    : 'Weddings, Corporate Seminars, Birthdays · Up to 300+ guests'}
                </Typography>
              </View>
            </View>

            <Button
              title={isNepali ? 'स्थानहरू र प्याकेज हेर्नुहोस्' : 'Explore Venues & Banquet Packages'}
              variant="gold"
              size="md"
              icon={<Ionicons name="business-outline" size={18} color="#000" />}
              onPress={() => navigation.navigate('Venues')}
              style={styles.ctaButton}
            />
          </Card>
        )}

        {/* Content Section */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.purple} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              {isNepali ? 'बुकिङ विवरण लोड हुँदैछ...' : 'Loading your bookings...'}
            </Text>
          </View>
        ) : !isAuthenticated ? (
          <Card variant="surface" style={styles.guestCard}>
            <Ionicons name="lock-closed-outline" size={38} color={colors.gold} />
            <Typography variant="h3" align="center" style={{ marginTop: spacing.sm, color: colors.text }}>
              {isNepali ? 'आफ्नो बुकिङ हेर्न साइन इन गर्नुहोस्' : 'Sign In to View Synced Bookings'}
            </Typography>
            <Typography
              variant="bodySmall"
              align="center"
              color={colors.textMuted}
              style={{ marginTop: spacing.xs, marginBottom: spacing.md }}
            >
              {isNepali
                ? 'तपाईंले अनलाइन पेश गर्नुभएका सबै आरक्षणहरू खातामा सुरक्षित हुन्छन्।'
                : 'Sign in with your email or phone to track live reservation confirmations.'}
            </Typography>
            <Button
              title={isNepali ? 'साइन इन गर्नुहोस्' : 'Sign In / Register'}
              variant="outline"
              size="md"
              icon={<Ionicons name="log-in-outline" size={18} color={colors.gold} />}
              onPress={() => navigation.navigate('LoginModal', { returnTo: 'Bookings' })}
            />
          </Card>
        ) : activeTab === 'tables' ? (
          tableReservations.length === 0 ? (
            <Card variant="surface" style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
              <Typography variant="h3" align="center" style={{ marginTop: spacing.sm, color: colors.text }}>
                {isNepali ? 'कुनै टेबल आरक्षण फेला परेन' : 'No Table Reservations Yet'}
              </Typography>
              <Typography
                variant="bodySmall"
                align="center"
                color={colors.textMuted}
                style={{ marginTop: spacing.xs, marginBottom: spacing.md }}
              >
                {isNepali
                  ? 'तपाईंले अनुरोध गर्नुभएको नयाँ टेबल आरक्षणहरू यहाँ देखिनेछन्।'
                  : 'Your upcoming and past dining reservations will appear here.'}
              </Typography>
              <Button
                title={isNepali ? 'अहिले टेबल बुक गर्नुहोस्' : 'Book a Table Now'}
                variant="gold"
                size="sm"
                onPress={() => navigation.navigate('Reservations')}
              />
            </Card>
          ) : (
            <View style={styles.listContainer}>
              <Typography variant="title" style={styles.sectionHeader}>
                {isNepali ? 'तपाईंको टेबल आरक्षण सूची' : 'Your Reserved Tables'}
              </Typography>

              {tableReservations.map((item, index) => (
                <Card key={item.id || index} variant="elevated" style={styles.bookingItemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.dateBadge}>
                      <Ionicons name="calendar-outline" size={16} color={colors.gold} />
                      <Text style={[styles.dateText, { color: colors.text }]}>
                        {item.date ? new Date(item.date).toLocaleDateString() : 'Upcoming'}
                      </Text>
                      {item.time ? (
                        <Text style={[styles.timeText, { color: colors.gold }]}>
                          · {item.time}
                        </Text>
                      ) : null}
                    </View>
                    {renderStatusBadge(item.status)}
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailRow}>
                      <Ionicons name="people-outline" size={16} color={colors.textMuted} />
                      <Text style={[styles.detailText, { color: colors.text }]}>
                        {item.guests} {t.venues.guestsCount}
                      </Text>
                    </View>

                    {item.occasion ? (
                      <View style={styles.detailRow}>
                        <Ionicons name="gift-outline" size={16} color={colors.textMuted} />
                        <Text style={[styles.detailText, { color: colors.text }]}>
                          {item.occasion}
                        </Text>
                      </View>
                    ) : null}

                    {item.notes ? (
                      <View style={styles.detailRow}>
                        <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
                        <Text style={[styles.detailText, { color: colors.textMuted }]} numberOfLines={2}>
                          {item.notes}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.actionContactBtn}
                      onPress={() => handleCall('+9779851150987')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call-outline" size={14} color={colors.gold} />
                      <Text style={[styles.actionContactText, { color: colors.gold }]}>
                        {isNepali ? 'रेस्टुरेन्टमा फोन गर्नुहोस्' : 'Call Restaurant'}
                      </Text>
                    </TouchableOpacity>

                    <Text style={[styles.refText, { color: colors.textMuted }]}>
                      #{item.id ? item.id.slice(-6).toUpperCase() : 'RES'}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          )
        ) : (
          eventBookings.length === 0 ? (
            <Card variant="surface" style={styles.emptyCard}>
              <Ionicons name="sparkles-outline" size={48} color={colors.textMuted} />
              <Typography variant="h3" align="center" style={{ marginTop: spacing.sm, color: colors.text }}>
                {isNepali ? 'कुनै ब्याङ्क्वेट सोधपुछ फेला परेन' : 'No Banquet Enquiries Yet'}
              </Typography>
              <Typography
                variant="bodySmall"
                align="center"
                color={colors.textMuted}
                style={{ marginTop: spacing.xs, marginBottom: spacing.md }}
              >
                {isNepali
                  ? 'तपाईंले योजना बनाउनुभएका विशेष कार्यक्रमहरू यहाँ देखिनेछन्।'
                  : 'Inquire about our lawn, halls, and catering packages for private celebrations.'}
              </Typography>
              <Button
                title={isNepali ? 'कार्यक्रम सोधपुछ पेश गर्नुहोस्' : 'Inquire for an Event'}
                variant="gold"
                size="sm"
                onPress={() => navigation.navigate('Venues')}
              />
            </Card>
          ) : (
            <View style={styles.listContainer}>
              <Typography variant="title" style={styles.sectionHeader}>
                {isNepali ? 'तपाईंको ब्याङ्क्वेट तथा कार्यक्रमहरू' : 'Your Banquet Enquiries'}
              </Typography>

              {eventBookings.map((ev, index) => (
                <Card key={ev.id || index} variant="elevated" style={styles.bookingItemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.dateBadge}>
                      <Ionicons name="sparkles" size={16} color={colors.gold} />
                      <Text style={[styles.dateText, { color: colors.text }]}>
                        {ev.eventType || 'Special Event'}
                      </Text>
                    </View>
                    {renderStatusBadge(ev.status)}
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                      <Text style={[styles.detailText, { color: colors.text }]}>
                        {ev.eventDate ? new Date(ev.eventDate).toLocaleDateString() : 'TBD'}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="people-outline" size={16} color={colors.textMuted} />
                      <Text style={[styles.detailText, { color: colors.text }]}>
                        {ev.guests} {t.venues.guestsCount}
                      </Text>
                    </View>

                    {ev.message ? (
                      <View style={styles.detailRow}>
                        <Ionicons name="document-text-outline" size={16} color={colors.textMuted} />
                        <Text style={[styles.detailText, { color: colors.textMuted }]} numberOfLines={2}>
                          {ev.message}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.actionContactBtn}
                      onPress={() => handleCall('+9779851150987')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call-outline" size={14} color={colors.gold} />
                      <Text style={[styles.actionContactText, { color: colors.gold }]}>
                        {isNepali ? 'इभेन्ट म्यानेजरलाई फोन' : 'Call Event Manager'}
                      </Text>
                    </TouchableOpacity>

                    <Text style={[styles.refText, { color: colors.textMuted }]}>
                      #{ev.id ? ev.id.slice(-6).toUpperCase() : 'EV'}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          )
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
    titleSection: {
      marginBottom: spacing.md,
    },
    subtitle: {
      marginTop: spacing.xs,
      lineHeight: 20,
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: 4,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: borderRadius.sm,
      gap: 6,
    },
    tabButtonActive: {
      backgroundColor: colors.purple,
    },
    tabButtonText: {
      fontSize: 13,
      fontWeight: '600',
    },
    tabButtonTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    ctaCard: {
      marginBottom: spacing.lg,
      padding: spacing.md,
    },
    ctaHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    ctaIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.gold,
    },
    ctaTextContainer: {
      flex: 1,
    },
    ctaButton: {
      marginTop: spacing.xs,
    },
    loadingContainer: {
      paddingVertical: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: spacing.sm,
      fontSize: 14,
    },
    guestCard: {
      alignItems: 'center',
      padding: spacing.xl,
      marginTop: spacing.sm,
    },
    emptyCard: {
      alignItems: 'center',
      padding: spacing.xl,
      marginTop: spacing.sm,
    },
    listContainer: {
      marginTop: spacing.xs,
    },
    sectionHeader: {
      marginBottom: spacing.sm,
    },
    bookingItemCard: {
      marginBottom: spacing.md,
      padding: spacing.md,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
      paddingBottom: spacing.xs,
    },
    dateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dateText: {
      fontSize: 14,
      fontWeight: '700',
    },
    timeText: {
      fontSize: 13,
      fontWeight: '600',
    },
    detailsGrid: {
      gap: 6,
      marginBottom: spacing.sm,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    detailText: {
      fontSize: 13,
      flex: 1,
    },
    cardActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: colors.surfaceBorder,
      paddingTop: spacing.xs,
      marginTop: spacing.xs,
    },
    actionContactBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
    },
    actionContactText: {
      fontSize: 12,
      fontWeight: '600',
    },
    refText: {
      fontSize: 11,
      fontWeight: '500',
      letterSpacing: 0.5,
    },
  });
