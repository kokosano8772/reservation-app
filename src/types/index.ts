// src/types/index.ts

export type Stylist = {
  id: string
  name: string
  name_kana: string
  bio: string
  photo_url: string
  specialties: string[]
  rank: 'director' | 'top' | 'senior' | 'stylist' | 'junior'
  is_active: boolean
  created_at: string
}

export type MenuCategory = 'cut' | 'color' | 'perm' | 'treatment' | 'set' | 'other'

export type Menu = {
  id: string
  name: string
  description: string
  price: number
  price_max: number | null
  duration_minutes: number
  category: MenuCategory
  is_active: boolean
  created_at: string
}

export type Customer = {
  id: string
  line_user_id: string | null
  name: string
  name_kana: string | null
  phone: string | null
  email: string | null
  notes: string | null
  visit_count: number
  last_visit_at: string | null
  created_at: string
}

export type ReservationStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show'

export type Reservation = {
  id: string
  customer_id: string
  stylist_id: string
  menu_id: string
  reservation_date: string
  start_time: string
  end_time: string
  status: ReservationStatus
  notes: string | null
  created_at: string
  updated_at: string
  customer?: Customer
  stylist?: Stylist
  menu?: Menu
}

export type StylistSchedule = {
  id: string
  stylist_id: string
  date: string
  is_holiday: boolean
  work_start: string | null
  work_end: string | null
  break_start: string | null
  break_end: string | null
}

export type TimeSlot = {
  time: string
  available: boolean
}

export type BookingState = {
  stylist: Stylist | null
  menu: Menu | null
  date: string | null
  time: string | null
  customerName: string
  customerPhone: string
  customerEmail: string
  notes: string
}

export type AdminStats = {
  todayReservations: number
  weekReservations: number
  monthReservations: number
  totalCustomers: number
  repeatRate: number
}
