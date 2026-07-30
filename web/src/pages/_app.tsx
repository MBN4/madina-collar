import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import '../styles/globals.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  useEffect(() => {
    // Runs once on load. Expired JWTs are dropped here before any protected
    // page mounts and fires its own useRequireAuth.
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <Component {...pageProps} />
      <footer
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '18px 16px',
          textAlign: 'center',
          fontSize: 11,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: 'rgba(0,0,0,0.55)',
          background: 'transparent',
        }}
      >
        Designed &amp; Developed by{' '}
        <a
          href="https://toptrendingms.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#a12525', textDecoration: 'none', fontWeight: 900 }}
        >
          TOPTRENDING
        </a>
      </footer>
    </>
  );
}
