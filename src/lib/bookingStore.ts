'use client'
// src/lib/bookingStore.ts
// Simple booking state manager using sessionStorage

import type { Stylist, Menu, BookingState } from '@/types'

const KEY = 'bloom_booking'

export const defaultBookingState: BookingState = {
  stylist: null,
  menu: null,
  date: null,
  time: null,
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  notes: '',
}

export function getBookingState(): BookingState {
  if (typeof window === 'undefined') return defaultBookingState
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? { ...defaultBookingState, ...JSON.parse(raw) } : defaultBookingState
  } catch {
    return defaultBookingState
  }
}

export function setBookingState(partial: Partial<BookingState>) {
  if (typeof window === 'undefined') return
  const current = getBookingState()
  sessionStorage.setItem(KEY, JSON.stringify({ ...current, ...partial }))
}

export function clearBookingState() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(KEY)
}

export function setStylist(stylist: Stylist) {
  setBookingState({ stylist, menu: null, date: null, time: null })
}

export function setMenu(menu: Menu) {
  setBookingState({ menu, date: null, time: null })
}

export function setDatetime(date: string, time: string) {
  setBookingState({ date, time })
}

export function setCustomerInfo(info: {
  customerName: string
  customerPhone: string
  customerEmail: string
  notes: string
}) {
  setBookingState(info)
}
