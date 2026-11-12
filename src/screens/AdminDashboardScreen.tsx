import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
  Modal,
  Linking,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { colors, spacing, borderRadius } from '../theme';
import {
  api,
  WEBSITE_BASE_URL,
  type AdminReportDto,
  type AdminOrderDto,
  type AdminReservationDto,
  type DishDto,
  type DispatchDeliveryDto,
  type UndispatchedOrderDto,
  type OnDutyRiderDto,
  type AdminOrderDetailDto,
} from '../services/api-client';
import { mobileRealtime } from '../services/realtime';
import { useAuthStore } from '../stores/auth-store';
import { pushNotifications } from '../services/push-notifications';

/** Formats database paisa integer amounts into readable Nepalese Rupees */
const formatAdminRupees = (amountInPaisa: number | undefined | null): string => {
  if (amountInPaisa === undefined || amountInPaisa === null) return '0';
  const rupees = Math.round(amountInPaisa / 100);
  return rupees.toLocaleString('en-IN');
};

interface AdminDashboardScreenProps {
  navigation: any;
}

type OperationTab = 'kitchen' | 'dispatch' | 'tables' | 'stock';
type KitchenFilter = 'ALL' | 'NEW' | 'COOKING' | 'READY' | 'TRANSIT' | 'DELAYED' | 'DONE' | 'CANCELLED';
type DispatchSubFilter = 'UNASSIGNED' | 'ACTIVE_TRIPS' | 'ISSUES' | 'FLEET';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#eab308', // Amber
  CONFIRMED: '#3b82f6', // Blue
  PREPARING: '#a855f7', // Purple
  READY: '#f97316', // Orange
  OUT_FOR_DELIVERY: '#06b6d4', // Cyan
  DELIVERED: '#22c55e', // Green
  COMPLETED: '#22c55e', // Green
  CANCELLED: '#ef4444', // Red
};

const DELIVERY_STATUS_COLORS: Record<string, string> = {
  ASSIGNED: '#eab308',
  ACCEPTED: '#3b82f6',
  PICKED_UP: '#06b6d4',
  ARRIVED_AT_CUSTOMER: '#a855f7',
  DELIVERED: '#22c55e',
  TIMEOUT: '#ef4444',
  DECLINED: '#ef4444',
  FAILED: '#dc2626',
};

export default function AdminDashboardScreen({ navigation }: AdminDashboardScreenProps) {
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<OperationTab>('kitchen');

  // Connection & Sync States
  const [connectionStatus, setConnectionStatus] = useState<'realtime' | 'polling' | 'offline'>('polling');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [orderLoadError, setOrderLoadError] = useState<string | null>(null);
  const [orderAuthRequired, setOrderAuthRequired] = useState(false);
  const [dispatchLoadError, setDispatchLoadError] = useState<string | null>(null);

  // Data states
  const [, setReport] = useState<AdminReportDto | null>(null);
  const [orders, setOrders] = useState<AdminOrderDto[]>([]);
  const [deliveries, setDeliveries] = useState<DispatchDeliveryDto[]>([]);
  const [undispatched, setUndispatched] = useState<UndispatchedOrderDto[]>([]);
  const [riders, setRiders] = useState<OnDutyRiderDto[]>([]);
  const [reservations, setReservations] = useState<AdminReservationDto[]>([]);
  const [dishes, setDishes] = useState<DishDto[]>([]);

  // Filters & Search
  const [kitchenSearch, setKitchenSearch] = useState('');
  const [kitchenFilter, setKitchenFilter] = useState<KitchenFilter>('ALL');
  const [dispatchFilter, setDispatchFilter] = useState<DispatchSubFilter>('UNASSIGNED');
  const [dishSearch, setDishSearch] = useState('');

  // Inline action loading tracking
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // New incoming order notification banner & sound alerts
  const [newOrderAlert, setNewOrderAlert] = useState<AdminOrderDto | null>(null);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  // Modal: Order Details
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDto | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<AdminOrderDetailDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal: Assign / Reassign Rider
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetOrderForDispatch, setTargetOrderForDispatch] = useState<{
    id: string;
    orderNumber: string;
    customerName: string;
    deliveryAddress?: string | null;
  } | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  const [dispatching, setDispatching] = useState(false);

  // Modal: Admin Override (ADMIN role only)
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideDelivery, setOverrideDelivery] = useState<DispatchDeliveryDto | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<string>('DELIVERED');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overriding, setOverriding] = useState(false);

  // Fetch all primary operational data
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setActionError(null);
    try {
      const [reportData, ordersResult, dispatchResult, ridersData, reservationsData, dishesData] =
        await Promise.all([
          api.admin.getReports().catch(() => null),
          api.admin.getOrders({ limit: 50 }).then(
            (data) => ({ data }),
            (error: unknown) => ({ error })
          ),
          api.admin.getDeliveries().then(
            (data) => ({ data }),
            (error: unknown) => ({ error })
          ),
          api.admin.getRiders().catch(() => []),
          api.admin.getReservations({ limit: 30 }).catch(() => []),
          api.menu.getDishes().catch(() => []),
        ]);

      if (reportData) setReport(reportData);

      if ('error' in ordersResult) {
        const error = ordersResult.error as { message?: string; status?: number };
        const status = error?.status ? ` (${error.status})` : '';
        const isAuth = error?.status === 401;
        setOrderAuthRequired(isAuth);
        setOrderLoadError(
          isAuth
            ? 'Authentication required or session expired. Please sign in to view orders.'
            : `Could not load orders${status}: ${error?.message || 'Please check your connection.'}`
        );
      } else if (Array.isArray(ordersResult.data)) {
        const freshOrders = ordersResult.data;

        // Detect new order arrival and trigger sound/vibration/notification alert
        if (!isFirstLoadRef.current && freshOrders.length > 0) {
          const brandNewOrders = freshOrders.filter(
            (o) => !knownOrderIdsRef.current.has(o.id) && (o.status === 'PENDING' || o.status === 'CONFIRMED')
          );
          if (brandNewOrders.length > 0) {
            const latest = brandNewOrders[0];
            // 1. Trigger vibration
            try {
              Vibration.vibrate([0, 500, 200, 500]);
            } catch {}

            // 2. Trigger system local notification
            void pushNotifications.triggerLocalOrderNotification({
              orderNumber: latest.orderNumber,
              total: latest.total,
              customerName: latest.customerName,
              type: latest.type,
            });

            // 3. Trigger in-app top banner
            setNewOrderAlert(latest);
          }
        }

        freshOrders.forEach((o) => knownOrderIdsRef.current.add(o.id));
        isFirstLoadRef.current = false;
        setOrders(freshOrders);
        setOrderLoadError(null);
        setOrderAuthRequired(false);
      } else {
        setOrderLoadError('Could not load orders: the server returned an unexpected response.');
        setOrderAuthRequired(false);
      }

      if ('error' in dispatchResult) {
        const error = dispatchResult.error as { message?: string; status?: number };
        const status = error?.status ? ` (${error.status})` : '';
        const isAuth = error?.status === 401;
        setDispatchLoadError(
          isAuth
            ? 'Authentication required or session expired. Please sign in to view dispatch.'
            : `Could not load dispatch${status}: ${error?.message || 'Please check your connection.'}`
        );
      } else if (dispatchResult.data) {
        if (dispatchResult.data.deliveries) setDeliveries(dispatchResult.data.deliveries);
        if (dispatchResult.data.undispatchedOrders) setUndispatched(dispatchResult.data.undispatchedOrders);
        setDispatchLoadError(null);
      }
      if (Array.isArray(ridersData)) {
        setRiders(
          ridersData.filter(
            (r) => r.shiftStatus === 'ON_DUTY' && r.licenseStatus === 'VERIFIED' && !r.isBlocked
          )
        );
      }
      if (Array.isArray(reservationsData)) setReservations(reservationsData);
      if (Array.isArray(dishesData)) setDishes(dishesData);

      setLastUpdated(new Date());
    } catch (err: any) {
      if (!isSilent) {
        setActionError(err?.message || 'Could not refresh operational data.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Realtime subscription setup & 15s fallback polling
  useEffect(() => {
    void Promise.resolve().then(() => {
      loadData();
    });

    let unsub: (() => void) | undefined;
    mobileRealtime
      .subscribeToAdminOrders((event, payload) => {
        setConnectionStatus('realtime');
        setLastUpdated(new Date());

        if (event === 'created') {
          // Immediate alert on realtime WebSocket arrival
          try {
            Vibration.vibrate([0, 500, 200, 500]);
          } catch {}
          if (payload?.orderNumber) {
            void pushNotifications.triggerLocalOrderNotification({
              orderNumber: payload.orderNumber,
              total: payload.total || 0,
              customerName: payload.customerName,
              type: payload.type,
            });
          }
          // New order created - refresh data smoothly
          loadData(true);
        } else if (event === 'updated' && payload?.orderId) {
          // Optimistically update matching order in place
          setOrders((prev) =>
            prev.map((o) =>
              o.id === payload.orderId
                ? { ...o, status: payload.status }
                : o
            )
          );
          // And revalidate dispatch in background
          loadData(true);
        }
      })
      .then((cleanup) => {
        unsub = cleanup;
      })
      .catch(() => {
        setConnectionStatus('polling');
      });

    // 15s polling fallback keeps metrics & timeout clocks accurate
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      loadData(true);
    }, 15000);

    return () => {
      clearInterval(interval);
      if (unsub) unsub();
    };
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Open Web Admin Console using centralized website URL
  const openWebAdmin = async () => {
    const url = `${WEBSITE_BASE_URL}/admin`;
    try {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: colors.background,
        controlsColor: colors.gold,
      });
    } catch {
      Linking.openURL(url).catch(() => {
        Alert.alert('Web Admin', `Visit ${url} in your desktop or mobile browser.`);
      });
    }
  };

  // Order status transition handler (Optimistic + Backend sync)
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string, note?: string) => {
    setUpdatingId(orderId);
    setActionError(null);

    // Optimistically update order status in local view immediately
    const previousOrders = [...orders];
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    try {
      await api.admin.updateOrderStatus(orderId, nextStatus, note);
      // Background revalidate to ensure full consistency
      loadData(true);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus } : null));
        if (selectedOrderDetail) {
          setSelectedOrderDetail((prev) => (prev ? { ...prev, status: nextStatus } : null));
        }
      }
    } catch (err: any) {
      // Revert optimistic update on error
      setOrders(previousOrders);
      const errMsg = err?.message || `Could not transition order to ${nextStatus}.`;
      setActionError(errMsg);
      Alert.alert('Status Transition Blocked', errMsg);
    } finally {
      setUpdatingId(null);
    }
  };

  // Open Full Order Details Modal
  const handleOpenOrderDetails = async (order: AdminOrderDto) => {
    setSelectedOrder(order);
    setSelectedOrderDetail(null);
    setDetailModalOpen(true);
    setLoadingDetail(true);

    try {
      const detail = await api.admin.getOrderDetails(order.id);
      setSelectedOrderDetail(detail);
    } catch {
      // Keep basic order data visible even if deep detail query fails
    } finally {
      setLoadingDetail(false);
    }
  };

  // Open Rider Dispatch / Reassign Modal
  const handleOpenDispatchModal = (target: {
    id: string;
    orderNumber: string;
    customerName: string;
    deliveryAddress?: string | null;
  }) => {
    setTargetOrderForDispatch(target);
    // Auto-select rider with lowest active workload
    if (riders.length > 0) {
      const sortedByWorkload = [...riders].sort(
        (a, b) => a.activeDeliveriesCount - b.activeDeliveriesCount
      );
      setSelectedRiderId(sortedByWorkload[0].id);
    } else {
      setSelectedRiderId('');
    }
    setAssignModalOpen(true);
  };

  // Submit Rider Dispatch
  const handleSubmitDispatch = async () => {
    if (!targetOrderForDispatch || !selectedRiderId) {
      Alert.alert('Select Rider', 'Please select an eligible on-duty rider.');
      return;
    }

    setDispatching(true);
    setActionError(null);

    try {
      await api.admin.dispatchOrder(targetOrderForDispatch.id, selectedRiderId);
      Alert.alert(
        'Order Dispatched',
        `Dispatched order #${targetOrderForDispatch.orderNumber}! 120s acceptance window initiated.`
      );
      setAssignModalOpen(false);
      loadData(true);
    } catch (err: any) {
      const msg = err?.message || 'Failed to dispatch order.';
      setActionError(msg);
      Alert.alert('Dispatch Failed', msg);
    } finally {
      setDispatching(false);
    }
  };

  // Unlock Delivery OTP
  const handleUnlockOtp = async (deliveryId: string, orderNumber: string) => {
    try {
      await api.admin.unlockDeliveryOtp(deliveryId);
      Alert.alert('OTP Unlocked', `Fresh 6-digit OTP generated for #${orderNumber}. Customer can now verify.`);
      loadData(true);
    } catch (err: any) {
      Alert.alert('Unlock Failed', err?.message || 'Could not unlock delivery OTP.');
    }
  };

  // Acknowledge Food Return to Kitchen
  const handleAcknowledgeFoodReturn = async (deliveryId: string, orderNumber: string) => {
    try {
      await api.admin.acknowledgeFoodReturn(deliveryId);
      Alert.alert('Food Return Acknowledged', `Returned items for #${orderNumber} marked received in kitchen.`);
      loadData(true);
    } catch (err: any) {
      Alert.alert('Action Failed', err?.message || 'Could not acknowledge food return.');
    }
  };

  // Open Admin Override Modal (ADMIN only)
  const handleOpenOverrideModal = (delivery: DispatchDeliveryDto) => {
    setOverrideDelivery(delivery);
    setOverrideStatus('DELIVERED');
    setOverrideReason('');
    setOverrideModalOpen(true);
  };

  // Submit Admin Override
  const handleSubmitOverride = async () => {
    if (!overrideDelivery) return;
    if (!overrideReason || overrideReason.trim().length < 5) {
      Alert.alert('Reason Required', 'Please provide a clear justification (minimum 5 characters).');
      return;
    }

    setOverriding(true);
    try {
      await api.admin.overrideDelivery(overrideDelivery.id, overrideStatus, overrideReason.trim());
      Alert.alert('Override Applied', `Delivery status updated to ${overrideStatus}.`);
      setOverrideModalOpen(false);
      loadData(true);
    } catch (err: any) {
      Alert.alert('Override Failed', err?.message || 'Admin override was rejected.');
    } finally {
      setOverriding(false);
    }
  };

  // Toggle Dish Availability (86 / Stock)
  const handleToggleDishAvailability = async (dishId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setDishes((prev) =>
      prev.map((d) => (d.id === dishId ? { ...d, isAvailable: nextStatus } : d))
    );
    try {
      await api.admin.toggleDishAvailability(dishId, nextStatus);
    } catch (err: any) {
      setDishes((prev) =>
        prev.map((d) => (d.id === dishId ? { ...d, isAvailable: currentStatus } : d))
      );
      Alert.alert('Error', err?.message || 'Could not update stock status');
    }
  };

  // Filtered Kitchen Orders
  const filteredOrders = useMemo(() => {
    const query = kitchenSearch.trim().toLowerCase();
    const now = currentTime;

    return orders.filter((o) => {
      // Search matching
      if (query.length > 0) {
        const matchesNum = o.orderNumber.toLowerCase().includes(query);
        const matchesName = o.customerName.toLowerCase().includes(query);
        const matchesPhone = o.customerPhone?.includes(query);
        if (!matchesNum && !matchesName && !matchesPhone) return false;
      }

      // Filter matching
      if (kitchenFilter === 'ALL') return true;
      if (kitchenFilter === 'NEW') return o.status === 'PENDING';
      if (kitchenFilter === 'COOKING') return o.status === 'PREPARING';
      if (kitchenFilter === 'READY') return o.status === 'READY';
      if (kitchenFilter === 'TRANSIT') return o.status === 'OUT_FOR_DELIVERY';
      if (kitchenFilter === 'DONE') return o.status === 'COMPLETED';
      if (kitchenFilter === 'CANCELLED') return o.status === 'CANCELLED';
      if (kitchenFilter === 'DELAYED') {
        const isStillActive = ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status);
        const elapsedMins = (now - new Date(o.createdAt).getTime()) / (1000 * 60);
        return isStillActive && elapsedMins >= 25;
      }

      return true;
    });
  }, [orders, kitchenSearch, kitchenFilter, currentTime]);

  // Dispatch breakdown
  const inTransitDeliveries = useMemo(
    () =>
      deliveries.filter((d) =>
        ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'ARRIVED_AT_CUSTOMER'].includes(d.deliveryStatus)
      ),
    [deliveries]
  );

  const issueDeliveries = useMemo(
    () =>
      deliveries.filter(
        (d) =>
          ['TIMEOUT', 'DECLINED', 'FAILED'].includes(d.deliveryStatus) ||
          d.isStuckAssigned ||
          d.otpLocked
      ),
    [deliveries]
  );

  const formatElapsed = (dateStr: string) => {
    const elapsedSeconds = Math.max(0, Math.floor((currentTime - new Date(dateStr).getTime()) / 1000));
    if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;
    const mins = Math.floor(elapsedSeconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m ago`;
  };

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
          <Text style={styles.headerTitle}>Purple Haze Operations</Text>
          <View style={styles.liveBadgeRow}>
            <View
              style={[
                styles.liveDot,
                {
                  backgroundColor:
                    connectionStatus === 'realtime'
                      ? '#22c55e'
                      : connectionStatus === 'polling'
                      ? '#eab308'
                      : '#ef4444',
                },
              ]}
            />
            <Text style={styles.liveText}>
              {connectionStatus === 'realtime'
                ? 'Realtime Fleet & Kitchen'
                : connectionStatus === 'polling'
                ? 'Live Sync (15s)'
                : 'Offline'}
            </Text>
            <Text style={styles.syncTimeText}>· {formatElapsed(lastUpdated.toISOString())}</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.iconRefreshBtn}
            onPress={() => onRefresh()}
            disabled={refreshing}
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color={refreshing ? colors.gold : colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.webConsoleButton}
            onPress={openWebAdmin}
            activeOpacity={0.8}
          >
            <Ionicons name="desktop-outline" size={16} color={colors.gold} />
            <Text style={styles.webConsoleText}>Web</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action error banner */}
      {actionError && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#ef4444" />
          <Text style={styles.errorBannerText} numberOfLines={2}>
            {actionError}
          </Text>
          <TouchableOpacity onPress={() => setActionError(null)}>
            <Ionicons name="close" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}

      {/* Main Operations Tabs (Role appropriate) */}
      {!isAuthenticated || !user ? (
        <View style={styles.authGateContainer}>
          <View style={styles.authGateIconCircle}>
            <Ionicons name="lock-closed-outline" size={36} color={colors.gold} />
          </View>
          <Text style={styles.authGateTitle}>Authentication Required</Text>
          <Text style={styles.authGateSubtitle}>
            Please sign in with an authorized Staff or Admin account to view and manage live orders, kitchen tickets, and rider dispatch.
          </Text>
          <TouchableOpacity
            style={styles.authGateButton}
            onPress={() => navigation.navigate('LoginModal')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Sign in with staff account"
          >
            <Ionicons name="log-in-outline" size={18} color="#000" />
            <Text style={styles.authGateButtonText}>Sign In with Staff Account</Text>
          </TouchableOpacity>
        </View>
      ) : user.role !== 'ADMIN' && user.role !== 'STAFF' ? (
        <View style={styles.authGateContainer}>
          <View style={[styles.authGateIconCircle, { backgroundColor: '#ef444420' }]}>
            <Ionicons name="shield-outline" size={36} color="#ef4444" />
          </View>
          <Text style={styles.authGateTitle}>Staff Access Only</Text>
          <Text style={styles.authGateSubtitle}>
            Signed in as {user.email} ({user.role}). Only Staff and Admin accounts have permissions to view live kitchen tickets and fleet dispatch.
          </Text>
          <TouchableOpacity
            style={styles.authGateButton}
            onPress={() => navigation.navigate('LoginModal')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Switch account"
          >
            <Ionicons name="swap-horizontal-outline" size={18} color="#000" />
            <Text style={styles.authGateButtonText}>Switch Account</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'kitchen' && styles.tabButtonActive]}
          onPress={() => setActiveTab('kitchen')}
        >
          <Ionicons
            name="flame-outline"
            size={16}
            color={activeTab === 'kitchen' ? colors.gold : colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'kitchen' && styles.tabTextActive]}>
            Kitchen ({orders.filter((o) => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status)).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'dispatch' && styles.tabButtonActive]}
          onPress={() => setActiveTab('dispatch')}
        >
          <Ionicons
            name="bicycle-outline"
            size={16}
            color={activeTab === 'dispatch' ? colors.gold : colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'dispatch' && styles.tabTextActive]}>
            Dispatch ({undispatched.length + inTransitDeliveries.length + issueDeliveries.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'tables' && styles.tabButtonActive]}
          onPress={() => setActiveTab('tables')}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color={activeTab === 'tables' ? colors.gold : colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'tables' && styles.tabTextActive]}>
            Tables ({reservations.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'stock' && styles.tabButtonActive]}
          onPress={() => setActiveTab('stock')}
        >
          <Ionicons
            name="toggle-outline"
            size={16}
            color={activeTab === 'stock' ? colors.gold : colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'stock' && styles.tabTextActive]}>
            86 / Stock
          </Text>
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
        {/* ========================================================================= */}
        {/* TAB 1: KITCHEN TICKETS & ORDER WORKFLOW                                   */}
        {/* ========================================================================= */}
        {activeTab === 'kitchen' && (
          <View>
            {/* Search Input */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search order #, customer or phone..."
                placeholderTextColor={colors.textMuted}
                value={kitchenSearch}
                onChangeText={setKitchenSearch}
              />
              {kitchenSearch.length > 0 && (
                <TouchableOpacity onPress={() => setKitchenSearch('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* New Incoming Order Alert Banner */}
            {newOrderAlert && (
              <View style={styles.newOrderBanner}>
                <View style={styles.newOrderPulse}>
                  <Ionicons name="notifications" size={18} color="#000" />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.newOrderBannerTitle}>🔔 New Order Received!</Text>
                  <Text style={styles.newOrderBannerSub}>
                    #{newOrderAlert.orderNumber} · {newOrderAlert.customerName} · Rs. {formatAdminRupees(newOrderAlert.total)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.newOrderBannerBtn}
                  onPress={() => {
                    handleOpenOrderDetails(newOrderAlert);
                    setNewOrderAlert(null);
                  }}
                >
                  <Text style={styles.newOrderBannerBtnText}>Review</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ padding: 4, marginLeft: 4 }}
                  onPress={() => setNewOrderAlert(null)}
                >
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}

            {/* Kitchen Status Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {[
                { id: 'ALL', label: 'All Orders' },
                { id: 'NEW', label: 'New (Pending)' },
                { id: 'COOKING', label: 'Cooking' },
                { id: 'READY', label: 'Ready for Handover' },
                { id: 'TRANSIT', label: 'On The Way' },
                { id: 'DELAYED', label: '⏱️ Delayed (>25m)' },
                { id: 'DONE', label: 'Completed' },
                { id: 'CANCELLED', label: 'Cancelled' },
              ].map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.filterChip, kitchenFilter === f.id && styles.filterChipActive]}
                  onPress={() => setKitchenFilter(f.id as KitchenFilter)}
                >
                  <Text
                    style={[styles.filterChipText, kitchenFilter === f.id && styles.filterChipTextActive]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Orders Feed */}
            {orderLoadError && orders.length > 0 && (
              <View style={styles.orderErrorBanner}>
                <Text style={styles.orderErrorBannerText}>{orderLoadError}</Text>
                <TouchableOpacity
                  onPress={() => orderAuthRequired ? navigation.navigate('LoginModal') : loadData()}
                  accessibilityRole="button"
                >
                  <Text style={styles.orderErrorRetryText}>
                    {orderAuthRequired ? 'Sign in' : 'Retry'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {loading ? (
              <ActivityIndicator size="large" color={colors.gold} style={{ marginTop: spacing.xl }} />
            ) : filteredOrders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name={orderLoadError ? 'cloud-offline-outline' : 'receipt-outline'}
                  size={48}
                  color={orderLoadError ? '#ef4444' : colors.textMuted}
                />
                <Text style={styles.emptyText}>
                  {orderLoadError || 'No orders match this filter.'}
                </Text>
                {orderLoadError && (
                  <TouchableOpacity
                    style={styles.retryOrdersButton}
                    onPress={() => orderAuthRequired ? navigation.navigate('LoginModal') : loadData()}
                    accessibilityRole="button"
                    accessibilityLabel="Retry loading orders"
                  >
                    <Ionicons name="refresh" size={16} color="#fff" />
                    <Text style={styles.retryOrdersButtonText}>
                      {orderAuthRequired ? 'Sign in' : 'Retry'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredOrders.map((order) => {
                const statusColor = STATUS_COLORS[order.status] || colors.purple;
                const isUpdating = updatingId === order.id;
                const isDelivery = order.type === 'DELIVERY';
                const isDineIn = order.type === 'DINE_IN';
                const isDelayed =
                  ['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status) &&
                  (currentTime - new Date(order.createdAt).getTime()) / (1000 * 60) >= 25;

                return (
                  <TouchableOpacity
                    key={order.id}
                    style={[styles.orderCard, isDelayed && styles.delayedOrderCard]}
                    activeOpacity={0.9}
                    onPress={() => handleOpenOrderDetails(order)}
                  >
                    {/* Card Header Row */}
                    <View style={styles.orderHeaderRow}>
                      <View style={{ flex: 1, paddingRight: spacing.sm }}>
                        <View style={styles.orderNumberRow}>
                          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                          <View
                            style={[
                              styles.typePill,
                              { backgroundColor: isDelivery ? '#3b82f615' : isDineIn ? '#a855f715' : '#eab30815' },
                            ]}
                          >
                            <Ionicons
                              name={isDelivery ? 'bicycle' : isDineIn ? 'restaurant' : 'bag-handle'}
                              size={12}
                              color={isDelivery ? '#3b82f6' : isDineIn ? '#a855f7' : '#eab308'}
                            />
                            <Text
                              style={[
                                styles.typePillText,
                                { color: isDelivery ? '#3b82f6' : isDineIn ? '#a855f7' : '#eab308' },
                              ]}
                            >
                              {order.type}
                            </Text>
                          </View>
                          {isDelayed && (
                            <View style={styles.delayedBadge}>
                              <Ionicons name="timer-outline" size={11} color="#ef4444" />
                              <Text style={styles.delayedBadgeText}>Delayed</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.customerName}>{order.customerName}</Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusColor + '20', borderColor: statusColor },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: statusColor }]}>{order.status}</Text>
                      </View>
                    </View>

                    {/* Items checklist snippet */}
                    {order.items && order.items.length > 0 && (
                      <View style={styles.itemsSummaryBox}>
                        {order.items.slice(0, 3).map((item, idx) => (
                          <View key={idx} style={styles.itemLineRow}>
                            <View style={styles.itemQtyBadge}>
                              <Text style={styles.itemQtyText}>{item.quantity}x</Text>
                            </View>
                            <Text style={styles.itemLineName} numberOfLines={1}>
                              {item.name}
                            </Text>
                          </View>
                        ))}
                        {order.items.length > 3 && (
                          <Text style={styles.moreItemsText}>
                            + {order.items.length - 3} more items...
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Metadata & Total */}
                    <View style={styles.orderMetaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons name="call-outline" size={13} color={colors.textMuted} />
                        <Text style={styles.metaText}>{order.customerPhone || 'N/A'}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                        <Text style={styles.metaText}>{formatElapsed(order.createdAt)}</Text>
                      </View>
                      <Text style={styles.orderTotal}>Rs. {formatAdminRupees(order.total)}</Text>
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

                      {order.status === 'READY' && !isDelivery && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#22c55e' }]}
                          onPress={() => handleUpdateOrderStatus(order.id, 'COMPLETED')}
                          disabled={isUpdating}
                        >
                          <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
                          <Text style={styles.actionBtnText}>Complete & Hand Over</Text>
                        </TouchableOpacity>
                      )}

                      {order.status === 'READY' && isDelivery && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: colors.gold }]}
                          onPress={() => handleOpenDispatchModal(order)}
                          disabled={isUpdating}
                        >
                          <Ionicons name="bicycle-outline" size={16} color="#000" />
                          <Text style={[styles.actionBtnText, { color: '#000' }]}>Assign Rider</Text>
                        </TouchableOpacity>
                      )}

                      {/* Detail preview pill */}
                      <TouchableOpacity
                        style={styles.detailsIconBtn}
                        onPress={() => handleOpenOrderDetails(order)}
                      >
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DISPATCH BOARD & FLEET LOGISTICS                                  */}
        {/* ========================================================================= */}
        {activeTab === 'dispatch' && (
          <View>
            {/* Fleet Status Summary Cards */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Ionicons name="people" size={20} color="#22c55e" />
                <Text style={styles.metricValue}>{riders.length}</Text>
                <Text style={styles.metricLabel}>On-Duty Riders</Text>
              </View>

              <View style={styles.metricCard}>
                <Ionicons name="bicycle" size={20} color="#3b82f6" />
                <Text style={styles.metricValue}>{inTransitDeliveries.length}</Text>
                <Text style={styles.metricLabel}>Active Trips</Text>
              </View>

              <View style={styles.metricCard}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text style={[styles.metricValue, { color: issueDeliveries.length > 0 ? '#ef4444' : colors.text }]}>
                  {issueDeliveries.length}
                </Text>
                <Text style={styles.metricLabel}>Issues</Text>
              </View>
            </View>

            {/* Dispatch Error Banner */}
            {dispatchLoadError && (
              <View style={[styles.orderErrorBanner, { marginHorizontal: spacing.md, marginBottom: spacing.sm }]}>
                <Text style={styles.orderErrorBannerText}>{dispatchLoadError}</Text>
                <TouchableOpacity
                  onPress={() => loadData()}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading dispatch"
                >
                  <Text style={styles.orderErrorRetryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Dispatch sub-filters */}
            <View style={styles.dispatchSubFilterRow}>
              <TouchableOpacity
                style={[styles.dispatchPill, dispatchFilter === 'UNASSIGNED' && styles.dispatchPillActive]}
                onPress={() => setDispatchFilter('UNASSIGNED')}
              >
                <Text
                  style={[
                    styles.dispatchPillText,
                    dispatchFilter === 'UNASSIGNED' && styles.dispatchPillTextActive,
                  ]}
                >
                  Unassigned ({undispatched.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dispatchPill, dispatchFilter === 'ACTIVE_TRIPS' && styles.dispatchPillActive]}
                onPress={() => setDispatchFilter('ACTIVE_TRIPS')}
              >
                <Text
                  style={[
                    styles.dispatchPillText,
                    dispatchFilter === 'ACTIVE_TRIPS' && styles.dispatchPillTextActive,
                  ]}
                >
                  In Transit ({inTransitDeliveries.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dispatchPill, dispatchFilter === 'ISSUES' && styles.dispatchPillActive]}
                onPress={() => setDispatchFilter('ISSUES')}
              >
                <Text
                  style={[
                    styles.dispatchPillText,
                    dispatchFilter === 'ISSUES' && styles.dispatchPillTextActive,
                  ]}
                >
                  Issues ({issueDeliveries.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dispatchPill, dispatchFilter === 'FLEET' && styles.dispatchPillActive]}
                onPress={() => setDispatchFilter('FLEET')}
              >
                <Text
                  style={[
                    styles.dispatchPillText,
                    dispatchFilter === 'FLEET' && styles.dispatchPillTextActive,
                  ]}
                >
                  Fleet ({riders.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* SUB-VIEW 1: UNASSIGNED ORDERS */}
            {dispatchFilter === 'UNASSIGNED' && (
              <View>
                {undispatched.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="checkmark-done-circle-outline" size={48} color="#22c55e" />
                    <Text style={styles.emptyText}>All delivery orders have riders assigned!</Text>
                  </View>
                ) : (
                  undispatched.map((u) => (
                    <View key={u.id} style={styles.dispatchCard}>
                      <View style={styles.dispatchCardHeader}>
                        <View>
                          <Text style={styles.orderNumber}>#{u.orderNumber}</Text>
                          <Text style={styles.customerName}>{u.customerName}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: '#f9731620', borderColor: '#f97316' }]}>
                          <Text style={[styles.statusText, { color: '#f97316' }]}>{u.status}</Text>
                        </View>
                      </View>

                      <View style={styles.addressBox}>
                        <Ionicons name="location-outline" size={16} color={colors.gold} />
                        <Text style={styles.addressText} numberOfLines={2}>
                          {u.deliveryAddress || 'Biratnagar local delivery'}
                        </Text>
                      </View>

                      <View style={styles.dispatchFooterRow}>
                        <Text style={styles.orderTotal}>Rs. {formatAdminRupees(u.total)}</Text>
                        <TouchableOpacity
                          style={styles.dispatchAssignBtn}
                          onPress={() =>
                            handleOpenDispatchModal({
                              id: u.id,
                              orderNumber: u.orderNumber,
                              customerName: u.customerName,
                              deliveryAddress: u.deliveryAddress,
                            })
                          }
                        >
                          <Ionicons name="bicycle" size={16} color="#000" />
                          <Text style={styles.dispatchAssignBtnText}>Assign Rider</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* SUB-VIEW 2: ACTIVE TRIPS */}
            {dispatchFilter === 'ACTIVE_TRIPS' && (
              <View>
                {inTransitDeliveries.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="bicycle-outline" size={48} color={colors.textMuted} />
                    <Text style={styles.emptyText}>No delivery trips currently in transit.</Text>
                  </View>
                ) : (
                  inTransitDeliveries.map((deliv) => {
                    const statusColor = DELIVERY_STATUS_COLORS[deliv.deliveryStatus] || '#06b6d4';
                    return (
                      <View key={deliv.id} style={styles.dispatchCard}>
                        <View style={styles.dispatchCardHeader}>
                          <View>
                            <Text style={styles.orderNumber}>#{deliv.orderNumber}</Text>
                            <Text style={styles.customerName}>{deliv.customerName}</Text>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: statusColor + '20', borderColor: statusColor },
                            ]}
                          >
                            <Text style={[styles.statusText, { color: statusColor }]}>
                              {deliv.deliveryStatus}
                            </Text>
                          </View>
                        </View>

                        {/* Assigned Rider Info */}
                        <View style={styles.assignedRiderRow}>
                          <View style={styles.riderAvatarCircle}>
                            <Ionicons name="person" size={16} color={colors.gold} />
                          </View>
                          <View style={{ flex: 1, marginLeft: spacing.xs }}>
                            <Text style={styles.riderNameText}>
                              {deliv.rider?.name || 'Assigned Rider'}
                            </Text>
                            <Text style={styles.riderPhoneText}>
                              {deliv.rider?.phone || ''} · {deliv.rider?.vehicleType || 'Bike'}
                            </Text>
                          </View>
                          {deliv.rider?.phone && (
                            <TouchableOpacity
                              style={styles.callIconBtn}
                              onPress={() => Linking.openURL(`tel:${deliv.rider?.phone}`)}
                            >
                              <Ionicons name="call" size={16} color="#22c55e" />
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Delivery Step Indicators */}
                        <View style={styles.stepsTimelineRow}>
                          <View style={[styles.stepDot, styles.stepDotDone]}>
                            <Ionicons name="checkmark" size={10} color="#fff" />
                          </View>
                          <View style={[styles.stepLine, deliv.acceptedAt ? styles.stepLineDone : null]} />
                          <View
                            style={[styles.stepDot, deliv.acceptedAt ? styles.stepDotDone : null]}
                          >
                            <Ionicons
                              name={deliv.acceptedAt ? 'checkmark' : 'ellipse'}
                              size={deliv.acceptedAt ? 10 : 6}
                              color="#fff"
                            />
                          </View>
                          <View style={[styles.stepLine, deliv.pickedUpAt ? styles.stepLineDone : null]} />
                          <View
                            style={[styles.stepDot, deliv.pickedUpAt ? styles.stepDotDone : null]}
                          >
                            <Ionicons
                              name={deliv.pickedUpAt ? 'checkmark' : 'ellipse'}
                              size={deliv.pickedUpAt ? 10 : 6}
                              color="#fff"
                            />
                          </View>
                          <View style={[styles.stepLine, deliv.arrivedAt ? styles.stepLineDone : null]} />
                          <View
                            style={[styles.stepDot, deliv.arrivedAt ? styles.stepDotDone : null]}
                          >
                            <Ionicons
                              name={deliv.arrivedAt ? 'checkmark' : 'ellipse'}
                              size={deliv.arrivedAt ? 10 : 6}
                              color="#fff"
                            />
                          </View>
                        </View>
                        <View style={styles.stepLabelsRow}>
                          <Text style={styles.stepLabelText}>Assigned</Text>
                          <Text style={styles.stepLabelText}>Accepted</Text>
                          <Text style={styles.stepLabelText}>Picked Up</Text>
                          <Text style={styles.stepLabelText}>Arrived</Text>
                        </View>

                        {/* Destination */}
                        <View style={styles.addressBox}>
                          <Ionicons name="location-outline" size={15} color={colors.textMuted} />
                          <Text style={styles.addressText} numberOfLines={1}>
                            {deliv.deliveryAddress || 'Biratnagar local address'}
                          </Text>
                        </View>

                        {/* Reassign / Actions bar */}
                        <View style={styles.dispatchActionsRow}>
                          <TouchableOpacity
                            style={styles.reassignBtn}
                            onPress={() =>
                              handleOpenDispatchModal({
                                id: deliv.orderId,
                                orderNumber: deliv.orderNumber,
                                customerName: deliv.customerName,
                                deliveryAddress: deliv.deliveryAddress,
                              })
                            }
                          >
                            <Ionicons name="swap-horizontal" size={14} color={colors.text} />
                            <Text style={styles.reassignBtnText}>Reassign Rider</Text>
                          </TouchableOpacity>

                          {isAdmin && (
                            <TouchableOpacity
                              style={styles.overrideBtn}
                              onPress={() => handleOpenOverrideModal(deliv)}
                            >
                              <Ionicons name="shield-outline" size={14} color={colors.gold} />
                              <Text style={styles.overrideBtnText}>Override</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* SUB-VIEW 3: DELIVERY ISSUES & EXCEPTIONS */}
            {dispatchFilter === 'ISSUES' && (
              <View>
                {issueDeliveries.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="shield-checkmark-outline" size={48} color="#22c55e" />
                    <Text style={styles.emptyText}>Zero exceptions! All fleet operations normal.</Text>
                  </View>
                ) : (
                  issueDeliveries.map((issue) => (
                    <View key={issue.id} style={[styles.dispatchCard, styles.issueCardBorder]}>
                      <View style={styles.dispatchCardHeader}>
                        <View>
                          <Text style={styles.orderNumber}>#{issue.orderNumber}</Text>
                          <Text style={styles.customerName}>{issue.customerName}</Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: '#ef444420', borderColor: '#ef4444' },
                          ]}
                        >
                          <Text style={[styles.statusText, { color: '#ef4444' }]}>
                            {issue.otpLocked ? 'OTP LOCKED' : issue.deliveryStatus}
                          </Text>
                        </View>
                      </View>

                      {/* Exception explanation badge */}
                      <View style={styles.exceptionAlertBanner}>
                        <Ionicons name="warning" size={16} color="#ef4444" />
                        <Text style={styles.exceptionAlertText}>
                          {issue.otpLocked
                            ? 'Customer entered incorrect OTP 3+ times. Unlock required.'
                            : issue.deliveryStatus === 'TIMEOUT'
                            ? 'Rider did not accept assignment within 120s window.'
                            : issue.deliveryStatus === 'DECLINED'
                            ? 'Rider declined delivery request.'
                            : issue.failureReason || 'Delivery marked as failed.'}
                        </Text>
                      </View>

                      {/* Safe Next Steps Action Row */}
                      <View style={styles.exceptionActionRow}>
                        {issue.otpLocked && (
                          <TouchableOpacity
                            style={[styles.safeActionBtn, { backgroundColor: '#3b82f6' }]}
                            onPress={() => handleUnlockOtp(issue.id, issue.orderNumber)}
                          >
                            <Ionicons name="lock-open-outline" size={16} color="#fff" />
                            <Text style={styles.safeActionBtnText}>Unlock & Reset OTP</Text>
                          </TouchableOpacity>
                        )}

                        {issue.deliveryStatus === 'FAILED' && (
                          <TouchableOpacity
                            style={[styles.safeActionBtn, { backgroundColor: '#f97316' }]}
                            onPress={() => handleAcknowledgeFoodReturn(issue.id, issue.orderNumber)}
                          >
                            <Ionicons name="restaurant-outline" size={16} color="#fff" />
                            <Text style={styles.safeActionBtnText}>Acknowledge Return to Kitchen</Text>
                          </TouchableOpacity>
                        )}

                        {(issue.deliveryStatus === 'TIMEOUT' ||
                          issue.deliveryStatus === 'DECLINED' ||
                          issue.deliveryStatus === 'FAILED') && (
                          <TouchableOpacity
                            style={[styles.safeActionBtn, { backgroundColor: colors.gold }]}
                            onPress={() =>
                              handleOpenDispatchModal({
                                id: issue.orderId,
                                orderNumber: issue.orderNumber,
                                customerName: issue.customerName,
                                deliveryAddress: issue.deliveryAddress,
                              })
                            }
                          >
                            <Ionicons name="bicycle" size={16} color="#000" />
                            <Text style={[styles.safeActionBtnText, { color: '#000' }]}>
                              Reassign Another Rider
                            </Text>
                          </TouchableOpacity>
                        )}

                        {isAdmin && (
                          <TouchableOpacity
                            style={styles.overrideBtn}
                            onPress={() => handleOpenOverrideModal(issue)}
                          >
                            <Ionicons name="shield-outline" size={14} color={colors.gold} />
                            <Text style={styles.overrideBtnText}>Manager Override</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* SUB-VIEW 4: ON-DUTY FLEET WORKLOAD */}
            {dispatchFilter === 'FLEET' && (
              <View>
                {riders.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                    <Text style={styles.emptyText}>No riders currently on duty.</Text>
                  </View>
                ) : (
                  riders.map((r) => (
                    <View key={r.id} style={styles.riderRowCard}>
                      <View style={styles.riderAvatarCircle}>
                        <Ionicons name="bicycle" size={18} color={colors.gold} />
                      </View>
                      <View style={{ flex: 1, marginLeft: spacing.sm }}>
                        <Text style={styles.riderNameText}>{r.name || 'Fleet Rider'}</Text>
                        <Text style={styles.riderMetaText}>
                          {r.phone || 'No phone'} · {r.vehicleType || 'Motorcycle'}
                        </Text>
                      </View>
                      <View style={styles.workloadPill}>
                        <Text style={styles.workloadPillText}>
                          {r.activeDeliveriesCount === 0
                            ? 'Available (0 trips)'
                            : `${r.activeDeliveriesCount} active trips`}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TABLE RESERVATIONS                                                */}
        {/* ========================================================================= */}
        {activeTab === 'tables' && (
          <View>
            {reservations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No table reservations recorded.</Text>
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
                    {res.tableNumber && (
                      <Text style={styles.metaText}>Table #{res.tableNumber}</Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: 86 / SOLD OUT STOCK CONTROLS                                      */}
        {/* ========================================================================= */}
        {activeTab === 'stock' && (
          <View>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search dish to toggle 86 status..."
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

            {dishes
              .filter((d) =>
                dishSearch.trim() === ''
                  ? true
                  : d.name.toLowerCase().includes(dishSearch.toLowerCase()) ||
                    d.categoryName?.toLowerCase().includes(dishSearch.toLowerCase())
              )
              .map((dish) => (
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

      {/* ========================================================================= */}
      {/* MODAL 1: FULL ORDER DETAILS                                              */}
      {/* ========================================================================= */}
      <Modal
        visible={detailModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>
                  Order #{selectedOrder?.orderNumber}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {selectedOrder?.type} · {selectedOrder?.customerName}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setDetailModalOpen(false)}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380, flexShrink: 1 }} showsVerticalScrollIndicator={false}>
              {loadingDetail ? (
                <ActivityIndicator size="small" color={colors.gold} style={{ padding: spacing.xl }} />
              ) : (
                <View>
                  {/* Customer Quick Call Row */}
                  <View style={styles.modalSectionBox}>
                    <Text style={styles.modalSectionTitle}>Customer & Contact</Text>
                    <Text style={styles.modalDetailText}>Name: {selectedOrder?.customerName}</Text>
                    <Text style={styles.modalDetailText}>Phone: {selectedOrder?.customerPhone || 'N/A'}</Text>
                    <View style={styles.contactButtonsRow}>
                      {selectedOrder?.customerPhone && (
                        <>
                          <TouchableOpacity
                            style={[styles.smallActionBtn, { backgroundColor: '#22c55e' }]}
                            onPress={() => Linking.openURL(`tel:${selectedOrder?.customerPhone}`)}
                          >
                            <Ionicons name="call" size={14} color="#fff" />
                            <Text style={styles.smallActionBtnText}>Call Customer</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.smallActionBtn, { backgroundColor: '#25D366' }]}
                            onPress={() =>
                              Linking.openURL(
                                `https://wa.me/${selectedOrder?.customerPhone?.replace(/\D/g, '')}`
                              ).catch(() => {})
                            }
                          >
                            <Ionicons name="logo-whatsapp" size={14} color="#fff" />
                            <Text style={styles.smallActionBtnText}>WhatsApp</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Delivery Address & Instructions */}
                  {selectedOrder?.type === 'DELIVERY' && (
                    <View style={styles.modalSectionBox}>
                      <Text style={styles.modalSectionTitle}>Delivery Destination</Text>
                      <Text style={styles.modalDetailText}>
                        {selectedOrderDetail?.deliveryAddress || selectedOrder?.deliveryAddress || 'Biratnagar local'}
                      </Text>
                      {selectedOrderDetail?.notes && (
                        <Text style={styles.modalNotesText}>Note: &ldquo;{selectedOrderDetail.notes}&rdquo;</Text>
                      )}
                    </View>
                  )}

                  {/* Items List */}
                  <View style={styles.modalSectionBox}>
                    <Text style={styles.modalSectionTitle}>Items Ordered</Text>
                    {(selectedOrderDetail?.items || selectedOrder?.items || []).map((it, idx) => (
                      <View key={idx} style={styles.itemDetailRow}>
                        <Text style={styles.itemDetailQty}>{it.quantity}x</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemDetailName}>{it.name}</Text>
                          {it.specialInstructions && (
                            <Text style={styles.itemSpecialInst}>&ldquo;{it.specialInstructions}&rdquo;</Text>
                          )}
                        </View>
                        {it.price && (
                          <Text style={styles.itemDetailPrice}>
                            Rs. {((it.price * it.quantity) / 100).toLocaleString()}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>

                  {/* Payment Breakdown */}
                  <View style={styles.modalSectionBox}>
                    <Text style={styles.modalSectionTitle}>Payment & Total</Text>
                    <View style={styles.paymentMetaRow}>
                      <Text style={styles.modalDetailText}>Method: {selectedOrder?.paymentMethod || 'COD'}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              selectedOrder?.paymentStatus === 'PAID' ? '#22c55e20' : '#eab30820',
                            borderColor:
                              selectedOrder?.paymentStatus === 'PAID' ? '#22c55e' : '#eab308',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color:
                                selectedOrder?.paymentStatus === 'PAID' ? '#22c55e' : '#eab308',
                            },
                          ]}
                        >
                          {selectedOrder?.paymentStatus || 'UNPAID'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.orderTotal, { fontSize: 18, marginTop: 4 }]}>
                      Total: Rs. {formatAdminRupees(selectedOrder?.total)}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Allowed Action Bar inside Modal */}
            <View style={styles.modalActionsBar}>
              {selectedOrder?.status === 'PENDING' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]}
                  onPress={() => handleUpdateOrderStatus(selectedOrder.id, 'CONFIRMED')}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Confirm Order</Text>
                </TouchableOpacity>
              )}

              {selectedOrder?.status === 'CONFIRMED' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#a855f7' }]}
                  onPress={() => handleUpdateOrderStatus(selectedOrder.id, 'PREPARING')}
                >
                  <Ionicons name="flame-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Start Cooking</Text>
                </TouchableOpacity>
              )}

              {selectedOrder?.status === 'PREPARING' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#f97316' }]}
                  onPress={() => handleUpdateOrderStatus(selectedOrder.id, 'READY')}
                >
                  <Ionicons name="cube-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Mark Ready</Text>
                </TouchableOpacity>
              )}

              {selectedOrder?.status === 'READY' && selectedOrder?.type !== 'DELIVERY' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#22c55e' }]}
                  onPress={() => handleUpdateOrderStatus(selectedOrder.id, 'COMPLETED')}
                >
                  <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Complete Order</Text>
                </TouchableOpacity>
              )}

              {selectedOrder?.status === 'READY' && selectedOrder?.type === 'DELIVERY' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.gold }]}
                  onPress={() => {
                    setDetailModalOpen(false);
                    handleOpenDispatchModal(selectedOrder);
                  }}
                >
                  <Ionicons name="bicycle-outline" size={16} color="#000" />
                  <Text style={[styles.actionBtnText, { color: '#000' }]}>Assign Rider</Text>
                </TouchableOpacity>
              )}

              {['PENDING', 'CONFIRMED'].includes(selectedOrder?.status || '') && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() =>
                    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
                      { text: 'Keep', style: 'cancel' },
                      {
                        text: 'Cancel Order',
                        style: 'destructive',
                        onPress: () => {
                          if (selectedOrder) handleUpdateOrderStatus(selectedOrder.id, 'CANCELLED');
                        },
                      },
                    ])
                  }
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: ASSIGN / REASSIGN ON-DUTY RIDER                                  */}
      {/* ========================================================================= */}
      <Modal
        visible={assignModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setAssignModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Assign Fleet Rider</Text>
                <Text style={styles.modalSubtitle}>
                  Order #{targetOrderForDispatch?.orderNumber} · {targetOrderForDispatch?.customerName}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setAssignModalOpen(false)}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSectionLabel}>Select Eligible On-Duty Rider:</Text>

            <ScrollView style={{ maxHeight: 300 }}>
              {riders.length === 0 ? (
                <View style={{ padding: spacing.md, alignItems: 'center' }}>
                  <Ionicons name="warning-outline" size={32} color="#eab308" />
                  <Text style={[styles.emptyText, { textAlign: 'center' }]}>
                    No riders currently on duty with a verified license. Ask a rider to punch in duty.
                  </Text>
                </View>
              ) : (
                riders.map((r, idx) => {
                  const isSelected = selectedRiderId === r.id;
                  const isLowestWorkload =
                    idx === 0 ||
                    r.activeDeliveriesCount <= Math.min(...riders.map((x) => x.activeDeliveriesCount));

                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[
                        styles.riderChoiceCard,
                        isSelected && styles.riderChoiceCardSelected,
                      ]}
                      onPress={() => setSelectedRiderId(r.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.riderAvatarCircle}>
                        <Ionicons
                          name="bicycle"
                          size={18}
                          color={isSelected ? '#000' : colors.gold}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: spacing.sm }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text
                            style={[
                              styles.riderNameText,
                              isSelected && { color: colors.goldText, fontWeight: 'bold' },
                            ]}
                          >
                            {r.name || 'Fleet Rider'}
                          </Text>
                          {isLowestWorkload && (
                            <View style={styles.recommendedBadge}>
                              <Text style={styles.recommendedBadgeText}>Recommended</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.riderMetaText}>
                          {r.phone || 'No phone'} · {r.vehicleType || 'Bike'}
                        </Text>
                      </View>

                      <View style={styles.workloadBadge}>
                        <Text style={styles.workloadBadgeText}>
                          {r.activeDeliveriesCount} active
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.dispatchNoticeBox}>
              <Ionicons name="timer-outline" size={15} color={colors.gold} />
              <Text style={styles.dispatchNoticeText}>
                Dispatching initiates a 120-second rider acceptance window.
              </Text>
            </View>

            <View style={styles.modalActionsBar}>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: colors.gold },
                  (!selectedRiderId || dispatching) && { opacity: 0.5 },
                ]}
                onPress={handleSubmitDispatch}
                disabled={!selectedRiderId || dispatching}
              >
                {dispatching ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#000" />
                    <Text style={[styles.actionBtnText, { color: '#000' }]}>Confirm Dispatch</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: ADMIN OVERRIDE (ADMIN ONLY)                                      */}
      {/* ========================================================================= */}
      {isAdmin && (
        <Modal
          visible={overrideModalOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setOverrideModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Manager Override</Text>
                  <Text style={styles.modalSubtitle}>Order #{overrideDelivery?.orderNumber}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setOverrideModalOpen(false)}
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSectionLabel}>Select Override Status:</Text>
              <View style={styles.overrideOptionsRow}>
                {['DELIVERED', 'FAILED', 'DECLINED'].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.overridePill,
                      overrideStatus === st && styles.overridePillActive,
                    ]}
                    onPress={() => setOverrideStatus(st)}
                  >
                    <Text
                      style={[
                        styles.overridePillText,
                        overrideStatus === st && styles.overridePillTextActive,
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.modalSectionLabel, { marginTop: spacing.md }]}>
                Reason for Override (required, min 5 chars):
              </Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="e.g. Customer verified delivery in person with cash handover..."
                placeholderTextColor={colors.textMuted}
                value={overrideReason}
                onChangeText={setOverrideReason}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActionsBar}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { backgroundColor: '#ef4444' },
                    overriding && { opacity: 0.5 },
                  ]}
                  onPress={handleSubmitOverride}
                  disabled={overriding}
                >
                  {overriding ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>Confirm Override</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  authGateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  authGateIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    marginBottom: spacing.md,
  },
  authGateTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  authGateSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  authGateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.gold,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.lg,
  },
  authGateButtonText: {
    color: '#000',
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.screenTop,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  headerTitle: {
    fontSize: 16,
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
    marginRight: 5,
  },
  liveText: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: '600',
  },
  syncTimeText: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 3,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconRefreshBtn: {
    padding: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceBorder,
  },
  webConsoleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
  },
  webConsoleText: {
    color: colors.goldText,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef444415',
    borderBottomWidth: 1,
    borderBottomColor: '#ef444440',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    gap: spacing.xs,
  },
  errorBannerText: {
    flex: 1,
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
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
    borderBottomWidth: 2,
    borderBottomColor: colors.gold,
  },
  tabText: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 4,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.goldText,
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
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    marginLeft: spacing.xs,
  },
  filterScroll: {
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
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
    paddingVertical: spacing.xl * 1.5,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  retryOrdersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.purple,
  },
  retryOrdersButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  orderErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#ef444480',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  orderErrorBannerText: {
    flex: 1,
    color: '#ef4444',
    fontSize: 12,
  },
  orderErrorRetryText: {
    color: colors.purple,
    fontWeight: '700',
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  delayedOrderCard: {
    borderColor: '#ef444480',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 3,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  delayedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef444420',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 2,
  },
  delayedBadgeText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  customerName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
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
  itemsSummaryBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginTop: spacing.xs,
    gap: 3,
  },
  itemLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQtyBadge: {
    backgroundColor: colors.surfaceBorder,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginRight: 6,
  },
  itemQtyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text,
  },
  itemLineName: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  moreItemsText: {
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
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
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 3,
  },
  orderTotal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.goldText,
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
    minHeight: 44,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    marginRight: spacing.xs,
    gap: 6,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
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
  detailsIconBtn: {
    padding: 6,
  },
  // Dispatch Styles
  dispatchSubFilterRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: 6,
  },
  dispatchPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  dispatchPillActive: {
    backgroundColor: colors.purpleMuted,
    borderColor: colors.purple,
  },
  dispatchPillText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  dispatchPillTextActive: {
    color: colors.purple,
    fontWeight: 'bold',
  },
  dispatchCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  issueCardBorder: {
    borderColor: '#ef444480',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  dispatchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
    gap: 4,
  },
  addressText: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  dispatchFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  dispatchAssignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  dispatchAssignBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  assignedRiderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginTop: spacing.xs,
  },
  riderAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderNameText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
  },
  riderPhoneText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  callIconBtn: {
    padding: 6,
    borderRadius: borderRadius.full,
    backgroundColor: '#22c55e20',
  },
  stepsTimelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: '#22c55e',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.surfaceBorder,
  },
  stepLineDone: {
    backgroundColor: '#22c55e',
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
    paddingHorizontal: 2,
  },
  stepLabelText: {
    fontSize: 9,
    color: colors.textMuted,
  },
  dispatchActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  reassignBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 4,
  },
  reassignBtnText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
  },
  overrideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.5)',
    gap: 4,
  },
  overrideBtnText: {
    fontSize: 11,
    color: colors.goldText,
    fontWeight: '600',
  },
  exceptionAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef444415',
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginTop: spacing.xs,
    gap: 6,
  },
  exceptionAlertText: {
    flex: 1,
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '500',
  },
  exceptionActionRow: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  safeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  safeActionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  riderRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  riderMetaText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  workloadPill: {
    backgroundColor: colors.surfaceBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  workloadPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },
  // Menu / Stock Styles
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    maxHeight: '92%',
  },
  newOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    borderColor: colors.gold,
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  newOrderPulse: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newOrderBannerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.goldText,
  },
  newOrderBannerSub: {
    fontSize: 11,
    color: colors.text,
    marginTop: 2,
  },
  newOrderBannerBtn: {
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  newOrderBannerBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSectionBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.goldText,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  modalDetailText: {
    fontSize: 12,
    color: colors.text,
    marginBottom: 2,
  },
  modalNotesText: {
    fontSize: 11,
    color: '#eab308',
    fontStyle: 'italic',
    marginTop: 2,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  smallActionBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  itemDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  itemDetailQty: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.goldText,
    width: 24,
  },
  itemDetailName: {
    fontSize: 12,
    color: colors.text,
  },
  itemSpecialInst: {
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  itemDetailPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  paymentMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  riderChoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  riderChoiceCardSelected: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
  },
  recommendedBadge: {
    backgroundColor: '#22c55e20',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 6,
  },
  recommendedBadgeText: {
    color: '#22c55e',
    fontSize: 9,
    fontWeight: 'bold',
  },
  workloadBadge: {
    backgroundColor: colors.surfaceBorder,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  workloadBadgeText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dispatchNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginTop: spacing.xs,
    gap: 6,
  },
  dispatchNoticeText: {
    flex: 1,
    fontSize: 11,
    color: colors.goldText,
  },
  overrideOptionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 4,
  },
  overridePill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  overridePillActive: {
    borderColor: '#ef4444',
    backgroundColor: '#ef444415',
  },
  overridePillText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  overridePillTextActive: {
    color: '#ef4444',
  },
  reasonInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    color: colors.text,
    padding: spacing.sm,
    fontSize: 12,
    textAlignVertical: 'top',
    height: 70,
    marginTop: 4,
  },
});
