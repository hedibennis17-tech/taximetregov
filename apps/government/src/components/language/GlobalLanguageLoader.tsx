'use client'
/**
 * TAXIMETER.GOV — Traduction silencieuse FR/EN
 * Fix flash: GT chargé UNE seule fois via flag global window.__GT_LOADED__
 * Même système DepXpreS — copie exacte
 */
import { useEffect } from 'react'
const LANG_KEY = 'taximetregov_lang'

declare global {
  interface Window {
    google?: Record<string, unknown>
    googleTranslateElementInit?: () => void
    __GT_LOADED__?: boolean
    __GT_LANG__?: string
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

    // 1. CSS masquage — toujours injecté
    if (!document.getElementById('taxgov-hide-gt')) {
      const style = document.createElement('style')
      style.id = 'taxgov-hide-gt'
      style.textContent = HIDE_CSS
      document.head.insertBefore(style, document.head.firstChild)
    }

    // 2. Lire langue
    let savedLang = 'fr'
    try { savedLang = localStorage.getItem(LANG_KEY) ?? 'fr' } catch {}

    if (savedLang === 'fr') {
      eraseCookie()
      // Si on était en EN, retour FR = effacer cookie sans reload
      // (le reload a déjà eu lieu via setLang)
      return
    }

    // 3. Cookie
    setCookie(savedLang)

    // 4. Lancer killer interval (toujours, pour masquer le widget si GT est déjà chargé)
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

    // 5. Si GT déjà chargé (navigation Next.js côté client) — juste appliquer
    if (window.__GT_LOADED__ && window.__GT_LANG__ === savedLang) {
      // Déjà traduit, rien à faire — évite le re-flash
      clearInterval(interval)
      return () => clearInterval(interval)
    }

    if (window.__GT_LOADED__ && window.__GT_LANG__ !== savedLang) {
      // Langue différente — appliquer
      applyLang(savedLang)
      window.__GT_LANG__ = savedLang
      return () => clearInterval(interval)
    }

    // 6. Premier chargement — charger le script GT UNE seule fois
    if (!document.getElementById('gt-script')) {
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
            autoDisplay: false,
            gaTrack: false,
            gaId: '',
          }, 'gt-silent-container')

          window.__GT_LOADED__ = true
          window.__GT_LANG__ = savedLang
          setTimeout(() => applyLang(savedLang), 800)
        } catch {}
      }

      const script = document.createElement('script')
      script.id = 'gt-script'
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      script.defer = true
      script.onerror = () => {}
      document.head.appendChild(script)
    }

    // 7. Corrections post-traduction
    const corrections: Array<[RegExp, string]> = [
      [/\bCourse\b/g, 'Ride'], [/\bCourses\b/g, 'Rides'],
      [/\bSalaire\b/gi, 'Revenue'], [/\bRiz\b/gi, 'Ride'],
      [/\bRace\b/g, 'Ride'], [/\bRaces\b/g, 'Rides'],
    ]

    const fixTexts = () => {
      if (savedLang === 'fr') return
      try {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) => {
            const p = node.parentElement
            if (!p) return NodeFilter.FILTER_REJECT
            if (['SCRIPT','STYLE'].includes(p.tagName)) return NodeFilter.FILTER_REJECT
            if (p.closest(".notranslate,[translate='no']")) return NodeFilter.FILTER_REJECT
            return NodeFilter.FILTER_ACCEPT
          }
        })
        const nodes: Text[] = []
        let n: Node | null
        while ((n = walker.nextNode())) nodes.push(n as Text)
        nodes.forEach(node => {
          let txt = node.nodeValue ?? ''
          corrections.forEach(([rx, rep]) => { txt = txt.replace(rx, rep) })
          if (txt !== node.nodeValue) node.nodeValue = txt
        })
      } catch {}
    }

    let fixTimer: ReturnType<typeof setTimeout>
    const obs = new MutationObserver(() => { clearTimeout(fixTimer); fixTimer = setTimeout(fixTexts, 150) })
    setTimeout(fixTexts, 900)
    setTimeout(fixTexts, 1600)
    setTimeout(() => {
      if (document.body) obs.observe(document.body, { childList: true, subtree: true, characterData: true })
    }, 1200)

    return () => { clearInterval(interval); obs.disconnect(); clearTimeout(fixTimer) }
  }, []) // ← VIDE: s'exécute UNE seule fois au montage

  return null
}

function setCookie(lang: string) {
  const val = `/fr/${lang}`
  const d = window.location.hostname
  document.cookie = `googtrans=${val};path=/;`
  document.cookie = `googtrans=${val};path=/;domain=${d}`
  document.cookie = `googtrans=${val};path=/;domain=.${d}`
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
