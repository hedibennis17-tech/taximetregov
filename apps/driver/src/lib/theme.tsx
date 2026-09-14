'use client'
import { createContext, useContext, useState, useLayoutEffect, ReactNode } from 'react'

type Theme = 'dark' | 'light'
const Ctx = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'light', toggle: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  // useLayoutEffect = synchrone, avant le premier paint
  useLayoutEffect(() => {
    const saved = (localStorage.getItem('qc-theme') as Theme) ?? 'light'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
    // Sync html class pour compatibilité Tailwind dark:
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(saved)
  }, [])

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('qc-theme', next)
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    // Sync html class pour compatibilité Tailwind dark:
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(next)
  }

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)
