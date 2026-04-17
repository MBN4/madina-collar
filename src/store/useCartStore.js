import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
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
        if (Object.keys(newCart[cartKey]).length === 0) {
          delete newCart[cartKey];
        }
      }
      return { cart: newCart };
    });
  },
  getTotalItems: () => {
    const { cart } = get();
    let total = 0;
    Object.values(cart).forEach(config => {
      Object.values(config).forEach(qty => {
        total += qty;
      });
    });
    return total;
  }
}));