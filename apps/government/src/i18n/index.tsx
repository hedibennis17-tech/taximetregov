'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { fr } from './fr'
import { en } from './en'

type Lang = 'fr' | 'en'
const translations = { fr, en }
const LANG_KEY = 'taximetregov_lang'

function setCookie(lang: Lang) {
  if (typeof document === 'undefined') return
  const d = window.location.hostname
  if (lang === 'fr') {
    const exp = 'expires=Thu,01 Jan 1970 00:00:00 UTC;'
    document.cookie = `googtrans=;${exp}path=/;`
    document.cookie = `googtrans=;${exp}path=/;domain=${d}`
    document.cookie = `googtrans=;${exp}path=/;domain=.${d}`
  } else {
    document.cookie = `googtrans=/fr/${lang};path=/;`
    document.cookie = `googtrans=/fr/${lang};path=/;domain=${d}`
    document.cookie = `googtrans=/fr/${lang};path=/;domain=.${d}`
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
    setCookie(l)
    // Fresh navigation — technique DepXpreS
    setTimeout(() => { window.location.href = window.location.href }, 100)
  }

  return (
    <I18nContext.Provider value={{ t: translations[lang], lang, setLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext)
