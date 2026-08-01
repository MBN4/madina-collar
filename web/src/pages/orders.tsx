import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import PageShell from "../components/PageShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Loader from "../components/ui/Loader";
import StaggerItem from "../components/ui/StaggerItem";
import SizeLabel from "../components/SizeLabel";
import { useRequireAuth } from "../hooks/useRequireAuth";
import styles from "../styles/Orders.module.css";
import { Order } from "../types";
import api from "../utils/api";

export default function Orders() {
  const router = useRouter();
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
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          Your past orders are fetched directly from the backend so the web app
          stays in sync with the mobile experience.
        </div>
        <div className={styles.actions}>
          <Button onClick={() => router.push("/catalog")}>
            Place More Order
          </Button>
        </div>
      </div>
      {loading ? (
        <Loader label="Loading your orders..." />
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : orders.length === 0 ? (
        <div className={styles.info}>No past orders yet. Start shopping!</div>
      ) : (
        <div className={styles.orderGrid}>
          {orders.map((order, index) => {
            const statusClass =
              styles[order.status.toLowerCase() as keyof typeof styles] || "";
            return (
              <StaggerItem
                key={order.id}
                index={index}
                staggerMs={100}
                direction="up"
              >
                <Card className={styles.orderCard}>
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
                          {item.width ? (
                            <>
                              {" "}
                              • Width: <SizeLabel value={item.width} />
                            </>
                          ) : (
                            ""
                          )}{" "}
                          • Size: <SizeLabel value={item.size} />
                        </p>
                        <p className={styles.orderItemPrice}>
                          {item.quantity} × Rs {item.price_at_purchase}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
