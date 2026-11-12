import { useQuery } from '@tanstack/react-query';
import { api, CategoryDto, DishDto, VenueDto, AdminOrderDto } from '../services/api-client';

export const queryKeys = {
  categories: ['categories'] as const,
  dishes: (params?: { categorySlug?: string; isVeg?: boolean }) => ['dishes', params] as const,
  dishDetail: (slug: string) => ['dish', slug] as const,
  venues: ['venues'] as const,
  deliveryZones: ['deliveryZones'] as const,
  customerOrders: ['customerOrders'] as const,
  customerOrder: (id: string) => ['customerOrder', id] as const,
  orderTracking: (orderNumber: string, phone: string) => ['orderTracking', orderNumber, phone] as const,
  adminOrders: (params?: { status?: string; type?: string }) => ['adminOrders', params] as const,
  adminDeliveries: ['adminDeliveries'] as const,
  adminReports: ['adminReports'] as const,
  reservations: ['reservations'] as const,
  eventBookings: ['eventBookings'] as const,
};

export function useCategoriesQuery() {
  return useQuery<CategoryDto[]>({
    queryKey: queryKeys.categories,
    queryFn: () => api.menu.getCategories(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    initialData: api.menu.getCachedCategories,
  });
}

export function useDishesQuery(params?: { categorySlug?: string; isVeg?: boolean }) {
  return useQuery<DishDto[]>({
    queryKey: queryKeys.dishes(params),
    queryFn: () => api.menu.getDishes(params),
    staleTime: 1000 * 60 * 3, // 3 minutes
    initialData: () => api.menu.getCachedDishes(params),
  });
}

export function useDishDetailQuery(slug: string) {
  return useQuery<DishDto>({
    queryKey: queryKeys.dishDetail(slug),
    queryFn: () => api.menu.getDishBySlug(slug),
    enabled: Boolean(slug),
  });
}

export function useVenuesQuery() {
  return useQuery<VenueDto[]>({
    queryKey: queryKeys.venues,
    queryFn: () => api.venues.getVenues(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useDeliveryZonesQuery() {
  return useQuery<any[]>({
    queryKey: queryKeys.deliveryZones,
    queryFn: () => api.deliveryZones.getAll(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCustomerOrdersQuery(enabled = true) {
  return useQuery<any[]>({
    queryKey: queryKeys.customerOrders,
    queryFn: async () => {
      const data = await api.orders.get('');
      return Array.isArray(data) ? data : [];
    },
    enabled,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useOrderTrackingQuery(orderNumber: string, phone: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.orderTracking(orderNumber, phone),
    queryFn: () => api.orders.track(orderNumber, phone),
    enabled: Boolean(orderNumber && phone && enabled),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'DELIVERED' || status === 'CANCELLED') return false;
      return 15000; // 15 seconds live poll if not completed
    },
  });
}

export function useAdminOrdersQuery(params?: { status?: string; type?: string }, enabled = true) {
  return useQuery<AdminOrderDto[]>({
    queryKey: queryKeys.adminOrders(params),
    queryFn: () => api.admin.getOrders(params),
    enabled,
    refetchInterval: 15000,
  });
}

export function useAdminDeliveriesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminDeliveries,
    queryFn: () => api.admin.getDeliveries(),
    enabled,
    refetchInterval: 15000,
  });
}
