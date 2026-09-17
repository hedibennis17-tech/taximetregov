'use client'
/**
 * TAXIMETER.GOV ADMIN — Traduction silencieuse FR/EN
 * Système Google Translate headless — AUCUNE barre visible
 * Identique au driver app et DepXpreS
 */
import { useEffect } from 'react'

declare global {
  interface Window { google?: Record<string, unknown>; googleTranslateElementInit?: () => void }
}

const HIDE_CSS = `
  /* TAXIMETER.GOV ADMIN — Masquer Google Translate UI */
  .skiptranslate { display:none !important; }
  .goog-te-banner-frame { display:none !important; }
  .goog-te-gadget { display:none !important; }
  #goog-gt-tt { display:none !important; }
  .goog-tooltip { display:none !important; }
  .goog-text-highlight { background:none !important; box-shadow:none !important; }
  .goog-te-balloon-frame { display:none !important; }
  iframe.skiptranslate { display:none !important; }
  body { top:0px !important; position:static !important; }
  #google_translate_element { display:none !important; }
  .goog-te-spinner-pos { display:none !important; }
  div[id^="goog-gt"] { display:none !important; }
  .VIpgJd-ZVi9od-ORHb { display:none !important; }
  .VIpgJd-ZVi9od-SmfZ { display:none !important; }
`

export function GlobalLanguageLoader() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // CSS masquage immédiat
    const styleId = 'taximetregov-admin-hide-gt'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = HIDE_CSS
      document.head.insertBefore(style, document.head.firstChild)
    }

    // Lire langue sauvegardée
    let savedLang = 'fr'
    try { savedLang = localStorage.getItem('taximetregov_lang') ?? 'fr' } catch {}

    if (savedLang === 'fr') { eraseCookie(); return }

    setCookie(savedLang)

    // Charger GT en mode silencieux
    if (!(window.google as Record<string,unknown>)?.translate) {
      let container = document.getElementById('gt-silent-container-admin')
      if (!container) {
        container = document.createElement('div')
        container.id = 'gt-silent-container-admin'
        container.style.cssText = 'display:none;position:absolute;top:-9999px;left:-9999px;'
        document.body.appendChild(container)
      }

      window.googleTranslateElementInit = () => {
        try {
          // @ts-expect-error — GT global
          new window.google.translate.TranslateElement({
            pageLanguage: 'fr',
            autoDisplay: false,
            gaTrack: false,
            gaId: '',
          }, 'gt-silent-container-admin')
          setTimeout(() => applyLang(savedLang), 800)
        } catch {}
      }

      const script = document.createElement('script')
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true; script.defer = true
      script.onerror = () => {}
      document.head.appendChild(script)
    } else {
      applyLang(savedLang)
    }

    // Killer interval
    let count = 0
    const interval = setInterval(() => {
      try {
        document.querySelectorAll('.skiptranslate,.goog-te-banner-frame,.goog-te-gadget,[class*="VIpgJd"]').forEach(el => {
          const h = el as HTMLElement
          h.style.display = 'none'; h.style.visibility = 'hidden'; h.style.height = '0'
        })
        if (document.body) document.body.style.top = '0px'
      } catch {}
      if (++count >= 30) clearInterval(interval)
    }, 300)

    return () => clearInterval(interval)
  }, [])

  return null
}

function setCookie(lang: string) {
  const val = `/fr/${lang}`
  const domain = window.location.hostname
  document.cookie = `googtrans=${val};path=/;`
  document.cookie = `googtrans=${val};path=/;domain=${domain}`
  document.cookie = `googtrans=${val};path=/;domain=.${domain}`
}

function eraseCookie() {
  const domain = window.location.hostname
  const exp = 'expires=Thu,01 Jan 1970 00:00:00 UTC;'
  document.cookie = `googtrans=;${exp}path=/;`
  document.cookie = `googtrans=;${exp}path=/;domain=${domain}`
  document.cookie = `googtrans=;${exp}path=/;domain=.${domain}`
}

function applyLang(lang: string) {
  try {
    document.querySelectorAll('select.goog-te-combo').forEach(sel => {
      const s = sel as HTMLSelectElement
      if (s.value !== lang) { s.value = lang; s.dispatchEvent(new Event('change', { bubbles:true })) }
    })
  } catch {}
}
