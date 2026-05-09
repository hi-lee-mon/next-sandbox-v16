import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

const publicPaths = ["/"]
const authPaths = ['/login', '/signup']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    // ヘッダーをつける場合はnext()の引数にheadersを渡す
    return NextResponse.next()
  }

  // 楽観的認証（cookieはクライアント由来の値であり偽造可能であるため）
  const sessionCookie = getSessionCookie(request)
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p))

  if (!sessionCookie && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      missing: [
        // `<Link>`のprefetchでの実行を防止する
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
