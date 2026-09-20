'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Eye, EyeOff, AlertCircle, Loader2, Sun, Moon } from 'lucide-react'
import { TaximetreGovLogo } from '@/components/brand/Logo'
import { GlobalLanguageLoader } from '@/components/language/GlobalLanguageLoader'
import { getLang, toggleLang } from '@/lib/i18n/language'

function useLoginTheme() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const saved = localStorage.getItem('qc-theme')
    setDark(saved === 'dark')
  }, [])
  function toggle() {
    const next = dark ? 'light' : 'dark'
    localStorage.setItem('qc-theme', next)
    document.documentElement.setAttribute('data-theme', next)
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(next)
    setDark(!dark)
  }
  return { dark, toggle }
}

export default function LoginPage() {
  const router = useRouter()
  const { dark, toggle } = useLoginTheme()
  const [lang, setLangState] = useState<'fr'|'en'>('fr')
  const [mode, setMode] = useState<'login'|'register'>('login')

  useEffect(() => { setLangState(getLang()) }, [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [success, setSuccess] = useState<string|null>(null)

  async function handleSubmit() {
    setLoading(true); setError(null); setSuccess(null)
    try {
      const sb = getSupabaseBrowserClient()
      if (mode === 'login') {
        const { error: e } = await sb.auth.signInWithPassword({ email, password })
        if (e) throw e
        router.replace('/home')
      } else {
        const { error: e } = await sb.auth.signUp({ email, password })
        if (e) throw e
        setSuccess('Vérifiez votre courriel pour confirmer votre compte.')
      }
    } catch (e: unknown) {
      setError((e as {message?:string}).message ?? 'Erreur inattendue')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      background: dark ? '#050E1C' : '#EEF3FC', padding:'0 20px', transition:'background 0.2s',
      backgroundImage: dark
        ? 'radial-gradient(ellipse at 20% 50%, rgba(0,61,165,0.10) 0%, transparent 60%)'
        : 'radial-gradient(ellipse at 20% 50%, rgba(0,61,165,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(11,79,113,0.04) 0%, transparent 60%)',
    }}>
      <GlobalLanguageLoader />

      {/* Boutons coin haut droit — thème + langue */}
      <div style={{ position:'fixed', top:16, right:16, display:'flex', gap:8 }}>
        {/* FR/EN */}
        <button onClick={() => { toggleLang(); setLangState(l => l==='fr'?'en':'fr') }} style={{
          height:38, borderRadius:12, padding:'0 10px',
          background: dark?'rgba(255,255,255,0.08)':'rgba(0,61,165,0.08)',
          border: dark?'1px solid rgba(255,255,255,0.15)':'1px solid rgba(0,61,165,0.20)',
          display:'flex', alignItems:'center', gap:4, cursor:'pointer',
        }}>
          <span style={{ fontSize:12, fontWeight:800, color: lang==='fr'?(dark?'white':'#003DA5'):(dark?'rgba(255,255,255,0.35)':'rgba(0,61,165,0.35)'), letterSpacing:'0.05em' }}>FR</span>
          <span style={{ fontSize:9, color:dark?'rgba(255,255,255,0.30)':'rgba(0,61,165,0.30)' }}>|</span>
          <span style={{ fontSize:12, fontWeight:800, color: lang==='en'?(dark?'white':'#003DA5'):(dark?'rgba(255,255,255,0.35)':'rgba(0,61,165,0.35)'), letterSpacing:'0.05em' }}>EN</span>
        </button>
        {/* Thème */}
        <button onClick={toggle} style={{
          width:38, height:38, borderRadius:12,
          background: dark?'rgba(255,255,255,0.08)':'rgba(0,61,165,0.08)',
          border: dark?'1px solid rgba(255,255,255,0.15)':'1px solid rgba(0,61,165,0.20)',
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
        }}>
          {dark ? <Sun size={16} color="#F5C842"/> : <Moon size={16} color="#003DA5"/>}
        </button>
      </div>

      {/* Card centrale */}
      <div style={{
        width:'100%', maxWidth:380,
        background: dark ? '#0F1F38' : '#FFFFFF',
        borderRadius:24,
        boxShadow: dark ? '0 8px 40px rgba(0,0,0,0.5)' : '0 8px 40px rgba(0,61,165,0.16)',
        overflow:'hidden',
        border: dark ? '1px solid rgba(59,130,246,0.18)' : 'none',
      }}>

        {/* Header bleu royal */}
        <div style={{ background:'linear-gradient(135deg,#003DA5 0%,#0B4F71 100%)', padding:'28px 24px', textAlign:'center', position:'relative' }}>
          <div style={{ position:'absolute', top:-8, right:10, fontSize:80, color:'rgba(255,255,255,0.05)', pointerEvents:'none' }}>⚜</div>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
            <TaximetreGovLogo size={60} />
          </div>
          <div style={{ fontSize:16, fontWeight:900, color:'#FFFFFF', letterSpacing:'0.05em', marginBottom:3 }}>
            TAXIM<span style={{ color:'#F5C842' }}>È</span>TRE<span style={{ color:'#F5C842' }}>.GOV</span>
          </div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.60)', letterSpacing:'0.06em' }}>
            Gouvernement du Québec · Espace chauffeur
          </div>
        </div>

        {/* Formulaire */}
        <div style={{ padding:'24px' }}>
          {/* Toggle login/register */}
          <div style={{ display:'flex', background: dark ? 'rgba(255,255,255,0.05)' : '#F4F7FE', borderRadius:12, padding:4, marginBottom:20 }}>
            {(['login','register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null) }} style={{
                flex:1, padding:'9px', borderRadius:10, fontSize:12, fontWeight:700, border:'none', cursor:'pointer', transition:'all 0.15s',
                background: mode===m ? '#003DA5' : 'transparent',
                color: mode===m ? '#FFFFFF' : (dark ? '#8BA3CC' : '#4A6A9A'),
                boxShadow: mode===m ? '0 4px 12px rgba(0,61,165,0.30)' : 'none',
              }}>
                {m === 'login' ? '🔐 Connexion' : '✍️ Inscription'}
              </button>
            ))}
          </div>

          {/* Messages */}
          {error && (
            <div style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'10px 12px', borderRadius:10, background:'rgba(220,38,38,0.07)', border:'1.5px solid rgba(220,38,38,0.25)', marginBottom:14 }}>
              <AlertCircle size={14} color="#DC2626" style={{ flexShrink:0, marginTop:1 }} />
              <span style={{ fontSize:11, color:'#DC2626', lineHeight:1.4 }}>{error}</span>
            </div>
          )}
          {success && (
            <div style={{ padding:'10px 12px', borderRadius:10, background:'rgba(5,150,105,0.08)', border:'1.5px solid rgba(5,150,105,0.25)', marginBottom:14 }}>
              <span style={{ fontSize:11, color:'#059669' }}>✓ {success}</span>
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, fontWeight:700, color: dark ? '#8BA3CC' : '#1A3A6B', display:'block', marginBottom:5, letterSpacing:'0.03em' }}>Adresse courriel</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="chauffeur@example.com"
              style={{ width:'100%', padding:'12px 14px', borderRadius:11, border:`1.5px solid ${dark ? 'rgba(59,130,246,0.25)' : '#C5D4EE'}`, fontSize:14, color: dark ? '#F0F4FF' : '#001433', background: dark ? 'rgba(5,14,28,0.8)' : '#FFFFFF', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = '#003DA5'}
              onBlur={e => e.target.style.borderColor = dark ? 'rgba(59,130,246,0.25)' : '#C5D4EE'}
            />
          </div>

          {/* Mot de passe */}
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:11, fontWeight:700, color: dark ? '#8BA3CC' : '#1A3A6B', display:'block', marginBottom:5, letterSpacing:'0.03em' }}>Mot de passe</label>
            <div style={{ position:'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width:'100%', padding:'12px 42px 12px 14px', borderRadius:11, border:`1.5px solid ${dark ? 'rgba(59,130,246,0.25)' : '#C5D4EE'}`, fontSize:14, color: dark ? '#F0F4FF' : '#001433', background: dark ? 'rgba(5,14,28,0.8)' : '#FFFFFF', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = '#003DA5'}
                onBlur={e => e.target.style.borderColor = dark ? 'rgba(59,130,246,0.25)' : '#C5D4EE'}
                onKeyDown={e => e.key==='Enter' && void handleSubmit()}
              />
              <button onClick={() => setShowPwd(v => !v)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center' }}>
                {showPwd ? <EyeOff size={16} color={dark ? '#8BA3CC' : '#4A6A9A'} /> : <Eye size={16} color={dark ? '#8BA3CC' : '#4A6A9A'} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button onClick={() => void handleSubmit()} disabled={loading || !email || !password} style={{
            width:'100%', padding:'14px', borderRadius:13, fontSize:14, fontWeight:800,
            background: loading || !email || !password ? '#C5D4EE' : '#003DA5',
            color: loading || !email || !password ? '#7B9ED9' : '#FFFFFF',
            border:'none', cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            boxShadow: loading || !email || !password ? 'none' : '0 4px 16px rgba(0,61,165,0.35)',
            transition:'all 0.15s',
          }}>
            {loading ? (
              <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} /> {mode==='login' ? 'Connexion…' : 'Inscription…'}</>
            ) : (
              mode==='login' ? '🔐 Se connecter' : '✍️ Créer mon compte'
            )}
          </button>

          <p style={{ textAlign:'center', fontSize:10, color: dark ? '#4A6285' : '#7B9ED9', margin:'16px 0 0', lineHeight:1.5 }}>
            Plateforme officielle du gouvernement du Québec<br/>
            Vos données sont protégées · Chiffrement SSL
          </p>
        </div>
      </div>


      {/* ── ACCÈS RAPIDE DÉMO ── */}
      <div style={{ marginTop:16, width:'100%', maxWidth:360 }}>
        <div style={{ fontSize:8, fontWeight:700, color: dark?'#4A6285':'#7B9ED9', textTransform:'uppercase', letterSpacing:'0.08em', textAlign:'center', marginBottom:8 }}>
          Accès rapide · Comptes DÉMO
        </div>
        <div style={{ background: dark?'rgba(0,61,165,0.12)':'rgba(0,61,165,0.06)', border:'1px solid', borderColor: dark?'rgba(0,61,165,0.3)':'rgba(0,61,165,0.15)', borderRadius:12, padding:12 }}>
          {[
            { name:'Alexandre Tremblay', email:'a.tremblay@driver-demo.taximetergov.demo', pwd:'Driver2026!', role:'Chauffeur · Uber Taxi', color:'#003DA5' },
            { name:'Fatima Zahra Benali', email:'fz.benali@driver-demo.taximetergov.demo', pwd:'Driver2026!', role:'Chauffeuse · Uber Eats', color:'#059669' },
            { name:'Marco Fernandez',    email:'m.fernandez@driver-demo.taximetergov.demo', pwd:'Driver2026!', role:'Chauffeur · Uber Rides', color:'#7C3AED' },
          ].map((u,i) => (
            <button key={i} onClick={() => { setEmail(u.email); setPassword(u.pwd) }}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, background:'transparent', border:'none',
                borderBottom: i<2 ? '1px solid rgba(0,61,165,0.1)' : 'none',
                padding:'8px 0', cursor:'pointer', textAlign:'left' }}>
              <div style={{ width:28, height:28, borderRadius:8, background:u.color, display:'flex', alignItems:'center', justifyContent:'center',
                color:'white', fontSize:10, fontWeight:900, flexShrink:0 }}>
                {u.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:10, fontWeight:700, color: dark?'#C5D4EE':'#1e293b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.name}</div>
                <div style={{ fontSize:8, color: dark?'#4A6285':'#7B9ED9' }}>{u.role}</div>
              </div>
              <div style={{ fontSize:7, fontWeight:700, color: u.color, background: u.color+'20', padding:'2px 6px', borderRadius:999, flexShrink:0 }}>AUTO-FILL</div>
            </button>
          ))}
          <div style={{ marginTop:8, padding:'6px 8px', background:'rgba(245,158,11,0.1)', borderRadius:8, fontSize:8, color:'#B45309', fontWeight:700 }}>
            ⚠️ Mot de passe DÉMO: <span style={{fontFamily:'monospace'}}>Driver2026!</span> · Données synthétiques
          </div>
        </div>
      </div>

      {/* Footer */}
      <p style={{ marginTop:20, fontSize:9, color: dark ? '#4A6285' : '#7B9ED9', textAlign:'center', letterSpacing:'0.05em' }}>
        TAXIMÈTRE.GOV · MODE PILOTE · © 2026 Gouvernement du Québec
      </p>
    </div>
  )
}
