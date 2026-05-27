// src/app/api/admin/customers/[id]/reservations/route.ts
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
      id, reservation_date, start_time, end_time, status, notes,
      stylist:stylists(name),
      menu:menus(name, price)
    `)
    .eq('customer_id', id)
    .neq('status', 'cancelled')
    .order('reservation_date', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
