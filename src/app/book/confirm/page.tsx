'use client'
// src/app/book/confirm/page.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getBookingState, setCustomerInfo } from '@/lib/bookingStore'
import { formatDateFull, formatPrice, formatDuration, formatTime } from '@/lib/utils'
import { StepIndicator } from '@/components/ui/Header'

export default function ConfirmPage() {
  const router = useRouter()
  const [state, setState] = useState(() =>
    typeof window !== 'undefined' ? getBookingState() : null
  )
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const s = getBookingState()
    setState(s)
    if (!s.stylist || !s.menu || !s.date || !s.time) {
      router.replace('/book/stylist')
    }
    // Pre-fill if returning
    setName(s.customerName)
    setPhone(s.customerPhone)
    setEmail(s.customerEmail)
    setNotes(s.notes)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!state?.stylist || !state?.menu || !state?.date || !state?.time) return
    if (!name.trim()) { setError('お名前を入力してください'); return }
    if (!phone.trim() && !email.trim()) { setError('電話番号またはメールアドレスを入力してください'); return }

    setSubmitting(true)
    setError('')
    setCustomerInfo({ customerName: name, customerPhone: phone, customerEmail: email, notes })

    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stylistId: state.stylist.id === 'any' ? null : state.stylist.id,
        menuId: state.menu.id,
        date: state.date,
        time: state.time,
        duration: state.menu.duration_minutes,
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        notes,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? '予約に失敗しました。もう一度お試しください。')
      setSubmitting(false)
      return
    }

    router.push(`/book/complete?id=${data.id}`)
  }

  if (!state) return null

  return (
    <div>
      <StepIndicator current={2} total={3} />
      <div style={{ padding: '0.5rem 1rem 0' }}>
        <h1 className="section-title animate-fadeInUp">予約内容の確認</h1>
      </div>

      {/* Summary card */}
      <div style={{ padding: '1rem' }}>
        <div className="animate-fadeInUp" style={{ background: 'var(--salon-accent-light)', border: '1.5px solid var(--salon-accent)', borderRadius: '1rem', padding: '1.25rem', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--salon-accent)', fontWeight: 600, marginBottom: '0.75rem' }}>予約内容</p>
          {[
            ['✂️ 担当', state.stylist?.name ?? ''],
            ['💄 メニュー', state.menu?.name ?? ''],
            ['💰 料金', state.menu ? formatPrice(state.menu.price, state.menu.price_max) : ''],
            ['⏱ 所要時間', state.menu ? formatDuration(state.menu.duration_minutes) : ''],
            ['📅 日時', state.date && state.time
              ? `${formatDateFull(state.date)} ${formatTime(state.time)}〜`
              : ''],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--salon-muted)', fontWeight: 500 }}>{label}</span>
              <span style={{ fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Customer form */}
        <form onSubmit={handleSubmit}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>お客様情報</p>

          {[
            { label: 'お名前 *', value: name, setter: setName, type: 'text', placeholder: '山田 花子', required: true },
            { label: '電話番号', value: phone, setter: setPhone, type: 'tel', placeholder: '09012345678', required: false },
            { label: 'メールアドレス', value: email, setter: setEmail, type: 'email', placeholder: 'example@email.com', required: false },
          ].map(({ label, value, setter, type, placeholder }) => (
            <div key={label} style={{ marginBottom: '0.875rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--salon-primary)' }}>
                {label}
              </label>
              <input
                type={type}
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1.5px solid var(--salon-border)',
                  fontSize: '1rem',
                  background: 'white',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--salon-accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--salon-border)')}
              />
            </div>
          ))}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              ご要望・アレルギー等
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例：肌が敏感です / パーマは控えめに など"
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '1.5px solid var(--salon-border)',
                fontSize: '0.9rem',
                background: 'white',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--salon-accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--salon-border)')}
            />
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', padding: '0.875rem', fontSize: '0.875rem', color: '#b91c1c', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary animate-fadeInUp delay-2"
            style={{ marginBottom: '1.25rem', fontSize: '1.05rem', letterSpacing: '0.02em' }}
          >
            {submitting ? '予約中...' : '✓ 予約を確定する'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => router.push('/book/datetime')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: 'var(--salon-muted)',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                padding: '0.25rem 0.5rem',
              }}
            >
              ← 日時を変更する
            </button>
          </div>
        </form>

        <p style={{ fontSize: '0.7rem', color: 'var(--salon-muted)', textAlign: 'center', marginTop: '1rem', lineHeight: 1.6 }}>
          ご予約確定後、確認メッセージをお送りします。
          <br />キャンセルは前日18時までにお願いします。
        </p>
      </div>
    </div>
  )
}
