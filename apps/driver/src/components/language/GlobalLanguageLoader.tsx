'use client'
/**
 * TAXIMETER.GOV — Traduction silencieuse FR/EN
 * Méthode cookie googtrans — AUCUNE barre visible, AUCUN logo Google
 * Copie exacte du système DepXpreS adapté pour TAXIMETER.GOV
 */
import { useEffect } from 'react'

declare global {
  interface Window { google?: Record<string, unknown>; googleTranslateElementInit?: () => void }
}

const HIDE_CSS = `
  /* TAXIMETER.GOV — Masquer Google Translate UI */
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

    // 1. CSS masquage immédiat dans <head>
    const styleId = 'taximetregov-hide-gt'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = HIDE_CSS
      document.head.insertBefore(style, document.head.firstChild)
    }

    // 2. Lire la langue sauvegardée
    let savedLang = 'fr'
    try { savedLang = localStorage.getItem('taximetregov_lang') ?? 'fr' } catch {}

    if (savedLang === 'fr') {
      eraseCookie()
      return
    }

    // 3. Cookie AVANT le script GT
    setCookie(savedLang)

    // 4. Charger Google Translate en mode silencieux
    if (!(window.google as Record<string,unknown>)?.translate) {
      let container = document.getElementById('gt-silent-container')
      if (!container) {
        container = document.createElement('div')
        container.id = 'gt-silent-container'
        container.style.cssText = 'display:none;position:absolute;top:-9999px;left:-9999px;'
        document.body.appendChild(container)
      }

      window.googleTranslateElementInit = () => {
        try {
          // @ts-expect-error — Google Translate global
          new window.google.translate.TranslateElement({
            pageLanguage: 'fr',
            autoDisplay: false,
            gaTrack: false,
            gaId: '',
          }, 'gt-silent-container')
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

    // 5. Killer interval — masquer tout widget GT résiduel
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

    // 6. Corrections post-traduction EN — GT traduit parfois mal les termes métier
    const corrections: Record<string, string> = {
      'Rice': 'Ride', 'rice': 'ride', 'Race': 'Ride', 'race': 'ride',
      'Running': 'Ride', 'Gross salary': 'Gross revenue', 'Salary': 'Revenue',
      'Wage': 'Revenue', 'Meter taxi': 'Taximeter', 'Tip': 'Tip',
    }

    const fixTexts = () => {
      if (savedLang === 'fr') return
      try {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) => {
            const p = node.parentElement
            if (!p) return NodeFilter.FILTER_REJECT
            const tag = p.tagName
            if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT
            if (p.closest(".notranslate,[translate='no']")) return NodeFilter.FILTER_REJECT
            return NodeFilter.FILTER_ACCEPT
          }
        })
        const nodes: Text[] = []
        let n: Node | null
        while ((n = walker.nextNode())) nodes.push(n as Text)
        nodes.forEach(node => {
          let txt = node.nodeValue ?? ''
          for (const [wrong, right] of Object.entries(corrections)) {
            txt = txt.replace(new RegExp(`\\b${wrong}\\b`, 'g'), right)
          }
          if (txt !== node.nodeValue) node.nodeValue = txt
        })
      } catch {}
    }

    let fixTimer: ReturnType<typeof setTimeout>
    const obs = new MutationObserver(() => { clearTimeout(fixTimer); fixTimer = setTimeout(fixTexts, 150) })
    setTimeout(fixTexts, 900)
    setTimeout(fixTexts, 1800)
    setTimeout(fixTexts, 2800)
    setTimeout(() => { if (document.body) obs.observe(document.body, { childList:true, subtree:true, characterData:true }) }, 1200)

    return () => { clearInterval(interval); obs.disconnect(); clearTimeout(fixTimer) }
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
