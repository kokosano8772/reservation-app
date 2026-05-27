// src/app/book/layout.tsx
import Link from 'next/link'

export default function BookLayout({ children }: { children: React.ReactNode }) {
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
            justifyContent: 'space-between',
          }}
        >
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                color: 'var(--salon-primary)',
              }}
            >
              BLOOM HAIR
            </span>
          </Link>
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--salon-muted)',
              fontWeight: 500,
            }}
          >
            オンライン予約
          </span>
        </div>
      </header>
      {children}
    </div>
  )
}
