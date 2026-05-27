'use client'
// src/app/admin/customers/page.tsx
import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { LoadingSpinner } from '@/components/ui/Header'
import type { Customer } from '@/types'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [customerReservations, setCustomerReservations] = useState<any[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '100' })
    if (debouncedSearch) params.set('search', debouncedSearch)
    const res = await fetch(`/api/admin/customers?${params}`)
    const data = await res.json()
    setCustomers(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [debouncedSearch])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  async function showCustomerDetail(customer: Customer) {
    setSelected(customer)
    setLoadingDetail(true)
    const params = new URLSearchParams({ limit: '20' })
    // We query reservations joined with customer, but we need by customer_id
    // Use the admin reservations endpoint with a custom filter
    const res = await fetch(`/api/admin/customers/${customer.id}/reservations`)
    const data = await res.json()
    setCustomerReservations(Array.isArray(data) ? data : [])
    setLoadingDetail(false)
  }

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1000 }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>顧客管理</h1>

      {/* Search */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="名前・電話番号・メールアドレスで検索..."
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: '0.75rem',
            border: '1.5px solid var(--salon-border)',
            fontSize: '0.9rem',
            background: 'white',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--salon-accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--salon-border)')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: '1rem' }}>
        {/* Customer list */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <LoadingSpinner label="顧客情報を読み込み中..." />
          ) : customers.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--salon-muted)', fontSize: '0.875rem' }}>
              顧客が見つかりません
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th>顧客名</th>
                    <th>連絡先</th>
                    <th>来店回数</th>
                    <th>最終来店</th>
                    <th>登録日</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      style={{
                        background: selected?.id === c.id ? 'var(--salon-accent-light)' : 'white',
                        cursor: 'pointer',
                      }}
                      onClick={() => showCustomerDetail(c)}
                    >
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.name}</div>
                        {c.name_kana && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--salon-muted)' }}>{c.name_kana}</div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--salon-muted)' }}>
                        {c.phone && <div>{c.phone}</div>}
                        {c.email && <div>{c.email}</div>}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: c.visit_count >= 3 ? 'var(--salon-accent)' : 'var(--salon-primary)',
                            fontSize: '0.875rem',
                          }}
                        >
                          {c.visit_count}回
                        </span>
                        {c.visit_count >= 3 && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--salon-accent)', fontWeight: 600 }}>
                            ★ 常連
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {c.last_visit_at
                          ? format(new Date(c.last_visit_at), 'M月d日', { locale: ja })
                          : '—'}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--salon-muted)', whiteSpace: 'nowrap' }}>
                        {format(new Date(c.created_at), 'yyyy/M/d', { locale: ja })}
                      </td>
                      <td>
                        <span style={{ color: 'var(--salon-accent)', fontSize: '1.1rem' }}>›</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Customer detail panel */}
        {selected && (
          <div className="card" style={{ padding: '1.25rem', height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>{selected.name}</p>
              <button
                onClick={() => setSelected(null)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: '1px solid var(--salon-border)',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--salon-muted)',
                }}
              >
                ✕
              </button>
            </div>

            {[
              ['来店回数', `${selected.visit_count}回`],
              ['電話番号', selected.phone ?? '未登録'],
              ['メール', selected.email ?? '未登録'],
              ['登録日', format(new Date(selected.created_at), 'yyyy年M月d日', { locale: ja })],
              ['最終来店', selected.last_visit_at
                ? format(new Date(selected.last_visit_at), 'yyyy年M月d日', { locale: ja })
                : '—'],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--salon-border)',
                }}
              >
                <span style={{ color: 'var(--salon-muted)' }}>{label}</span>
                <span style={{ fontWeight: 600 }}>{value}</span>
              </div>
            ))}

            {selected.notes && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--salon-bg)', borderRadius: '0.625rem', fontSize: '0.8rem' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.72rem', color: 'var(--salon-muted)' }}>メモ</p>
                <p>{selected.notes}</p>
              </div>
            )}

            {/* Reservation history */}
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontWeight: 700, fontSize: '0.825rem', marginBottom: '0.625rem' }}>来店履歴</p>
              {loadingDetail ? (
                <LoadingSpinner label="読み込み中..." />
              ) : customerReservations.length === 0 ? (
                <p style={{ fontSize: '0.78rem', color: 'var(--salon-muted)' }}>履歴なし</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {customerReservations.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        padding: '0.625rem 0.75rem',
                        background: 'var(--salon-bg)',
                        borderRadius: '0.625rem',
                        fontSize: '0.78rem',
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>
                        {format(new Date(r.reservation_date), 'M月d日(E)', { locale: ja })}
                        {' '}{r.start_time?.slice(0, 5)}〜
                      </div>
                      <div style={{ color: 'var(--salon-muted)' }}>
                        {(r.stylist as any)?.name} / {(r.menu as any)?.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
