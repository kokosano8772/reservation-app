// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { format, addMinutes, parse, isBefore, isAfter, startOfDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { TimeSlot, Reservation } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatPrice(price: number, priceMax?: number | null): string {
  const formatted = price.toLocaleString('ja-JP')
  if (priceMax) {
    return `¥${formatted}〜¥${priceMax.toLocaleString('ja-JP')}`
  }
  return `¥${formatted}`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}時間${m}分` : `${h}時間`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return format(date, 'M月d日(E)', { locale: ja })
}

export function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr)
  return format(date, 'yyyy年M月d日(E)', { locale: ja })
}

export function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5)
}

export const RANK_LABELS: Record<string, string> = {
  director: 'ディレクター',
  top: 'トップスタイリスト',
  senior: 'シニアスタイリスト',
  stylist: 'スタイリスト',
  junior: 'ジュニアスタイリスト',
}

export const CATEGORY_LABELS: Record<string, string> = {
  cut: 'カット',
  color: 'カラー',
  perm: 'パーマ・矯正',
  treatment: 'トリートメント',
  set: 'セットメニュー',
  other: 'その他',
}

export const CATEGORY_COLORS: Record<string, string> = {
  cut: 'bg-pink-50 text-pink-700',
  color: 'bg-amber-50 text-amber-700',
  perm: 'bg-purple-50 text-purple-700',
  treatment: 'bg-teal-50 text-teal-700',
  set: 'bg-blue-50 text-blue-700',
  other: 'bg-gray-50 text-gray-700',
}

// Generate 30-min time slots from workStart to workEnd
export function generateTimeSlots(
  workStart: string,
  workEnd: string,
  durationMinutes: number,
  existingReservations: Reservation[],
  breakStart?: string | null,
  breakEnd?: string | null,
): TimeSlot[] {
  const slots: TimeSlot[] = []
  const base = new Date('2000-01-01')

  const parseTime = (t: string) => parse(t.slice(0, 5), 'HH:mm', base)

  const start = parseTime(workStart)
  const end = parseTime(workEnd)

  let current = start
  while (isBefore(current, end)) {
    const slotEnd = addMinutes(current, durationMinutes)
    if (isAfter(slotEnd, end)) break

    const timeStr = format(current, 'HH:mm')
    const slotEndStr = format(slotEnd, 'HH:mm')

    // Check break time overlap
    let inBreak = false
    if (breakStart && breakEnd) {
      const bStart = parseTime(breakStart)
      const bEnd = parseTime(breakEnd)
      inBreak = isBefore(current, bEnd) && isAfter(slotEnd, bStart)
    }

    // Check existing reservation overlap
    let hasConflict = false
    for (const res of existingReservations) {
      if (res.status === 'cancelled') continue
      const resStart = parseTime(res.start_time)
      const resEnd = parseTime(res.end_time)
      if (isBefore(current, resEnd) && isAfter(slotEnd, resStart)) {
        hasConflict = true
        break
      }
    }

    slots.push({
      time: timeStr,
      available: !inBreak && !hasConflict,
    })

    current = addMinutes(current, 30)
  }

  return slots
}

export function calcEndTime(startTime: string, durationMinutes: number): string {
  const base = new Date('2000-01-01')
  const start = parse(startTime, 'HH:mm', base)
  const end = addMinutes(start, durationMinutes)
  return format(end, 'HH:mm')
}
