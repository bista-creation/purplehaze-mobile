import { tokenStorage } from './token-storage';
import type { ApiResponse } from '../shared/types';

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
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress?: string;
  type?: 'DELIVERY' | 'PICKUP' | 'DINE_IN';
  paymentMethod?: 'COD' | 'ESEWA' | 'KHALTI';
  items: OrderItemDto[];
  notes?: string;
  idempotencyKey?: string;
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
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
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
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    type: string;
    createdAt: string;
  }>;
  topSellingDishes: Array<{
    dishId: string;
    name: string;
    quantitySold: number;
    totalSalesPaisa: number;
  }>;
}

export interface AdminOrderDto {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  total: number;
  status: string;
  paymentStatus: string;
  type: string;
  createdAt: string;
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
    lineTotal: number;
  }>;
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
// Automatic 401 Refresh Queue
// ----------------------------------------------------

let isRefreshing = false;
let refreshSubscribers: Array<(newToken: string | null) => void> = [];

function onTokenRefreshed(newToken: string | null) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

async function executeTokenRefresh(): Promise<string | null> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  const baseUrl = getApiBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      await tokenStorage.clearTokens();
      return null;
    }

    const json = (await res.json()) as ApiResponse<AuthTokensDto>;
    if (json.data?.accessToken && json.data?.refreshToken) {
      await tokenStorage.setAccessToken(json.data.accessToken);
      await tokenStorage.setRefreshToken(json.data.refreshToken);
      return json.data.accessToken;
    }
  } catch (error) {
    console.warn('[API Client] Token refresh network error:', error);
  }

  await tokenStorage.clearTokens();
  return null;
}

// ----------------------------------------------------
// Base Request Handler with Auto-Retry
// ----------------------------------------------------

async function request<T>(
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
      }
    } else {
      return new Promise<T>((resolve, reject) => {
        refreshSubscribers.push((newToken) => {
          if (newToken) {
            resolve(request<T>(endpoint, options, true));
          } else {
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

    logout: (pushToken?: string, allDevices = false) =>
      request<{ message: string }>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ pushToken, allDevices }),
      }),

    getMe: () => request<UserSessionDto>('/auth/me'),

    googleSignIn: (idToken: string) =>
      request<AuthResponseDto>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      }),
  },

  menu: {
    getCategories: async (): Promise<CategoryDto[]> => {
      try {
        const res = await request<CategoryDto[]>('/menu/categories');
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {
        console.warn('[API Client] Failed to fetch live categories, using offline fallbacks:', e);
      }
      return offlineCategories;
    },

    getDishes: async (params?: { categoryId?: string; isVeg?: boolean }): Promise<DishDto[]> => {
      try {
        const query = new URLSearchParams();
        if (params?.categoryId) query.set('categoryId', params.categoryId);
        if (params?.isVeg !== undefined) query.set('isVeg', String(params.isVeg));
        const res = await request<DishDto[]>(`/menu/dishes?${query.toString()}`);
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {
        console.warn('[API Client] Failed to fetch live dishes, using offline fallbacks:', e);
      }
      return offlineDishes;
    },

    getDishBySlug: (slug: string) => request<DishDto>(`/menu/dishes/${slug}`),

    search: (q: string) => request<DishDto[]>(`/menu/search?q=${encodeURIComponent(q)}`),
  },

  venues: {
    getVenues: async (): Promise<VenueDto[]> => {
      try {
        const res = await request<VenueDto[]>('/venues');
        if (Array.isArray(res) && res.length > 0) return res;
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
  },

  reservations: {
    create: (data: CreateReservationDto) =>
      request<{ id: string; status: string; date: string }>('/reservations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  orders: {
    create: (data: CreateOrderDto) =>
      request<{ orderId: string; orderNumber: string; total: number }>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    track: (orderNumber: string, phone: string) =>
      request<TrackOrderResultDto>('/orders/track', {
        method: 'POST',
        body: JSON.stringify({ orderNumber, phone }),
      }),

    get: (id: string) => request<TrackOrderResultDto>(`/orders/${id}`),

    cancel: (id: string, reason?: string) =>
      request<{ success: boolean; status: string }>(`/orders/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  profile: {
    get: () => request<UserSessionDto>('/profile'),

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
    chat: (message: string, history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>) =>
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
  },

  admin: {
    getReports: () => request<AdminReportDto>('/admin/reports'),

    getOrders: (params?: { status?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit || 30));
      return request<AdminOrderDto[]>(`/admin/orders?${q.toString()}`);
    },

    updateOrderStatus: (id: string, status: string, note?: string) =>
      request<{ message: string; order: any }>(`/admin/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, note }),
      }),

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
    description: 'Biratnagar favorite! Minced chicken with Himalayan herbs, served with spicy tomato timur chutney.',
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
    description: 'Juicy steamed momos immersed in a rich, tangy sesame-peanut broth with cilantro.',
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
    description: 'Fresh cottage cheese cubes cooked in a velvety tomato-cashew butter gravy infused with kasuri methi.',
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
    description: 'Grilled tender chicken breast served on a smoking iron platter with garlic rice, buttered vegetables, and pepper sauce.',
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
    description: 'Traditional dried buffalo meat tossed with mustard oil, roasted cumin, garlic, green chilies, and fresh ginger.',
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
    description: 'Smokey clay-oven roasted chicken marinated with fenugreek seeds, mustard oil, garlic, and fresh green chili.',
    price: 35000,
    isVeg: false,
    isAvailable: true,
    categoryId: 'cat-nepali',
    categoryName: 'Nepali Authentic',
    categorySlug: 'nepali',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&q=80',
  },
];

export const offlineVenues: VenueDto[] = [
  {
    id: 'venue-rooftop',
    name: 'Rooftop Terrace',
    slug: 'rooftop',
    tagline: 'Dinner under the stars with Biratnagar city night skyline',
    capacity: 120,
    images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'],
    features: ['Panoramic City View', 'Acoustic Live Music Setup', 'Cocktail Bar', 'Open Air Seating'],
  },
  {
    id: 'venue-hall',
    name: 'Grand Banquet Hall',
    slug: 'hall',
    tagline: 'Air-conditioned modern banquet hall for weddings and celebrations',
    capacity: 250,
    images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80'],
    features: ['Fully Air Conditioned', 'Projector & Sound System', 'Custom Buffet Stations', 'Private Dressing Suite'],
  },
  {
    id: 'venue-garden',
    name: 'Garden Courtyard',
    slug: 'garden',
    tagline: 'Lush greenery, fairy lights, and live BBQ for celebrations',
    capacity: 180,
    images: ['https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80'],
    features: ['Live Tandoor & BBQ Station', 'Fairy Light Ambiance', 'Outdoor Cocktail Area', 'Child-Friendly Space'],
  },
];
