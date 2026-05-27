// src/app/api/admin/stats/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export async function GET() {
  const supabase = await createAdminClient()
  const today = format(new Date(), 'yyyy-MM-dd')
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd')

  const [todayRes, weekRes, monthRes, totalCustomers, repeatCustomers] = await Promise.all([
    supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('reservation_date', today)
      .neq('status', 'cancelled'),

    supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .gte('reservation_date', weekStart)
      .lte('reservation_date', weekEnd)
      .neq('status', 'cancelled'),

    supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .gte('reservation_date', monthStart)
      .lte('reservation_date', monthEnd)
      .neq('status', 'cancelled'),

    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true }),

    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .gte('visit_count', 2),
  ])

  const total = totalCustomers.count ?? 0
  const repeat = repeatCustomers.count ?? 0
  const repeatRate = total > 0 ? Math.round((repeat / total) * 100) : 0

  return NextResponse.json({
    todayReservations: todayRes.count ?? 0,
    weekReservations: weekRes.count ?? 0,
    monthReservations: monthRes.count ?? 0,
    totalCustomers: total,
    repeatRate,
  })
}
