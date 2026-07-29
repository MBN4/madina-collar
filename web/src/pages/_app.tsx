import type { AppProps } from 'next/app';
import '../styles/globals.css';

export default function MyApp({ Component, pageProps }: AppProps) {
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
