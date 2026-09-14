// TAXIMETER.GOV — Logo officiel
// Couleurs Québec: Bleu #003DA5 + Blanc + Fleur-de-lis

import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'dark' | 'light' | 'white'
  showTagline?: boolean
}

const SIZES = {
  sm:  { w: 120, mark: 24, title: 11, sub: 7  },
  md:  { w: 160, mark: 32, title: 13, sub: 8  },
  lg:  { w: 220, mark: 48, title: 17, sub: 10 },
  xl:  { w: 300, mark: 64, title: 22, sub: 12 },
}

export function TaximetreGovLogo({ size = 'md', variant = 'dark', showTagline = true }: LogoProps) {
  const s = SIZES[size]
  const blue   = '#003DA5'
  const titleC = variant === 'white' ? '#FFFFFF' : variant === 'light' ? '#003DA5' : '#FFFFFF'
  const subC   = variant === 'white' ? 'rgba(255,255,255,0.7)' : variant === 'light' ? '#4A6FA5' : 'rgba(255,255,255,0.6)'
  const dotC   = '#C8102E' // Rouge Québec

  return (
    <div className="flex items-center gap-3">
      {/* Marque — écusson stylisé */}
      <div className="relative flex-shrink-0" style={{ width: s.mark, height: s.mark }}>
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width={s.mark} height={s.mark}>
          {/* Fond écusson */}
          <path d="M24 2L44 10V28C44 38 34 45 24 47C14 45 4 38 4 28V10L24 2Z"
            fill={blue} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
          {/* Fleur-de-lis stylisée */}
          <g transform="translate(14, 10) scale(0.42)">
            <path d="M24 8C24 8 18 14 18 20C18 23.3 20.7 26 24 26C27.3 26 30 23.3 30 20C30 14 24 8 24 8Z" fill="white"/>
            <path d="M24 22C24 22 10 26 8 34C7 38 10 40 14 38L24 32L34 38C38 40 41 38 40 34C38 26 24 22 24 22Z" fill="white"/>
            <path d="M24 30V44" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            <path d="M16 36H32" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </g>
          {/* Point rouge en bas */}
          <circle cx="24" cy="43" r="2.5" fill={dotC}/>
        </svg>
      </div>

      {/* Texte */}
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-0.5">
          <span style={{ color: titleC, fontSize: s.title, fontWeight: 900, letterSpacing: '0.08em', fontFamily: 'system-ui, sans-serif' }}>
            TAXIM<span style={{ color: variant === 'light' ? blue : '#6DB6FF' }}>È</span>TRE
          </span>
          <span style={{ color: dotC, fontSize: s.title * 0.9, fontWeight: 900 }}>.GOV</span>
        </div>
        {showTagline && (
          <span style={{ color: subC, fontSize: s.sub, letterSpacing: '0.12em', fontWeight: 500, marginTop: 2 }}>
            Gouvernement du Québec
          </span>
        )}
      </div>
    </div>
  )
}

// Version compacte pour header
export function TaximetreGovMark({ size = 32, white = false }: { size?: number; white?: boolean }) {
  const blue = white ? '#FFFFFF' : '#003DA5'
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
      <path d="M24 2L44 10V28C44 38 34 45 24 47C14 45 4 38 4 28V10L24 2Z"
        fill={blue} stroke={white ? 'rgba(255,255,255,0.3)' : 'rgba(0,61,165,0.3)'} strokeWidth="0.5"/>
      <g transform="translate(14, 10) scale(0.42)">
        <path d="M24 8C24 8 18 14 18 20C18 23.3 20.7 26 24 26C27.3 26 30 23.3 30 20C30 14 24 8 24 8Z" fill="white"/>
        <path d="M24 22C24 22 10 26 8 34C7 38 10 40 14 38L24 32L34 38C38 40 41 38 40 34C38 26 24 22 24 22Z" fill="white"/>
        <path d="M24 30V44" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <path d="M16 36H32" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
      <circle cx="24" cy="43" r="2.5" fill="#C8102E"/>
    </svg>
  )
}
