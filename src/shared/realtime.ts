export const REALTIME_CHANNELS = {
  adminOrders: "orders:admin",
  adminBookings: "bookings:admin",
  publicMenu: "menu:public",
  orderTracking: (orderId: string) => `orders:${orderId}`,
  userOrders: (userId: string) => `orders:user:${userId}`,
} as const;

export const REALTIME_EVENTS = {
  orderCreated: "order.created",
  orderStatusUpdated: "order.status_updated",
  menuUpdated: "menu.updated",
  bookingUpdated: "booking.updated",
  promotionUpdated: "promotion.updated",
} as const;

export type OrderStatusUpdatedPayload = {
  orderId: string;
  orderNumber: string;
  status: string;
  previousStatus?: string;
  note?: string | null;
  updatedAt: string;
};

export type MenuUpdatedPayload = {
  type: "dish_availability" | "dish_price" | "category_updated";
  dishId?: string;
  dishName?: string;
  isAvailable?: boolean;
  price?: number;
  categoryId?: string;
  updatedAt: string;
};
