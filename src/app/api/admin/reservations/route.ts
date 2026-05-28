// src/app/api/admin/reservations/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')         // e.g. "2025-06-01"
  const stylistId = searchParams.get('stylistId')
  const status = searchParams.get('status')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const limit = parseInt(searchParams.get('limit') ?? '100')

  const supabase = await createAdminClient()

  let query = supabase
    .from('reservations')
    .select(`
      id, reservation_date, start_time, end_time, status, notes, created_at,
      stylist:stylists(id, name, photo_url),
      menu:menus(id, name, price, duration_minutes),
      customer:customers(id, name, phone, email, visit_count)
    `)
    .order('reservation_date', { ascending: false })
    .order('start_time', { ascending: true })
    .limit(limit)

  if (date) query = query.eq('reservation_date', date)
  if (from) query = query.gte('reservation_date', from)
  if (to) query = query.lte('reservation_date', to)
  if (stylistId) query = query.eq('stylist_id', stylistId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
