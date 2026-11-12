import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth-store';
import { useCartStore } from '../stores/cart-store';
import { useTheme } from '../stores/theme-store';
import { useI18n } from '../i18n';
import { Header } from '../components/ui';
import { ColorTheme, spacing, borderRadius } from '../theme';
import { STATUS_META } from '../shared/constants';
import type { OrderDto } from '../shared/types';

interface OrdersScreenProps {
  navigation: any;
}

export default function OrdersScreen({ navigation }: OrdersScreenProps) {
  const { isAuthenticated } = useAuthStore();
  const { colors } = useTheme();
  const { t, formatCurrency, isNepali } = useI18n();

  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(isAuthenticated);
  const [refreshing, setRefreshing] = useState(false);

  // Guest lookup state
  const [guestOrderNum, setGuestOrderNum] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.get<any>('/orders');
      const list = Array.isArray(data) ? data : data?.items || [];
      setOrders(list);
    } catch (err: any) {
      console.warn('Failed to load orders', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void fetchOrders();
    });

    return () => {
      active = false;
    };
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleGuestLookup = async () => {
    if (!guestOrderNum.trim() || !guestPhone.trim()) {
      Alert.alert(t.orders.requiredFields, t.orders.enterOrderAndPhone);
      return;
    }
    setGuestLoading(true);
    try {
      const data = await api.get<OrderDto>(
        `/orders/track?orderNumber=${encodeURIComponent(guestOrderNum.trim())}&phone=${encodeURIComponent(guestPhone.trim())}`
      );
      if (data?.orderNumber) {
        navigation.navigate('OrderTracking', {
          // Guest tracking intentionally returns a sanitized DTO without the database id.
          orderId: data.id || data.orderNumber,
          orderNumber: data.orderNumber,
          phone: guestPhone.trim(),
        });
      }
    } catch (err: any) {
      Alert.alert(t.common.error, err?.message || t.orders.noMatchingOrder);
    } finally {
      setGuestLoading(false);
    }
  };

  const handleReorder = (order: OrderDto) => {
    if (!order.items || order.items.length === 0) {
      Alert.alert(t.common.error, t.orders.noItemsToReorder);
      return;
    }
    const addItem = useCartStore.getState().addItem;
    for (const item of order.items) {
      addItem({
        dishId: (item as any).dishId || item.id,
        name: item.name,
        slug: (item as any).slug || 'dish',
        image: (item as any).image || null,
        basePrice: item.basePrice || Math.round(item.lineTotal / item.quantity),
        variantPriceDelta: 0,
        addOns: [],
        quantity: item.quantity,
      });
    }
    Alert.alert(t.orders.reorder, t.orders.reorderSuccess, [
      {
        text: t.navigation.cart,
        onPress: () => navigation.navigate('Cart'),
      },
      { text: t.common.close },
    ]);
  };

  const renderOrderItem = ({ item }: { item: OrderDto }) => {
    const meta = STATUS_META[item.status] || { label: item.status, color: '#a855f7' };

    return (
      <View style={styles.orderCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
            <Text style={styles.orderDate}>
              {new Date(item.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${meta.color}25`, borderColor: meta.color },
            ]}
          >
            <Text style={[styles.statusBadgeText, { color: meta.color }]}>
              {isNepali ? ({ PENDING: t.orders.pending, CONFIRMED: t.orders.confirmed, PREPARING: t.orders.preparing, READY: t.orders.ready, OUT_FOR_DELIVERY: t.orders.outForDelivery, COMPLETED: t.orders.completed, CANCELLED: t.orders.cancelled } as Record<string, string>)[item.status] || meta.label : meta.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.itemsSummary} numberOfLines={2}>
            {item.items?.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
          </Text>
          <Text style={styles.amountText}>{t.cart.total}: {formatCurrency(item.total)}</Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() =>
              navigation.navigate('OrderTracking', {
                orderId: item.id,
                orderNumber: item.orderNumber,
                phone: item.customerPhone,
                token: item.publicToken,
              })
            }
          >
            <Ionicons name="navigate-outline" size={16} color="#c084fc" />
            <Text style={styles.trackBtnText}>{t.orders.track}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reorderBtn} onPress={() => handleReorder(item)}>
            <Ionicons name="refresh-outline" size={16} color="#fff" />
            <Text style={styles.reorderBtnText}>{t.orders.reorder}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.guestContainer}>
          <Ionicons name="receipt-outline" size={64} color="#7c3aed" />
          <Text style={styles.guestTitle}>{t.orders.trackViewOrders}</Text>
          <Text style={styles.guestSubtitle}>
            {t.orders.guestSubtitle}
          </Text>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('LoginModal')}
          >
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <Text style={styles.loginBtnText}>{t.orders.signInToAccount}</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t.orders.guestLookup}</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.guestForm}>
            <Text style={styles.inputLabel}>{t.orders.orderNumber}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. PH-20261102-1234"
              placeholderTextColor="#64748b"
              value={guestOrderNum}
              onChangeText={setGuestOrderNum}
              autoCapitalize="characters"
            />

            <Text style={styles.inputLabel}>{t.orders.phone}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9800000000"
              placeholderTextColor="#64748b"
              value={guestPhone}
              onChangeText={setGuestPhone}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={styles.lookupBtn}
              onPress={handleGuestLookup}
              disabled={guestLoading}
            >
              {guestLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.lookupBtnText}>{t.orders.findOrder}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="receipt-outline" size={64} color="#64748b" />
          <Text style={styles.emptyTitle}>{t.orders.noOrdersYet}</Text>
          <Text style={styles.emptySubtitle}>
            {t.orders.emptySubtitle}
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('Menu')}
          >
            <Text style={styles.browseBtnText}>{t.orders.browseMenu}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#a855f7"
              colors={['#a855f7']}
            />
          }
        />
      )}
    </View>
  );
}

const createStyles = (colors: ColorTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    listContent: { padding: spacing.lg, paddingBottom: 32 },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    guestContainer: {
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    guestTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 16,
    },
    guestSubtitle: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 20,
      lineHeight: 20,
    },
    loginBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.purple,
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: borderRadius.md,
      gap: 8,
      width: '100%',
      borderWidth: 1,
      borderColor: colors.gold,
    },
    loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
      width: '100%',
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.surfaceBorder },
    dividerText: { color: colors.textMuted, fontSize: 11, fontWeight: '700', marginHorizontal: 12 },
    guestForm: { width: '100%' },
    inputLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6 },
    input: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 15,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      marginBottom: 14,
    },
    lookupBtn: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.gold,
      paddingVertical: 14,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginTop: 6,
    },
    lookupBtnText: { color: colors.goldText, fontSize: 15, fontWeight: '700' },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 16 },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 24,
      maxWidth: 280,
    },
    browseBtn: {
      backgroundColor: colors.purple,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.gold,
    },
    browseBtnText: { color: '#fff', fontWeight: 'bold' },
    orderCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    orderNumber: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    orderDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
      borderWidth: 1,
    },
    statusBadgeText: { fontSize: 11, fontWeight: '700' },
    cardBody: {
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingVertical: 10,
      marginBottom: 12,
    },
    itemsSummary: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
    amountText: { color: colors.goldText, fontWeight: 'bold', fontSize: 15, marginTop: 6 },
    cardActions: { flexDirection: 'row', gap: 10 },
    trackBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.purpleMuted,
      paddingVertical: 10,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.purple,
      gap: 6,
    },
    trackBtnText: { color: colors.purpleText, fontWeight: '700', fontSize: 13 },
    reorderBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.purple,
      paddingVertical: 10,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.gold,
      gap: 6,
    },
    reorderBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  });
