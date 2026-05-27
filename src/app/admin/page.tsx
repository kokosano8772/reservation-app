'use client'
// src/app/admin/page.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { formatTime } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/Header'
import type { Reservation } from '@/types'

type Stats = {
  todayReservations: number
  weekReservations: number
  monthReservations: number
  totalCustomers: number
  repeatRate: number
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: '予約済',
  cancelled: 'キャンセル',
  completed: '来店済',
  no_show: '無断キャン',
}
const STATUS_COLOR: Record<string, string> = {
  confirmed: '#15803d',
  cancelled: '#b91c1c',
  completed: '#6b7280',
  no_show: '#c2410c',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [todayReservations, setTodayReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayLabel = format(new Date(), 'M月d日(E)', { locale: ja })

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then((r) => r.json()),
      fetch(`/api/admin/reservations?date=${today}&limit=50`).then((r) => r.json()),
    ]).then(([s, r]) => {
      setStats(s)
      setTodayReservations(Array.isArray(r) ? r : [])
      setLoading(false)
    })
  }, [today])

  async function updateStatus(reservationId: string, status: string) {
    await fetch(`/api/admin/reservations/${reservationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setTodayReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: status as any } : r))
    )
  }

  if (loading) {
    return <LoadingSpinner label="読み込み中..." />
  }

  return (
    <div style={{ padding: '1.25rem', maxWidth: 900 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>ダッシュボード</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--salon-muted)', marginTop: '0.25rem' }}>
          {format(new Date(), 'yyyy年M月d日(E) HH:mm', { locale: ja })} 現在
        </p>
      </div>

      {/* Stats grid */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          {[
            { label: '本日の予約', value: stats.todayReservations, unit: '件', color: 'var(--salon-accent)' },
            { label: '今週の予約', value: stats.weekReservations, unit: '件', color: '#3b82f6' },
            { label: '今月の予約', value: stats.monthReservations, unit: '件', color: '#8b5cf6' },
            { label: '総顧客数', value: stats.totalCustomers, unit: '名', color: '#10b981' },
            { label: 'リピート率', value: stats.repeatRate, unit: '%', color: '#f59e0b' },
          ].map(({ label, value, unit, color }) => (
            <div
              key={label}
              className="card"
              style={{ padding: '1rem 1.25rem' }}
            >
              <p style={{ fontSize: '0.72rem', color: 'var(--salon-muted)', marginBottom: '0.375rem', fontWeight: 500 }}>
                {label}
              </p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color, lineHeight: 1 }}>
                {value}
                <span style={{ fontSize: '0.875rem', fontWeight: 500, marginLeft: '0.25rem', color: 'var(--salon-muted)' }}>
                  {unit}
                </span>
              </p>
            </div>
          ))}

          {/* Quick links */}
          <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--salon-muted)', fontWeight: 500 }}>クイックリンク</p>
            {[
              { href: '/admin/reservations', label: '予約一覧 →' },
              { href: '/admin/customers', label: '顧客一覧 →' },
              { href: '/admin/schedule', label: 'スケジュール →' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--salon-accent)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Today's reservations */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--salon-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            {todayLabel}の予約（{todayReservations.filter(r => r.status !== 'cancelled').length}件）
          </p>
          <Link
            href="/admin/reservations"
            style={{ fontSize: '0.78rem', color: 'var(--salon-accent)', textDecoration: 'none', fontWeight: 600 }}
          >
            全件表示 →
          </Link>
        </div>

        {todayReservations.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--salon-muted)', fontSize: '0.875rem' }}>
            本日の予約はありません
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>時間</th>
                  <th>顧客名</th>
                  <th>担当</th>
                  <th>メニュー</th>
                  <th>ステータス</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {todayReservations
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((r) => {
                    const stylist = r.stylist as any
                    const menu = r.menu as any
                    const customer = r.customer as any
                    return (
                      <tr key={r.id} style={{ background: r.status === 'cancelled' ? '#fafafa' : 'white' }}>
                        <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {formatTime(r.start_time)}〜{formatTime(r.end_time)}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{customer?.name ?? '—'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--salon-muted)' }}>
                            {customer?.phone ?? ''}
                          </div>
                        </td>
                        <td>{stylist?.name ?? '—'}</td>
                        <td style={{ fontSize: '0.825rem' }}>{menu?.name ?? '—'}</td>
                        <td>
                          <span
                            className="tag"
                            style={{
                              background: `${STATUS_COLOR[r.status]}18`,
                              color: STATUS_COLOR[r.status],
                              fontSize: '0.7rem',
                            }}
                          >
                            {STATUS_LABEL[r.status] ?? r.status}
                          </span>
                        </td>
                        <td>
                          {r.status === 'confirmed' && (
                            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => updateStatus(r.id, 'completed')}
                                style={{
                                  padding: '3px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #86efac',
                                  background: '#f0fdf4',
                                  color: '#15803d',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                来店済
                              </button>
                              <button
                                onClick={() => updateStatus(r.id, 'cancelled')}
                                style={{
                                  padding: '3px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #fecaca',
                                  background: '#fef2f2',
                                  color: '#b91c1c',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                キャンセル
                              </button>
                              <button
                                onClick={() => updateStatus(r.id, 'no_show')}
                                style={{
                                  padding: '3px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #fed7aa',
                                  background: '#fff7ed',
                                  color: '#c2410c',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                無断欠席
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
