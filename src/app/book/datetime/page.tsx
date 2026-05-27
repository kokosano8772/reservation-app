'use client'
// src/app/book/datetime/page.tsx
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore, startOfToday, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { getBookingState, setDatetime } from '@/lib/bookingStore'
import { StepIndicator, LoadingSpinner } from '@/components/ui/Header'
import type { TimeSlot } from '@/types'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

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
  const state = typeof window !== 'undefined' ? getBookingState() : null

  useEffect(() => {
    if (!state?.stylist || !state?.menu) { router.replace('/book/menu'); }
  }, [])

  const fetchSlots = useCallback(async (date: Date) => {
    if (!state?.stylist || !state?.menu) return
    setLoadingSlots(true)
    setSlots([])
    setSelectedTime(null)
    const dateStr = format(date, 'yyyy-MM-dd')
    const stylistId = state.stylist.id === 'any' ? '' : state.stylist.id
    if (!stylistId) {
      // "Any" stylist - use default slots
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

  function handleDateSelect(date: Date) {
    setSelectedDate(date)
    fetchSlots(date)
  }

  function handleTimeSelect(time: string) {
    if (!selectedDate) return
    setSelectedTime(time)
    setDatetime(format(selectedDate, 'yyyy-MM-dd'), time)
    setTimeout(() => router.push('/book/confirm'), 150)
  }

  // Build calendar grid
  const firstDay = startOfMonth(viewMonth)
  const lastDay = endOfMonth(viewMonth)
  const days = eachDayOfInterval({ start: firstDay, end: lastDay })
  const startPad = getDay(firstDay) // 0=Sun

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

      {/* Calendar */}
      <div style={{ padding: '0.75rem 1rem 0' }}>
        <div style={{ background: 'white', border: '1px solid var(--salon-border)', borderRadius: '1rem', padding: '1rem' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <button onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--salon-border)', background: 'white', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{format(viewMonth, 'yyyy年M月', { locale: ja })}</span>
            <button onClick={nextMonth} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--salon-border)', background: 'white', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {WEEKDAYS.map((d, i) => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0', color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : 'var(--salon-muted)' }}>{d}</div>
            ))}
          </div>

          {/* Day grid */}
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

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => !disabled && handleDateSelect(day)}
                  className={`calendar-day ${disabled ? 'past' : 'available'} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  style={{
                    color: isSelected ? 'white' : isSun ? '#ef4444' : isSat ? '#3b82f6' : undefined,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    background: 'none',
                    border: 'none',
                  }}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div style={{ padding: '1rem' }}>
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

          {!loadingSlots && slots.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && handleTimeSelect(slot.time)}
                  className={`time-slot ${slot.available ? 'available' : 'unavailable'} ${selectedTime === slot.time ? 'selected' : ''}`}
                  style={{ background: 'white', border: '1px solid var(--salon-border)' }}
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
