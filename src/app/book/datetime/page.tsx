'use client'
// src/app/book/datetime/page.tsx
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore, startOfToday, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { getBookingState, setDatetime } from '@/lib/bookingStore'
import { StepIndicator, LoadingSpinner } from '@/components/ui/Header'
import type { TimeSlot } from '@/types'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

type DayAvail = 'open' | 'low' | 'full' | 'loading'

export default function DatetimePage() {
  const router = useRouter()
  const today = startOfToday()
  const maxDate = addDays(today, 60)

  const [viewMonth, setViewMonth] = useState(today)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [isHoliday, setIsHoliday] = useState(false)
  const [monthAvail, setMonthAvail] = useState<Record<string, DayAvail>>({})
  const [tappedDate, setTappedDate] = useState<string | null>(null)
  const [slotsKey, setSlotsKey] = useState(0)
  const fetchBatchRef = useRef(0)

  const state = typeof window !== 'undefined' ? getBookingState() : null

  useEffect(() => {
    if (!state?.stylist || !state?.menu) { router.replace('/book/menu') }
  }, [])

  // ── 変更1: 表示月の全日付の空き状況を一括取得 ──────────────────────────
  useEffect(() => {
    // おまかせ or 状態未確定の場合はバッジ不要
    if (!state?.stylist || state.stylist.id === 'any' || !state?.menu) return

    const stylistId = state.stylist.id
    const duration = state.menu.duration_minutes
    const batchId = ++fetchBatchRef.current

    const targets = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) })
      .filter(d => !isBefore(d, today) && isBefore(d, maxDate))

    // まず全対象日を 'loading' で初期化
    const initial: Record<string, DayAvail> = {}
    targets.forEach(d => { initial[format(d, 'yyyy-MM-dd')] = 'loading' })
    setMonthAvail(initial)

    // 並行フェッチ — 各日の結果が届いた順に反映
    targets.forEach(async (day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      try {
        const params = new URLSearchParams({ stylistId, date: dateStr, duration: String(duration) })
        const res = await fetch(`/api/reservations/slots?${params}`)
        const data = await res.json()
        const available = (data.slots ?? []).filter((s: TimeSlot) => s.available).length
        const status: DayAvail = (data.holiday || available === 0) ? 'full'
          : available <= 2 ? 'low'
          : 'open'
        setMonthAvail(prev => {
          if (fetchBatchRef.current !== batchId) return prev  // 月切替後の古い結果を無視
          return { ...prev, [dateStr]: status }
        })
      } catch {
        setMonthAvail(prev => {
          if (fetchBatchRef.current !== batchId) return prev
          return { ...prev, [dateStr]: 'full' }
        })
      }
    })
  }, [viewMonth]) // 月切替のたびに再取得

  // ── 既存: 日付選択時の時間スロット取得（変更なし）──────────────────────
  const fetchSlots = useCallback(async (date: Date) => {
    if (!state?.stylist || !state?.menu) return
    setLoadingSlots(true)
    setSlots([])
    setSelectedTime(null)
    const dateStr = format(date, 'yyyy-MM-dd')
    const stylistId = state.stylist.id === 'any' ? '' : state.stylist.id
    if (!stylistId) {
      setSlots(generateDefaultSlots(state.menu.duration_minutes))
      setLoadingSlots(false)
      return
    }
    const params = new URLSearchParams({
      stylistId,
      date: dateStr,
      duration: String(state.menu.duration_minutes),
    })
    const res = await fetch(`/api/reservations/slots?${params}`)
    const data = await res.json()
    setIsHoliday(data.holiday ?? false)
    setSlots(data.slots ?? [])
    setLoadingSlots(false)
  }, [state?.stylist?.id, state?.menu?.duration_minutes])

  function generateDefaultSlots(duration: number): TimeSlot[] {
    const slots: TimeSlot[] = []
    for (let h = 10; h < 19; h++) {
      for (const m of [0, 30]) {
        const endMinutes = h * 60 + m + duration
        if (endMinutes > 19 * 60) break
        slots.push({ time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, available: true })
      }
    }
    return slots
  }

  // ── 変更2: タップアニメーション付き日付選択 ──────────────────────────────
  function handleDateSelect(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    setTappedDate(dateStr)
    setTimeout(() => setTappedDate(null), 200)
    setSelectedDate(date)
    setSlotsKey(k => k + 1)  // スロット欄を再マウント → fadeIn 再生
    fetchSlots(date)
  }

  function handleTimeSelect(time: string) {
    if (!selectedDate) return
    setSelectedTime(time)
    setDatetime(format(selectedDate, 'yyyy-MM-dd'), time)
    setTimeout(() => router.push('/book/confirm'), 150)
  }

  // カレンダーグリッド構築
  const firstDay = startOfMonth(viewMonth)
  const lastDay = endOfMonth(viewMonth)
  const days = eachDayOfInterval({ start: firstDay, end: lastDay })
  const startPad = getDay(firstDay)

  const prevMonth = () => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  return (
    <div>
      <StepIndicator current={2} total={3} />
      <div style={{ padding: '0.5rem 1rem 0' }}>
        {state?.stylist && state?.menu && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--salon-accent)', fontWeight: 600, background: 'var(--salon-accent-light)', padding: '4px 10px', borderRadius: '9999px' }}>
              {state.stylist.name}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#4b5563', fontWeight: 600, background: '#f3f4f6', padding: '4px 10px', borderRadius: '9999px' }}>
              {state.menu.name}
            </span>
          </div>
        )}
        <h1 className="section-title">日時を選ぶ</h1>
      </div>

      {/* カレンダー */}
      <div style={{ padding: '0.75rem 1rem 0' }}>
        <div style={{ background: 'white', border: '1px solid var(--salon-border)', borderRadius: '1rem', padding: '1rem' }}>

          {/* 月ナビ */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <button onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--salon-border)', background: 'white', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{format(viewMonth, 'yyyy年M月', { locale: ja })}</span>
            <button onClick={nextMonth} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--salon-border)', background: 'white', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
          </div>

          {/* 曜日ヘッダー */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {WEEKDAYS.map((d, i) => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0', color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : 'var(--salon-muted)' }}>{d}</div>
            ))}
          </div>

          {/* 日付グリッド */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
            {days.map((day) => {
              const isPast = isBefore(day, today)
              const isTooFar = !isBefore(day, maxDate)
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
              const isToday = isSameDay(day, today)
              const isSun = getDay(day) === 0
              const isSat = getDay(day) === 6
              const disabled = isPast || isTooFar
              const dateStr = format(day, 'yyyy-MM-dd')
              const avail = monthAvail[dateStr]
              const isFull = !disabled && avail === 'full'

              // ── 変更1: バッジ用ドットの色 ──
              const dotColor = avail === 'open' ? 'var(--salon-available)'
                : avail === 'low' ? 'var(--salon-warning)'
                : 'transparent'

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => !disabled && handleDateSelect(day)}
                  // ── 変更2: タップ時にスケールアニメーション ──
                  className={tappedDate === dateStr ? 'calendar-day-tapped' : undefined}
                  style={{
                    padding: '0.2rem 0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 40,
                    borderRadius: '50%',
                    border: 'none',
                    // ── 変更1: 選択済み → accent / 満員 → border色でグレー ──
                    background: isSelected ? 'var(--salon-accent)' : 'none',
                    color: isSelected ? 'white'
                      : disabled || isFull ? 'var(--salon-border)'
                      : isSun ? '#ef4444'
                      : isSat ? '#3b82f6'
                      : 'inherit',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span style={{ fontSize: '0.875rem', lineHeight: 1 }}>{format(day, 'd')}</span>
                  {/* ── 変更1: 空き状況バッジ（おまかせ以外・未来日のみ）── */}
                  {!disabled && (
                    <span style={{
                      display: 'block',
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      marginTop: 3,
                      background: isSelected ? 'rgba(255,255,255,0.7)' : dotColor,
                      flexShrink: 0,
                    }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 時間スロット ── 変更2: key でフォース再マウント → fadeIn 毎回発火 */}
      {selectedDate && (
        <div key={slotsKey} className="slots-fade-in" style={{ padding: '1rem' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--salon-primary)' }}>
            {format(selectedDate, 'M月d日(E)', { locale: ja })} の空き時間
          </p>

          {loadingSlots && <LoadingSpinner label="空き枠を確認中..." />}

          {!loadingSlots && isHoliday && (
            <p style={{ textAlign: 'center', color: 'var(--salon-muted)', fontSize: '0.875rem', padding: '1.5rem' }}>
              この日は定休日または休暇です
            </p>
          )}

          {!loadingSlots && !isHoliday && slots.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--salon-muted)', fontSize: '0.875rem', padding: '1.5rem' }}>
              この日の空き枠はありません
            </p>
          )}

          {/* ── 変更3: 時間スロットのデザインは完全に現状維持 ── */}
          {!loadingSlots && slots.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && handleTimeSelect(slot.time)}
                  className={`time-slot ${slot.available ? 'available' : 'unavailable'} ${selectedTime === slot.time ? 'selected' : ''}`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedDate && (
        <p style={{ textAlign: 'center', color: 'var(--salon-muted)', fontSize: '0.875rem', padding: '2rem 1rem' }}>
          上のカレンダーから日付を選んでください
        </p>
      )}
    </div>
  )
}
