'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'dark' | 'light'
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'dark', toggle: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('qc-theme') as Theme | null
    apply(saved ?? 'dark')
    setTheme(saved ?? 'dark')
  }, [])

  function apply(t: Theme) {
    const html = document.documentElement
    const body = document.body
    // Classe sur html pour Tailwind darkMode: 'class'
    if (t === 'dark') {
      html.classList.add('dark')
      html.classList.remove('light')
    } else {
      html.classList.add('light')
      html.classList.remove('dark')
    }
    // Background direct sur body
    body.style.cssText = t === 'dark'
      ? 'background:#050E1C!important;color:#F0F4FF!important;'
      : 'background:#F0F4FF!important;color:#0A1628!important;'
  }

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('qc-theme', next)
    apply(next)
    // Force reload des styles en ajoutant/retirant une classe sur body
    document.body.classList.toggle('theme-transitioning')
    setTimeout(() => document.body.classList.toggle('theme-transitioning'), 50)
  }

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)
