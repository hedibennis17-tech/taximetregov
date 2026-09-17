'use client'
/**
 * TAXIMETER.GOV — Traduction silencieuse FR/EN sans flash
 * - FR→EN : GT charge une fois, traduit via applyLang(), PAS de reload
 * - EN→FR : reload() nécessaire (GT ne peut pas dé-traduire sans)
 * - Navigation Next.js : GT déjà chargé, flag __GT_LOADED__ évite re-flash
 */
import { useEffect } from 'react'
import { LANG_KEY } from '@/lib/i18n/language'

declare global {
  interface Window {
    google?: Record<string, unknown>
    googleTranslateElementInit?: () => void
    __GT_LOADED__?: boolean
    __GT_LANG__?: string
  }
}

const HIDE_CSS = `
  .skiptranslate{display:none!important}
  .goog-te-banner-frame{display:none!important}
  .goog-te-gadget{display:none!important}
  #goog-gt-tt{display:none!important}
  .goog-tooltip{display:none!important}
  .goog-text-highlight{background:none!important;box-shadow:none!important}
  .goog-te-balloon-frame{display:none!important}
  iframe.skiptranslate{display:none!important}
  body{top:0px!important;position:static!important}
  #google_translate_element{display:none!important}
  .goog-te-spinner-pos{display:none!important}
  div[id^="goog-gt"]{display:none!important}
  .VIpgJd-ZVi9od-ORHb{display:none!important}
  .VIpgJd-ZVi9od-SmfZ{display:none!important}
`

function injectCSS() {
  if (document.getElementById('taxgov-hide-gt')) return
  const s = document.createElement('style')
  s.id = 'taxgov-hide-gt'
  s.textContent = HIDE_CSS
  document.head.insertBefore(s, document.head.firstChild)
}

function setCookie(lang: string) {
  const val = `/fr/${lang}`
  const d = window.location.hostname
  document.cookie = `googtrans=${val};path=/;`
  document.cookie = `googtrans=${val};path=/;domain=${d}`
  document.cookie = `googtrans=${val};path=/;domain=.${d}`
  if (d.includes('vercel.app')) document.cookie = `googtrans=${val};path=/;domain=.vercel.app`
}

function eraseCookie() {
  const exp = 'expires=Thu,01 Jan 1970 00:00:00 UTC;'
  const d = window.location.hostname
  document.cookie = `googtrans=;${exp}path=/;`
  document.cookie = `googtrans=;${exp}path=/;domain=${d}`
  document.cookie = `googtrans=;${exp}path=/;domain=.${d}`
  if (d.includes('vercel.app')) document.cookie = `googtrans=;${exp}path=/;domain=.vercel.app`
}

function applyLang(lang: string) {
  try {
    document.querySelectorAll('select.goog-te-combo').forEach(sel => {
      const s = sel as HTMLSelectElement
      if (s.value !== lang) {
        s.value = lang
        s.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })
  } catch {}
}

function startKillerInterval() {
  let n = 0
  const iv = setInterval(() => {
    try {
      document.querySelectorAll('.skiptranslate,.goog-te-banner-frame,.goog-te-gadget,[class*="VIpgJd"]')
        .forEach(el => {
          const h = el as HTMLElement
          h.style.cssText += 'display:none!important;visibility:hidden!important;height:0!important;'
        })
      if (document.body) document.body.style.top = '0px'
    } catch {}
    if (++n >= 40) clearInterval(iv)
  }, 300)
  return iv
}

function loadGTScript(lang: string) {
  if (document.getElementById('gt-script')) {
    // Script déjà dans le DOM — juste appliquer
    if (window.__GT_LOADED__) {
      applyLang(lang)
      window.__GT_LANG__ = lang
    }
    return
  }

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
      window.__GT_LANG__ = lang
      setTimeout(() => applyLang(lang), 800)
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

export function GlobalLanguageLoader() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    injectCSS()

    let savedLang = 'fr'
    try { savedLang = localStorage.getItem(LANG_KEY) ?? 'fr' } catch {}

    if (savedLang === 'fr') {
      eraseCookie()
      return
    }

    setCookie(savedLang)

    const iv = startKillerInterval()

    // Si GT déjà chargé + même langue → rien (évite re-flash navigation)
    if (window.__GT_LOADED__ && window.__GT_LANG__ === savedLang) {
      return () => clearInterval(iv)
    }

    loadGTScript(savedLang)

    // Écouter event custom du bouton FR|EN (sans reload pour EN)
    const onSetLang = (e: Event) => {
      const lang = (e as CustomEvent<{lang: string}>).detail.lang
      setCookie(lang)
      if (window.__GT_LOADED__) {
        applyLang(lang)
        window.__GT_LANG__ = lang
      } else {
        loadGTScript(lang)
      }
    }
    window.addEventListener('taxgov:setlang', onSetLang)

    return () => {
      clearInterval(iv)
      window.removeEventListener('taxgov:setlang', onSetLang)
    }
  }, []) // UNE seule fois

  return null
}
