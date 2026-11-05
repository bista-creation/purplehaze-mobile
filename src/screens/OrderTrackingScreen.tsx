import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { api as apiClient } from '../services/api-client';
import { mobileRealtime } from '../services/realtime';
import { STATUS_META, type OrderStatus } from '../shared/constants';
import type { OrderDto } from '../shared/types';
import { useTheme } from '../stores/theme-store';
import { ColorTheme, spacing, borderRadius } from '../theme';

interface OrderTrackingScreenProps {
  route: {
    params: {
      orderId: string;
      orderNumber?: string;
      phone?: string;
      token?: string;
    };
  };
  navigation: any;
}

const STATUS_STEPS: { key: OrderStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'PENDING', label: 'Order Placed', icon: 'receipt-outline' },
  { key: 'CONFIRMED', label: 'Confirmed', icon: 'checkmark-circle-outline' },
  { key: 'PREPARING', label: 'Cooking in Kitchen', icon: 'restaurant-outline' },
  { key: 'READY', label: 'Packed & Ready', icon: 'cube-outline' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: 'bicycle-outline' },
  { key: 'COMPLETED', label: 'Delivered', icon: 'home-outline' },
];

const STEP_INDEX: Record<OrderStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  READY: 3,
  OUT_FOR_DELIVERY: 4,
  COMPLETED: 5,
  CANCELLED: -1,
};

function formatRs(paisa: number): string {
  return `Rs. ${Math.round(paisa / 100).toLocaleString()}`;
}

function hasValidCoordinates(loc?: { latitude: number; longitude: number } | null): boolean {
  return Boolean(
    loc &&
    typeof loc.latitude === 'number' &&
    typeof loc.longitude === 'number' &&
    !isNaN(loc.latitude) &&
    !isNaN(loc.longitude) &&
    (loc.latitude !== 0 || loc.longitude !== 0)
  );
}

export default function OrderTrackingScreen({ route, navigation }: OrderTrackingScreenProps) {
  const { orderId, orderNumber, phone, token } = route.params || {};
  const { colors } = useTheme();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [riderLocation, setRiderLocation] = useState<{
    latitude: number;
    longitude: number;
    speed?: number | null;
    updatedAt?: string;
  } | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const fetchOrder = useCallback(async () => {
    try {
      let endpoint = `/orders/${orderId}`;
      if (token) {
        endpoint = `/orders/${orderId}?token=${encodeURIComponent(token)}`;
      } else if (orderNumber && phone) {
        endpoint = `/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`;
      }

      const headers: Record<string, string> = token ? { 'x-order-token': token } : {};

      const data = await api.get<OrderDto>(endpoint, headers);
      if (data) {
        setOrder(data);
        setError(null);
        setLastUpdated(new Date());
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId, orderNumber, phone, token]);

  const fetchRiderLocation = useCallback(async () => {
    if (!orderId) return;
    try {
      const endpoint = token
        ? `/orders/${orderId}/location?token=${encodeURIComponent(token)}`
        : `/orders/${orderId}/location`;
      const headers: Record<string, string> = token ? { 'x-order-token': token } : {};
      const res = await api.get<{
        active: boolean;
        location?: {
          latitude: number;
          longitude: number;
          speed?: number | null;
          updatedAt?: string;
        } | null;
      }>(endpoint, headers);

      if (res?.active && res.location && hasValidCoordinates(res.location)) {
        setRiderLocation(res.location);
      } else if (!res?.active || res?.location === null) {
        setRiderLocation(null);
      }
    } catch {
      // silent fallback
    }
  }, [orderId, token]);

  useEffect(() => {
    void (async () => {
      await fetchOrder();
      await fetchRiderLocation();
    })();

    let unsubscribe = () => {};
    const targetId = order?.id || orderId;

    if (targetId) {
      mobileRealtime
        .subscribeToOrder(
          targetId,
          (payload) => {
            setOrder((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                status: (payload.status as any) || prev.status,
                paymentStatus: ((payload as any).paymentStatus as any) || prev.paymentStatus,
              };
            });
            setLastUpdated(new Date());
            fetchRiderLocation();
          },
          (liveLoc) => {
            if (hasValidCoordinates(liveLoc)) {
              setRiderLocation({
                latitude: liveLoc.latitude,
                longitude: liveLoc.longitude,
                speed: liveLoc.speed,
                updatedAt: liveLoc.updatedAt,
              });
              setLastUpdated(new Date());
            }
          }
        )
        .then((unsub) => {
          unsubscribe = unsub;
        })
        .catch(() => {});
    }

    // 5-second polling fallback
    pollTimerRef.current = setInterval(() => {
      fetchOrder();
      fetchRiderLocation();
    }, 5000);

    return () => {
      unsubscribe();
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [fetchOrder, fetchRiderLocation, orderId, order?.id]);

  const gpsStatus = useMemo(() => {
    const valid = hasValidCoordinates(riderLocation);
    if (!valid) {
      return {
        state: 'waiting' as const,
        badgeText: 'AWAITING GPS SIGNAL',
        badgeColor: '#64748b',
        subtitle: 'Rider is en route. Waiting for live GPS broadcast...',
        canOpenMap: false,
      };
    }

    if (!riderLocation?.updatedAt) {
      return {
        state: 'live' as const,
        badgeText: 'LIVE GPS',
        badgeColor: '#10b981',
        subtitle: riderLocation?.speed
          ? `Moving at ${(riderLocation.speed * 3.6).toFixed(0)} km/h`
          : 'Live coordinate acquired',
        canOpenMap: true,
      };
    }

    const elapsedSecs = Math.max(
      0,
      Math.floor((now - new Date(riderLocation.updatedAt).getTime()) / 1000)
    );

    if (elapsedSecs < 60) {
      return {
        state: 'live' as const,
        badgeText: 'LIVE GPS',
        badgeColor: '#10b981',
        subtitle: riderLocation.speed
          ? `Moving at ${(riderLocation.speed * 3.6).toFixed(0)} km/h · ${elapsedSecs < 5 ? 'Just now' : `${elapsedSecs}s ago`}`
          : `Updated ${elapsedSecs < 5 ? 'just now' : `${elapsedSecs}s ago`}`,
        canOpenMap: true,
      };
    }

    if (elapsedSecs < 300) {
      const mins = Math.floor(elapsedSecs / 60);
      return {
        state: 'stale' as const,
        badgeText: 'SIGNAL PAUSED',
        badgeColor: '#f59e0b',
        subtitle: `Last signal received ${mins}m ago. Reconnecting...`,
        canOpenMap: true,
      };
    }

    const mins = Math.floor(elapsedSecs / 60);
    return {
      state: 'waiting' as const,
      badgeText: 'GPS UNAVAILABLE',
      badgeColor: '#64748b',
      subtitle: `Signal lost ${mins}m ago. Rider en route to your address.`,
      canOpenMap: false,
    };
  }, [riderLocation, now]);

  const handleCallRestaurant = () => {
    Linking.openURL('tel:+9779852022202').catch(() => {
      Alert.alert('Notice', 'Unable to initiate call.');
    });
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(`Hi Purple Haze, checking status of order #${order?.orderNumber || orderId}`);
    Linking.openURL(`whatsapp://send?phone=9779852022202&text=${text}`).catch(() => {
      Alert.alert('WhatsApp', 'WhatsApp is not installed on this device.');
    });
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.orders.cancel(order?.id || orderId, 'Customer requested cancellation via mobile app');
              setOrder((prev) => (prev ? { ...prev, status: 'CANCELLED' } : prev));
              Alert.alert('Order Cancelled', 'Your order has been cancelled.');
            } catch (err: any) {
              Alert.alert('Unable to Cancel', err?.message || 'Order could not be cancelled.');
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('MainTabs', { screen: 'Orders' });
    }
  };

  if (loading && !order) {
    return (
      <View style={styles.loadingContainer}>
        <TouchableOpacity onPress={handleBack} style={styles.stateBackBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>Connecting to live tracker...</Text>
      </View>
    );
  }

  if (error && !order) {
    return (
      <View style={styles.errorContainer}>
        <TouchableOpacity onPress={handleBack} style={styles.stateBackBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Order Not Found</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchOrder}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.retryBtn,
            {
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: colors.gold,
              marginTop: spacing.sm,
            },
          ]}
          onPress={() => navigation?.navigate?.('MainTabs', { screen: 'Orders' })}
        >
          <Text style={{ color: colors.gold, fontWeight: '700' }}>View All Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStatus = order?.status || 'PENDING';
  const isCancelled = currentStatus === 'CANCELLED';
  const currentStep = STEP_INDEX[currentStatus] ?? 0;
  const meta = STATUS_META[currentStatus] || { label: currentStatus, color: '#a855f7' };

  return (
    <View style={styles.screenWrapper}>
      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.navBackBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Live Order Tracker</Text>
        <TouchableOpacity
          onPress={() => navigation?.navigate?.('MainTabs', { screen: 'Home' })}
          style={styles.navHomeBtn}
          accessibilityRole="button"
          accessibilityLabel="Go to Home"
        >
          <Ionicons name="home-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.orderNumber}>#{order?.orderNumber}</Text>
              <Text style={styles.orderType}>
                {order?.type === 'DELIVERY' ? 'Home Delivery' : 'Pickup / Takeaway'}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                { backgroundColor: `${meta.color}25`, borderColor: meta.color },
              ]}
            >
              <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>

          <Text style={styles.updatedAt}>
            Realtime active · Last synced {lastUpdated.toLocaleTimeString()}
          </Text>
        </View>

        {/* Progress Timeline */}
        {isCancelled ? (
          <View style={[styles.card, styles.cancelledCard]}>
            <Ionicons name="close-circle-outline" size={40} color="#ef4444" />
            <Text style={styles.cancelledTitle}>Order Cancelled</Text>
            <Text style={styles.cancelledText}>
              This order was cancelled. If you made an online payment, your refund will be handled promptly.
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Status Timeline</Text>
            <View style={styles.timeline}>
              {STATUS_STEPS.map((step, idx) => {
                const isPast = idx < currentStep;
                const isCurrent = idx === currentStep;
                const isUpcoming = idx > currentStep;

                return (
                  <View key={step.key} style={styles.timelineStep}>
                    <View style={styles.iconColumn}>
                      <View
                        style={[
                          styles.stepCircle,
                          isPast && styles.stepCirclePast,
                          isCurrent && styles.stepCircleCurrent,
                          isUpcoming && styles.stepCircleUpcoming,
                        ]}
                      >
                        <Ionicons
                          name={step.icon}
                          size={17}
                          color={isPast || isCurrent ? '#fff' : '#64748b'}
                        />
                      </View>
                      {idx < STATUS_STEPS.length - 1 && (
                        <View
                          style={[
                            styles.timelineLine,
                            idx < currentStep ? styles.timelineLineActive : styles.timelineLineInactive,
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.stepContent}>
                      <Text
                        style={[
                          styles.stepLabel,
                          isCurrent && styles.stepLabelCurrent,
                          isUpcoming && styles.stepLabelUpcoming,
                        ]}
                      >
                        {step.label}
                      </Text>
                      {isCurrent && (
                        <Text style={styles.stepSublabel}>
                          {STATUS_META[step.key]?.description || 'In progress...'}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Live Rider Location & Tracking */}
        {(order?.status === 'OUT_FOR_DELIVERY' || riderLocation) && (
          <View style={[styles.card, styles.riderCard]}>
            <View style={styles.riderHeader}>
              <View style={styles.riderIconCircle}>
                <Ionicons name="bicycle" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.riderTitle}>Rider En Route</Text>
                <Text style={styles.riderSubtitle}>{gpsStatus.subtitle}</Text>
              </View>
              <View
                style={[
                  styles.livePulseBadge,
                  {
                    backgroundColor: `${gpsStatus.badgeColor}20`,
                    borderColor: gpsStatus.badgeColor,
                  },
                ]}
              >
                {gpsStatus.state === 'live' && (
                  <View style={[styles.pulseDot, { backgroundColor: gpsStatus.badgeColor }]} />
                )}
                <Text style={[styles.livePulseText, { color: gpsStatus.badgeColor }]}>
                  {gpsStatus.badgeText}
                </Text>
              </View>
            </View>

            {/* Delivery OTP for secure handoff */}
            {Boolean((order as any)?.deliveryOtp) && (
              <View style={styles.otpBox}>
                <Text style={styles.otpLabel}>Delivery Verification Code</Text>
                <Text style={styles.otpValue}>{(order as any).deliveryOtp}</Text>
                <Text style={styles.otpHint}>Share this 6-digit code with your rider upon arrival</Text>
              </View>
            )}

            {/* Google Maps link: only when valid coordinates exist */}
            {gpsStatus.canOpenMap && riderLocation ? (
              <TouchableOpacity
                style={styles.openMapBtn}
                onPress={() => {
                  const url = `https://www.google.com/maps/search/?api=1&query=${riderLocation.latitude},${riderLocation.longitude}`;
                  Linking.openURL(url);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="navigate-circle" size={18} color="#FFFFFF" />
                <Text style={styles.openMapText}>Track Rider Location on Google Maps</Text>
                <Ionicons name="open-outline" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <View style={styles.awaitingGpsBox}>
                <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                <Text style={styles.awaitingGpsText}>
                  Live map navigation activates automatically once rider coordinates are received.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Customer and Delivery Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recipient & Delivery</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recipient:</Text>
            <Text style={styles.detailValue}>{order?.customerName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>{order?.customerPhone}</Text>
          </View>
          {order?.deliveryAddress && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>
                {order.deliveryAddress}
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method:</Text>
            <Text style={styles.detailValue}>{order?.paymentMethod}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Status:</Text>
            <Text
              style={[
                styles.detailValue,
                { color: order?.paymentStatus === 'PAID' ? '#10b981' : '#f59e0b' },
              ]}
            >
              {order?.paymentStatus}
            </Text>
          </View>
        </View>

        {/* Items Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items in Order</Text>
          {order?.items?.map((item) => (
            <View key={item.id} style={styles.orderItemRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.itemName}>
                  {item.quantity}x {item.name}
                </Text>
                {item.variantName && (
                  <Text style={styles.itemVariant}>Variant: {item.variantName}</Text>
                )}
                {item.instructions && (
                  <Text style={styles.itemNotes}>Note: {item.instructions}</Text>
                )}
              </View>
              <Text style={styles.itemPrice}>{formatRs(item.lineTotal)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>{formatRs(order?.total || 0)}</Text>
          </View>
        </View>

        {/* Contact Restaurant Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.callBtn} onPress={handleCallRestaurant}>
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Call Restaurant</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.whatsAppBtn} onPress={handleOpenWhatsApp}>
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>WhatsApp Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Customer Cancellation Option */}
        {currentStatus === 'PENDING' && (
          <TouchableOpacity style={styles.cancelOrderBtn} onPress={handleCancelOrder}>
            <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
            <Text style={styles.cancelOrderText}>Cancel Order</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ColorTheme) {
  return StyleSheet.create({
    screenWrapper: {
      flex: 1,
      backgroundColor: colors.background,
    },
    navBar: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
      backgroundColor: colors.surface,
    },
    navBackBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.md,
    },
    navTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    navHomeBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.md,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.md,
      paddingBottom: 40,
      gap: spacing.md,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      padding: spacing.xl,
    },
    stateBackBtn: {
      position: 'absolute',
      top: 48,
      left: spacing.md,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    loadingText: {
      marginTop: spacing.md,
      color: colors.textSecondary,
      fontSize: 14,
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      padding: spacing.xl,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginTop: spacing.md,
    },
    errorText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
    },
    retryBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.md,
    },
    retryBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 14,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    orderNumber: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    orderType: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
      borderWidth: 1,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '700',
    },
    updatedAt: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: spacing.sm,
    },
    cancelledCard: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      borderColor: '#ef444450',
    },
    cancelledTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#ef4444',
      marginTop: spacing.sm,
    },
    cancelledText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.md,
    },
    timeline: {
      paddingLeft: 4,
    },
    timelineStep: {
      flexDirection: 'row',
      minHeight: 52,
    },
    iconColumn: {
      alignItems: 'center',
      width: 32,
    },
    stepCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
    },
    stepCirclePast: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    stepCircleCurrent: {
      backgroundColor: colors.gold,
      borderColor: colors.gold,
    },
    stepCircleUpcoming: {
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
    },
    timelineLine: {
      width: 2,
      flex: 1,
      marginVertical: 4,
    },
    timelineLineActive: {
      backgroundColor: colors.primary,
    },
    timelineLineInactive: {
      backgroundColor: colors.surfaceBorder,
    },
    stepContent: {
      flex: 1,
      marginLeft: spacing.md,
      paddingTop: 4,
    },
    stepLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    stepLabelCurrent: {
      color: colors.gold,
      fontWeight: '700',
    },
    stepLabelUpcoming: {
      color: colors.textMuted,
    },
    stepSublabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    riderCard: {
      borderColor: colors.purple,
      backgroundColor: `${colors.purple}10`,
    },
    riderHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: spacing.md,
    },
    riderIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.purple,
      alignItems: 'center',
      justifyContent: 'center',
    },
    riderTitle: {
      fontSize: 15,
      fontWeight: 'bold',
      color: colors.text,
    },
    riderSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    livePulseBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
      borderWidth: 1,
    },
    pulseDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    livePulseText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    otpBox: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      alignItems: 'center',
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    otpLabel: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
      marginBottom: 4,
    },
    otpValue: {
      fontSize: 26,
      fontWeight: '900',
      color: colors.gold,
      letterSpacing: 4,
    },
    otpHint: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 4,
    },
    openMapBtn: {
      backgroundColor: colors.purple,
      borderRadius: borderRadius.md,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: colors.gold,
    },
    openMapText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 13,
    },
    awaitingGpsBox: {
      backgroundColor: `${colors.textMuted}12`,
      borderRadius: borderRadius.md,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: `${colors.textMuted}25`,
    },
    awaitingGpsText: {
      color: colors.textMuted,
      fontSize: 12,
      flex: 1,
      lineHeight: 16,
    },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    detailLabel: { color: colors.textMuted, fontSize: 13 },
    detailValue: { color: colors.text, fontSize: 13, fontWeight: '600' },
    orderItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    itemName: { color: colors.text, fontSize: 14, fontWeight: '600' },
    itemVariant: { color: colors.gold, fontSize: 12, marginTop: 2 },
    itemNotes: { color: colors.textMuted, fontSize: 11, fontStyle: 'italic', marginTop: 2 },
    itemPrice: { color: colors.text, fontSize: 14, fontWeight: '700' },
    divider: { height: 1, backgroundColor: colors.surfaceBorder, marginVertical: 12 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
    totalValue: { fontSize: 18, fontWeight: 'bold', color: colors.gold },
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    callBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.info,
      paddingVertical: 14,
      borderRadius: borderRadius.md,
      gap: 8,
    },
    whatsAppBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.success,
      paddingVertical: 14,
      borderRadius: borderRadius.md,
      gap: 8,
    },
    actionBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 13,
    },
    cancelOrderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: '#ef444450',
      gap: 6,
      marginTop: spacing.sm,
    },
    cancelOrderText: {
      color: '#ef4444',
      fontSize: 13,
      fontWeight: '600',
    },
  });
}
