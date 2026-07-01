import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";
import styles from "../styles/Checkout.module.css";
import { Quality } from "../types";
import api from "../utils/api";

type CartItem = {
  key: string;
  quality: string;
  style: string;
  category: string;
  color: string;
  width?: string | null;
  size: string;
  qty: number;
  price: number;
};

export default function Checkout() {
  const router = useRouter();
  const isAuthenticated = useRequireAuth();
  const { cart, getTotalItems, removeItem, resetCart } = useCartStore();
  const { token, logout } = useAuthStore();
  const [biltiInfo, setBiltiInfo] = useState("");
  const [catalog, setCatalog] = useState<Quality[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const cartItemsList = useMemo(() => {
    if (!catalog.length) return [];
    const items: CartItem[] = [];
    Object.entries(cart).forEach(([key, sizes]) => {
      const parts = key.split("|");
      const qName = parts[0];
      const sName = parts[1];
      const catVal = parts[2];
      const colVal = parts[3];
      const widVal = parts[4] || null;
      const quality = catalog.find((q) => q.name === qName);
      const style = quality?.Styles?.find((s) => s.name === sName);
      Object.entries(sizes).forEach(([sizeVal, qty]) => {
        const catId = style?.ProductAttributes?.find(
          (a) => a.type === "category" && a.value === catVal,
        )?.id;
        const colId = style?.ProductAttributes?.find(
          (a) => a.type === "color" && a.value === colVal,
        )?.id;
        const widId = widVal
          ? style?.ProductAttributes?.find(
              (a) => a.type === "width" && a.value === widVal,
            )?.id
          : null;
        const sizeId = style?.ProductAttributes?.find(
          (a) => a.type === "size" && a.value === sizeVal,
        )?.id;
        const matrixMatch = style?.PriceMatrices?.find(
          (p) =>
            p.categoryId === catId &&
            p.colorId === colId &&
            (widId ? p.widthId === widId : true) &&
            p.sizeId === sizeId,
        );
        const price = matrixMatch ? Number(matrixMatch.price) : 0;
        items.push({
          key,
          quality: qName,
          style: sName,
          category: catVal,
          color: colVal,
          width: widVal,
          size: sizeVal,
          qty,
          price,
        });
      });
    });
    return items;
  }, [cart, catalog]);

  const totalAmount = useMemo(
    () => cartItemsList.reduce((acc, item) => acc + item.price * item.qty, 0),
    [cartItemsList],
  );
  const totalItems = getTotalItems();

  const fetchCatalog = async () => {
    try {
      const res = await api.get("/admin/qualities");
      setCatalog(res.data);
    } catch (err) {
      console.error("Catalog fetch failed");
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchCatalog();
  }, [isAuthenticated]);

  const handlePlaceOrder = async () => {
    if (!biltiInfo) {
      setMessage("Please enter Bilti information.");
      return;
    }
    if (!cartItemsList.length) {
      setMessage("Your cart is empty.");
      return;
    }

    setLoading(true);
    try {
      await api.post(
        "/orders/place",
        {
          cartItems: cartItemsList,
          totalAmount,
          paymentMethod: "Transfer / Cash",
          biltiInfo,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      resetCart();
      router.push("/orders");
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
        router.push("/auth");
      } else {
        setMessage("Failed to place order.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <PageShell title="Checkout">
      <div className={styles.checkoutShell}>
        <div className={styles.heroCard}>
          <div>
            <div className={styles.heroTitle}>Ready to place your order?</div>
            <p className={styles.heroText}>
              The web checkout mirrors the mobile flow with the same cart
              details and delivery step.
            </p>
          </div>
          <div className={styles.heroAmount}>Rs {totalAmount}</div>
        </div>

        <div className={styles.checkoutGrid}>
          <div className={styles.summaryPanel}>
            <div className={styles.sectionHeading}>
              <h2>Order Summary</h2>
              <span>{totalItems} items selected</span>
            </div>
            <div className={styles.summaryHint}>
              Your order is built from the same cart structure as the mobile app
              and posted to the backend through the live API.
            </div>
            <div className={styles.list}>
              {cartItemsList.map((item, index) => (
                <div key={index} className={styles.itemRow}>
                  <div className={styles.itemMain}>
                    <p className={styles.itemTitle}>
                      {item.quality} • {item.style}
                    </p>
                    <p className={styles.itemMeta}>
                      {item.category} • {item.color}{" "}
                      {item.width ? `• W:${item.width}` : ""} • Size:{" "}
                      {item.size}
                    </p>
                  </div>
                  <div className={styles.itemPricing}>
                    <span>
                      {item.qty} x Rs {item.price}
                    </span>
                    <button
                      className={styles.removeButton}
                      onClick={() => removeItem(item.key, item.size)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {!cartItemsList.length && (
                <div className={styles.empty}>
                  No items yet. Return to collections to add fabric selections.
                </div>
              )}
            </div>
          </div>

          <div className={styles.detailsPanel}>
            <div className={styles.sectionHeading}>
              <h2>Delivery Details</h2>
              <span>Step 2</span>
            </div>
            <textarea
              value={biltiInfo}
              onChange={(e) => setBiltiInfo(e.target.value)}
              placeholder="Bilti address / phone details"
            />
            <div className={styles.totalRow}>
              <span>Total Items</span>
              <strong>{totalItems}</strong>
            </div>
            <div className={styles.totalRow}>
              <span>Total Amount</span>
              <strong>Rs {totalAmount}</strong>
            </div>
            {message && <div className={styles.message}>{message}</div>}
            <button
              className={styles.placeButton}
              onClick={handlePlaceOrder}
              disabled={loading || !cartItemsList.length}
            >
              {loading ? "Placing order..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
