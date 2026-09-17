// TAXIMETER.GOV — Gestion langue FR/EN
// Technique DepXpreS: cookie googtrans + fresh navigation = traduction automatique
export const LANG_KEY = 'taximetregov_lang'

export function getLang(): 'fr' | 'en' {
  if (typeof window === 'undefined') return 'fr'
  try { return (localStorage.getItem(LANG_KEY) as 'fr' | 'en') ?? 'fr' } catch { return 'fr' }
}

export function setLang(lang: 'fr' | 'en') {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(LANG_KEY, lang) } catch {}

  const domain = window.location.hostname
  if (lang === 'fr') {
    // Effacer cookie → retour français natif
    const exp = 'expires=Thu,01 Jan 1970 00:00:00 UTC;'
    document.cookie = `googtrans=;${exp}path=/;`
    document.cookie = `googtrans=;${exp}path=/;domain=${domain}`
    document.cookie = `googtrans=;${exp}path=/;domain=.${domain}`
  } else {
    // Poser cookie AVANT navigation
    document.cookie = `googtrans=/fr/${lang};path=/;`
    document.cookie = `googtrans=/fr/${lang};path=/;domain=${domain}`
    document.cookie = `googtrans=/fr/${lang};path=/;domain=.${domain}`
  }

  // Fresh navigation — Google CDN lit le cookie et traduit automatiquement
  // C'est la technique exacte de DepXpreS (pas un simple reload)
  setTimeout(() => { window.location.href = window.location.href }, 100)
}

export function toggleLang() {
  setLang(getLang() === 'fr' ? 'en' : 'fr')
}

export function purgeOnLogout() {
  try { localStorage.removeItem(LANG_KEY) } catch {}
  if (typeof document === 'undefined') return
  const domain = window.location.hostname
  const exp = 'expires=Thu,01 Jan 1970 00:00:00 UTC;'
  document.cookie = `googtrans=;${exp}path=/;`
  document.cookie = `googtrans=;${exp}path=/;domain=${domain}`
  document.cookie = `googtrans=;${exp}path=/;domain=.${domain}`
}
