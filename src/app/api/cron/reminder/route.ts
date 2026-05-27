// src/app/api/cron/reminder/route.ts
// Vercel Cron: 毎朝9時に翌日予約のリマインドLINEを送信
// vercel.json の crons 設定: "0 9 * * *" (JST 18:00 = UTC 9:00)
import { createAdminClient } from '@/lib/supabase/server'
import { sendLineMessage, buildReminderMessage } from '@/lib/line'
import { formatDateFull, formatTime } from '@/lib/utils'
import { NextRequest, NextResponse } from 'next/server'
import { format, addDays } from 'date-fns'

export async function GET(req: NextRequest) {
  // Vercel Cron 認証チェック
  const authHeader = req.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const supabase = await createAdminClient()

  // 翌日の確定予約を全件取得
  const { data: reservations, error } = await supabase
    .from('reservations')
    .select(`
      id,
      reservation_date,
      start_time,
      end_time,
      customer:customers(name, line_user_id),
      stylist:stylists(name),
      menu:menus(name)
    `)
    .eq('reservation_date', tomorrow)
    .eq('status', 'confirmed')

  if (error) {
    console.error('[cron/reminder] fetch error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!reservations || reservations.length === 0) {
    return NextResponse.json({ sent: 0, message: '翌日の予約なし' })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  let sent = 0
  let skipped = 0

  for (const r of reservations) {
    const customer = r.customer as any
    const stylist = r.stylist as any
    const menu = r.menu as any

    if (!customer?.line_user_id) {
      skipped++
      continue
    }

    try {
      await sendLineMessage(customer.line_user_id, [
        buildReminderMessage({
          customerName: customer.name,
          stylistName: stylist?.name ?? '',
          menuName: menu?.name ?? '',
          date: formatDateFull(r.reservation_date),
          startTime: formatTime(r.start_time),
          siteUrl,
        }),
      ])
      sent++
    } catch (e) {
      console.error(`[cron/reminder] LINE send failed for ${r.id}:`, e)
    }
  }

  console.log(`[cron/reminder] ${tomorrow}: sent=${sent}, skipped=${skipped}`)
  return NextResponse.json({
    date: tomorrow,
    total: reservations.length,
    sent,
    skipped,
  })
}
