import React from 'react'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TAXIMETER.GOV — Enterprise Gov',
  description: 'Portail entreprise — TAXIMETER.GOV · PILOTE',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
