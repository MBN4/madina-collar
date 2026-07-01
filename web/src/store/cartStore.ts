import { create } from "zustand";
import { persist } from "zustand/middleware";

type CartItems = Record<string, Record<string, number>>;

type CartState = {
  cart: CartItems;
  updateQuantity: (cartKey: string, size: string, delta: number) => void;
  removeItem: (cartKey: string, size: string) => void;
  resetCart: () => void;
  getTotalItems: () => number;
};

export const useCartStore = create<
  CartState,
  [["zustand/persist", Partial<CartState>]]
>(
  persist(
    (set, get) => ({
      cart: {},
      updateQuantity: (cartKey, size, delta) => {
        set((state) => {
          const currentConfigCart = state.cart[cartKey] || {};
          const currentQty = currentConfigCart[size] || 0;
          const newQty = Math.min(100, Math.max(0, currentQty + delta));
          const updatedConfig = { ...currentConfigCart, [size]: newQty };
          if (newQty === 0) delete updatedConfig[size];
          const newCart = { ...state.cart };
          if (Object.keys(updatedConfig).length === 0) {
            delete newCart[cartKey];
          } else {
            newCart[cartKey] = updatedConfig;
          }
          return { cart: newCart };
        });
      },
      removeItem: (cartKey, size) => {
        set((state) => {
          const newCart = { ...state.cart };
          if (newCart[cartKey]) {
            delete newCart[cartKey][size];
            if (Object.keys(newCart[cartKey]).length === 0)
              delete newCart[cartKey];
          }
          return { cart: newCart };
        });
      },
      resetCart: () => set({ cart: {} }),
      getTotalItems: () => {
        const { cart } = get();
        let total = 0;
        Object.values(cart).forEach((config) => {
          Object.values(config).forEach((qty) => {
            total += qty;
          });
        });
        return total;
      },
    }),
    {
      name: "madina-collar-cart",
      partialize: (state) => ({ cart: state.cart }),
    },
  ),
);
