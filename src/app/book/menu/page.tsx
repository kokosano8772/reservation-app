'use client'
// src/app/book/menu/page.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBookingState, setMenu } from '@/lib/bookingStore'
import { CATEGORY_LABELS, formatPrice, formatDuration } from '@/lib/utils'
import { LoadingSpinner, ErrorMessage, StepIndicator } from '@/components/ui/Header'
import type { Menu, MenuCategory } from '@/types'

const CATEGORY_ORDER: MenuCategory[] = ['cut', 'color', 'perm', 'treatment', 'set', 'other']

export default function MenuPage() {
  const router = useRouter()
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<MenuCategory | 'all'>('all')

  const state = typeof window !== 'undefined' ? getBookingState() : null

  useEffect(() => {
    if (!state?.stylist) { router.replace('/book/stylist'); return }
    fetch('/api/menus')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMenus(data)
        else setError('メニュー情報の取得に失敗しました')
      })
      .catch(() => setError('通信エラーが発生しました'))
      .finally(() => setLoading(false))
  }, [])

  function handleSelect(menu: Menu) {
    setSelectedId(menu.id)
    setMenu(menu)
    setTimeout(() => router.push('/book/datetime'), 150)
  }

  const categories = CATEGORY_ORDER.filter((c) =>
    menus.some((m) => m.category === c)
  )

  const filtered = activeCategory === 'all' ? menus : menus.filter((m) => m.category === activeCategory)

  return (
    <div>
      <StepIndicator current={1} total={3} />
      <div style={{ padding: '0.5rem 1rem 0' }}>
        {state?.stylist && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              padding: '0.625rem 0.875rem',
              background: 'var(--salon-accent-light)',
              borderRadius: '0.75rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--salon-accent)', fontWeight: 600 }}>
              担当：{state.stylist.name}
            </span>
            <button
              onClick={() => router.push('/book/stylist')}
              style={{
                marginLeft: 'auto',
                fontSize: '0.7rem',
                color: 'var(--salon-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              変更
            </button>
          </div>
        )}
        <h1 className="section-title animate-fadeInUp">メニューを選ぶ</h1>
      </div>

      {/* Category tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {(['all', ...categories] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              flexShrink: 0,
              padding: '0.4rem 0.875rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 500,
              border: '1.5px solid',
              cursor: 'pointer',
              transition: 'all 0.15s',
              borderColor: activeCategory === cat ? 'var(--salon-accent)' : 'var(--salon-border)',
              background: activeCategory === cat ? 'var(--salon-accent)' : 'white',
              color: activeCategory === cat ? 'white' : 'var(--salon-primary)',
            }}
          >
            {cat === 'all' ? 'すべて' : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 1rem 2rem' }}>
        {loading && <LoadingSpinner label="読み込み中..." />}
        {error && <ErrorMessage message={error} />}

        {filtered.map((menu, idx) => (
          <button
            key={menu.id}
            onClick={() => handleSelect(menu)}
            className={`animate-fadeInUp delay-${Math.min(idx + 1, 5)}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              width: '100%',
              background: selectedId === menu.id ? 'var(--salon-accent-light)' : 'white',
              border: `1.5px solid ${selectedId === menu.id ? 'var(--salon-accent)' : 'var(--salon-border)'}`,
              borderRadius: '1rem',
              padding: '1rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
              marginBottom: '0.625rem',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{menu.name}</span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontWeight: 500,
                    background: '#f3f4f6',
                    color: '#4b5563',
                  }}
                >
                  {CATEGORY_LABELS[menu.category]}
                </span>
              </div>
              {menu.description && (
                <p
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--salon-muted)',
                    lineHeight: 1.6,
                    marginBottom: '0.5rem',
                  }}
                >
                  {menu.description}
                </p>
              )}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--salon-accent)' }}>
                  {formatPrice(menu.price, menu.price_max)}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--salon-muted)' }}>
                  ⏱ {formatDuration(menu.duration_minutes)}
                </span>
              </div>
            </div>
            <span style={{ color: 'var(--salon-accent)', fontSize: '1.25rem', flexShrink: 0 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}
