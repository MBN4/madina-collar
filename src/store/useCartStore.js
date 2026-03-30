import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  cart: {},
  updateQuantity: (quality, size, delta) => {
    set((state) => {
      const currentQualityCart = state.cart[quality] || {};
      const currentQty = currentQualityCart[size] || 0;
      const newQty = Math.min(100, Math.max(0, currentQty + delta));
      return {
        cart: {
          ...state.cart,
          [quality]: { ...currentQualityCart, [size]: newQty },
        },
      };
    });
  },
  getTotalItems: () => {
    const { cart } = get();
    let total = 0;
    Object.values(cart).forEach(q => Object.values(q).forEach(qty => total += qty));
    return total;
  }
}));