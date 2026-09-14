'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'dark' | 'light'
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'dark', toggle: () => {} })

function applyTheme(t: Theme) {
  const html = document.documentElement
  const body = document.body
  html.setAttribute('data-theme', t)
  if (t === 'light') {
    html.classList.remove('dark')
    body.style.background = '#F0F4FF'
    body.style.color = '#0A1628'
  } else {
    html.classList.add('dark')
    body.style.background = '#050E1C'
    body.style.color = '#F0F4FF'
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = (localStorage.getItem('qc-theme') as Theme) ?? 'dark'
    setTheme(saved)
    applyTheme(saved)
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('qc-theme', next)
    setTheme(next)
    applyTheme(next)
  }

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)
