'use client'
import { createContext, useContext, useState, ReactNode } from 'react'
import { fr } from './fr'
import { en } from './en'

type Lang = 'fr' | 'en'
const translations = { fr, en }

const I18nContext = createContext<{ t: typeof fr; lang: Lang; setLang: (l: Lang) => void }>({
  t: fr, lang: 'fr', setLang: () => {}
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr')
  return (
    <I18nContext.Provider value={{ t: translations[lang], lang, setLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext)
