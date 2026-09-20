// TAXIMETER.GOV — Enterprise Gov — Next.js Edge Middleware
// Protection côté serveur avant que la page ne charge
// Complète (ne remplace pas) la protection AuthProvider côté client

import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/_next', '/favicon', '/logo']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Laisser passer les routes publiques
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Vérifier la présence d'un token Supabase (cookie sb- ou header)
  const hasCookie = req.cookies.has('sb-access-token')
    || req.cookies.has(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0]?.split('//')[1]}-auth-token`)
    || [...req.cookies.getAll()].some(c => c.name.includes('-auth-token'))

  // Si aucun cookie session ET route sensible → on laisse AuthProvider gérer
  // (le middleware edge ne peut pas décoder JWT sans la clé — AuthProvider est la barrière principale)
  // Ce middleware sert à la défense en profondeur: headers sécurité

  const res = NextResponse.next()

  // Headers de sécurité
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-Enterprise-ID', 'ENT-DEMO-001')
  res.headers.set('X-Pilot-Mode', 'SYNTHETIC-DATA')
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
  )

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
