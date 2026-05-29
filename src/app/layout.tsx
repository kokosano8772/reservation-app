// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KOKO DESIGN | ご予約',
  description: '美容室 KOKO DESIGN のオンライン予約サイト。スタイリスト指名・日時選択・即時確定。',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a1a1a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ background: 'var(--salon-bg)', minHeight: '100dvh' }}>
        {children}
      </body>
    </html>
  )
}
