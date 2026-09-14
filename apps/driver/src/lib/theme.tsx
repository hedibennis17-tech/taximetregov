'use client'
import { createContext, useContext, ReactNode } from 'react'

type Theme = 'dark' | 'light'

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return (localStorage.getItem('qc-theme') as Theme) ?? 'dark'
}

export function toggleTheme() {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark'
  localStorage.setItem('qc-theme', next)
  window.location.reload()
}

const ThemeCtx = createContext<Theme>('dark')

export function ThemeProvider({ children }: { children: ReactNode }) {
  // On lit le thème depuis localStorage au SSR via script inline
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          var t = localStorage.getItem('qc-theme') || 'dark';
          document.documentElement.setAttribute('data-theme', t);
          document.documentElement.className = t;
          if (t === 'light') {
            document.documentElement.style.background = '#F0F4FF';
          } else {
            document.documentElement.style.background = '#050E1C';
          }
        })();
      `}} />
      <ThemeCtx.Provider value={getTheme()}>
        {children}
      </ThemeCtx.Provider>
    </>
  )
}

export function useTheme() {
  const theme = useContext(ThemeCtx)
  return { theme, toggle: toggleTheme }
}
