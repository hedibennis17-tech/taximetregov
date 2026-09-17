'use client'
/**
 * TAXIMETER.GOV — Traduction silencieuse FR/EN
 * Copie exacte du système DepXpreS qui fonctionne en production
 * Technique: script Google Translate Element + select.goog-te-combo + cookie
 */
import { useEffect } from 'react'
import { LANG_KEY } from '@/lib/i18n/language'

declare global {
  interface Window {
    google?: Record<string, unknown>
    googleTranslateElementInit?: () => void
  }
}

const HIDE_CSS = `
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

    // 1. CSS masquage immédiat avant tout render
    const styleId = 'taxgov-hide-gt'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = HIDE_CSS
      document.head.insertBefore(style, document.head.firstChild)
    }

    // 2. Lire langue sauvegardée
    let savedLang = 'fr'
    try { savedLang = localStorage.getItem(LANG_KEY) ?? 'fr' } catch {}

    if (savedLang === 'fr') {
      eraseCookie()
      return
    }

    // 3. Poser le cookie AVANT de charger GT
    setCookie(savedLang)

    // 4. Charger Google Translate Element en mode silencieux
    if (!(window.google as Record<string, unknown>)?.translate) {
      let container = document.getElementById('gt-silent-container')
      if (!container) {
        container = document.createElement('div')
        container.id = 'gt-silent-container'
        container.style.cssText = 'display:none;position:absolute;top:-9999px;left:-9999px;'
        document.body.appendChild(container)
      }

      window.googleTranslateElementInit = () => {
        try {
          // @ts-expect-error GT global
          new window.google.translate.TranslateElement({
            pageLanguage: 'fr',
            autoDisplay: false, // ← CRITIQUE: pas d'affichage auto
            gaTrack: false,
            gaId: '',
          }, 'gt-silent-container')

          // Déclencher la traduction via le select caché — même timing que DepXpreS
          setTimeout(() => applyLang(savedLang), 800)
        } catch {}
      }

      const script = document.createElement('script')
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      script.defer = true
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
          h.style.display = 'none'
          h.style.visibility = 'hidden'
          h.style.height = '0'
        })
        if (document.body) document.body.style.top = '0px'
      } catch {}
      if (++count >= 40) clearInterval(interval)
    }, 300)

    // 6. Corrections post-traduction (termes métier taxi mal traduits par GT)
    const corrections: Record<string, Array<[RegExp, string]>> = {
      en: [
        [/\bCourse\b/g, 'Ride'], [/\bCourses\b/g, 'Rides'],
        [/\bSalaire\b/gi, 'Revenue'], [/\bRiz\b/gi, 'Ride'],
        [/\bRace\b/g, 'Ride'], [/\bRaces\b/g, 'Rides'],
      ],
    }

    const fixTexts = () => {
      if (savedLang === 'fr') return
      const rules = corrections[savedLang]
      if (!rules) return
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
          rules.forEach(([rx, rep]) => { txt = txt.replace(rx, rep) })
          if (txt !== node.nodeValue) node.nodeValue = txt
        })
      } catch {}
    }

    let fixTimer: ReturnType<typeof setTimeout>
    const obs = new MutationObserver(() => { clearTimeout(fixTimer); fixTimer = setTimeout(fixTexts, 150) })
    setTimeout(fixTexts, 800)
    setTimeout(fixTexts, 1500)
    setTimeout(fixTexts, 2500)
    setTimeout(() => {
      if (document.body) obs.observe(document.body, { childList: true, subtree: true, characterData: true })
    }, 1000)

    return () => { clearInterval(interval); obs.disconnect(); clearTimeout(fixTimer) }
  }, [])

  return null
}

function setCookie(lang: string) {
  const val = `/fr/${lang}`
  const d = window.location.hostname
  document.cookie = `googtrans=${val};path=/;`
  document.cookie = `googtrans=${val};path=/;domain=${d}`
  document.cookie = `googtrans=${val};path=/;domain=.${d}`
  // Vercel: poser aussi sur .vercel.app
  if (d.includes('vercel.app')) {
    document.cookie = `googtrans=${val};path=/;domain=.vercel.app`
  }
}

function eraseCookie() {
  const exp = 'expires=Thu,01 Jan 1970 00:00:00 UTC;'
  const d = window.location.hostname
  document.cookie = `googtrans=;${exp}path=/;`
  document.cookie = `googtrans=;${exp}path=/;domain=${d}`
  document.cookie = `googtrans=;${exp}path=/;domain=.${d}`
  if (d.includes('vercel.app')) {
    document.cookie = `googtrans=;${exp}path=/;domain=.vercel.app`
  }
}

function applyLang(lang: string) {
  try {
    const selects = document.querySelectorAll('select.goog-te-combo')
    for (const sel of selects) {
      const s = sel as HTMLSelectElement
      if (s.value !== lang) {
        s.value = lang
        s.dispatchEvent(new Event('change', { bubbles: true }))
        break
      }
    }
  } catch {}
}
