import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/layout/Providers'
import { GlobalLanguageLoader } from '@/components/language/GlobalLanguageLoader'

export const metadata: Metadata = {
  title: 'TAXIMÈTRE.GOV — Gouvernement du Québec',
  description: 'Infrastructure numérique gouvernementale — Gestion des revenus des chauffeurs et travailleurs de plateformes',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <GlobalLanguageLoader />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
