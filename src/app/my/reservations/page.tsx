'use client'
// src/app/my/reservations/page.tsx
import { useState } from 'react'
import { LoadingSpinner } from '@/components/ui/Header'
import { formatDateFull, formatTime } from '@/lib/utils'
import Link from 'next/link'
import type { Reservation } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  confirmed: '予約済み',
  cancelled: 'キャンセル済み',
  completed: '来店済み',
  no_show: '無断キャンセル',
}
const STATUS_STYLE: Record<string, string> = {
  confirmed: 'badge-confirmed',
  cancelled: 'badge-cancelled',
  completed: 'badge-completed',
  no_show: 'badge-no_show',
}

export default function MyReservationsPage() {
  const [searchType, setSearchType] = useState<'phone' | 'email'>('phone')
  const [searchValue, setSearchValue] = useState('')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState('')
  const [cancelSuccess, setCancelSuccess] = useState('')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchValue.trim()) return
    setLoading(true)
    setError('')
    setReservations([])
    setSearched(false)
    setCancelError('')
    setCancelSuccess('')

    const params = new URLSearchParams({ [searchType]: searchValue.trim() })
    const res = await fetch(`/api/reservations?${params}`)
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? '検索に失敗しました')
    } else {
      setReservations(Array.isArray(data) ? data : [])
      setSearched(true)
    }
    setLoading(false)
  }

  async function handleCancel(reservationId: string) {
    if (!confirm('この予約をキャンセルしますか？')) return
    setCancelingId(reservationId)
    setCancelError('')
    setCancelSuccess('')

    const res = await fetch('/api/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reservationId,
        [searchType]: searchValue.trim(),
      }),
    })
    const data = await res.json()

    if (!res.ok) {
      setCancelError(data.error ?? 'キャンセルに失敗しました')
    } else {
      setCancelSuccess('キャンセルが完了しました')
      // Update local state
      setReservations((prev) =>
        prev.map((r) => (r.id === reservationId ? { ...r, status: 'cancelled' } : r))
      )
    }
    setCancelingId(null)
  }

  const upcoming = reservations.filter(
    (r) =>
      r.status === 'confirmed' &&
      new Date(`${r.reservation_date}T${r.start_time}`) >= new Date()
  )
  const past = reservations.filter((r) => !upcoming.includes(r))

  return (
    <div style={{ padding: '1rem' }}>
      {/* Search form */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.875rem' }}>
          予約を検索する
        </p>

        {/* Toggle */}
        <div
          style={{
            display: 'flex',
            background: 'var(--salon-bg)',
            borderRadius: '0.625rem',
            padding: 3,
            marginBottom: '0.875rem',
          }}
        >
          {(['phone', 'email'] as const).map((type) => (
            <button
              key={type}
              onClick={() => { setSearchType(type); setSearchValue('') }}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                transition: 'all 0.15s',
                background: searchType === type ? 'white' : 'transparent',
                color: searchType === type ? 'var(--salon-primary)' : 'var(--salon-muted)',
                boxShadow: searchType === type ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {type === 'phone' ? '📞 電話番号' : '✉️ メールアドレス'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type={searchType === 'phone' ? 'tel' : 'email'}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={searchType === 'phone' ? '09012345678' : 'example@email.com'}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              border: '1.5px solid var(--salon-border)',
              fontSize: '1rem',
              background: 'white',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--salon-accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--salon-border)')}
          />
          <button type="submit" className="btn-primary" disabled={loading || !searchValue.trim()}>
            {loading ? '検索中...' : '予約を検索'}
          </button>
        </form>
      </div>

      {loading && <LoadingSpinner label="検索中..." />}

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.75rem',
            padding: '0.875rem',
            fontSize: '0.875rem',
            color: '#b91c1c',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {cancelError && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.75rem',
            padding: '0.875rem',
            fontSize: '0.875rem',
            color: '#b91c1c',
            marginBottom: '1rem',
          }}
        >
          {cancelError}
        </div>
      )}

      {cancelSuccess && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '0.75rem',
            padding: '0.875rem',
            fontSize: '0.875rem',
            color: '#15803d',
            marginBottom: '1rem',
          }}
        >
          {cancelSuccess}
        </div>
      )}

      {searched && reservations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔍</p>
          <p style={{ fontWeight: 600, marginBottom: '0.375rem' }}>予約が見つかりません</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--salon-muted)' }}>
            ご登録の{searchType === 'phone' ? '電話番号' : 'メールアドレス'}をご確認ください
          </p>
        </div>
      )}

      {/* Upcoming reservations */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--salon-muted)', marginBottom: '0.625rem', letterSpacing: '0.05em' }}>
            今後のご予約
          </p>
          {upcoming.map((r) => (
            <ReservationCard
              key={r.id}
              reservation={r}
              onCancel={handleCancel}
              canceling={cancelingId === r.id}
            />
          ))}
        </div>
      )}

      {/* Past / cancelled */}
      {past.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--salon-muted)', marginBottom: '0.625rem', letterSpacing: '0.05em' }}>
            過去の予約
          </p>
          {past.map((r) => (
            <ReservationCard
              key={r.id}
              reservation={r}
              onCancel={handleCancel}
              canceling={cancelingId === r.id}
              isPast
            />
          ))}
        </div>
      )}

      {/* New booking CTA */}
      {searched && (
        <div style={{ marginTop: '0.5rem' }}>
          <Link
            href="/book/stylist"
            className="btn-primary"
            style={{ display: 'block', textDecoration: 'none', textAlign: 'center', padding: '1rem' }}
          >
            新しい予約をする
          </Link>
        </div>
      )}
    </div>
  )
}

function ReservationCard({
  reservation: r,
  onCancel,
  canceling,
  isPast = false,
}: {
  reservation: Reservation
  onCancel: (id: string) => void
  canceling: boolean
  isPast?: boolean
}) {
  const stylist = r.stylist as any
  const menu = r.menu as any
  const canCancel =
    r.status === 'confirmed' &&
    !isPast &&
    new Date(`${r.reservation_date}T${r.start_time}`) > new Date()

  return (
    <div
      className="card"
      style={{
        padding: '1rem',
        marginBottom: '0.75rem',
        opacity: isPast ? 0.8 : 1,
      }}
    >
      {/* Status + date row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
        }}
      >
        <span
          className={`tag ${STATUS_STYLE[r.status] ?? 'badge-confirmed'}`}
          style={{ fontSize: '0.7rem' }}
        >
          {STATUS_LABEL[r.status] ?? r.status}
        </span>
        <span style={{ fontSize: '0.78rem', color: 'var(--salon-muted)', fontWeight: 500 }}>
          #{r.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.875rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--salon-muted)', width: 16, flexShrink: 0 }}>📅</span>
          <span style={{ fontWeight: 600 }}>
            {formatDateFull(r.reservation_date)}&nbsp;
            {formatTime(r.start_time)}〜{formatTime(r.end_time)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--salon-muted)', width: 16, flexShrink: 0 }}>✂️</span>
          <span>{stylist?.name ?? '未設定'}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--salon-muted)', width: 16, flexShrink: 0 }}>💄</span>
          <span>
            {menu?.name ?? '未設定'}
            {menu?.price && (
              <span style={{ color: 'var(--salon-muted)', marginLeft: '0.5rem' }}>
                ¥{menu.price.toLocaleString()}〜
              </span>
            )}
          </span>
        </div>
        {r.notes && (
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--salon-muted)', width: 16, flexShrink: 0 }}>📝</span>
            <span style={{ color: 'var(--salon-muted)' }}>{r.notes}</span>
          </div>
        )}
      </div>

      {/* Cancel button */}
      {canCancel && (
        <button
          onClick={() => onCancel(r.id)}
          disabled={canceling}
          style={{
            width: '100%',
            padding: '0.625rem',
            borderRadius: '0.625rem',
            border: '1.5px solid #fecaca',
            background: 'white',
            color: '#b91c1c',
            fontSize: '0.825rem',
            fontWeight: 600,
            cursor: canceling ? 'not-allowed' : 'pointer',
            opacity: canceling ? 0.6 : 1,
            transition: 'all 0.15s',
          }}
        >
          {canceling ? 'キャンセル中...' : 'この予約をキャンセルする'}
        </button>
      )}
    </div>
  )
}
