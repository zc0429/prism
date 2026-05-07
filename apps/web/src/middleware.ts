import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

const publicRoutes = ['/', '/sign-in', '/sign-up', '/download', '/setup', '/api/auth']

export default auth((req) => {
  const pathname = req.nextUrl.pathname
  const isPublic = publicRoutes.some((r) => pathname === r || (r !== '/' && pathname.startsWith(r)))
  const isAuth = !!req.auth

  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
    if (isAuth) return NextResponse.redirect(new URL('/dashboard', req.url))
    return NextResponse.next()
  }

  if (!isAuth && !isPublic) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/api/:path*'],
}
