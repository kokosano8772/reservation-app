// src/app/api/reservations/slots/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateTimeSlots } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const stylistId = searchParams.get('stylistId')
  const date = searchParams.get('date')
  const durationStr = searchParams.get('duration')

  if (!stylistId || !date || !durationStr) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const duration = parseInt(durationStr)
  const supabase = await createAdminClient()

  // Get stylist schedule for the day (custom schedule overrides default)
  const { data: schedule } = await supabase
    .from('stylist_schedules')
    .select('*')
    .eq('stylist_id', stylistId)
    .eq('date', date)
    .single()

  // Default shop hours if no custom schedule
  const workStart = schedule?.work_start ?? '10:00:00'
  const workEnd = schedule?.work_end ?? '19:00:00'
  const breakStart = schedule?.break_start ?? null
  const breakEnd = schedule?.break_end ?? null
  const isHoliday = schedule?.is_holiday ?? false

  if (isHoliday) {
    return NextResponse.json({ slots: [], holiday: true })
  }

  // Get existing reservations for this stylist on this date
  const { data: reservations } = await supabase
    .from('reservations')
    .select('start_time, end_time, status')
    .eq('stylist_id', stylistId)
    .eq('reservation_date', date)
    .neq('status', 'cancelled')

  const slots = generateTimeSlots(
    workStart,
    workEnd,
    duration,
    (reservations ?? []) as any,
    breakStart,
    breakEnd,
  )

  return NextResponse.json({ slots, holiday: false })
}
