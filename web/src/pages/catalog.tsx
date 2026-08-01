import { ChevronRight, Layers, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "../components/ui/Button";
import PageShell from "../components/PageShell";
import StaggerItem from "../components/ui/StaggerItem";
import Loader from "../components/ui/Loader";
import { useRequireAuth } from "../hooks/useRequireAuth";
import styles from "../styles/Catalog.module.css";
import { Quality } from "../types";
import api, { getImageUrl } from "../utils/api";

export default function Catalog() {
  const isAuthenticated = useRequireAuth();
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchQualities = () => {
    setLoading(true);
    setError("");
    api
      .get("/admin/qualities")
      .then((response) => {
        setQualities(response.data);
      })
      .catch(() => {
        setError("Unable to connect to server.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchQualities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <PageShell title="">
      <div className={styles.page}>
        <div className={styles.titleSection}>
          <h2 className={styles.mainTitle}>Collections</h2>
          <p className={styles.subtitle}>Select from our handpicked premium range</p>
        </div>

        {loading ? (
          <Loader label="Syncing latest fabrics..." />
        ) : error ? (
          <div className={styles.centerState}>
            <p className={styles.errorText}>{error}</p>
            <Button variant="dark" onClick={fetchQualities}>
              <RefreshCcw size={16} />
              Retry
            </Button>
          </div>
        ) : qualities.length === 0 ? (
          <div className={styles.centerState}>
            <Layers size={48} color="var(--text-secondary)" style={{ opacity: 0.2, marginBottom: 15 }} />
            <p className={styles.emptyText}>No fabrics found.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {qualities.map((quality, index) => (
              <StaggerItem key={quality.id} index={index} staggerMs={150} direction="scale">
                <Link
                  href={{
                    pathname: "/product",
                    query: { qualityId: quality.id, qualityName: quality.name },
                  }}
                  className={styles.card}
                >
                  {quality.tag ? <div className={styles.tag}>{quality.tag}</div> : null}
                  <div className={styles.imageContainer}>
                    {quality.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={getImageUrl(quality.image_url)} alt={quality.name} />
                    ) : (
                      <Layers size={30} color="var(--metallic-gold)" opacity={0.2} />
                    )}
                  </div>
                  <div className={styles.cardFooter}>
                    <h2>{quality.name}</h2>
                    <div className={styles.arrowIcon}>
                      <ChevronRight size={14} color="#fff" strokeWidth={4} />
                    </div>
                  </div>
                  <div className={styles.priceLine}>{Number(quality.price) > 0 ? `Starting at Rs ${quality.price}` : 'Price NA'}</div>
                </Link>
              </StaggerItem>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
