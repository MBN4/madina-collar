import Link from "next/link";
import { ReactNode } from "react";
import { useAuthStore } from "../store/authStore";
import styles from "../styles/PageShell.module.css";

type Props = {
  title: string;
  children: ReactNode;
};

export default function PageShell({ title, children }: Props) {
  const { user, logout, isAuthenticated } = useAuthStore();

  return (
    <div className={styles.pageShell}>
      <div className={styles.headerWrapper}>
        <header className={styles.header}>
          <Link href="/catalog" className={styles.brandWrap}>
            <div className={styles.brandBadge}>MC</div>
            <div>
              <div className={styles.brand}>Madina Collar</div>
              <div className={styles.brandSub}>Premium Fabric Studio</div>
            </div>
          </Link>
          <nav className={styles.nav}>
            <Link href="/catalog">Collections</Link>
            <Link href="/orders">Order History</Link>
            {isAuthenticated ? (
              <button className={styles.linkButton} onClick={logout}>
                Logout
              </button>
            ) : (
              <Link href="/auth">Login</Link>
            )}
          </nav>
          {user ? (
            <div className={styles.profile}>
              Hi, {user.username || user.phone || "Customer"}
            </div>
          ) : null}
        </header>
      </div>
      <main className={styles.main}>
        {title ? (
          <div className={styles.titleRow}>
            <h1>{title}</h1>
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
