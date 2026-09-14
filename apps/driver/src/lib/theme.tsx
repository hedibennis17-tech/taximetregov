'use client'
import { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'dark' | 'light'
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'dark', toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('qc-theme') as Theme | null
    if (saved) setTheme(saved)
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('qc-theme', next)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.body.style.background = theme === 'dark' ? '#050E1C' : '#F0F4FF'
    document.body.style.color = theme === 'dark' ? '#F0F4FF' : '#0A1628'
  }, [theme])

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)
