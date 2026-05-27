// src/app/api/admin/schedules/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const stylistId = searchParams.get('stylistId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!stylistId) return NextResponse.json({ error: 'stylistId required' }, { status: 400 })

  const supabase = await createAdminClient()
  let query = supabase
    .from('stylist_schedules')
    .select('*')
    .eq('stylist_id', stylistId)

  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    stylistId,
    date,
    is_holiday,
    work_start,
    work_end,
    break_start,
    break_end,
  } = body

  if (!stylistId || !date) {
    return NextResponse.json({ error: 'stylistId and date required' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('stylist_schedules')
    .upsert(
      {
        stylist_id: stylistId,
        date,
        is_holiday: is_holiday ?? false,
        work_start: is_holiday ? null : (work_start ?? '10:00'),
        work_end: is_holiday ? null : (work_end ?? '19:00'),
        break_start: is_holiday ? null : (break_start ?? null),
        break_end: is_holiday ? null : (break_end ?? null),
      },
      { onConflict: 'stylist_id,date' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
