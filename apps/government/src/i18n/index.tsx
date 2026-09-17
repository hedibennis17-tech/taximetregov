'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { fr } from './fr'
import { en } from './en'

type Lang = 'fr' | 'en'
const translations = { fr, en }
const LANG_KEY = 'taximetregov_lang'

function allDomains(): string[] {
  if (typeof window === 'undefined') return []
  const h = window.location.hostname
  const parts = h.split('.')
  const parent = parts.length >= 2 ? '.' + parts.slice(-2).join('.') : ''
  return [h, '.' + h, parent, '.vercel.app'].filter(Boolean)
}

function applyCookie(lang: Lang) {
  if (typeof document === 'undefined') return
  if (lang === 'fr') {
    const exp = 'expires=Thu,01 Jan 1970 00:00:00 UTC;'
    document.cookie = `googtrans=;${exp}path=/;`
    allDomains().forEach(d => { document.cookie = `googtrans=;${exp}path=/;domain=${d}` })
  } else {
    const val = `/fr/${lang}`
    document.cookie = `googtrans=${val};path=/;`
    allDomains().forEach(d => { document.cookie = `googtrans=${val};path=/;domain=${d}` })
  }
}

const I18nContext = createContext<{ t: typeof fr; lang: Lang; setLang: (l: Lang) => void }>({
  t: fr, lang: 'fr', setLang: () => {}
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY) as Lang | null
      if (saved === 'en') setLangState('en')
    } catch {}
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    try { localStorage.setItem(LANG_KEY, l) } catch {}
    applyCookie(l)
    if (l === 'fr') { window.location.reload() } else { window.dispatchEvent(new CustomEvent('taxgov:setlang', { detail: { lang: l } })) }
  }

  return (
    <I18nContext.Provider value={{ t: translations[lang], lang, setLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext)
