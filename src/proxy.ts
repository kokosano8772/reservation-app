// src/proxy.ts
// Next.js 16: middleware.ts → proxy.ts に改名
// 管理画面 (/admin/*) に Basic 認証ガードをかける
// ADMIN_PASSWORD が未設定の場合は認証なし（開発時はそのまま使用可）

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // /admin パスのみ保護
  if (pathname.startsWith('/admin')) {
    const adminPassword = process.env.ADMIN_PASSWORD

    // 環境変数未設定なら認証スキップ（開発環境向け）
    if (!adminPassword) {
      return NextResponse.next()
    }

    const authHeader = req.headers.get('authorization') ?? ''

    if (authHeader.startsWith('Basic ')) {
      const base64 = authHeader.slice(6)
      const decoded = Buffer.from(base64, 'base64').toString('utf-8')
      // format: "username:password" — usernameは任意、passwordだけ検証
      const colonIndex = decoded.indexOf(':')
      const password = colonIndex !== -1 ? decoded.slice(colonIndex + 1) : ''

      if (password === adminPassword) {
        return NextResponse.next()
      }
    }

    // 認証失敗 → Basic 認証ダイアログを要求
    return new NextResponse('認証が必要です', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="BLOOM HAIR Admin", charset="UTF-8"',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  // /admin 以下のページのみ適用（API・静的ファイルは除外）
  matcher: ['/admin/:path*'],
}
