import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  TextInput,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { colors, spacing, borderRadius } from '../theme';
import { api, type AdminReportDto, type AdminOrderDto, type AdminReservationDto, type DishDto } from '../services/api-client';
import { useAuthStore } from '../stores/auth-store';

interface AdminDashboardScreenProps {
  navigation: any;
}

type AdminTab = 'orders' | 'reservations' | 'menu';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#eab308', // Yellow
  CONFIRMED: '#3b82f6', // Blue
  PREPARING: '#a855f7', // Purple
  READY: '#f97316', // Orange
  OUT_FOR_DELIVERY: '#06b6d4', // Cyan
  DELIVERED: '#22c55e', // Green
  COMPLETED: '#22c55e', // Green
  CANCELLED: '#ef4444', // Red
};

export default function AdminDashboardScreen({ navigation }: AdminDashboardScreenProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [report, setReport] = useState<AdminReportDto | null>(null);
  const [orders, setOrders] = useState<AdminOrderDto[]>([]);
  const [reservations, setReservations] = useState<AdminReservationDto[]>([]);
  const [dishes, setDishes] = useState<DishDto[]>([]);
  const [dishSearch, setDishSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [reportData, ordersData, reservationsData, dishesData] = await Promise.all([
        api.admin.getReports().catch(() => null),
        api.admin.getOrders({ limit: 50 }).catch(() => []),
        api.admin.getReservations({ limit: 30 }).catch(() => []),
        api.menu.getDishes().catch(() => []),
      ]);

      if (reportData) setReport(reportData);
      if (Array.isArray(ordersData)) setOrders(ordersData);
      if (Array.isArray(reservationsData)) setReservations(reservationsData);
      if (Array.isArray(dishesData)) setDishes(dishesData);
    } catch (err: any) {
      console.warn('Admin load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // 10s auto-refresh for live kitchen
    const timer = setInterval(() => {
      loadData();
    }, 10000);
    return () => clearInterval(timer);
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId);
    try {
      await api.admin.updateOrderStatus(orderId, nextStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
      Alert.alert('Success', `Order marked as ${nextStatus}`);
      loadData();
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleDishAvailability = async (dishId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setDishes((prev) =>
      prev.map((d) => (d.id === dishId ? { ...d, isAvailable: nextStatus } : d))
    );
    try {
      await api.admin.toggleDishAvailability(dishId, nextStatus);
    } catch (err: any) {
      // Revert on failure
      setDishes((prev) =>
        prev.map((d) => (d.id === dishId ? { ...d, isAvailable: currentStatus } : d))
      );
      Alert.alert('Error', err?.message || 'Could not update availability');
    }
  };

  const openWebAdmin = async () => {
    const url = 'http://localhost:3000/admin';
    try {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: colors.background,
        controlsColor: colors.gold,
      });
    } catch {
      Alert.alert('Open Web Admin', `Please visit ${url} in your desktop browser.`);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'ALL') return true;
    if (orderFilter === 'ACTIVE') return ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status);
    return o.status === orderFilter;
  });

  const filteredDishes = dishes.filter((d) =>
    dishSearch.trim() === ''
      ? true
      : d.name.toLowerCase().includes(dishSearch.toLowerCase()) ||
        d.categoryName?.toLowerCase().includes(dishSearch.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Restaurant Operations</Text>
          <View style={styles.liveBadgeRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live Kitchen Sync</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.webConsoleButton}
          onPress={openWebAdmin}
          activeOpacity={0.8}
        >
          <Ionicons name="desktop-outline" size={18} color={colors.gold} />
          <Text style={styles.webConsoleText}>Web</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        {/* Metric Cards Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Ionicons name="restaurant" size={20} color="#a855f7" />
            <Text style={styles.metricValue}>
              {report?.summary?.activeOrders ?? orders.filter((o) => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status)).length}
            </Text>
            <Text style={styles.metricLabel}>Active Orders</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="cash-outline" size={20} color={colors.gold} />
            <Text style={styles.metricValue}>
              Rs. {Math.round((report?.summary?.totalRevenuePaisa || 0) / 100).toLocaleString()}
            </Text>
            <Text style={styles.metricLabel}>Revenue</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="receipt-outline" size={20} color="#3b82f6" />
            <Text style={styles.metricValue}>
              {report?.summary?.totalOrders ?? orders.length}
            </Text>
            <Text style={styles.metricLabel}>Total Orders</Text>
          </View>
        </View>

        {/* Tab Segment Controls */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'orders' && styles.tabButtonActive]}
            onPress={() => setActiveTab('orders')}
          >
            <Ionicons
              name="fast-food-outline"
              size={16}
              color={activeTab === 'orders' ? colors.gold : colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
              Orders ({filteredOrders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'reservations' && styles.tabButtonActive]}
            onPress={() => setActiveTab('reservations')}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={activeTab === 'reservations' ? colors.gold : colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'reservations' && styles.tabTextActive]}>
              Tables ({reservations.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'menu' && styles.tabButtonActive]}
            onPress={() => setActiveTab('menu')}
          >
            <Ionicons
              name="toggle-outline"
              size={16}
              color={activeTab === 'menu' ? colors.gold : colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === 'menu' && styles.tabTextActive]}>
              86 / Stock
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: ORDERS & KITCHEN */}
        {activeTab === 'orders' && (
          <View>
            {/* Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {['ALL', 'ACTIVE', 'PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, orderFilter === f && styles.filterChipActive]}
                  onPress={() => setOrderFilter(f)}
                >
                  <Text style={[styles.filterChipText, orderFilter === f && styles.filterChipTextActive]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {loading ? (
              <ActivityIndicator size="large" color={colors.gold} style={{ marginTop: spacing.xl }} />
            ) : filteredOrders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No orders match this filter</Text>
              </View>
            ) : (
              filteredOrders.map((order) => {
                const statusColor = STATUS_COLORS[order.status] || colors.purple;
                const isUpdating = updatingId === order.id;

                return (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderHeaderRow}>
                      <View>
                        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                        <Text style={styles.customerName}>{order.customerName}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{order.status}</Text>
                      </View>
                    </View>

                    <View style={styles.orderMetaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons name="call-outline" size={14} color={colors.textMuted} />
                        <Text style={styles.metaText}>{order.customerPhone || 'N/A'}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                        <Text style={styles.metaText}>
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <Text style={styles.orderTotal}>
                        Rs. {Math.round(order.total / 100).toLocaleString()}
                      </Text>
                    </View>

                    {/* Quick Kitchen Action Buttons */}
                    <View style={styles.actionButtonsRow}>
                      {order.status === 'PENDING' && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]}
                          onPress={() => handleUpdateOrderStatus(order.id, 'CONFIRMED')}
                          disabled={isUpdating}
                        >
                          <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                          <Text style={styles.actionBtnText}>Confirm Order</Text>
                        </TouchableOpacity>
                      )}

                      {order.status === 'CONFIRMED' && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#a855f7' }]}
                          onPress={() => handleUpdateOrderStatus(order.id, 'PREPARING')}
                          disabled={isUpdating}
                        >
                          <Ionicons name="flame-outline" size={16} color="#fff" />
                          <Text style={styles.actionBtnText}>Start Cooking</Text>
                        </TouchableOpacity>
                      )}

                      {order.status === 'PREPARING' && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#f97316' }]}
                          onPress={() => handleUpdateOrderStatus(order.id, 'READY')}
                          disabled={isUpdating}
                        >
                          <Ionicons name="cube-outline" size={16} color="#fff" />
                          <Text style={styles.actionBtnText}>Mark Ready</Text>
                        </TouchableOpacity>
                      )}

                      {order.status === 'READY' && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#22c55e' }]}
                          onPress={() => handleUpdateOrderStatus(order.id, 'COMPLETED')}
                          disabled={isUpdating}
                        >
                          <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
                          <Text style={styles.actionBtnText}>Delivered / Done</Text>
                        </TouchableOpacity>
                      )}

                      {['PENDING', 'CONFIRMED'].includes(order.status) && (
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={() =>
                            Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
                              { text: 'Keep', style: 'cancel' },
                              {
                                text: 'Cancel Order',
                                style: 'destructive',
                                onPress: () => handleUpdateOrderStatus(order.id, 'CANCELLED'),
                              },
                            ])
                          }
                          disabled={isUpdating}
                        >
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* TAB 2: RESERVATIONS */}
        {activeTab === 'reservations' && (
          <View>
            {reservations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No reservations found</Text>
              </View>
            ) : (
              reservations.map((res) => (
                <View key={res.id} style={styles.orderCard}>
                  <View style={styles.orderHeaderRow}>
                    <View>
                      <Text style={styles.orderNumber}>{res.name}</Text>
                      <Text style={styles.customerName}>{res.phone}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: '#3b82f620', borderColor: '#3b82f6' }]}>
                      <Text style={[styles.statusText, { color: '#3b82f6' }]}>{res.status}</Text>
                    </View>
                  </View>
                  <View style={styles.orderMetaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="people-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.metaText}>{res.guests} Guests</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.metaText}>{res.timeSlot || 'Evening'}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 3: 86 / SOLD OUT CONTROLS */}
        {activeTab === 'menu' && (
          <View>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search dish to toggle availability..."
                placeholderTextColor={colors.textMuted}
                value={dishSearch}
                onChangeText={setDishSearch}
              />
              {dishSearch.length > 0 && (
                <TouchableOpacity onPress={() => setDishSearch('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {filteredDishes.map((dish) => (
              <View key={dish.id} style={styles.dishRowCard}>
                <View style={styles.dishInfo}>
                  <Text style={styles.dishTitle}>{dish.name}</Text>
                  <Text style={styles.dishCategory}>
                    {dish.categoryName || 'Food'} · Rs. {Math.round(dish.price / 100)}
                  </Text>
                </View>
                <View style={styles.toggleContainer}>
                  <Text
                    style={[
                      styles.stockStatusText,
                      { color: dish.isAvailable ? '#22c55e' : '#ef4444' },
                    ]}
                  >
                    {dish.isAvailable ? 'In Stock' : '86 / Sold Out'}
                  </Text>
                  <Switch
                    value={dish.isAvailable}
                    onValueChange={() => handleToggleDishAvailability(dish.id, dish.isAvailable)}
                    trackColor={{ false: '#7f1d1d', true: '#14532d' }}
                    thumbColor={dish.isAvailable ? '#22c55e' : '#ef4444'}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: '600',
  },
  webConsoleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
  },
  webConsoleText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 60,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 3,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
  },
  tabButtonActive: {
    backgroundColor: colors.background,
  },
  tabText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 4,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.gold,
  },
  filterScroll: {
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  filterChipActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  filterChipText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  customerName: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  orderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 4,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.gold,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    marginRight: spacing.xs,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  cancelBtnText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    marginLeft: spacing.xs,
  },
  dishRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  dishInfo: {
    flex: 1,
  },
  dishTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  dishCategory: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  toggleContainer: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  stockStatusText: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
});
