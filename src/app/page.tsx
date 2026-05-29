// src/app/page.tsx
import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh' }}>
      <div style={{ background: 'var(--salon-primary)', color: 'white', padding: '3rem 1.5rem 2.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.7rem', letterSpacing: '0.25em', opacity: 0.6, marginBottom: '0.5rem' }}>HAIR SALON</p>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '0.75rem' }}>KOKO DESIGN</h1>
        <p style={{ fontSize: '0.875rem', opacity: 0.7, lineHeight: 1.7 }}>名古屋 鶴舞<br />10:00〜20:00 / 火曜定休</p>
      </div>
      <div style={{ padding: '1.5rem 1.25rem' }}>
        <Link href="/book/stylist" style={{ display: 'block', textDecoration: 'none' }}>
          <div style={{
            background: 'var(--salon-accent)',
            color: 'white',
            borderRadius: '9999px',
            padding: '1.1rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '0.15rem',
          }}>
            <p style={{ fontSize: '0.7rem', opacity: 0.85, letterSpacing: '0.12em' }}>今すぐ</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '0.05em' }}>ご予約はこちら ›</p>
          </div>
        </Link>
      </div>
      <div style={{ padding: '0 1rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        {[['✂️', 'スタイリスト指名'], ['🕐', '24時間予約可'], ['⭐', 'リピーター優遇']].map(([icon, label]) => (
          <div key={label} className="card" style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{icon}</div>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, lineHeight: 1.4 }}>{label}</p>
          </div>
        ))}
      </div>
      <div style={{ padding: '0 1rem 2rem' }}>
        <Link href="/my/reservations" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1px solid var(--salon-border)', borderRadius: '0.75rem', padding: '1rem 1.25rem', textDecoration: 'none', color: 'var(--salon-primary)' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>予約確認・変更</span>
          <span>›</span>
        </Link>
      </div>
    </div>
  )
}
