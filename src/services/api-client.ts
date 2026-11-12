import type { ApiResponse } from '../shared/types';
import { tokenStorage } from './token-storage';

function cleanUrl(url?: string): string {
  if (!url) return '';
  return url
    .replace(/^[\uFEFF\u200B-\u200D\s]+|[\uFEFF\u200B-\u200D\s]+$/g, '')
    .trim()
    .replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return `http://${host}:3000/api/v1`;
    }
  }

  const rawEnv = process.env.EXPO_PUBLIC_API_URL;
  const envUrl = cleanUrl(rawEnv);
  if (envUrl && !envUrl.includes('purple-haze-git-feature-api-v1-bistacreation-3818.vercel.app')) {
    return envUrl;
  }

  return 'https://purplehaze-nine.vercel.app/api/v1';
}

export const API_BASE_URL = getApiBaseUrl();

export function getWebsiteBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return `http://${host}:3000`;
    }
  }

  const rawEnv = process.env.EXPO_PUBLIC_WEBSITE_URL;
  const envUrl = cleanUrl(rawEnv);
  if (envUrl) {
    return envUrl;
  }

  return 'https://purplehaze-nine.vercel.app';
}

export const WEBSITE_BASE_URL = getWebsiteBaseUrl();

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// ----------------------------------------------------
// Type Definitions (Generated from /api/v1/openapi.json)
// ----------------------------------------------------

export interface UserSessionDto {
  id: string;
  email: string;
  name: string | null;
  phone?: string | null;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  image?: string | null;
}

export interface SavedAddressDto {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthResponseDto {
  user: UserSessionDto;
  tokens: AuthTokensDto;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  sortOrder: number;
  dishCount?: number;
}

export interface DishVariantDto {
  id: string;
  name: string;
  price?: number;
  priceDelta?: number;
  isDefault?: boolean;
}

export interface AddOnDto {
  id: string;
  name: string;
  price: number;
}

export interface DishDto {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  image?: string | null;
  isVeg: boolean;
  isSpicy?: boolean;
  isAvailable: boolean;
  categoryId: string;
  categoryName?: string;
  categorySlug?: string;
  variants?: DishVariantDto[];
  addOns?: AddOnDto[];
}

export interface VenueDto {
  id: string;
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  capacity: number | null;
  image?: string | null;
  images: string[];
  features: string[];
}

export interface CreateReservationDto {
  name: string;
  email: string;
  phone: string;
  date: string; // ISO
  guests: number;
  occasion?: string;
  notes?: string;
}

export interface CreateEventBookingDto {
  venueId?: string;
  name: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string; // ISO
  guests: number;
  message?: string;
}

export interface OrderItemDto {
  dishId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  variantName?: string;
  addOns?: string[];
  instructions?: string;
}

export interface CreateOrderDto {
  details: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    type: 'DELIVERY' | 'PICKUP' | 'DINE_IN';
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zoneId?: string;
    tableNumber?: string;
    notes?: string;
    paymentMethod: 'COD' | 'ESEWA' | 'KHALTI';
    couponCode?: string;
    scheduledFor?: string;
    saveAddress?: boolean;
  };
  items: OrderItemDto[];
  idempotencyKey?: string;
}

export interface CreatedOrderDto {
  orderId: string;
  orderNumber: string;
  publicToken: string;
  confirmationUrl?: string;
  paymentMethod: string;
  digitalPayment: boolean;
  total: number;
}

export interface TrackOrderResultDto {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  createdAt: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
}

export interface AdminSummaryDto {
  totalOrders: number;
  completedOrders: number;
  activeOrders: number;
  totalReservations: number;
  totalEvents: number;
  totalRevenuePaisa: number;
  totalRevenueNpr: number;
}

export interface AdminReportDto {
  summary: AdminSummaryDto;
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    type: string;
    createdAt: string;
  }[];
  topSellingDishes: {
    dishId: string;
    name: string;
    quantitySold: number;
    totalSalesPaisa: number;
  }[];
}

export interface AdminOrderDto {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryAddress?: string | null;
  notes?: string | null;
  total: number;
  subtotal?: number;
  deliveryFee?: number;
  tax?: number;
  discount?: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  type: string;
  createdAt: string;
  acceptedAt?: string | null;
  acceptedBy?: string | null;
  items?: {
    id: string;
    name: string;
    quantity: number;
    price?: number;
    lineTotal?: number;
    specialInstructions?: string | null;
    variantName?: string | null;
  }[];
  statusHistory?: {
    id: string;
    status: string;
    note?: string | null;
    changedBy?: string | null;
    createdAt: string;
  }[];
}

export interface DispatchDeliveryDto {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string | null;
  total: number;
  orderStatus: string;
  deliveryStatus: string;
  provider: string;
  paymentMethod: string;
  rider: {
    id: string;
    name: string | null;
    phone: string | null;
    vehicleType: string;
  } | null;
  otpLocked: boolean;
  otpAttempts: number;
  assignedAt: string;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  arrivedAt: string | null;
  isStuckAssigned: boolean;
  failureReason: string | null;
  items: { name: string; quantity: number }[];
}

export interface UndispatchedOrderDto {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string | null;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

export interface OnDutyRiderDto {
  id: string;
  userId: string;
  name: string | null;
  email?: string;
  phone: string | null;
  vehicleType: string;
  licenseStatus: string;
  shiftStatus: string;
  activeDeliveriesCount: number;
  isBlocked?: boolean;
  licenseExpiresAt?: string | null;
  lastActiveAt?: string | null;
}

export interface AdminOrderDetailDto {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  deliveryAddress: string | null;
  notes?: string | null;
  total: number;
  subtotal?: number;
  deliveryFee?: number;
  tax?: number;
  discount?: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  type: string;
  createdAt: string;
  updatedAt?: string;
  acceptedAt?: string | null;
  acceptedBy?: string | null;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    lineTotal?: number;
    specialInstructions?: string | null;
    variantName?: string | null;
  }[];
  statusHistory?: {
    id: string;
    status: string;
    note?: string | null;
    changedBy?: string | null;
    createdAt: string;
  }[];
  delivery?: {
    id: string;
    status: string;
    provider: string;
    assignedAt?: string | null;
    pickedUpAt?: string | null;
    deliveredAt?: string | null;
    rider?: {
      id: string;
      name: string | null;
      phone: string | null;
      vehicleType?: string;
    } | null;
  } | null;
  deliveryOtp?: string | null;
}

export interface AdminReservationDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  guests: number;
  date: string;
  timeSlot: string;
  status: string;
  tableNumber?: string | null;
  notes?: string | null;
}

// ----------------------------------------------------
// Automatic 401 Refresh Queue & Auth Expiration
// ----------------------------------------------------

type AuthExpiredListener = () => void;
const authExpiredListeners = new Set<AuthExpiredListener>();

export function onAuthExpired(listener: AuthExpiredListener): () => void {
  authExpiredListeners.add(listener);
  return () => {
    authExpiredListeners.delete(listener);
  };
}

function notifyAuthExpired() {
  authExpiredListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore
    }
  });
}

let isRefreshing = false;
let refreshSubscribers: ((newToken: string | null) => void)[] = [];

function onTokenRefreshed(newToken: string | null) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

async function executeTokenRefresh(): Promise<string | null> {
  try {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      notifyAuthExpired();
      return null;
    }
    const response = await fetch(`${cleanUrl(getApiBaseUrl())}/auth/refresh`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const json = await response.json().catch(() => ({})) as ApiResponse<{ tokens: AuthTokensDto; user: UserSessionDto }>;
    const data = json.data;
    if (!response.ok || !data?.tokens?.accessToken || !data.tokens.refreshToken) {
      await tokenStorage.clearTokens();
      notifyAuthExpired();
      return null;
    }
    await Promise.all([
      tokenStorage.setAccessToken(data.tokens.accessToken),
      tokenStorage.setRefreshToken(data.tokens.refreshToken),
      tokenStorage.setUserSession(JSON.stringify(data.user)),
    ]);
    return data.tokens.accessToken;
  } catch (error) {
    console.warn('[API Client] Token refresh network error:', error);
  }

  notifyAuthExpired();
  return null;
}

// ----------------------------------------------------
// Base Request Handler with Auto-Retry
// ----------------------------------------------------

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const baseUrl = cleanUrl(getApiBaseUrl());
  const cleanEndpoint = endpoint.replace(/^[\uFEFF\u200B-\u200D\s]+/, '').trim();
  const url = cleanEndpoint.startsWith('http')
    ? cleanEndpoint
    : `${baseUrl}${cleanEndpoint.startsWith('/') ? '' : '/'}${cleanEndpoint}`;

  const token = await tokenStorage.getAccessToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr) {
    throw new ApiError('NETWORK_ERROR', 'Network connection unavailable. Please check your internet.', 0, netErr);
  }

  // Handle 401 Unauthorized with token refresh & queueing
  if (response.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await executeTokenRefresh();
      isRefreshing = false;
      onTokenRefreshed(newToken);

      if (newToken) {
        return request<T>(endpoint, options, true);
      } else {
        notifyAuthExpired();
      }
    } else {
      return new Promise<T>((resolve, reject) => {
        refreshSubscribers.push((newToken) => {
          if (newToken) {
            resolve(request<T>(endpoint, options, true));
          } else {
            notifyAuthExpired();
            reject(new ApiError('UNAUTHORIZED', 'Session expired. Please sign in again.', 401));
          }
        });
      });
    }
  }

  const json = (await response.json().catch(() => ({}))) as ApiResponse<T>;

  if (!response.ok || json.error) {
    throw new ApiError(
      json.error?.code || 'API_ERROR',
      json.error?.message || response.statusText || 'Request failed',
      response.status,
      json.error?.details
    );
  }

  return json.data as T;
}

// ----------------------------------------------------
// Typed API Services
// ----------------------------------------------------

// ----------------------------------------------------
// Memory Cache for Client-Side SWR
// ----------------------------------------------------
let clientCategoriesCache: { data: CategoryDto[]; expiresAt: number } | null = null;
const clientDishesCache = new Map<string, { data: DishDto[]; expiresAt: number }>();
const CLIENT_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<AuthResponseDto>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    register: (userData: { name: string; email: string; password: string; phone?: string }) =>
      request<AuthResponseDto>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),

    logout: (pushToken?: string, allDevices = false, refreshToken?: string) =>
      request<{ message: string }>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ pushToken, allDevices, refreshToken }),
      }),

    getMe: () => request<UserSessionDto>('/auth/me'),

    googleSignIn: (idToken: string) =>
      request<AuthResponseDto>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      }),
  },

  menu: {
    getCachedCategories: (): CategoryDto[] => {
      return clientCategoriesCache?.data || offlineCategories;
    },

    getCachedDishes: (params?: { categorySlug?: string; isVeg?: boolean }): DishDto[] => {
      const key = `${params?.categorySlug || 'all'}_${params?.isVeg}`;
      const entry = clientDishesCache.get(key);
      if (entry) return entry.data;
      return offlineDishes.filter((dish) =>
        (!params?.categorySlug || dish.categorySlug === params.categorySlug) &&
        (params?.isVeg === undefined || dish.isVeg === params.isVeg)
      );
    },

    getCategories: async (options?: { forceRefresh?: boolean }): Promise<CategoryDto[]> => {
      const now = Date.now();
      if (!options?.forceRefresh && clientCategoriesCache && now < clientCategoriesCache.expiresAt) {
        return clientCategoriesCache.data;
      }

      try {
        const res = await request<CategoryDto[]>('/menu/categories');
        if (Array.isArray(res) && res.length > 0) {
          clientCategoriesCache = { data: res, expiresAt: now + CLIENT_CACHE_TTL_MS };
          return res;
        }
      } catch (e) {
        console.warn('[API Client] Failed to fetch live categories, using offline fallbacks:', e);
      }

      if (clientCategoriesCache?.data) {
        return clientCategoriesCache.data;
      }
      return offlineCategories;
    },

    getDishes: async (
      params?: { categorySlug?: string; isVeg?: boolean },
      options?: { forceRefresh?: boolean }
    ): Promise<DishDto[]> => {
      const key = `${params?.categorySlug || 'all'}_${params?.isVeg}`;
      const now = Date.now();
      const cached = clientDishesCache.get(key);

      if (!options?.forceRefresh && cached && now < cached.expiresAt) {
        return cached.data;
      }

      try {
        const query = new URLSearchParams();
        if (params?.categorySlug) query.set('category', params.categorySlug);
        if (params?.isVeg !== undefined) query.set('isVeg', String(params.isVeg));
        const res = await request<DishDto[]>(`/menu/dishes?${query.toString()}`);
        if (Array.isArray(res) && res.length > 0) {
          clientDishesCache.set(key, { data: res, expiresAt: now + CLIENT_CACHE_TTL_MS });
          return res;
        }
      } catch (e) {
        console.warn('[API Client] Failed to fetch live dishes, using offline fallbacks:', e);
      }

      if (cached?.data) {
        return cached.data;
      }
      return offlineDishes.filter((dish) =>
        (!params?.categorySlug || dish.categorySlug === params.categorySlug) &&
        (params?.isVeg === undefined || dish.isVeg === params.isVeg)
      );
    },

    getDishBySlug: (slug: string) => request<DishDto>(`/menu/dishes/${slug}`),

    search: (q: string) => request<DishDto[]>(`/menu/search?q=${encodeURIComponent(q)}`),
  },

  venues: {
    getVenues: async (): Promise<VenueDto[]> => {
      try {
        const res = await request<VenueDto[]>('/venues');
        if (Array.isArray(res)) return res;
      } catch (e) {
        console.warn('[API Client] Failed to fetch venues, using offline fallbacks:', e);
      }
      return offlineVenues;
    },

    createEventBooking: (data: CreateEventBookingDto) =>
      request<{ id: string; status: string }>('/event-bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getEventBookings: () => request<any[]>('/event-bookings'),
  },

  deliveryZones: {
    getAll: () => request<any[]>('/delivery-zones'),
  },

  checkout: {
    validateCart: (items: any[]) =>
      request<{ valid: boolean; issues?: string[] }>('/cart/validate', {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),

    validateCoupon: (code: string, subtotal: number) =>
      request<{ valid: boolean; discount: number; reason?: string }>('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, subtotal }),
      }),

    calculate: (payload: any) =>
      request<any>('/checkout/calculate', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  reservations: {
    getAll: () => request<any[]>('/reservations'),

    create: (data: CreateReservationDto) =>
      request<{ id: string; status: string; date: string }>('/reservations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  orders: {
    create: (data: CreateOrderDto) =>
      request<CreatedOrderDto>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    track: (orderNumber: string, phone: string) =>
      request<TrackOrderResultDto>(
        `/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`
      ),

    get: (id: string) => request<TrackOrderResultDto>(`/orders/${id}`),

    getLocation: (orderId: string, token?: string) => {
      const headers: Record<string, string> = {};
      if (token) headers['x-order-token'] = token;
      const q = token ? `?token=${encodeURIComponent(token)}` : '';
      return request<{
        active: boolean;
        status: string;
        message?: string;
        location: {
          latitude: number;
          longitude: number;
          speed?: number | null;
          heading?: number | null;
          updatedAt?: string;
        } | null;
      }>(`/orders/${orderId}/location${q}`, { headers });
    },

    cancel: (id: string, reason?: string) =>
      request<{ success: boolean; status: string }>(`/orders/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  profile: {
    get: () => request<UserSessionDto>('/profile'),

    addresses: () => request<SavedAddressDto[]>('/profile/addresses'),

    update: (data: { name: string; phone?: string }) =>
      request<UserSessionDto>('/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteAccount: () =>
      request<{ message: string }>('/profile', {
        method: 'DELETE',
      }),
  },

  assistant: {
    chat: (message: string, history?: { role: 'user' | 'assistant' | 'system'; content: string }[]) =>
      request<{ reply: string; suggestedActions?: string[] }>('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ message, history }),
      }),
  },

  payments: {
    initiate: (orderId: string, provider: 'ESEWA' | 'KHALTI') =>
      request<{
        paymentUrl?: string;
        formUrl?: string;
        params?: Record<string, string>;
        pidx?: string;
      }>('/payments/initiate', {
        method: 'POST',
        body: JSON.stringify({ orderId, provider, appScheme: 'purplehaze' }),
      }),

    verifyEsewa: (data: { orderId: string; refId: string; amt: number }) =>
      request<{ success: boolean; message: string }>('/payments/esewa/verify', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    verifyKhalti: (data: { pidx: string; orderId: string }) =>
      request<{ success: boolean; message: string }>('/payments/khalti/verify', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  notifications: {
    registerPushToken: (token: string, platform?: string) =>
      request<{ success: boolean }>('/notifications/push-token', {
        method: 'POST',
        body: JSON.stringify({ token, platform: platform || 'expo' }),
      }),
  },

  realtime: {
    getToken: () => request<{ token: string; url?: string }>('/realtime/token'),
  },

  admin: {
    getReports: () => request<AdminReportDto>('/admin/reports'),

    getOrders: (params?: { status?: string; type?: string; search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.status && params.status !== 'ALL') q.set('status', params.status);
      if (params?.type && params.type !== 'ALL') q.set('type', params.type);
      if (params?.search) q.set('search', params.search);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit || 50));
      return request<AdminOrderDto[]>(`/admin/orders?${q.toString()}`);
    },

    getOrderDetails: (id: string) =>
      request<AdminOrderDetailDto>(`/orders/${id}`),

    updateOrderStatus: (id: string, status: string, note?: string) =>
      request<{ message: string; order: any }>(`/admin/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, note }),
      }),

    getDeliveries: () =>
      request<{ deliveries: DispatchDeliveryDto[]; undispatchedOrders: UndispatchedOrderDto[] }>(
        '/admin/deliveries'
      ),

    dispatchOrder: (orderId: string, riderProfileId: string) =>
      request<{ id: string; status: string }>('/admin/deliveries/dispatch', {
        method: 'POST',
        body: JSON.stringify({ orderId, riderProfileId }),
      }),

    unlockDeliveryOtp: (deliveryId: string) =>
      request<{ id: string; otpVersion: number; message: string }>(
        `/admin/deliveries/${deliveryId}/otp-unlock`,
        { method: 'POST' }
      ),

    acknowledgeFoodReturn: (deliveryId: string, notes?: string) =>
      request<{ id: string; status: string; returnAcknowledgedAt: string }>(
        `/admin/deliveries/${deliveryId}/acknowledge-return`,
        {
          method: 'POST',
          body: JSON.stringify({ notes }),
        }
      ),

    overrideDelivery: (deliveryId: string, newStatus: string, reason: string) =>
      request<{ id: string; status: string }>(`/admin/deliveries/${deliveryId}/override`, {
        method: 'POST',
        body: JSON.stringify({ newStatus, reason }),
      }),

    getRiders: () =>
      request<OnDutyRiderDto[]>('/admin/riders'),

    getReservations: (params?: { status?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit || 30));
      return request<AdminReservationDto[]>(`/admin/reservations?${q.toString()}`);
    },

    updateReservationStatus: (id: string, status: string, tableNumber?: string) =>
      request<{ message: string }>(`/admin/reservations`, {
        method: 'PUT',
        body: JSON.stringify({ id, status, tableNumber }),
      }),

    getEventBookings: (params?: { status?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit || 30));
      return request<any[]>(`/admin/event-bookings?${q.toString()}`);
    },

    updateEventBookingStatus: (id: string, status: string, notes?: string) =>
      request<{ message: string }>(`/admin/event-bookings`, {
        method: 'PUT',
        body: JSON.stringify({ id, status, notes }),
      }),

    toggleDishAvailability: (id: string, isAvailable: boolean) =>
      request<{ id: string; name: string; isAvailable: boolean }>(`/admin/menu/dishes/${id}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable }),
      }),
  },
};

// ----------------------------------------------------
// Authentic Offline Fallbacks (Purple Haze Biratnagar)
// ----------------------------------------------------

export const offlineCategories: CategoryDto[] = [
  { id: 'cat-chef', name: "Chef's Recommendations", slug: 'chef-recommendations', sortOrder: 0, dishCount: 4 },
  { id: 'cat-nepali', name: 'Nepali Authentic', slug: 'nepali', sortOrder: 1, dishCount: 4 },
  { id: 'cat-indian', name: 'Indian Tandoor & Curries', slug: 'indian', sortOrder: 2, dishCount: 3 },
  { id: 'cat-asian', name: 'Asian & Momo', slug: 'asian', sortOrder: 3, dishCount: 4 },
  { id: 'cat-continental', name: 'Continental & Sizzlers', slug: 'continental', sortOrder: 4, dishCount: 3 },
];

export const offlineDishes: DishDto[] = [
  {
    id: 'dish-1',
    name: 'Steamed Chicken Momo (10 pcs)',
    slug: 'steamed-chicken-momo',
    description: 'Juicy minced chicken infused with wild Himalayan timur pepper, scallions, and roasted coriander; served with stone-ground tomato timur chutney.',
    price: 24000,
    isVeg: false,
    isAvailable: true,
    categoryId: 'cat-asian',
    categoryName: 'Asian & Momo',
    categorySlug: 'asian',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80',
  },
  {
    id: 'dish-2',
    name: 'Special Chicken Jhol Momo',
    slug: 'special-chicken-jhol-momo',
    description: 'Juicy steamed dumplings immersed in a fragrant, tangy sesame-peanut broth spiked with wild Himalayan timur and garden cilantro.',
    price: 28000,
    isVeg: false,
    isAvailable: true,
    categoryId: 'cat-asian',
    categoryName: 'Asian & Momo',
    categorySlug: 'asian',
    image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&q=80',
  },
  {
    id: 'dish-3',
    name: 'Paneer Butter Masala',
    slug: 'paneer-butter-masala',
    description: 'Artisanal cottage cheese simmered in a velvety slow-reduced tomato-cashew butter gravy infused with fragrant mountain kasuri methi.',
    price: 38000,
    isVeg: true,
    isAvailable: true,
    categoryId: 'cat-indian',
    categoryName: 'Indian Tandoor & Curries',
    categorySlug: 'indian',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80',
  },
  {
    id: 'dish-4',
    name: 'Purple Haze Chicken Sizzler',
    slug: 'purple-haze-chicken-sizzler',
    description: 'Flame-grilled tender chicken breast sizzling over cast iron with charcoal embers, buttered garden vegetables, garlic rice, and cracked black pepper jus.',
    price: 55000,
    isVeg: false,
    isAvailable: true,
    categoryId: 'cat-continental',
    categoryName: 'Continental & Sizzlers',
    categorySlug: 'continental',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
  },
  {
    id: 'dish-5',
    name: 'Crispy Buff Sukuti Sadeko',
    slug: 'crispy-buff-sukuti-sadeko',
    description: 'Highland cured meat crisped over open fire, hand-tossed in pungent stone-ground mustard oil, wild Himalayan timur pepper, charred garlic, and green chilies.',
    price: 32000,
    isVeg: false,
    isAvailable: true,
    categoryId: 'cat-nepali',
    categoryName: 'Nepali Authentic',
    categorySlug: 'nepali',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
  },
  {
    id: 'dish-6',
    name: 'Newari Chicken Choila',
    slug: 'newari-chicken-choila',
    description: 'Smokey chicken roasted over glowing charcoal embers, seasoned with raw mustard oil, roasted fenugreek, and crushed Newari spices.',
    price: 35000,
    isVeg: false,
    isAvailable: true,
    categoryId: 'cat-nepali',
    categoryName: 'Nepali Authentic',
    categorySlug: 'nepali',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&q=80',
  },
  {
    id: 'dish-7',
    name: 'Mutton Fila (Charcoal Grilled)',
    slug: 'mutton-fila-charcoal-grilled',
    description: 'Prime cuts of tender mutton steeped in stone-ground mustard oil and wild Himalayan timur, flame-kissed over charcoal embers with rich Newari spices.',
    price: 58000,
    isVeg: false,
    isAvailable: true,
    categoryId: 'cat-nepali',
    categoryName: 'Nepali Authentic',
    categorySlug: 'nepali',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    variants: [
      { id: 'v-fila-med', name: 'Medium Well & Juicy', priceDelta: 0, isDefault: true },
      { id: 'v-fila-char', name: 'Charred Crispy Edge', priceDelta: 0 },
      { id: 'v-fila-timur', name: 'Extra Wild Timur Crust', priceDelta: 3000 },
    ],
  },
  {
    id: 'dish-8',
    name: 'Special Newari Khaja Set',
    slug: 'special-newari-khaja-set',
    description: 'Authentic royal Newari feast: beaten baji rice, charcoal choila, aloo tama curry, bhatmas sadeko, and house-pickled radish in stone-ground mustard oil.',
    price: 45000,
    isVeg: false,
    isAvailable: true,
    categoryId: 'cat-nepali',
    categoryName: 'Nepali Authentic',
    categorySlug: 'nepali',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
    variants: [
      { id: 'v-khaja-chicken', name: 'Chicken Choila Style', priceDelta: 0, isDefault: true },
      { id: 'v-khaja-buff', name: 'Buff Sukuti Style', priceDelta: 4000 },
      { id: 'v-khaja-veg', name: 'Mushroom & Paneer (Veg)', priceDelta: -3000 },
    ],
  },
];

export const offlineVenues: VenueDto[] = [
  {
    id: 'venue-banquet-hall',
    name: 'Banquet Hall',
    slug: 'banquet-hall',
    tagline: 'Grand indoor banquet hall for up to 300 guests',
    description:
      'A grand indoor hall welcoming up to 300 guests for weddings, receptions, celebrations, and large corporate events.',
    capacity: 300,
    image: 'https://purplehaze-nine.vercel.app/images/venues/banquet.jpg',
    images: [
      'https://purplehaze-nine.vercel.app/images/venues/banquet.jpg',
      'https://purplehaze-nine.vercel.app/images/venues/banquet-hall-setup.jpg',
      'https://purplehaze-nine.vercel.app/images/venues/Bighall.jpg',
      'https://purplehaze-nine.vercel.app/images/venues/hall-stage.jpg',
    ],
    features: [
      'Up to 300 guests',
      'Weddings & Receptions',
      'Celebrations & Galas',
      'Large Corporate Events',
      'Staging & Presentation Area',
    ],
  },
  {
    id: 'venue-meeting-hall-100',
    name: 'Meeting Hall (100 Guests)',
    slug: 'meeting-hall-100',
    tagline: 'Professional conference & workshop hall for up to 100 guests',
    description:
      'A dedicated indoor hall tailored for corporate meetings, seminars, workshops, and private gatherings for up to 100 guests.',
    capacity: 100,
    image: 'https://purplehaze-nine.vercel.app/images/venues/meeting-hall.jpg',
    images: [
      'https://purplehaze-nine.vercel.app/images/venues/meeting-hall.jpg',
      'https://purplehaze-nine.vercel.app/images/venues/meeting.jpg',
    ],
    features: [
      'Up to 100 guests',
      'Corporate Meetings',
      'Seminars & Training',
      'Interactive Workshops',
      'Private Gatherings',
    ],
  },
  {
    id: 'venue-meeting-hall-50',
    name: 'Meeting Hall (50 Guests)',
    slug: 'meeting-hall-50',
    tagline: 'Focused meeting & intimate event space for up to 50 guests',
    description:
      'An intimate meeting space ideally proportioned for smaller meetings, focused workshops, and intimate private events of up to 50 guests.',
    capacity: 50,
    image: 'https://purplehaze-nine.vercel.app/images/venues/mini-hall.jpg',
    images: [
      'https://purplehaze-nine.vercel.app/images/venues/mini-hall.jpg',
      'https://purplehaze-nine.vercel.app/images/venues/meeting.jpg',
    ],
    features: [
      'Up to 50 guests',
      'Smaller Meetings',
      'Interactive Workshops',
      'Intimate Private Events',
      'Team Discussions',
    ],
  },
  {
    id: 'venue-open-garden',
    name: 'Open Garden',
    slug: 'open-garden',
    tagline: 'Signature open-air garden under Biratnagar evening lights',
    description:
      'Our signature open-air garden space surrounded by greenery and evening lights, perfect for weddings, outdoor celebrations, corporate gatherings, and music events.',
    capacity: null,
    image: 'https://purplehaze-nine.vercel.app/images/venues/garden-lawn.jpg',
    images: [
      'https://purplehaze-nine.vercel.app/images/venues/garden-lawn.jpg',
      'https://purplehaze-nine.vercel.app/images/venues/garden.jpg',
      'https://purplehaze-nine.vercel.app/images/venues/garden-sitting-area.jpg',
      'https://purplehaze-nine.vercel.app/images/venues/outdoor-party.jpg',
    ],
    features: [
      'Capacity on enquiry',
      'Outdoor Weddings',
      'Open-Air Celebrations',
      'Corporate Gatherings',
      'Music & Cultural Events',
    ],
  },
];
