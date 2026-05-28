'use client'
// src/app/book/stylist/page.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { setStylist } from '@/lib/bookingStore'
import { RANK_LABELS } from '@/lib/utils'
import { LoadingSpinner, ErrorMessage, StepIndicator } from '@/components/ui/Header'
import type { Stylist } from '@/types'

export default function StylistPage() {
  const router = useRouter()
  const [stylists, setStylists] = useState<Stylist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/stylists')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setStylists(data)
        else setError('スタイリスト情報の取得に失敗しました')
      })
      .catch(() => setError('通信エラーが発生しました'))
      .finally(() => setLoading(false))
  }, [])

  function handleSelect(stylist: Stylist) {
    setSelected(stylist.id)
    setStylist(stylist)
    setTimeout(() => router.push('/book/menu'), 150)
  }

  return (
    <div>
      <StepIndicator current={0} total={3} />
      <div style={{ padding: '0.5rem 1rem 0' }}>
        <h1 className="section-title">スタイリストを選ぶ</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--salon-muted)', marginTop: '0.25rem' }}>
          担当してほしいスタイリストを選んでください
        </p>
      </div>

      <div style={{ padding: '1rem' }}>
        {loading && <LoadingSpinner label="読み込み中..." />}
        {error && <ErrorMessage message={error} />}

        {stylists.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSelect(s)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              width: '100%',
              background: selected === s.id ? 'var(--salon-accent-light)' : 'white',
              border: `1.5px solid ${selected === s.id ? 'var(--salon-accent)' : 'var(--salon-border)'}`,
              borderRadius: '1rem',
              padding: '1rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
              marginBottom: '0.75rem',
            }}
          >
            {/* Photo */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
                background: 'var(--salon-border)',
              }}
            >
              {s.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.photo_url}
                  alt={s.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    color: 'var(--salon-muted)',
                  }}
                >
                  ✂️
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700 }}>{s.name}</span>
                <span
                  className="tag"
                  style={{
                    background: 'var(--salon-accent-light)',
                    color: 'var(--salon-accent)',
                    fontSize: '0.65rem',
                  }}
                >
                  {RANK_LABELS[s.rank] ?? s.rank}
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--salon-muted)',
                  lineHeight: 1.6,
                  marginBottom: '0.5rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {s.bio}
              </p>
              {s.specialties?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {s.specialties.map((sp) => (
                    <span
                      key={sp}
                      style={{
                        fontSize: '0.65rem',
                        background: '#f3f4f6',
                        color: '#4b5563',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontWeight: 500,
                      }}
                    >
                      {sp}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Arrow */}
            <span style={{ color: 'var(--salon-accent)', fontSize: '1.25rem', flexShrink: 0, alignSelf: 'center' }}>›</span>
          </button>
        ))}

        {/* Unspecified option */}
        {!loading && stylists.length > 0 && (
          <button
            onClick={() => {
              setStylist({
                id: 'any',
                name: 'おまかせ',
                name_kana: '',
                bio: 'スタッフにお任せください',
                photo_url: '',
                specialties: [],
                rank: 'stylist',
                is_active: true,
                created_at: '',
              })
              router.push('/book/menu')
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: 'white',
              border: '1.5px solid var(--salon-border)',
              borderRadius: '1rem',
              padding: '1rem 1.25rem',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>おまかせ（指名なし）</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--salon-muted)', marginTop: '0.2rem' }}>
                当日の担当スタッフにお任せします
              </p>
            </div>
            <span style={{ color: 'var(--salon-muted)', fontSize: '1.25rem' }}>›</span>
          </button>
        )}
      </div>
    </div>
  )
}
