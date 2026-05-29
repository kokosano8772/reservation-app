'use client'
// src/app/page.tsx
import { useState } from 'react'
import Link from 'next/link'

type Tab = '予約' | '店舗情報'

function BookingTab() {
  return (
    <>
      <div style={{ padding: '1.5rem 1.25rem' }}>
        <Link href="/book/stylist" style={{ display: 'block', textDecoration: 'none' }}>
          <div className="animate-fadeInUp delay-2" style={{
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
        {[['✂️', 'スタイリスト指名'], ['🕐', '24時間予約可'], ['⭐', 'リピーター優遇']].map(([icon, label], i) => (
          <div key={label} className={`card animate-fadeInUp delay-${i + 1}`} style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{icon}</div>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, lineHeight: 1.4 }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 1rem 2rem' }}>
        <Link href="/my/reservations" className="animate-fadeInUp delay-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1px solid var(--salon-border)', borderRadius: '0.75rem', padding: '1rem 1.25rem', textDecoration: 'none', color: 'var(--salon-primary)' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>予約確認・変更</span>
          <span>›</span>
        </Link>
      </div>
    </>
  )
}

function StoreTab() {
  const info = [
    { icon: '📍', label: '住所', value: '愛知県名古屋市中区千代田3丁目11−32 5F' },
    { icon: '📞', label: '電話番号', value: '03-XXXX-XXXX' },
    { icon: '🕐', label: '営業時間', value: '月〜土 10:00〜20:00 / 火曜定休' },
  ]

  return (
    <div style={{ padding: '1rem' }}>
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        {info.map(({ icon, label, value }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              gap: '0.875rem',
              alignItems: 'flex-start',
              padding: '0.75rem 0',
              borderBottom: '1px solid var(--salon-border)',
            }}
          >
            <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '0.05rem' }}>{icon}</span>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--salon-muted)', fontWeight: 600, marginBottom: '0.2rem', letterSpacing: '0.05em' }}>{label}</p>
              <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--salon-primary)', lineHeight: 1.5 }}>{value}</p>
            </div>
          </div>
        ))}
        <div style={{ paddingTop: '0.875rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--salon-muted)', fontWeight: 600, marginBottom: '0.625rem', letterSpacing: '0.05em' }}>🗺 アクセス</p>
          <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid var(--salon-border)' }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3262.036635940773!2d136.91215417721511!3d35.15570705866113!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60037b123aed15e1%3A0x44aac74c44c2ce97!2z44ix44Kz44Kz44OH44K244Kk44Oz!5e0!3m2!1sja!2sjp!4v1780038271295!5m2!1sja!2sjp"
              width="100%"
              height="280"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('予約')

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh' }}>
      {/* Hero */}
      <div style={{ background: 'var(--salon-primary)', color: 'white', padding: '3rem 1.5rem 2.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.7rem', letterSpacing: '0.25em', opacity: 0.6, marginBottom: '0.5rem' }}>HAIR SALON</p>
        <h1 className="animate-fadeInUp" style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '0.75rem' }}>KOKO DESIGN</h1>
        <p style={{ fontSize: '0.875rem', opacity: 0.7, lineHeight: 1.7 }}>名古屋 鶴舞<br />10:00〜20:00 / 火曜定休</p>
      </div>

      {/* Tab bar — segmented control */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.25rem',
        background: '#f0f0f0',
        padding: '0.375rem',
        margin: '0',
        borderBottom: '1px solid var(--salon-border)',
      }}>
        {(['予約', '店舗情報'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.6rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: activeTab === tab ? 'white' : 'transparent',
              color: activeTab === tab ? 'var(--salon-primary)' : 'var(--salon-muted)',
              fontWeight: activeTab === tab ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.15s',
              letterSpacing: '0.03em',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === '予約' ? <BookingTab /> : <StoreTab />}
    </div>
  )
}
