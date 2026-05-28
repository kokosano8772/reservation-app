'use client'
// src/app/admin/reservations/page.tsx
import { useEffect, useState, useCallback } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { formatTime } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/Header'
import type { Reservation, Stylist } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  confirmed: '予約済',
  cancelled: 'キャンセル',
  completed: '来店済',
  no_show: '無断欠席',
}
const STATUS_COLOR: Record<string, string> = {
  confirmed: '#15803d',
  cancelled: '#b91c1c',
  completed: '#6b7280',
  no_show: '#c2410c',
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [stylists, setStylists] = useState<Stylist[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedStylist, setSelectedStylist] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ date: selectedDate, limit: '200' })
    if (selectedStylist) params.set('stylistId', selectedStylist)
    if (selectedStatus) params.set('status', selectedStatus)
    const res = await fetch(`/api/admin/reservations?${params}`)
    const data = await res.json()
    setReservations(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [selectedDate, selectedStylist, selectedStatus])

  useEffect(() => {
    fetch('/api/stylists').then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setStylists(d)
    })
  }, [])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: status as any } : r)))
  }

  const active = reservations.filter((r) => r.status !== 'cancelled')
  const cancelled = reservations.filter((r) => r.status === 'cancelled')

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1000 }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>予約管理</h1>

      {/* Filter bar */}
      <div
        className="card"
        style={{
          padding: '1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Date nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
            style={{
              width: 32,
              height: 32,
              borderRadius: '0.5rem',
              border: '1px solid var(--salon-border)',
              background: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            ‹
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '0.625rem',
              border: '1.5px solid var(--salon-border)',
              fontSize: '0.875rem',
              background: 'white',
              outline: 'none',
            }}
          />
          <button
            onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
            style={{
              width: 32,
              height: 32,
              borderRadius: '0.5rem',
              border: '1px solid var(--salon-border)',
              background: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            ›
          </button>
          <button
            onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: '0.5rem',
              border: '1.5px solid var(--salon-accent)',
              background: 'var(--salon-accent-light)',
              color: 'var(--salon-accent)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            今日
          </button>
        </div>

        {/* Stylist filter */}
        <select
          value={selectedStylist}
          onChange={(e) => setSelectedStylist(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '0.625rem',
            border: '1.5px solid var(--salon-border)',
            fontSize: '0.875rem',
            background: 'white',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">全スタイリスト</option>
          {stylists.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '0.625rem',
            border: '1.5px solid var(--salon-border)',
            fontSize: '0.875rem',
            background: 'white',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">全ステータス</option>
          {Object.entries(STATUS_LABEL).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <span style={{ fontSize: '0.8rem', color: 'var(--salon-muted)', marginLeft: 'auto' }}>
          {format(new Date(selectedDate), 'M月d日(E)', { locale: ja })} / 有効 {active.length}件
        </span>
      </div>

      {loading ? (
        <LoadingSpinner label="予約を読み込み中..." />
      ) : reservations.length === 0 ? (
        <div
          className="card"
          style={{ padding: '3rem', textAlign: 'center', color: 'var(--salon-muted)', fontSize: '0.875rem' }}
        >
          該当する予約はありません
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th>時間</th>
                  <th>顧客名</th>
                  <th>連絡先</th>
                  <th>担当</th>
                  <th>メニュー</th>
                  <th>来店回数</th>
                  <th>ステータス</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {reservations
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((r) => {
                    const stylist = r.stylist as any
                    const menu = r.menu as any
                    const customer = r.customer as any
                    const isCancelled = r.status === 'cancelled'
                    return (
                      <tr
                        key={r.id}
                        style={{
                          background: isCancelled ? '#fafafa' : 'white',
                          opacity: isCancelled ? 0.65 : 1,
                        }}
                      >
                        <td style={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                          {formatTime(r.start_time)}<br />
                          <span style={{ fontWeight: 400, color: 'var(--salon-muted)', fontSize: '0.75rem' }}>
                            〜{formatTime(r.end_time)}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{customer?.name ?? '—'}</div>
                          {customer?.visit_count > 1 && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--salon-accent)', fontWeight: 600 }}>
                              ★ リピーター
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--salon-muted)' }}>
                          {customer?.phone && <div>{customer.phone}</div>}
                          {customer?.email && <div style={{ fontSize: '0.72rem' }}>{customer.email}</div>}
                        </td>
                        <td style={{ fontSize: '0.875rem' }}>{stylist?.name ?? '—'}</td>
                        <td style={{ fontSize: '0.825rem' }}>
                          {menu?.name ?? '—'}
                          {menu?.price && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--salon-muted)' }}>
                              ¥{menu.price.toLocaleString()}〜
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '0.875rem' }}>
                          {customer?.visit_count ?? 0}回
                        </td>
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: 80 }}>
                              <button
                                onClick={() => updateStatus(r.id, 'completed')}
                                style={{ padding: '3px 8px', borderRadius: '5px', border: '1px solid #86efac', background: '#f0fdf4', color: '#15803d', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                              >
                                来店済
                              </button>
                              <button
                                onClick={() => updateStatus(r.id, 'no_show')}
                                style={{ padding: '3px 8px', borderRadius: '5px', border: '1px solid #fed7aa', background: '#fff7ed', color: '#c2410c', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                              >
                                無断欠席
                              </button>
                              <button
                                onClick={() => updateStatus(r.id, 'cancelled')}
                                style={{ padding: '3px 8px', borderRadius: '5px', border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                              >
                                キャンセル
                              </button>
                            </div>
                          )}
                          {r.status !== 'confirmed' && (
                            <button
                              onClick={() => updateStatus(r.id, 'confirmed')}
                              style={{ padding: '3px 8px', borderRadius: '5px', border: '1px solid var(--salon-border)', background: 'white', color: 'var(--salon-muted)', fontSize: '0.7rem', cursor: 'pointer' }}
                            >
                              復元
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
