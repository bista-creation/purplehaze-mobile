export const ROLES = ["CUSTOMER", "STAFF", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_TYPES = ["DELIVERY", "PICKUP", "DINE_IN"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["COD", "ESEWA", "KHALTI"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED", "FAILED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const STATUS_META: Record<
  OrderStatus,
  { label: string; description: string; color: string }
> = {
  PENDING: {
    label: "Order Placed",
    description: "Received by restaurant, awaiting confirmation",
    color: "#f59e0b",
  },
  CONFIRMED: {
    label: "Confirmed",
    description: "Order accepted by our team",
    color: "#3b82f6",
  },
  PREPARING: {
    label: "Cooking in Kitchen",
    description: "Our chefs are preparing your food fresh",
    color: "#8b5cf6",
  },
  READY: {
    label: "Ready for Handover",
    description: "Packed and ready for rider or pickup",
    color: "#ec4899",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    description: "Rider is heading to your address",
    color: "#06b6d4",
  },
  COMPLETED: {
    label: "Delivered",
    description: "Order completed. Enjoy your meal!",
    color: "#10b981",
  },
  CANCELLED: {
    label: "Cancelled",
    description: "This order has been cancelled",
    color: "#ef4444",
  },
};
