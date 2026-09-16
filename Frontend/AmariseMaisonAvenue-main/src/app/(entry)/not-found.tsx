import Link from 'next/link';

// 404 boundary. Self-contained, no app-specific imports.
export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: '#f8fafc',
        color: '#0f172a',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        <p style={{ fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#64748b', margin: 0 }}>
          Error 404
        </p>
        <h1 style={{ fontSize: 'clamp(1.8rem, 1rem + 3vw, 2.6rem)', fontWeight: 800, margin: '0.5rem 0 0.75rem', lineHeight: 1.1 }}>
          Page not found
        </h1>
        <p style={{ color: '#475569', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          style={{ display: 'inline-block', background: '#4f46e5', color: '#fff', borderRadius: 10, padding: '0.8rem 1.5rem', fontWeight: 700, textDecoration: 'none' }}
        >
          Back to homepage
        </Link>
      </div>
    </main>
  );
}
