// src/app/api/admin/reservations/[id]/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id, reservation_date, start_time, end_time, status, notes, created_at,
      stylist:stylists(name, photo_url),
      menu:menus(name, price, price_max, duration_minutes),
      customer:customers(name, phone, email, visit_count)
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: '予約が見つかりません' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { status } = body

  const validStatuses = ['confirmed', 'cancelled', 'completed', 'no_show']
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
