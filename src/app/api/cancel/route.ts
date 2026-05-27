// src/app/api/cancel/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { reservationId, phone, email } = body

  if (!reservationId) {
    return NextResponse.json({ error: 'reservationId required' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // Verify ownership: caller must provide phone or email that matches the customer
  const { data: reservation } = await supabase
    .from('reservations')
    .select('*, customer:customers(phone, email)')
    .eq('id', reservationId)
    .single()

  if (!reservation) {
    return NextResponse.json({ error: '予約が見つかりません' }, { status: 404 })
  }

  const customer = reservation.customer as any
  const isOwner =
    (phone && customer?.phone === phone) || (email && customer?.email === email)

  if (!isOwner) {
    return NextResponse.json({ error: '本人確認ができませんでした' }, { status: 403 })
  }

  if (reservation.status === 'cancelled') {
    return NextResponse.json({ error: 'すでにキャンセル済みです' }, { status: 400 })
  }

  const { error } = await supabase
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', reservationId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
