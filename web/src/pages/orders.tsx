import { useEffect, useState } from "react";
import PageShell from "../components/PageShell";
import { useRequireAuth } from "../hooks/useRequireAuth";
import styles from "../styles/Orders.module.css";
import { Order } from "../types";
import api from "../utils/api";

export default function Orders() {
  const isAuthenticated = useRequireAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    api
      .get("/orders/my-orders")
      .then((res) => setOrders(res.data))
      .catch(() => setError("Unable to load order history."))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <PageShell title="Order History">
      <div className={styles.summaryCard}>
        Your past orders are fetched directly from the backend so the web app
        stays in sync with the mobile experience.
      </div>
      {loading ? (
        <div className={styles.info}>Loading your orders...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : orders.length === 0 ? (
        <div className={styles.info}>No past orders yet. Start shopping!</div>
      ) : (
        <div className={styles.orderGrid}>
          {orders.map((order) => {
            const statusClass =
              styles[order.status.toLowerCase() as keyof typeof styles] || "";
            return (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div className={styles.orderHeaderInfo}>
                    <h3>Order #{order.id}</h3>
                    <p>{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`${styles.status} ${statusClass}`}>
                    {order.status}
                  </span>
                </div>

                <div className={styles.orderMeta}>
                  <span>Rs {order.total_amount.toLocaleString()}</span>
                  <span>{order.payment_method}</span>
                </div>

                <div className={styles.orderItems}>
                  {order.items.map((item) => (
                    <div key={item.id} className={styles.orderItem}>
                      <p className={styles.orderItemTitle}>
                        {item.quality} — {item.style}
                      </p>
                      <p className={styles.orderItemDetail}>
                        {item.category} • {item.color}
                        {item.width ? ` • Width: ${item.width}` : ""} • Size:{" "}
                        {item.size}
                      </p>
                      <p className={styles.orderItemPrice}>
                        {item.quantity} × Rs {item.price_at_purchase}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
