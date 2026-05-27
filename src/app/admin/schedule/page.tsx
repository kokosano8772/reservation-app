'use client'
// src/app/admin/schedule/page.tsx
import { useEffect, useState, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { LoadingSpinner } from '@/components/ui/Header'
import type { Stylist, StylistSchedule } from '@/types'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const DEFAULT_TIMES = {
  work_start: '10:00',
  work_end: '19:00',
  break_start: '13:00',
  break_end: '14:00',
}

export default function AdminSchedulePage() {
  const [stylists, setStylists] = useState<Stylist[]>([])
  const [selectedStylist, setSelectedStylist] = useState<string>('')
  const [viewMonth, setViewMonth] = useState(new Date())
  const [schedules, setSchedules] = useState<Record<string, StylistSchedule>>({})
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ ...DEFAULT_TIMES, is_holiday: false })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    fetch('/api/stylists')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d) && d.length > 0) {
          setStylists(d)
          setSelectedStylist(d[0].id)
        }
      })
  }, [])

  const fetchSchedules = useCallback(async () => {
    if (!selectedStylist) return
    setLoading(true)
    const from = format(startOfMonth(viewMonth), 'yyyy-MM-dd')
    const to = format(endOfMonth(viewMonth), 'yyyy-MM-dd')
    const params = new URLSearchParams({ stylistId: selectedStylist, from, to })
    const res = await fetch(`/api/admin/schedules?${params}`)
    const data = await res.json()
    const map: Record<string, StylistSchedule> = {}
    if (Array.isArray(data)) {
      data.forEach((s: StylistSchedule) => { map[s.date] = s })
    }
    setSchedules(map)
    setLoading(false)
  }, [selectedStylist, viewMonth])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  function handleDayClick(dateStr: string) {
    setSelectedDay(dateStr)
    const existing = schedules[dateStr]
    if (existing) {
      setEditForm({
        work_start: existing.work_start?.slice(0, 5) ?? DEFAULT_TIMES.work_start,
        work_end: existing.work_end?.slice(0, 5) ?? DEFAULT_TIMES.work_end,
        break_start: existing.break_start?.slice(0, 5) ?? DEFAULT_TIMES.break_start,
        break_end: existing.break_end?.slice(0, 5) ?? DEFAULT_TIMES.break_end,
        is_holiday: existing.is_holiday,
      })
    } else {
      setEditForm({ ...DEFAULT_TIMES, is_holiday: false })
    }
    setSaveMsg('')
  }

  async function handleSave() {
    if (!selectedStylist || !selectedDay) return
    setSaving(true)
    setSaveMsg('')
    const res = await fetch('/api/admin/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stylistId: selectedStylist,
        date: selectedDay,
        ...editForm,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setSaveMsg('保存しました')
      fetchSchedules()
    } else {
      setSaveMsg(data.error ?? '保存に失敗しました')
    }
    setSaving(false)
  }

  // Build calendar
  const firstDay = startOfMonth(viewMonth)
  const lastDay = endOfMonth(viewMonth)
  const days = eachDayOfInterval({ start: firstDay, end: lastDay })
  const startPad = getDay(firstDay)

  return (
    <div style={{ padding: '1.25rem', maxWidth: 900 }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>スケジュール管理</h1>

      {/* Stylist selector */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--salon-muted)' }}>担当：</span>
        {stylists.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSelectedStylist(s.id); setSelectedDay(null) }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              border: '1.5px solid',
              borderColor: selectedStylist === s.id ? 'var(--salon-accent)' : 'var(--salon-border)',
              background: selectedStylist === s.id ? 'var(--salon-accent)' : 'white',
              color: selectedStylist === s.id ? 'white' : 'var(--salon-primary)',
              fontWeight: 600,
              fontSize: '0.825rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedDay ? '1fr 280px' : '1fr', gap: '1rem' }}>
        {/* Calendar */}
        <div className="card" style={{ padding: '1.25rem' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <button
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              style={{ width: 32, height: 32, borderRadius: '0.5rem', border: '1px solid var(--salon-border)', background: 'white', cursor: 'pointer', fontSize: '1.1rem' }}
            >‹</button>
            <span style={{ fontWeight: 700 }}>{format(viewMonth, 'yyyy年M月', { locale: ja })}</span>
            <button
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              style={{ width: 32, height: 32, borderRadius: '0.5rem', border: '1px solid var(--salon-border)', background: 'white', cursor: 'pointer', fontSize: '1.1rem' }}
            >›</button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
            {WEEKDAYS.map((d, i) => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 600, color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : 'var(--salon-muted)', padding: '0.25rem 0' }}>{d}</div>
            ))}
          </div>

          {loading ? <LoadingSpinner label="読み込み中..." /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
              {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
              {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const schedule = schedules[dateStr]
                const isHoliday = schedule?.is_holiday
                const hasCustom = !!schedule && !isHoliday
                const isSelected = selectedDay === dateStr
                const isToday = isSameDay(day, new Date())
                const isSun = getDay(day) === 0
                const isSat = getDay(day) === 6

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDayClick(dateStr)}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 52,
                      borderRadius: '0.625rem',
                      border: '1.5px solid',
                      borderColor: isSelected ? 'var(--salon-accent)' : isHoliday ? '#fecaca' : hasCustom ? '#86efac' : 'var(--salon-border)',
                      background: isSelected ? 'var(--salon-accent)' : isHoliday ? '#fef2f2' : hasCustom ? '#f0fdf4' : 'white',
                      color: isSelected ? 'white' : isHoliday ? '#b91c1c' : isSun ? '#ef4444' : isSat ? '#3b82f6' : 'var(--salon-primary)',
                      fontWeight: isToday ? 700 : 500,
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      transition: 'all 0.1s',
                    }}
                  >
                    {format(day, 'd')}
                    {isHoliday && <span style={{ fontSize: '0.5rem', fontWeight: 600 }}>休</span>}
                    {hasCustom && !isSelected && <span style={{ fontSize: '0.5rem', color: '#15803d' }}>●</span>}
                  </button>
                )
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.875rem', fontSize: '0.72rem', color: 'var(--salon-muted)' }}>
            {[
              { color: '#fef2f2', border: '#fecaca', label: '休日設定' },
              { color: '#f0fdf4', border: '#86efac', label: 'カスタム時間' },
              { color: 'white', border: 'var(--salon-border)', label: 'デフォルト（10〜19時）' },
            ].map(({ color, border, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: color, border: `1px solid ${border}` }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Edit panel */}
        {selectedDay && (
          <div className="card" style={{ padding: '1.25rem', height: 'fit-content' }}>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>
              {format(new Date(selectedDay), 'M月d日(E)', { locale: ja })} の設定
            </p>

            {/* Holiday toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editForm.is_holiday}
                onChange={(e) => setEditForm((f) => ({ ...f, is_holiday: e.target.checked }))}
                style={{ width: 18, height: 18, accentColor: 'var(--salon-accent)', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>この日を休日にする</span>
            </label>

            {!editForm.is_holiday && (
              <>
                {[
                  { label: '勤務開始', key: 'work_start' },
                  { label: '勤務終了', key: 'work_end' },
                  { label: '休憩開始', key: 'break_start' },
                  { label: '休憩終了', key: 'break_end' },
                ].map(({ label, key }) => (
                  <div key={key} style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--salon-muted)', marginBottom: '0.3rem' }}>
                      {label}
                    </label>
                    <input
                      type="time"
                      value={editForm[key as keyof typeof editForm] as string}
                      onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.625rem',
                        border: '1.5px solid var(--salon-border)',
                        fontSize: '0.9rem',
                        background: 'white',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                ))}
              </>
            )}

            {saveMsg && (
              <div style={{
                padding: '0.625rem 0.875rem',
                borderRadius: '0.625rem',
                background: saveMsg === '保存しました' ? '#f0fdf4' : '#fef2f2',
                color: saveMsg === '保存しました' ? '#15803d' : '#b91c1c',
                fontSize: '0.8rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
              }}>
                {saveMsg}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? '保存中...' : '保存する'}
            </button>
            <button
              onClick={() => setSelectedDay(null)}
              className="btn-outline"
              style={{ marginTop: '0.5rem' }}
            >
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
