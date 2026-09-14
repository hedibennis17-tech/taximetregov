'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { TaximetreGovLogo } from '@/components/brand/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [mode,     setMode]     = useState<'login'|'register'>('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string|null>(null)
  const [success,  setSuccess]  = useState<string|null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null); setSuccess(null)
    try {
      const supabase = getSupabaseBrowserClient()

      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError
        if (data.session) {
          await fetch('/api/auth/setup', { method: 'POST', headers: { Authorization: `Bearer ${data.session.access_token}` } })
          router.replace('/home')
        } else {
          setSuccess('Compte créé! Vérifiez votre courriel pour confirmer.')
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        if (!data.session) throw new Error('Impossible de créer la session.')
        await fetch('/api/auth/setup', { method: 'POST', headers: { Authorization: `Bearer ${data.session.access_token}` } })
        router.replace('/home')
      }
    } catch (err) {
      const msg = (err as Error).message
      if (msg.includes('Invalid login')) setError('Courriel ou mot de passe incorrect.')
      else if (msg.includes('already registered')) setError('Ce courriel est déjà utilisé.')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F4F6FA' }}>

      {/* Bande bleue en haut */}
      <div style={{ background: '#003DA5', height: 6 }} />

      {/* Header gouvernemental */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'white', borderBottom: '1px solid #DDE3EE' }}>
        <div className="text-[10px] text-gray-500 font-medium tracking-wide">Gouvernement du Québec</div>
        <div className="text-[10px] text-gray-400">🔒 Connexion sécurisée</div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <TaximetreGovLogo size="lg" variant="light" showTagline />
          <div className="text-xs text-center" style={{ color: '#8A96A8', maxWidth: 260 }}>
            Infrastructure numérique gouvernementale · Espace chauffeur
          </div>
        </div>

        {/* Card formulaire */}
        <div className="w-full max-w-sm" style={{ background: 'white', borderRadius: 20, border: '1px solid #DDE3EE', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', padding: 28 }}>

          {/* Tabs login/register */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', background:'#F4F6FA', borderRadius:10, padding:3, marginBottom:24 }}>
            {(['login','register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null) }}
                style={{
                  padding:'9px 0', borderRadius:8, fontWeight:700, fontSize:13,
                  background: mode===m ? 'white' : 'transparent',
                  color: mode===m ? '#003DA5' : '#8A96A8',
                  boxShadow: mode===m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  border:'none', cursor:'pointer', transition:'all 0.15s',
                }}>
                {m === 'login' ? 'Connexion' : 'Créer un compte'}
              </button>
            ))}
          </div>

          {/* Erreur */}
          {error && (
            <div style={{ background:'#FEE2E2', border:'1px solid #FECACA', borderRadius:10, padding:'10px 14px', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <AlertCircle size={14} color="#C8102E" />
              <span style={{ fontSize:13, color:'#C8102E', fontWeight:500 }}>{error}</span>
            </div>
          )}
          {success && (
            <div style={{ background:'#E6F4ED', border:'1px solid #A7F3C4', borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
              <span style={{ fontSize:13, color:'#00873A', fontWeight:500 }}>{success}</span>
            </div>
          )}

          <form onSubmit={e => void handleSubmit(e)}>
            {/* Email */}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#4A5568', marginBottom:6 }}>
                Adresse courriel
              </label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="votre@courriel.ca"
                style={{
                  width:'100%', padding:'12px 14px', borderRadius:10,
                  border:'1.5px solid #DDE3EE', fontSize:15, outline:'none',
                  background:'white', color:'#0A1628',
                  transition:'border 0.15s',
                }}
                onFocus={e => e.target.style.border='1.5px solid #003DA5'}
                onBlur={e => e.target.style.border='1.5px solid #DDE3EE'}
              />
            </div>

            {/* Mot de passe */}
            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#4A5568', marginBottom:6 }}>
                Mot de passe
              </label>
              <div style={{ position:'relative' }}>
                <input type={showPwd ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  style={{
                    width:'100%', padding:'12px 44px 12px 14px', borderRadius:10,
                    border:'1.5px solid #DDE3EE', fontSize:15, outline:'none',
                    background:'white', color:'#0A1628',
                  }}
                  onFocus={e => e.target.style.border='1.5px solid #003DA5'}
                  onBlur={e => e.target.style.border='1.5px solid #DDE3EE'}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#8A96A8' }}>
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Bouton */}
            <button type="submit" disabled={loading}
              style={{
                width:'100%', padding:'14px', borderRadius:12,
                background: loading ? '#7A98D0' : '#003DA5',
                color:'white', fontWeight:800, fontSize:15,
                border:'none', cursor: loading ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                transition:'background 0.15s',
              }}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>
        </div>

        {/* Pied de page */}
        <div className="mt-8 text-center space-y-1">
          <div className="text-[10px]" style={{ color:'#8A96A8' }}>
            Mode pilote · Données synthétiques · Gouvernement du Québec
          </div>
          <div className="text-[10px]" style={{ color:'#C8102E' }}>
            ⚜ TAXIMETER.GOV
          </div>
        </div>
      </div>

      {/* Bande bleue en bas */}
      <div style={{ background:'#003DA5', height:4 }} />
    </div>
  )
}
