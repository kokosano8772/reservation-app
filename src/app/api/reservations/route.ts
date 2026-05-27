// src/app/api/reservations/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { calcEndTime, formatDateFull, formatTime } from '@/lib/utils'
import { sendLineMessage, buildConfirmationMessage, buildAdminNotificationMessage } from '@/lib/line'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const phone = searchParams.get('phone')
  const email = searchParams.get('email')

  const supabase = await createAdminClient()

  let customerQuery = supabase.from('customers').select('id')
  if (phone) customerQuery = customerQuery.eq('phone', phone)
  else if (email) customerQuery = customerQuery.eq('email', email)
  else return NextResponse.json([])

  const { data: customers } = await customerQuery
  if (!customers?.length) return NextResponse.json([])

  const customerIds = customers.map((c) => c.id)
  const { data, error } = await supabase
    .from('reservations')
    .select(`*, customer:customers(*), stylist:stylists(*), menu:menus(*)`)
    .in('customer_id', customerIds)
    .order('reservation_date', { ascending: false })
    .order('start_time', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    stylistId,
    menuId,
    date,
    time,
    duration,
    customerName,
    customerPhone,
    customerEmail,
    notes,
  } = body

  if (!stylistId || !menuId || !date || !time || !duration || !customerName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await createAdminClient()
  const endTime = calcEndTime(time, duration)

  // Conflict check (double booking prevention)
  const { data: conflicts } = await supabase
    .from('reservations')
    .select('id')
    .eq('stylist_id', stylistId)
    .eq('reservation_date', date)
    .neq('status', 'cancelled')
    .or(`start_time.lt.${endTime}:00,end_time.gt.${time}:00`)

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json({ error: 'この時間枠はすでに予約済みです。別の時間をお選びください。' }, { status: 409 })
  }

  // Upsert customer (find by phone or email, or create new)
  let customerId: string
  const findQuery = supabase.from('customers').select('id')
  if (customerPhone) {
    const { data: existing } = await findQuery.eq('phone', customerPhone).single()
    if (existing) {
      customerId = existing.id
      await supabase.from('customers').update({ name: customerName, email: customerEmail }).eq('id', customerId)
    } else {
      const { data: newCustomer, error: ce } = await supabase
        .from('customers')
        .insert({ name: customerName, phone: customerPhone, email: customerEmail })
        .select('id')
        .single()
      if (ce || !newCustomer) return NextResponse.json({ error: 'Customer creation failed' }, { status: 500 })
      customerId = newCustomer.id
    }
  } else {
    const { data: newCustomer, error: ce } = await supabase
      .from('customers')
      .insert({ name: customerName, phone: customerPhone ?? null, email: customerEmail ?? null })
      .select('id')
      .single()
    if (ce || !newCustomer) return NextResponse.json({ error: 'Customer creation failed' }, { status: 500 })
    customerId = newCustomer.id
  }

  // Create reservation
  const { data: reservation, error: re } = await supabase
    .from('reservations')
    .insert({
      customer_id: customerId,
      stylist_id: stylistId,
      menu_id: menuId,
      reservation_date: date,
      start_time: `${time}:00`,
      end_time: `${endTime}:00`,
      status: 'confirmed',
      notes: notes || null,
    })
    .select('id')
    .single()

  if (re || !reservation) {
    return NextResponse.json({ error: re?.message ?? 'Reservation failed' }, { status: 500 })
  }

  // Increment visit count (fire and forget)
  supabase.rpc('increment_visit_count', { customer_id: customerId }).then(() => {})

  // Fetch details for notification
  const { data: details } = await supabase
    .from('reservations')
    .select('*, stylist:stylists(name), menu:menus(name,duration_minutes)')
    .eq('id', reservation.id)
    .single()

  // Send LINE notification (fire and forget)
  if (details) {
    const stylistName = (details.stylist as any)?.name ?? ''
    const menuName = (details.menu as any)?.name ?? ''
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const dateFormatted = formatDateFull(date)

    const { data: customer } = await supabase
      .from('customers')
      .select('line_user_id, phone')
      .eq('id', customerId)
      .single()

    if (customer?.line_user_id) {
      sendLineMessage(customer.line_user_id, [
        buildConfirmationMessage({
          customerName,
          stylistName,
          menuName,
          date: dateFormatted,
          startTime: formatTime(time),
          endTime: formatTime(endTime),
          reservationId: reservation.id,
          siteUrl,
        }),
      ])
    }

    // Notify admin via LINE if ADMIN_LINE_USER_ID is set
    const adminUserId = process.env.ADMIN_LINE_USER_ID
    if (adminUserId) {
      sendLineMessage(adminUserId, [
        buildAdminNotificationMessage({
          customerName,
          stylistName,
          menuName,
          date: dateFormatted,
          startTime: formatTime(time),
          phone: customer?.phone ?? '未設定',
        }),
      ])
    }
  }

  return NextResponse.json({ id: reservation.id }, { status: 201 })
}
