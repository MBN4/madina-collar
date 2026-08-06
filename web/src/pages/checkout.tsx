import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, PlusCircle, Truck, Trash2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { FieldTextarea } from "../components/ui/FieldInput";
import PageShell from "../components/PageShell";
import SizeLabel from "../components/SizeLabel";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";
import styles from "../styles/Checkout.module.css";
import { Quality } from "../types";
import api from "../utils/api";
import { sizeToNumber } from "../utils/sizeOrder";

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
  const [showDetails, setShowDetails] = useState(true);

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
    return items.sort((a, b) => sizeToNumber(a.size) - sizeToNumber(b.size));
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
    <PageShell title="">
      <div className={styles.checkoutShell}>
        <div className={styles.headerRow}>
          <h1 className={styles.headerTitle}>Order Summary</h1>
          <Button
            variant="ghost"
            className={styles.addMore}
            onClick={() => router.push("/catalog")}
          >
            <PlusCircle size={16} />
            Add
          </Button>
        </div>

        <div className={styles.checkoutGrid}>
          <Card className={styles.summaryPanel}>
            <div className={styles.summaryTop}>
              <span className={styles.summaryLabel}>Total Payable</span>
              <button className={styles.trayToggle} onClick={() => setShowDetails((v) => !v)}>
                {showDetails ? "Hide" : "Show"}
                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
            <div className={styles.mainStats}>
              <div>
                <div className={styles.statSub}>Total Volume</div>
                <div className={styles.statVal}>{totalItems} Pcs</div>
              </div>
              <div>
                <div className={styles.statSub} style={{ textAlign: "right" }}>
                  Total Amount
                </div>
                <div className={styles.grandAmount}>Rs {totalAmount}</div>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {showDetails && (
                <motion.div
                  className={styles.itemTray}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{ overflow: "hidden" }}
                >
                  {cartItemsList.map((item, index) => (
                    <div key={index} className={styles.itemRow}>
                      <div className={styles.itemMain}>
                        <p className={styles.itemTitle}>
                          {item.quality} • {item.style}
                        </p>
                        <p className={styles.itemMeta}>
                          {item.category} • {item.color}{" "}
                          {item.width ? (
                            <>
                              • W:<SizeLabel value={item.width} />{" "}
                            </>
                          ) : (
                            ""
                          )}
                          • Size:{" "}
                          <SizeLabel value={item.size} />
                        </p>
                      </div>
                      <div className={styles.itemPricing}>
                        <span className={styles.itemQty}>{item.qty}x</span>
                        <button
                          className={styles.removeButton}
                          onClick={() => removeItem(item.key, item.size)}
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {!cartItemsList.length && (
                    <div className={styles.empty}>
                      No items yet. Return to collections to add fabric selections.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          <Card className={styles.detailsPanel}>
            <div className={styles.inputLabel}>Bilti Details (Address / Phone)</div>
            <FieldTextarea
              icon={<Truck size={18} />}
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
            <Button
              fullWidth
              className={styles.placeButton}
              onClick={handlePlaceOrder}
              disabled={loading || !cartItemsList.length}
            >
              {loading ? "Processing..." : "Place Order"}
              {!loading && <CheckCircle2 size={20} />}
            </Button>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
