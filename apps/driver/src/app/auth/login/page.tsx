'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { TaximetreGovLogo } from '@/components/brand/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login'|'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [success, setSuccess] = useState<string|null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null); setSuccess(null)
    try {
      const sb = getSupabaseBrowserClient()
      if (mode === 'register') {
        const { data, error: err } = await sb.auth.signUp({ email, password })
        if (err) throw err
        if (data.session) {
          await fetch('/api/auth/setup', { method:'POST', headers:{ Authorization:`Bearer ${data.session.access_token}` } })
          router.replace('/home')
        } else {
          setSuccess('Compte créé! Vérifiez votre courriel pour confirmer.')
        }
      } else {
        const { data, error: err } = await sb.auth.signInWithPassword({ email, password })
        if (err) throw err
        if (!data.session) throw new Error('Session invalide.')
        await fetch('/api/auth/setup', { method:'POST', headers:{ Authorization:`Bearer ${data.session.access_token}` } })
        router.replace('/home')
      }
    } catch (err) {
      const msg = (err as Error).message
      if (msg.includes('Invalid login')) setError('Courriel ou mot de passe incorrect.')
      else if (msg.includes('already registered')) setError('Ce courriel est déjà utilisé.')
      else setError(msg)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'#050E1C', position:'relative', overflow:'hidden' }}>
      {/* Background décoratif */}
      <div style={{ position:'absolute', top:-100, left:-100, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,61,165,0.3) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-100, right:-100, width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', top:'30%', right:-50, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,31,92,0.4) 0%, transparent 70%)', pointerEvents:'none' }}/>

      {/* Header */}
      <div style={{ background:'rgba(0,31,92,0.8)', borderBottom:'1px solid rgba(59,130,246,0.2)', backdropFilter:'blur(10px)', padding:'10px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)', fontWeight:500, letterSpacing:'0.05em' }}>Gouvernement du Québec</span>
        <span style={{ fontSize:9, color:'rgba(59,130,246,0.8)', display:'flex', alignItems:'center', gap:4 }}>🔒 Connexion sécurisée</span>
      </div>

      {/* Contenu */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px' }}>

        {/* Logo vrai */}
        <div style={{ marginBottom:32, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <TaximetreGovLogo size={140} />
          <div style={{ fontSize:11, color:'rgba(139,163,204,0.7)', textAlign:'center', maxWidth:260, lineHeight:1.5 }}>
            Infrastructure numérique · Espace chauffeur certifié
          </div>
        </div>

        {/* Card formulaire */}
        <div style={{ width:'100%', maxWidth:360, background:'rgba(15,31,56,0.95)', borderRadius:20, border:'1px solid rgba(59,130,246,0.25)', boxShadow:'0 8px 40px rgba(0,0,0,0.5)', padding:24, backdropFilter:'blur(10px)' }}>

          {/* Tabs */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', background:'rgba(5,14,28,0.8)', borderRadius:10, padding:3, marginBottom:20 }}>
            {(['login','register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null) }}
                style={{ padding:'9px 0', borderRadius:8, fontWeight:700, fontSize:13, background: mode===m ? '#003DA5' : 'transparent', color: mode===m ? 'white' : '#4A6285', border:'none', cursor:'pointer', transition:'all 0.15s' }}>
                {m === 'login' ? 'Connexion' : 'S\'inscrire'}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ background:'rgba(200,16,46,0.1)', border:'1px solid rgba(200,16,46,0.3)', borderRadius:10, padding:'10px 14px', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
              <AlertCircle size={14} color="#EF4444" />
              <span style={{ fontSize:13, color:'#EF4444' }}>{error}</span>
            </div>
          )}
          {success && (
            <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:10, padding:'10px 14px', marginBottom:16 }}>
              <span style={{ fontSize:13, color:'#10B981' }}>{success}</span>
            </div>
          )}

          <form onSubmit={e => void handleSubmit(e)}>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#8BA3CC', marginBottom:6, letterSpacing:'0.05em' }}>COURRIEL</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@courriel.ca"
                style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:'1px solid rgba(59,130,246,0.2)', fontSize:15, background:'rgba(5,14,28,0.8)', color:'#F0F4FF', outline:'none', transition:'border 0.15s' }}
                onFocus={e => e.target.style.border='1px solid rgba(59,130,246,0.6)'}
                onBlur={e => e.target.style.border='1px solid rgba(59,130,246,0.2)'}
              />
            </div>
            <div style={{ marginBottom:22 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#8BA3CC', marginBottom:6, letterSpacing:'0.05em' }}>MOT DE PASSE</label>
              <div style={{ position:'relative' }}>
                <input type={showPwd ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={8}
                  style={{ width:'100%', padding:'12px 44px 12px 14px', borderRadius:10, border:'1px solid rgba(59,130,246,0.2)', fontSize:15, background:'rgba(5,14,28,0.8)', color:'#F0F4FF', outline:'none' }}
                  onFocus={e => e.target.style.border='1px solid rgba(59,130,246,0.6)'}
                  onBlur={e => e.target.style.border='1px solid rgba(59,130,246,0.2)'}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#4A6285' }}>
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'14px', borderRadius:12, background: loading ? '#1A3A7A' : 'linear-gradient(135deg, #003DA5 0%, #1A56C4 100%)', color:'white', fontWeight:800, fontSize:15, border:'none', cursor: loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 4px 16px rgba(0,61,165,0.4)', transition:'all 0.15s' }}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>
        </div>

        <div style={{ marginTop:20, textAlign:'center' }}>
          <div style={{ fontSize:9, color:'rgba(139,163,204,0.4)', letterSpacing:'0.05em' }}>
            MODE PILOTE · DONNÉES SYNTHÉTIQUES · GOUVERNEMENT DU QUÉBEC
          </div>
          <div style={{ fontSize:10, color:'rgba(200,16,46,0.6)', marginTop:4 }}>⚜ TAXIMETER.GOV</div>
        </div>
      </div>

      <div style={{ background:'rgba(0,31,92,0.5)', height:4 }}/>
    </div>
  )
}
