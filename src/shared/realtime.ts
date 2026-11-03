export const REALTIME_CHANNELS = {
  adminOrders: "admin-orders",
  adminBookings: "admin-orders",
  publicMenu: "menu-availability",
  menuAvailability: "menu-availability",
  orderTracking: (orderId: string) => `order-${orderId}`,
  userOrders: (userId: string) => `user-${userId}`,
  userChannel: (userId: string) => `user-${userId}`,
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
