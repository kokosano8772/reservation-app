'use client'
// src/app/book/complete/page.tsx
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { clearBookingState } from '@/lib/bookingStore'
import { formatDateFull, formatTime } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/Header'
import { Suspense } from 'react'

type ReservationDetail = {
  id: string
  reservation_date: string
  start_time: string
  end_time: string
  status: string
  notes: string | null
  stylist: { name: string }
  menu: { name: string; price: number; price_max: number | null; duration_minutes: number }
  customer: { name: string; phone: string | null; email: string | null }
}

function CompleteContent() {
  const searchParams = useSearchParams()
  const reservationId = searchParams.get('id')
  const [detail, setDetail] = useState<ReservationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Clear booking session state on success
    clearBookingState()

    if (!reservationId) {
      setError('予約IDが見つかりません')
      setLoading(false)
      return
    }

    fetch(`/api/admin/reservations/${reservationId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setDetail(data)
      })
      .catch(() => setError('予約情報の取得に失敗しました'))
      .finally(() => setLoading(false))
  }, [reservationId])

  if (loading) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '3rem 1rem' }}>
        <LoadingSpinner label="予約情報を確認中..." />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
        <div className="animate-fadeIn" style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h1 className="animate-fadeInUp" style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          ご予約ありがとうございます
        </h1>
        <p style={{ color: 'var(--salon-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          予約が確定しました。確認メッセージをご確認ください。
        </p>
        <Link href="/" className="btn-primary animate-fadeInUp delay-2" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
          トップに戻る
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh' }}>
      {/* Header */}
      <div
        style={{
          background: 'var(--salon-primary)',
          color: 'white',
          padding: '2.5rem 1.5rem 2rem',
          textAlign: 'center',
        }}
      >
        <div
          className="animate-fadeIn"
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            margin: '0 auto 1rem',
          }}
        >
          ✓
        </div>
        <h1 className="animate-fadeInUp" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.375rem' }}>
          ご予約が確定しました
        </h1>
        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
          {detail.customer.name} 様、ご予約ありがとうございます
        </p>
      </div>

      {/* Reservation detail card */}
      <div style={{ padding: '1.25rem 1rem' }}>
        <div
          className="card animate-fadeInUp delay-1"
          style={{ padding: '1.25rem', marginBottom: '1rem' }}
        >
          <p
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'var(--salon-accent)',
              marginBottom: '1rem',
            }}
          >
            予約番号: {detail.id.slice(0, 8).toUpperCase()}
          </p>

          {[
            {
              icon: '📅',
              label: '日時',
              value: `${formatDateFull(detail.reservation_date)} ${formatTime(detail.start_time)}〜${formatTime(detail.end_time)}`,
            },
            { icon: '✂️', label: '担当', value: detail.stylist.name },
            { icon: '💄', label: 'メニュー', value: detail.menu.name },
            {
              icon: '💰',
              label: '料金目安',
              value: detail.menu.price_max
                ? `¥${detail.menu.price.toLocaleString()}〜¥${detail.menu.price_max.toLocaleString()}`
                : `¥${detail.menu.price.toLocaleString()}`,
            },
          ].map(({ icon, label, value }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                paddingBottom: '0.75rem',
                marginBottom: '0.75rem',
                borderBottom: '1px solid var(--salon-border)',
              }}
            >
              <span style={{ fontSize: '1rem', width: 22, flexShrink: 0 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--salon-muted)', marginBottom: '0.125rem' }}>
                  {label}
                </p>
                <p style={{ fontSize: '0.925rem', fontWeight: 600 }}>{value}</p>
              </div>
            </div>
          ))}

          {detail.notes && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1rem', width: 22, flexShrink: 0 }}>📝</span>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--salon-muted)', marginBottom: '0.125rem' }}>ご要望</p>
                <p style={{ fontSize: '0.875rem' }}>{detail.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Notice */}
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '0.875rem',
            padding: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#92400e', marginBottom: '0.375rem' }}>
            📋 ご来店前のご確認
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.78rem', color: '#78350f', lineHeight: 1.8 }}>
            <li>キャンセル・変更は前日18時までにお願いします</li>
            <li>遅刻される場合は必ずご連絡ください</li>
            <li>カラーの方はアレルギーパッチテストをご確認ください</li>
          </ul>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link
            href="/book/stylist"
            className="btn-primary animate-fadeInUp delay-2"
            style={{ display: 'block', textDecoration: 'none', textAlign: 'center', padding: '1rem' }}
          >
            別の予約を追加する
          </Link>
          <Link
            href="/my/reservations"
            className="btn-outline"
            style={{ display: 'block', textDecoration: 'none', textAlign: 'center', padding: '1rem' }}
          >
            予約一覧を確認する
          </Link>
        </div>

        {/* Salon info */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--salon-border)',
          }}
        >
          <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>BLOOM HAIR</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--salon-muted)', lineHeight: 1.7 }}>
            渋谷区神宮前 2-XX-XX<br />
            TEL: 03-XXXX-XXXX<br />
            営業時間: 10:00〜20:00（火曜定休）
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CompletePage() {
  return (
    <Suspense fallback={<div style={{ maxWidth: 480, margin: '0 auto', padding: '3rem 1rem' }}><LoadingSpinner label="読み込み中..." /></div>}>
      <CompleteContent />
    </Suspense>
  )
}
