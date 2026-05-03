import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

let count = 0

// このfunction内で`await`を使用する場合は、`async`でマークできます
export function proxy(request: NextRequest) {
  count = count + 1
  console.log("🚨proxy", count)
}

export const config = {
  // middlewareを呼び出して良いパスを指定
  matcher: [
    /*
     * 以下のパスを除く全てのリクエストにマッチする
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - その他、拡張子が *.(svg|png|jpg|jpeg|gif|webp) のファイル
     */ {
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      // プリフェッチでmiddlewareが呼び出されないようにする
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}