import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TAXIMÈTRE.GOV — Driver',
  description: 'Plateforme chauffeur — Gouvernement du Québec',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Taximètre.GOV' },
}
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1,
  userScalable: false, themeColor: '#003DA5',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
        <style>{`
          @font-face {
            font-family: 'DSEG7';
            src: url('https://cdn.jsdelivr.net/npm/dseg@0.46.0/fonts/DSEG7-Classic/DSEG7Classic-Regular.woff2') format('woff2');
            font-display: swap;
          }
          @font-face {
            font-family: 'DSEG7';
            src: url('https://cdn.jsdelivr.net/npm/dseg@0.46.0/fonts/DSEG7-Classic/DSEG7Classic-Bold.woff2') format('woff2');
            font-weight: 700;
            font-display: swap;
          }
          .dseg { font-family: 'DSEG7', 'Courier New', monospace; }
          .space-grotesk { font-family: 'Space Grotesk', system-ui, sans-serif; }
          .space-mono { font-family: 'Space Mono', monospace; }
        `}</style>
      </head>
      <body className="bg-slate-950 text-white min-h-screen overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
