// TAXIMETER.GOV — Logo officiel (inspiré du vrai logo)
import React from 'react'

interface LogoProps {
  size?: number
  className?: string
}

// SVG du vrai logo TAXIMETREGOV
export function TaximetreGovLogo({ size = 120, className = '' }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Cercle extérieur */}
      <circle cx="100" cy="100" r="97" fill="#001F5C" stroke="white" strokeWidth="2"/>
      <circle cx="100" cy="100" r="88" fill="none" stroke="white" strokeWidth="1"/>
      
      {/* Texte circulaire TAXIMETREGOV */}
      <path id="topArc" d="M 20,100 A 80,80 0 0,1 180,100" fill="none"/>
      <text fontFamily="Arial Black, Arial" fontWeight="900" fontSize="16" fill="white" letterSpacing="3">
        <textPath href="#topArc" startOffset="8%">TAXIMETER</textPath>
      </text>
      <path id="govArc" d="M 20,100 A 80,80 0 0,1 180,100" fill="none"/>
      <text fontFamily="Arial Black, Arial" fontWeight="900" fontSize="16" fill="#3B82F6" letterSpacing="3">
        <textPath href="#govArc" startOffset="72%">GOV</textPath>
      </text>

      {/* Fleur-de-lis centrale en haut */}
      <g transform="translate(100,32) scale(0.9)">
        <path d="M0,-14 C0,-14 -4,-8 -4,-4 C-4,-1.8 -2.2,0 0,0 C2.2,0 4,-1.8 4,-4 C4,-8 0,-14 0,-14Z" fill="#3B82F6"/>
        <path d="M0,0 C0,0 -12,3 -13,9 C-14,12 -11,13 -8,11 L0,6 L8,11 C11,13 14,12 13,9 C12,3 0,0 0,0Z" fill="#3B82F6"/>
        <rect x="-1.5" y="4" width="3" height="10" fill="#3B82F6"/>
        <rect x="-5" y="11" width="10" height="2" fill="#3B82F6"/>
      </g>

      {/* Fleurs-de-lis gauche et droite */}
      <g transform="translate(28,95) scale(0.55)">
        <path d="M0,-14 C0,-14 -4,-8 -4,-4 C-4,-1.8 -2.2,0 0,0 C2.2,0 4,-1.8 4,-4 C4,-8 0,-14 0,-14Z" fill="white"/>
        <path d="M0,0 C0,0 -12,3 -13,9 C-14,12 -11,13 -8,11 L0,6 L8,11 C11,13 14,12 13,9 C12,3 0,0 0,0Z" fill="white"/>
        <rect x="-1.5" y="4" width="3" height="10" fill="white"/>
      </g>
      <g transform="translate(172,95) scale(0.55)">
        <path d="M0,-14 C0,-14 -4,-8 -4,-4 C-4,-1.8 -2.2,0 0,0 C2.2,0 4,-1.8 4,-4 C4,-8 0,-14 0,-14Z" fill="white"/>
        <path d="M0,0 C0,0 -12,3 -13,9 C-14,12 -11,13 -8,11 L0,6 L8,11 C11,13 14,12 13,9 C12,3 0,0 0,0Z" fill="white"/>
        <rect x="-1.5" y="4" width="3" height="10" fill="white"/>
      </g>

      {/* Skyline Montréal stylisée */}
      <g fill="#1A3A7A" opacity="0.8">
        <rect x="30" y="85" width="8" height="30"/>
        <rect x="40" y="75" width="10" height="40"/>
        <rect x="52" y="80" width="6" height="35"/>
        <rect x="60" y="70" width="12" height="45"/>
        <rect x="74" y="78" width="8" height="37"/>
        {/* Pont */}
        <path d="M120,90 Q140,72 160,90" stroke="#1A3A7A" strokeWidth="2" fill="none"/>
        <line x1="130" y1="80" x2="130" y2="90" stroke="#1A3A7A" strokeWidth="1.5"/>
        <line x1="140" y1="76" x2="140" y2="90" stroke="#1A3A7A" strokeWidth="1.5"/>
        <line x1="150" y1="80" x2="150" y2="90" stroke="#1A3A7A" strokeWidth="1.5"/>
        <rect x="125" y="90" width="38" height="25" fill="#1A3A7A"/>
      </g>

      {/* Voiture taxi blanche */}
      <g transform="translate(55, 88)">
        {/* Carrosserie */}
        <path d="M10,30 L10,18 L18,10 L72,10 L80,18 L80,30 Z" fill="white" stroke="#DDD" strokeWidth="0.5"/>
        {/* Toit */}
        <path d="M22,10 L26,2 L64,2 L68,10 Z" fill="white" stroke="#DDD" strokeWidth="0.5"/>
        {/* Enseigne TAXI */}
        <rect x="32" y="0" width="26" height="8" rx="2" fill="#001F5C"/>
        <text x="45" y="6.5" textAnchor="middle" fill="white" fontSize="5" fontFamily="Arial" fontWeight="bold">TAXI</text>
        {/* Pare-brise */}
        <path d="M24,10 L28,4 L62,4 L66,10 Z" fill="#99CCFF" opacity="0.6"/>
        {/* Phares */}
        <ellipse cx="18" cy="25" rx="5" ry="3" fill="#99CCFF"/>
        <ellipse cx="72" cy="25" rx="5" ry="3" fill="#99CCFF"/>
        {/* Grille */}
        <rect x="30" y="24" width="30" height="8" rx="1" fill="#CCCCCC"/>
        <line x1="35" y1="24" x2="35" y2="32" stroke="#999" strokeWidth="0.5"/>
        <line x1="40" y1="24" x2="40" y2="32" stroke="#999" strokeWidth="0.5"/>
        <line x1="45" y1="24" x2="45" y2="32" stroke="#999" strokeWidth="0.5"/>
        <line x1="50" y1="24" x2="50" y2="32" stroke="#999" strokeWidth="0.5"/>
        <line x1="55" y1="24" x2="55" y2="32" stroke="#999" strokeWidth="0.5"/>
        {/* Fleur-de-lis sur capot */}
        <g transform="translate(45,18) scale(0.4)">
          <path d="M0,-8 C0,-8 -3,-4 -3,-2 C-3,-0.8 -1.5,0 0,0 C1.5,0 3,-0.8 3,-2 C3,-4 0,-8 0,-8Z" fill="#003DA5"/>
          <path d="M0,0 C0,0 -7,2 -8,5 C-9,7 -7,8 -5,6.5 L0,4 L5,6.5 C7,8 9,7 8,5 C7,2 0,0 0,0Z" fill="#003DA5"/>
        </g>
        {/* Roues */}
        <circle cx="25" cy="30" r="6" fill="#333"/>
        <circle cx="25" cy="30" r="3" fill="#666"/>
        <circle cx="65" cy="30" r="6" fill="#333"/>
        <circle cx="65" cy="30" r="3" fill="#666"/>
      </g>

      {/* Display tarimètre */}
      <rect x="52" y="148" width="96" height="18" rx="4" fill="#000D2E"/>
      <rect x="54" y="150" width="92" height="14" rx="3" fill="#001F5C" stroke="#3B82F6" strokeWidth="0.5"/>
      <text x="62" y="160" fill="#8A9AB5" fontSize="7" fontFamily="monospace">FARE</text>
      <text x="82" y="160" fill="#3B82F6" fontSize="9" fontFamily="monospace" fontWeight="bold">25.50 $</text>
      <text x="138" y="160" fontSize="8">📍</text>
      <text x="152" y="160" fontSize="8">🕐</text>

      {/* Séparateur */}
      <path d="M15,168 L185,168" stroke="white" strokeWidth="1"/>
      <path d="M15,170 L185,170" stroke="#3B82F6" strokeWidth="0.5" opacity="0.5"/>

      {/* Bandeau bas */}
      <path d="M15,170 L185,170 L180,190 L20,190 Z" fill="#001F5C"/>
      <text x="100" y="178" textAnchor="middle" fill="white" fontSize="6" fontFamily="Arial" fontWeight="bold" letterSpacing="1">PLATEFORME OFFICIELLE</text>
      <text x="100" y="186" textAnchor="middle" fill="#3B82F6" fontSize="6.5" fontFamily="Arial" fontWeight="bold" letterSpacing="0.5">POUR TAXIS ET VTC</text>

      {/* Texte bas circulaire */}
      <path id="botArc" d="M 18,105 A 82,82 0 0,0 182,105" fill="none"/>
      <text fontFamily="Arial" fontWeight="600" fontSize="7.5" fill="white" letterSpacing="1.5" opacity="0.85">
        <textPath href="#botArc" startOffset="5%">TRANSPARENCE  ✦  CONFORMITÉ  ✦  CONFIANCE</textPath>
      </text>
    </svg>
  )
}

// Version petite pour header
export function TaximetreGovMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="97" fill="#001F5C" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
      <g transform="translate(100,45) scale(1.1)">
        <path d="M0,-18 C0,-18 -5,-10 -5,-5 C-5,-2.2 -2.8,0 0,0 C2.8,0 5,-2.2 5,-5 C5,-10 0,-18 0,-18Z" fill="#3B82F6"/>
        <path d="M0,0 C0,0 -15,4 -16,12 C-17,16 -13,17 -10,14 L0,8 L10,14 C13,17 17,16 16,12 C15,4 0,0 0,0Z" fill="#3B82F6"/>
        <rect x="-2" y="6" width="4" height="14" fill="#3B82F6"/>
      </g>
      <g transform="translate(55, 95)">
        <path d="M10,28 L10,16 L18,8 L72,8 L80,16 L80,28 Z" fill="white"/>
        <path d="M22,8 L26,0 L64,0 L68,8 Z" fill="white"/>
        <rect x="32" y="-2" width="26" height="7" rx="1.5" fill="#001F5C"/>
        <text x="45" y="4" textAnchor="middle" fill="white" fontSize="4.5" fontFamily="Arial" fontWeight="bold">TAXI</text>
        <circle cx="25" cy="28" r="6" fill="#333"/>
        <circle cx="65" cy="28" r="6" fill="#333"/>
      </g>
      <text x="100" y="175" textAnchor="middle" fill="white" fontSize="11" fontFamily="Arial Black" fontWeight="900" letterSpacing="2">TAXIMETER</text>
      <text x="100" y="187" textAnchor="middle" fill="#3B82F6" fontSize="11" fontFamily="Arial Black" fontWeight="900" letterSpacing="2">.GOV</text>
    </svg>
  )
}

// Spinner de chargement avec logo
export function TaximetreGovLoader({ message = 'Chargement…' }: { message?: string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:32 }}>
      <div style={{ position:'relative' }}>
        <TaximetreGovLogo size={80} />
        <div style={{
          position:'absolute', inset:-6,
          border:'3px solid transparent',
          borderTopColor:'#3B82F6',
          borderRadius:'50%',
          animation:'spin 1s linear infinite',
        }}/>
      </div>
      <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', fontWeight:500 }}>{message}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
