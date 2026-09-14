'use client'

// Logo depuis /public/logo.png (hébergé dans l'app)
const LOGO_URL = '/logo.png'

export function TaximetreGovLogo({ size = 120, className = '' }: { size?: number; className?: string }) {
  return (
    <img src={LOGO_URL} alt="TAXIMETER.GOV" width={size} height={size}
      className={className} style={{ objectFit: 'contain', display: 'block' }} />
  )
}

export function TaximetreGovMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <img src={LOGO_URL} alt="TAXIMETER.GOV" width={size} height={size}
      className={className} style={{ objectFit: 'contain', display: 'block' }} />
  )
}

export function TaximetreGovLoader({ message = 'Chargement…' }: { message?: string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:48 }}>
      <div style={{ position:'relative', width:80, height:80 }}>
        <img src={LOGO_URL} alt="TAXIMETER.GOV" width={80} height={80} style={{ objectFit:'contain', borderRadius:'50%' }} />
        <div style={{
          position:'absolute', inset:-4,
          border:'3px solid transparent',
          borderTopColor:'#3B82F6',
          borderRightColor:'rgba(59,130,246,0.3)',
          borderRadius:'50%',
          animation:'logo-spin 1s linear infinite',
        }}/>
      </div>
      <span style={{ fontSize:12, color:'rgba(139,163,204,0.7)', fontWeight:500 }}>{message}</span>
      <style>{`@keyframes logo-spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  )
}
