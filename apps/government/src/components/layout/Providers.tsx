'use client'
import { ReactNode, createContext, useContext, useState } from 'react'
import { I18nProvider } from '@/i18n'

type Theme = 'light' | 'dark'
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'light', toggle: () => {} })
export const useTheme = () => useContext(ThemeCtx)

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light')
  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <I18nProvider>
        <div className={theme === 'dark' ? 'dark' : ''} style={{ minHeight: '100vh' }}>
          {children}
        </div>
      </I18nProvider>
    </ThemeCtx.Provider>
  )
}
