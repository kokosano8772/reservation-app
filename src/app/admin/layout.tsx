// src/app/admin/layout.tsx
import Link from 'next/link'

const NAV = [
  { href: '/admin', label: 'ダッシュボード', icon: '📊' },
  { href: '/admin/reservations', label: '予約管理', icon: '📅' },
  { href: '/admin/customers', label: '顧客管理', icon: '👥' },
  { href: '/admin/schedule', label: 'スケジュール', icon: '🗓' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
      {/* Top bar */}
      <header
        style={{
          background: 'var(--salon-primary)',
          color: 'white',
          padding: '0 1.5rem',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.06em' }}>
            BLOOM HAIR
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              background: 'rgba(255,255,255,0.15)',
              padding: '2px 8px',
              borderRadius: '9999px',
              letterSpacing: '0.05em',
            }}
          >
            管理画面
          </span>
        </div>
        <Link
          href="/"
          style={{
            fontSize: '0.78rem',
            color: 'rgba(255,255,255,0.7)',
            textDecoration: 'none',
          }}
        >
          予約サイトへ →
        </Link>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar (desktop) */}
        <nav
          style={{
            width: 220,
            background: 'white',
            borderRight: '1px solid var(--salon-border)',
            padding: '1rem 0',
            flexShrink: 0,
            display: 'none',
          }}
          className="admin-sidebar"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.75rem 1.25rem',
                textDecoration: 'none',
                color: 'var(--salon-primary)',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'background 0.15s',
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav
        style={{
          background: 'white',
          borderTop: '1px solid var(--salon-border)',
          display: 'flex',
          position: 'sticky',
          bottom: 0,
          zIndex: 50,
        }}
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem 0',
              textDecoration: 'none',
              color: 'var(--salon-primary)',
              fontSize: '0.6rem',
              gap: '0.15rem',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
