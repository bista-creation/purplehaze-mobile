import type {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  Role,
} from "./constants";

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: unknown;
  };
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
};

export type UserProfileDto = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: Role;
  image: string | null;
  createdAt: string;
};

export type MenuCategoryDto = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  sortOrder: number;
  isActive: boolean;
  dishCount?: number;
};

export type DishVariantDto = {
  id: string;
  name: string;
  priceDelta: number;
  isDefault: boolean;
  isAvailable: boolean;
};

export type DishAddOnDto = {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
};

export type MenuDishDto = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  details?: string | null;
  price: number; // in paisa
  comparePrice?: number | null;
  image?: string | null;
  isVeg: boolean;
  isSpicy: boolean;
  isFeatured: boolean;
  isAvailable: boolean;
  prepTime: number;
  calories?: number | null;
  variants: DishVariantDto[];
  addOns: Array<{ addOn: DishAddOnDto }>;
};

export type CartItem = {
  cartItemId: string; // unique key for this combination
  dishId: string;
  name: string;
  slug: string;
  image?: string | null;
  basePrice: number;
  variantId?: string | null;
  variantName?: string | null;
  variantPriceDelta: number;
  addOns: Array<{ id: string; name: string; price: number }>;
  instructions?: string;
  quantity: number;
  lineTotal: number;
};

export type OrderSummaryDto = {
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  itemCount: number;
};

export type OrderDto = {
  id: string;
  orderNumber: string;
  publicToken: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  type: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  deliveryAddress?: string | null;
  notes?: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    basePrice: number;
    lineTotal: number;
    variantName?: string | null;
    addOns?: string | null;
    instructions?: string | null;
  }>;
};

export type AddressDto = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  isDefault: boolean;
};
