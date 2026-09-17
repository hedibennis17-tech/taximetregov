// TAXIMETER.GOV — Gestion langue FR/EN
export const LANG_KEY = 'taximetregov_lang'

export function getLang(): 'fr' | 'en' {
  if (typeof window === 'undefined') return 'fr'
  try { return (localStorage.getItem(LANG_KEY) as 'fr' | 'en') ?? 'fr' } catch { return 'fr' }
}

function allDomains(): string[] {
  const h = window.location.hostname
  const parts = h.split('.')
  // ex: taximetregov-driver-hedi.vercel.app → ['.vercel.app', 'taximetregov-driver-hedi.vercel.app', '.taximetregov-driver-hedi.vercel.app']
  const parent = parts.length >= 2 ? '.' + parts.slice(-2).join('.') : ''
  return [h, '.' + h, parent, '.vercel.app'].filter(Boolean)
}

export function setLang(lang: 'fr' | 'en') {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(LANG_KEY, lang) } catch {}

  if (lang === 'fr') {
    const exp = 'expires=Thu,01 Jan 1970 00:00:00 UTC;'
    document.cookie = `googtrans=;${exp}path=/;`
    allDomains().forEach(d => {
      document.cookie = `googtrans=;${exp}path=/;domain=${d}`
    })
  } else {
    const val = `/fr/${lang}`
    document.cookie = `googtrans=${val};path=/;`
    allDomains().forEach(d => {
      document.cookie = `googtrans=${val};path=/;domain=${d}`
    })
  }

  // Fresh load — Google CDN lit le cookie et traduit
  setTimeout(() => { window.location.href = window.location.href }, 150)
}

export function toggleLang() {
  setLang(getLang() === 'fr' ? 'en' : 'fr')
}

export function purgeOnLogout() {
  try { localStorage.removeItem(LANG_KEY) } catch {}
  if (typeof document === 'undefined') return
  const exp = 'expires=Thu,01 Jan 1970 00:00:00 UTC;'
  document.cookie = `googtrans=;${exp}path=/;`
  allDomains().forEach(d => {
    document.cookie = `googtrans=;${exp}path=/;domain=${d}`
  })
}

function allDomains(): string[] {
  const h = window.location.hostname
  const parts = h.split('.')
  const parent = parts.length >= 2 ? '.' + parts.slice(-2).join('.') : ''
  return [h, '.' + h, parent, '.vercel.app'].filter(Boolean)
}
