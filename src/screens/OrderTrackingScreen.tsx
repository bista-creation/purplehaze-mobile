import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { mobileRealtime } from '../services/realtime';
import { STATUS_META, type OrderStatus } from '../shared/constants';
import type { OrderDto } from '../shared/types';

interface OrderTrackingScreenProps {
  route: {
    params: {
      orderId: string;
      orderNumber?: string;
      phone?: string;
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

export default function OrderTrackingScreen({ route, navigation }: OrderTrackingScreenProps) {
  const { orderId, orderNumber, phone } = route.params || {};
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      let endpoint = `/orders/${orderId}`;
      if (!orderId && orderNumber && phone) {
        endpoint = `/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`;
      }

      const data = await api.get<OrderDto>(endpoint);
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
  }, [orderId, orderNumber, phone]);

  useEffect(() => {
    fetchOrder();

    let unsubscribe = () => {};
    const targetId = order?.id || orderId;

    if (targetId) {
      mobileRealtime
        .subscribeToOrder(targetId, (payload) => {
          setOrder((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: payload.status,
              paymentStatus: (payload.paymentStatus as any) || prev.paymentStatus,
            };
          });
          setLastUpdated(new Date());
        })
        .then((unsub) => {
          unsubscribe = unsub;
        })
        .catch(() => {});
    }

    // 5-second polling fallback
    pollTimerRef.current = setInterval(() => {
      fetchOrder();
    }, 5000);

    return () => {
      unsubscribe();
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [fetchOrder, orderId, order?.id]);

  const handleCallRestaurant = () => {
    Linking.openURL('tel:+9779800000000').catch(() => {
      Alert.alert('Notice', 'Unable to initiate call.');
    });
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(`Hi Purple Haze, checking status of order #${order?.orderNumber || orderId}`);
    Linking.openURL(`whatsapp://send?phone=9779800000000&text=${text}`).catch(() => {
      Alert.alert('WhatsApp', 'WhatsApp is not installed on this device.');
    });
  };

  if (loading && !order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>Connecting to live tracker...</Text>
      </View>
    );
  }

  if (error && !order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Order Not Found</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchOrder}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStatus = order?.status || 'PENDING';
  const isCancelled = currentStatus === 'CANCELLED';
  const currentStep = STEP_INDEX[currentStatus] ?? 0;
  const meta = STATUS_META[currentStatus] || { label: currentStatus, color: '#a855f7' };

  return (
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0716' },
  content: { padding: 16, paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0b0716',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0b0716',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginTop: 12 },
  errorText: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 6, marginBottom: 20 },
  retryBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  card: {
    backgroundColor: '#18122B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc' },
  orderType: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  updatedAt: { color: '#64748b', fontSize: 11, marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', marginBottom: 14 },
  timeline: { paddingLeft: 4 },
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start' },
  iconColumn: { alignItems: 'center', width: 36 },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCirclePast: { backgroundColor: '#10b981' },
  stepCircleCurrent: { backgroundColor: '#7c3aed' },
  stepCircleUpcoming: { backgroundColor: '#1e1b2e', borderWidth: 1, borderColor: '#334155' },
  timelineLine: { width: 2, height: 32 },
  timelineLineActive: { backgroundColor: '#10b981' },
  timelineLineInactive: { backgroundColor: '#334155' },
  stepContent: { flex: 1, paddingLeft: 12, paddingTop: 4, paddingBottom: 24 },
  stepLabel: { fontSize: 14, fontWeight: '600', color: '#cbd5e1' },
  stepLabelCurrent: { color: '#a855f7', fontWeight: 'bold', fontSize: 15 },
  stepLabelUpcoming: { color: '#64748b' },
  stepSublabel: { color: '#c084fc', fontSize: 11, marginTop: 2 },
  cancelledCard: { alignItems: 'center', padding: 24 },
  cancelledTitle: { color: '#ef4444', fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  cancelledText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 6 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { color: '#94a3b8', fontSize: 13 },
  detailValue: { color: '#f8fafc', fontSize: 13, fontWeight: '600' },
  orderItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  itemName: { color: '#e2e8f0', fontSize: 14, fontWeight: '500' },
  itemVariant: { color: '#a855f7', fontSize: 12, marginTop: 2 },
  itemNotes: { color: '#94a3b8', fontSize: 11, fontStyle: 'italic', marginTop: 2 },
  itemPrice: { color: '#f8fafc', fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#f8fafc' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#a855f7' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  whatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
