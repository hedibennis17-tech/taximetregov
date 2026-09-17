'use client'
// TAXIMETER.GOV — Gestion langue FR/EN (système silencieux Google Translate)
const LANG_KEY = 'taximetregov_lang'

export function getLang(): 'fr' | 'en' {
  if (typeof window === 'undefined') return 'fr'
  try { return (localStorage.getItem(LANG_KEY) as 'fr' | 'en') ?? 'fr' } catch { return 'fr' }
}

export function setLang(lang: 'fr' | 'en') {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(LANG_KEY, lang) } catch {}

  const domain = window.location.hostname
  if (lang === 'fr') {
    // Effacer cookie → retour français
    const exp = 'expires=Thu,01 Jan 1970 00:00:00 UTC;'
    document.cookie = `googtrans=;${exp}path=/;`
    document.cookie = `googtrans=;${exp}path=/;domain=${domain}`
    document.cookie = `googtrans=;${exp}path=/;domain=.${domain}`
  } else {
    const val = `/fr/${lang}`
    document.cookie = `googtrans=${val};path=/;`
    document.cookie = `googtrans=${val};path=/;domain=${domain}`
    document.cookie = `googtrans=${val};path=/;domain=.${domain}`
  }
  // Recharger pour appliquer
  window.location.reload()
}

export function toggleLang() {
  setLang(getLang() === 'fr' ? 'en' : 'fr')
}

export function purgeOnLogout() {
  try { localStorage.removeItem(LANG_KEY) } catch {}
  const domain = typeof window !== 'undefined' ? window.location.hostname : ''
  const exp = 'expires=Thu,01 Jan 1970 00:00:00 UTC;'
  if (typeof document !== 'undefined') {
    document.cookie = `googtrans=;${exp}path=/;`
    document.cookie = `googtrans=;${exp}path=/;domain=${domain}`
    document.cookie = `googtrans=;${exp}path=/;domain=.${domain}`
  }
}
