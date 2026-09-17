'use client'
/**
 * TAXIMETER.GOV — Traduction silencieuse FR/EN
 * Technique exacte DepXpreS:
 * 1. Cookie googtrans posé AVANT la navigation
 * 2. Fresh page load → Google CDN traduit automatiquement via le cookie
 * 3. CSS masque TOUT élément Google Translate visible
 * AUCUNE barre, AUCUN badge, AUCUN logo
 */
import { useEffect } from 'react'
const LANG_KEY = 'taximetregov_lang'

const HIDE_CSS = `
  .skiptranslate, .goog-te-banner-frame, .goog-te-gadget,
  #goog-gt-tt, .goog-tooltip, .goog-te-balloon-frame,
  iframe.skiptranslate, #google_translate_element,
  .goog-te-spinner-pos, div[id^="goog-gt"],
  .VIpgJd-ZVi9od-ORHb, .VIpgJd-ZVi9od-SmfZ,
  .VIpgJd-ZVi9od-xl07Ob { display:none !important; visibility:hidden !important; }
  .goog-text-highlight { background:none !important; box-shadow:none !important; }
  body { top:0px !important; }
`

export function GlobalLanguageLoader() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Masquage immédiat — avant tout render
    if (!document.getElementById('taxgov-hide-gt')) {
      const s = document.createElement('style')
      s.id = 'taxgov-hide-gt'
      s.textContent = HIDE_CSS
      document.head.insertBefore(s, document.head.firstChild)
    }

    // 2. Lire la langue
    let lang = 'fr'
    try { lang = localStorage.getItem(LANG_KEY) ?? 'fr' } catch {}

    // 3. Si FR → effacer cookie et sortir
    if (lang === 'fr') {
      eraseCookie()
      return
    }

    // 4. Si EN → poser cookie (il est peut-être déjà là, on le repose quand même)
    setCookie(lang)

    // 5. Killer interval 40× pour supprimer tout widget GT résiduel
    let n = 0
    const iv = setInterval(() => {
      document.querySelectorAll(
        '.skiptranslate,.goog-te-banner-frame,.goog-te-gadget,[class*="VIpgJd"]'
      ).forEach(el => {
        const h = el as HTMLElement
        h.style.cssText += 'display:none!important;visibility:hidden!important;height:0!important;'
      })
      if (document.body) document.body.style.top = '0px'
      if (++n >= 40) clearInterval(iv)
    }, 250)

    return () => clearInterval(iv)
  }, [])

  return null
}

function setCookie(lang: string) {
  const val = `/fr/${lang}`
  const d = window.location.hostname
  document.cookie = `googtrans=${val};path=/;`
  document.cookie = `googtrans=${val};path=/;domain=${d}`
  document.cookie = `googtrans=${val};path=/;domain=.${d}`
}

function eraseCookie() {
  const exp = 'expires=Thu,01 Jan 1970 00:00:00 UTC;'
  const d = window.location.hostname
  document.cookie = `googtrans=;${exp}path=/;`
  document.cookie = `googtrans=;${exp}path=/;domain=${d}`
  document.cookie = `googtrans=;${exp}path=/;domain=.${d}`
}
