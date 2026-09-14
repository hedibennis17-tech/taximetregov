'use client'

// Logo réel depuis imgur
const LOGO_URL = 'https://i.imgur.com/Sx0vJpi.png'

export function TaximetreGovLogo({ size = 120, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src={LOGO_URL}
      alt="TAXIMETER.GOV"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  )
}

export function TaximetreGovMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src={LOGO_URL}
      alt="TAXIMETER.GOV"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  )
}

export function TaximetreGovLoader({ message = 'Chargement…' }: { message?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid rgba(59,130,246,0.2)',
        borderTopColor: '#3B82F6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ fontSize: 13, color: 'rgba(139,163,204,0.7)' }}>{message}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
