import React, { useEffect, useState, useCallback } from 'react';
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
import { STATUS_META } from '../shared/constants';
import type { OrderDto } from '../shared/types';

interface OrdersScreenProps {
  navigation: any;
}

function formatRs(paisa: number): string {
  return `Rs. ${Math.round(paisa / 100).toLocaleString()}`;
}

export default function OrdersScreen({ navigation }: OrdersScreenProps) {
  const { isAuthenticated } = useAuthStore();

  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Guest lookup state
  const [guestOrderNum, setGuestOrderNum] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
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
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleGuestLookup = async () => {
    if (!guestOrderNum.trim() || !guestPhone.trim()) {
      Alert.alert('Required Fields', 'Please enter both your Order Number and Phone Number.');
      return;
    }
    setGuestLoading(true);
    try {
      const data = await api.get<OrderDto>(
        `/orders/track?orderNumber=${encodeURIComponent(guestOrderNum.trim())}&phone=${encodeURIComponent(guestPhone.trim())}`
      );
      if (data?.id) {
        navigation.navigate('OrderTracking', {
          orderId: data.id,
          orderNumber: data.orderNumber,
          phone: data.customerPhone,
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No matching order found.');
    } finally {
      setGuestLoading(false);
    }
  };

  const handleReorder = (order: OrderDto) => {
    if (!order.items || order.items.length === 0) {
      Alert.alert('Notice', 'No items found in this order to reorder.');
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
    Alert.alert('Reorder', 'Items from this order have been placed into your cart!', [
      {
        text: 'View Cart',
        onPress: () => navigation.navigate('Cart'),
      },
      { text: 'OK' },
    ]);
  };

  const renderOrderItem = ({ item }: { item: OrderDto }) => {
    const isCancelled = item.status === 'CANCELLED';
    const isCompleted = item.status === 'COMPLETED';
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
              {meta.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.itemsSummary} numberOfLines={2}>
            {item.items?.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
          </Text>
          <Text style={styles.amountText}>Total: {formatRs(item.total)}</Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
          >
            <Ionicons name="navigate-outline" size={16} color="#c084fc" />
            <Text style={styles.trackBtnText}>Track Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reorderBtn} onPress={() => handleReorder(item)}>
            <Ionicons name="refresh-outline" size={16} color="#fff" />
            <Text style={styles.reorderBtnText}>Reorder</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.guestContainer}>
          <Ionicons name="receipt-outline" size={64} color="#7c3aed" />
          <Text style={styles.guestTitle}>Track & View Orders</Text>
          <Text style={styles.guestSubtitle}>
            Log in to see your entire order history, or track a guest order below.
          </Text>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('LoginModal')}
          >
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <Text style={styles.loginBtnText}>Sign In to Account</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR GUEST LOOKUP</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.guestForm}>
            <Text style={styles.inputLabel}>Order Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. PH-20261102-1234"
              placeholderTextColor="#64748b"
              value={guestOrderNum}
              onChangeText={setGuestOrderNum}
              autoCapitalize="characters"
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
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
                <Text style={styles.lookupBtnText}>Find My Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="receipt-outline" size={64} color="#64748b" />
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySubtitle}>
            When you place an order, it will appear here so you can track kitchen preparation & delivery live!
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('Menu')}
          >
            <Text style={styles.browseBtnText}>Explore Menu</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0716' },
  listContent: { padding: 16, paddingBottom: 32 },
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
    color: '#f8fafc',
    marginTop: 16,
  },
  guestSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 20,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    width: '100%',
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: '#64748b', fontSize: 11, fontWeight: '700', marginHorizontal: 12 },
  guestForm: { width: '100%' },
  inputLabel: { color: '#cbd5e1', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#18122B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  lookupBtn: {
    backgroundColor: '#1e1b2e',
    borderWidth: 1,
    borderColor: '#a855f7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  lookupBtnText: { color: '#c084fc', fontSize: 15, fontWeight: '700' },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc', marginTop: 16 },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
    maxWidth: 280,
  },
  browseBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  browseBtnText: { color: '#fff', fontWeight: 'bold' },
  orderCard: {
    backgroundColor: '#18122B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc' },
  orderDate: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  cardBody: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 10,
    marginBottom: 12,
  },
  itemsSummary: { color: '#cbd5e1', fontSize: 13, lineHeight: 18 },
  amountText: { color: '#a855f7', fontWeight: 'bold', fontSize: 15, marginTop: 6 },
  cardActions: { flexDirection: 'row', gap: 10 },
  trackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  trackBtnText: { color: '#c084fc', fontWeight: '600', fontSize: 13 },
  reorderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  reorderBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
