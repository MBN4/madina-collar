import Link from "next/link";
import { useEffect, useState } from "react";
import PageShell from "../components/PageShell";
import { useRequireAuth } from "../hooks/useRequireAuth";
import styles from "../styles/Catalog.module.css";
import { Quality } from "../types";
import api, { getImageUrl } from "../utils/api";

export default function Catalog() {
  const isAuthenticated = useRequireAuth();
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    api
      .get("/admin/qualities")
      .then((response) => {
        setQualities(response.data);
      })
      .catch(() => {
        setError("Unable to load catalog.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isAuthenticated]);

  return (
    <PageShell title="Collections">
      <div className={styles.heroPanel}>
        <div>
          <div className={styles.heroBadge}>Top Quality Fabrics</div>
          <h2>Browse the same premium collections from the mobile app.</h2>
          <p>
            Select a quality, configure your options, and check out with the
            same backend flow.
          </p>
        </div>
        <div className={styles.metricsCard}>
          <span>{qualities.length}</span>
          <p>Collections available</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.info}>Loading catalog...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : qualities.length === 0 ? (
        <div className={styles.info}>No qualities found.</div>
      ) : (
        <div className={styles.grid}>
          {qualities.map((quality) => (
            <Link
              key={quality.id}
              href={{
                pathname: "/product",
                query: { qualityId: quality.id, qualityName: quality.name },
              }}
              className={styles.card}
            >
              {quality.tag ? (
                <div className={styles.tag}>{quality.tag}</div>
              ) : null}
              <div className={styles.imageContainer}>
                <img src={getImageUrl(quality.image_url)} alt={quality.name} />
              </div>
              <div className={styles.cardFooter}>
                <h2>{quality.name}</h2>
                <span>Starting at Rs {quality.price}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
