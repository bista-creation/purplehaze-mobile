import { create } from "zustand";
import type { CartItem } from "../shared";

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "cartItemId" | "lineTotal">) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotalPaisa: () => number;
  getSubtotalNpr: () => number;
};

function generateCartItemId(
  dishId: string,
  variantId?: string | null,
  addOns: Array<{ id: string }> = [],
): string {
  const sortedAddOnIds = addOns
    .map((a) => a.id)
    .sort()
    .join(",");
  return `${dishId}_${variantId || "default"}_${sortedAddOnIds}`;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (newItem) => {
    const cartItemId = generateCartItemId(
      newItem.dishId,
      newItem.variantId,
      newItem.addOns,
    );

    const unitPrice =
      newItem.basePrice +
      newItem.variantPriceDelta +
      newItem.addOns.reduce((sum, a) => sum + a.price, 0);

    set((state) => {
      const existingIndex = state.items.findIndex(
        (i) => i.cartItemId === cartItemId,
      );

      if (existingIndex >= 0) {
        const updated = [...state.items];
        const existing = updated[existingIndex];
        const newQty = Math.min(20, existing.quantity + newItem.quantity);
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          lineTotal: newQty * unitPrice,
        };
        return { items: updated };
      }

      const fullItem: CartItem = {
        ...newItem,
        cartItemId,
        lineTotal: newItem.quantity * unitPrice,
      };

      return { items: [...state.items, fullItem] };
    });
  },

  removeItem: (cartItemId) => {
    set((state) => ({
      items: state.items.filter((i) => i.cartItemId !== cartItemId),
    }));
  },

  updateQuantity: (cartItemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(cartItemId);
      return;
    }

    set((state) => ({
      items: state.items.map((item) => {
        if (item.cartItemId !== cartItemId) return item;
        const clampedQty = Math.min(20, Math.max(1, quantity));
        const unitPrice = item.lineTotal / item.quantity;
        return {
          ...item,
          quantity: clampedQty,
          lineTotal: clampedQty * unitPrice,
        };
      }),
    }));
  },

  clearCart: () => set({ items: [] }),

  getItemCount: () => {
    return get().items.reduce((total, i) => total + i.quantity, 0);
  },

  getSubtotalPaisa: () => {
    return get().items.reduce((total, i) => total + i.lineTotal, 0);
  },

  getSubtotalNpr: () => {
    return get().getSubtotalPaisa() / 100;
  },
}));
