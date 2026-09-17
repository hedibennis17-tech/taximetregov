import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') ?? ''
  const googtrans = req.cookies.get('googtrans')?.value ?? null
  const acceptLang = req.headers.get('accept-language') ?? ''
  const host = req.headers.get('host') ?? ''
  const referer = req.headers.get('referer') ?? ''

  // Parse tous les cookies
  const cookies: Record<string,string> = {}
  cookieHeader.split(';').forEach(c => {
    const [k,v] = c.trim().split('=')
    if (k) cookies[k] = v ?? ''
  })

  return NextResponse.json({
    ok: true,
    diagnosis: {
      // Cookie Google Translate
      googtrans_cookie:     googtrans,
      googtrans_present:    !!googtrans,
      googtrans_expected:   '/fr/en',
      googtrans_correct:    googtrans === '/fr/en',

      // Headers
      host,
      accept_language: acceptLang,
      referer,

      // Tous les cookies
      all_cookies: cookies,

      // Domaine pour le cookie
      domain_info: {
        hostname:       host.split(':')[0],
        cookie_domain:  `.${host.split(':')[0]}`,
        vercel_domain:  host.includes('vercel.app'),
      },

      // Instructions test
      instructions: [
        '1. Ouvre DevTools → Application → Cookies',
        '2. Cherche le cookie "googtrans"',
        '3. Sa valeur doit être "/fr/en"',
        '4. Il doit exister pour le domaine ET .domaine',
        '5. Si absent → le setLang() ne pose pas le cookie correctement',
        '6. Si présent mais pas de traduction → Google CDN ne lit pas le cookie',
      ],

      // État attendu
      expected_flow: {
        step1: 'Clic FR|EN → setLang("en")',
        step2: 'Cookie googtrans=/fr/en posé sur / et .domaine',
        step3: 'window.location.href = current URL (fresh load)',
        step4: 'Au chargement, Google CDN lit le cookie',
        step5: 'Page traduite automatiquement en anglais',
      },

      // Fix si ça marche pas
      vercel_fix: host.includes('vercel.app')
        ? 'SUR VERCEL: le cookie doit être posé sur .vercel.app ET taximetregov-driver-hedi-benniss-projects.vercel.app'
        : 'Domaine local détecté',

      timestamp: new Date().toISOString(),
    }
  })
}

export async function POST(req: NextRequest) {
  // Test: forcer le cookie manuellement
  const body = await req.json() as { lang?: string }
  const lang = body.lang ?? 'en'
  const host = req.headers.get('host') ?? ''
  const hostname = host.split(':')[0]!

  const val = lang === 'fr' ? '' : `/fr/${lang}`
  const res = NextResponse.json({
    ok: true,
    action: lang === 'fr' ? 'ERASE_COOKIE' : 'SET_COOKIE',
    cookie_value: val,
    hostname,
    message: lang === 'fr'
      ? 'Cookie effacé — rechargez la page'
      : `Cookie googtrans=${val} posé — rechargez la page manuellement pour voir la traduction`,
  })

  if (lang === 'fr') {
    res.cookies.delete('googtrans')
  } else {
    res.cookies.set('googtrans', val, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      secure: host.includes('vercel.app'),
    })
  }

  return res
}
