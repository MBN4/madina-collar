import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/authStore';
import styles from '../styles/Home.module.css';

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/catalog');
    }
  }, [isAuthenticated, router]);

  return (
    <main className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.brand}>Madina Collar</div>
        <h1 className={styles.title}><span>Premium fabric ordering</span>, now on the web.</h1>
        <p className={styles.description}>
          Browse quality collections, configure your order, and submit directly through the existing Madina Collar API.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primaryButton} href="/auth">
            Get Started
          </Link>
          <Link className={styles.secondaryButton} href="/catalog">
            Browse Catalog
          </Link>
        </div>
      </div>
    </main>
  );
}
