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

export const BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const TIME_SLOTS = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
  "5:30 PM",
  "6:00 PM",
  "6:30 PM",
  "7:00 PM",
  "7:30 PM",
  "8:00 PM",
  "8:30 PM",
  "9:00 PM",
] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];

export const EVENT_TYPES = [
  "Wedding",
  "Reception",
  "Birthday",
  "Anniversary",
  "Corporate meeting",
  "Conference / seminar",
  "Private party",
  "Other",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const SEATING_OPTIONS = [
  { id: 'garden', label: 'Lush Garden', icon: 'leaf-outline', description: 'Open-air dining amidst natural greenery & ambient lighting' },
  { id: 'cabin', label: 'Private Cabin', icon: 'shield-outline', description: 'Exclusive intimate dining cabin for families and private gatherings' },
  { id: 'indoor', label: 'Indoor Lounge', icon: 'business-outline', description: 'Climate-controlled relaxed indoor dining hall' },
] as const;

/**
 * Detects placeholder or test strings (e.g. "jhfvhjvhjbbkvkvk", "asdf", "test")
 * so the customer UI can omit rendering them cleanly without exposing database cleanup text.
 */
export function isPlaceholderDescription(desc?: string | null): boolean {
  if (!desc) return true;
  const trimmed = desc.trim();
  if (trimmed.length === 0) return true;
  return /^(jhfv|test|asdf|mock|[bcdfghjklmnpqrstvwxyz]{6,})/i.test(trimmed);
}

