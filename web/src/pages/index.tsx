import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import styles from "../styles/Home.module.css";
import { ANIMATIONS } from "../styles/theme";

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/catalog");
    }
  }, [isAuthenticated, router]);

  return (
    <main className={styles.container}>
      <motion.div
        className={styles.hero}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <motion.div
          className={styles.logoWrap}
          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={ANIMATIONS.splash.scale}
        >
          <div className={styles.logoGlow} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/madina-collar-round.png" alt="Madina Collar" />
        </motion.div>
        <div className={styles.brand}>Madina Collar</div>
        <h1 className={styles.title}>
          <span>Premium fabric ordering</span>, now on the web.
        </h1>
        <p className={styles.description}>
          Browse quality collections, configure your order, and submit directly
          through the existing Madina Collar API.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primaryButton} href="/auth">
            Get Started
          </Link>
          <Link className={styles.secondaryButton} href="/catalog">
            Browse Catalog
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
