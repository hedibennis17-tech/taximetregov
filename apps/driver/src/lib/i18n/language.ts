// TAXIMETER.GOV — Gestion langue FR/EN
// PAS de reload() — GT traduit en place via applyLang()
export const LANG_KEY = 'taximetregov_lang'

export function getLang(): 'fr' | 'en' {
  if (typeof window === 'undefined') return 'fr'
  try { return (localStorage.getItem(LANG_KEY) as 'fr' | 'en') ?? 'fr' } catch { return 'fr' }
}

export function setLang(lang: 'fr' | 'en') {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(LANG_KEY, lang) } catch {}

  const d = window.location.hostname
  if (lang === 'fr') {
    const exp = 'expires=Thu,01 Jan 1970 00:00:00 UTC;'
    document.cookie = `googtrans=;${exp}path=/;`
    document.cookie = `googtrans=;${exp}path=/;domain=${d}`
    document.cookie = `googtrans=;${exp}path=/;domain=.${d}`
    if (d.includes('vercel.app')) document.cookie = `googtrans=;${exp}path=/;domain=.vercel.app`
    // Retour FR = reload obligatoire (GT ne peut pas "dé-traduire" sans reload)
    window.location.reload()
  } else {
    const val = `/fr/${lang}`
    document.cookie = `googtrans=${val};path=/;`
    document.cookie = `googtrans=${val};path=/;domain=${d}`
    document.cookie = `googtrans=${val};path=/;domain=.${d}`
    if (d.includes('vercel.app')) document.cookie = `googtrans=${val};path=/;domain=.vercel.app`
    // EN = PAS de reload — GT applique via applyLang() dans GlobalLanguageLoader
    // Le reload causait le flash. On dispatch un event custom à la place.
    window.dispatchEvent(new CustomEvent('taxgov:setlang', { detail: { lang } }))
  }
}

export function toggleLang() {
  setLang(getLang() === 'fr' ? 'en' : 'fr')
}

export function purgeOnLogout() {
  try { localStorage.removeItem(LANG_KEY) } catch {}
  if (typeof document === 'undefined') return
  const exp = 'expires=Thu,01 Jan 1970 00:00:00 UTC;'
  const d = window.location.hostname
  document.cookie = `googtrans=;${exp}path=/;`
  document.cookie = `googtrans=;${exp}path=/;domain=${d}`
  document.cookie = `googtrans=;${exp}path=/;domain=.${d}`
  if (d.includes('vercel.app')) document.cookie = `googtrans=;${exp}path=/;domain=.vercel.app`
}
