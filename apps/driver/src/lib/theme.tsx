'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'dark' | 'light'

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'dark',
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  // Charger depuis localStorage au montage
  useEffect(() => {
    const saved = localStorage.getItem('qc-theme') as Theme | null
    if (saved === 'light' || saved === 'dark') setTheme(saved)
  }, [])

  // Appliquer au DOM à chaque changement
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    root.setAttribute('data-theme', theme)
    if (theme === 'dark') {
      body.style.background = '#050E1C'
      body.style.color = '#F0F4FF'
    } else {
      body.style.background = '#F0F4FF'
      body.style.color = '#0A1628'
    }
  }, [theme])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('qc-theme', next)
  }

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => useContext(ThemeCtx)
