// src/app/my/layout.tsx
import Link from 'next/link'

export default function MyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh' }}>
      <header
        style={{
          background: 'white',
          borderBottom: '1px solid var(--salon-border)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            padding: '0 1rem',
            height: 52,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <Link
            href="/"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--salon-bg)',
              border: '1px solid var(--salon-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              fontSize: '1rem',
              flexShrink: 0,
            }}
          >
            ‹
          </Link>
          <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>予約確認・変更</span>
        </div>
      </header>
      {children}
    </div>
  )
}
