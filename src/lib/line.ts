// src/lib/line.ts

type LineMessage = {
  type: 'text'
  text: string
}

export async function sendLineMessage(userId: string, messages: LineMessage[]) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token || !userId || userId === 'guest') return

  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to: userId, messages }),
  })
}

export function buildConfirmationMessage(params: {
  customerName: string
  stylistName: string
  menuName: string
  date: string
  startTime: string
  endTime: string
  reservationId: string
  siteUrl: string
}): LineMessage {
  return {
    type: 'text',
    text: `【予約確定】\n\n${params.customerName} 様\n\nご予約が確定しました。\n\n━━━━━━━━━━━━━━\n📅 ${params.date}\n⏰ ${params.startTime}〜${params.endTime}\n✂️ ${params.stylistName}\n💄 ${params.menuName}\n━━━━━━━━━━━━━━\n\n変更・キャンセルはこちら：\n${params.siteUrl}/my/reservations\n\nご来店をお待ちしております🌸`,
  }
}

export function buildReminderMessage(params: {
  customerName: string
  stylistName: string
  menuName: string
  date: string
  startTime: string
  siteUrl: string
}): LineMessage {
  return {
    type: 'text',
    text: `【前日リマインド】\n\n${params.customerName} 様\n\n明日のご予約のご確認です。\n\n━━━━━━━━━━━━━━\n📅 ${params.date}\n⏰ ${params.startTime}〜\n✂️ ${params.stylistName}\n💄 ${params.menuName}\n━━━━━━━━━━━━━━\n\nご来店を楽しみにお待ちしております✨\n\n変更は前日18時までにお願いします：\n${params.siteUrl}/my/reservations`,
  }
}

export function buildAdminNotificationMessage(params: {
  customerName: string
  stylistName: string
  menuName: string
  date: string
  startTime: string
  phone: string
}): LineMessage {
  return {
    type: 'text',
    text: `【新規予約】\n\n👤 ${params.customerName}\n📞 ${params.phone}\n\n📅 ${params.date} ${params.startTime}〜\n✂️ ${params.stylistName}\n💄 ${params.menuName}`,
  }
}
