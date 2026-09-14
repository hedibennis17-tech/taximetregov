'use client'
import { TaximetreGovLoader } from '@/components/brand/Logo'
import { AppShell } from '@/components/layout/AppShell'
import { useTheme } from '@/lib/theme'
import { getThemeTokens, cardStyle, SectionTitle } from '@/lib/theme-helpers'
import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, Lock, RefreshCw, AlertCircle, Unplug } from 'lucide-react'
import { getToken } from '@/lib/api'

interface Provider {
  id:string; provider_code:string; display_name:string; provider_type:string; provider_status:string
  connector_status:string; account_id:string|null; connection_status:string|null
  provider_driver_id_masked:string|null; connected_at:string|null; last_sync_at:string|null
  sync_error_count:number; partner_approval_reference:string|null; isMockOnly:boolean
  revenue:{gross:string;tips:string;count:string;last_activity:string}|null
}

const PROVIDER_ICON: Record<string,string> = { UBER:'⬛', LYFT:'🟣', DOORDASH:'🔴', UBER_EATS:'🟡', INSTACART:'🟢', SKIP:'🟠' }
const TYPE_LABEL: Record<string,string> = { RIDESHARE:'Covoiturage', MULTI_SERVICE:'Multi-service', FOOD_DELIVERY:'Livraison repas', GROCERY_DELIVERY:'Livraison épicerie' }

function fmtMoney(v:string|number) { return new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(typeof v==='string'?parseFloat(v)||0:v) }

function statusConf(status:string|null, isMockOnly:boolean) {
  if (status==='CONNECTED'&&isMockOnly) return { label:'Connectée (DEV)', color:'#B45309', bg:'rgba(180,83,9,0.10)', bdr:'rgba(180,83,9,0.25)' }
  if (status==='CONNECTED')            return { label:'Connectée',        color:'#059669', bg:'rgba(5,150,105,0.10)', bdr:'rgba(5,150,105,0.25)' }
  if (status==='PENDING')              return { label:'En attente',       color:'#B45309', bg:'rgba(180,83,9,0.10)', bdr:'rgba(180,83,9,0.25)' }
  if (status==='ERROR')                return { label:'Erreur',           color:'#DC2626', bg:'rgba(220,38,38,0.10)', bdr:'rgba(220,38,38,0.25)' }
  if (status==='DISCONNECTED')         return { label:'Déconnectée',      color:'#4A6A9A', bg:'rgba(74,106,154,0.08)', bdr:'rgba(74,106,154,0.20)' }
  return { label:'Non connectée', color:'#4A6A9A', bg:'rgba(74,106,154,0.05)', bdr:'rgba(74,106,154,0.15)' }
}

async function apiFetch(path:string, body?:unknown) {
  const token = getToken()
  const res = await fetch(path, { method:body?'POST':'GET', headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})}, body:body?JSON.stringify(body):undefined })
  const json = await res.json() as {success:boolean;data:unknown;error?:string}
  if (!res.ok || !json.success) throw new Error(json.error??`Erreur ${res.status}`)
  return json.data
}

export default function PlatformsPage() {
  const [providers, setProviders]   = useState<Provider[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string|null>(null)
  const [connecting, setConnecting] = useState<string|null>(null)
  const [connected, setConnected]   = useState<string|null>(null)
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const t = getThemeTokens(dark)

  const loadProviders = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const data = await apiFetch('/api/providers/list') as { providers:Provider[]; connectedCount:number }
      setProviders(data.providers)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void loadProviders() }, [loadProviders])

  async function handleConnect(code:string) {
    setConnecting(code); setError(null)
    try { await apiFetch('/api/providers/connect',{providerCode:code}); setConnected(code); await loadProviders(); setTimeout(()=>setConnected(null),3000) }
    catch (e) { setError((e as Error).message) }
    finally { setConnecting(null) }
  }

  async function handleDisconnect(code:string) {
    if (!confirm(`Déconnecter ${code} ?`)) return
    try { await apiFetch('/api/providers/disconnect',{providerCode:code}); await loadProviders() }
    catch (e) { setError((e as Error).message) }
  }

  const conn    = providers.filter(p => p.connection_status==='CONNECTED')
  const notConn = providers.filter(p => p.connection_status!=='CONNECTED')

  if (loading) return <AppShell><div style={{minHeight:'70vh',display:'flex',alignItems:'center',justifyContent:'center'}}><TaximetreGovLoader message="Chargement des plateformes…" /></div></AppShell>

  return (
    <AppShell>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 16px 12px' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:t.text, margin:0, letterSpacing:'-0.01em' }}>Mes plateformes</h1>
          <p style={{ fontSize:11, color:t.text3, margin:'3px 0 0' }}>{conn.length} connectée(s) · {providers.length} disponibles</p>
        </div>
        <button onClick={() => void loadProviders()} style={{ width:38, height:38, borderRadius:12, background:t.card, border:`1.5px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:t.shadow }}>
          <RefreshCw size={16} color={t.accent} />
        </button>
      </div>

      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:14, paddingBottom:32 }}>
        {/* Dev warning */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'11px 13px', borderRadius:12, background:'rgba(180,83,9,0.08)', border:'1.5px solid rgba(180,83,9,0.25)' }}>
          <AlertCircle size={14} color={t.amber} style={{ flexShrink:0, marginTop:1 }} />
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:t.amber, marginBottom:3 }}>Mode développement</div>
            <div style={{ fontSize:10, color:t.text2, lineHeight:1.5 }}>Toutes les connexions sont simulées. L'intégration réelle nécessite l'approbation officielle du programme partenaire de chaque plateforme.</div>
          </div>
        </div>

        {error && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 13px', borderRadius:12, background:'rgba(220,38,38,0.08)', border:'1.5px solid rgba(220,38,38,0.25)' }}>
            <AlertCircle size={14} color={t.red} />
            <span style={{ fontSize:11, color:t.red }}>{error}</span>
          </div>
        )}

        {/* Connectées */}
        {conn.length > 0 && (
          <div>
            <SectionTitle title="Connectées" t={t} />
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {conn.map(p => {
                const sc = statusConf(p.connection_status, p.isMockOnly)
                return (
                  <div key={p.id} style={{ ...cardStyle(t), padding:'16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom: p.revenue ? 12 : 0 }}>
                      <span style={{ fontSize:30 }}>{PROVIDER_ICON[p.provider_code]??'🚗'}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                          <span style={{ fontSize:14, fontWeight:700, color:t.text }}>{p.display_name}</span>
                          <span style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:20, background:sc.bg, color:sc.color, border:`1px solid ${sc.bdr}` }}>{sc.label}</span>
                        </div>
                        <div style={{ fontSize:10, color:t.text3 }}>
                          {TYPE_LABEL[p.provider_type]??p.provider_type}
                          {p.provider_driver_id_masked && ` · ID: ${p.provider_driver_id_masked}`}
                        </div>
                      </div>
                    </div>
                    {p.revenue && (
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                        {[
                          { label:'Brut 30j',   val:fmtMoney(p.revenue.gross), color:t.green },
                          { label:'Pourboires', val:fmtMoney(p.revenue.tips),  color:t.accent },
                          { label:'Activités',  val:p.revenue.count,            color:t.text },
                        ].map(s => (
                          <div key={s.label} style={{ background: dark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)', borderRadius:10, padding:'9px', textAlign:'center', border:`1px solid ${t.border}` }}>
                            <div style={{ fontSize:12, fontWeight:800, color:s.color }}>{s.val}</div>
                            <div style={{ fontSize:9, color:t.text3, marginTop:2 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:10, color:t.text3 }}>{p.last_sync_at ? `Sync: ${new Date(p.last_sync_at).toLocaleDateString('fr-CA')}` : 'Jamais synchronisé'}</span>
                      <button onClick={() => void handleDisconnect(p.provider_code)} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, color:t.red, background:'none', border:'none', cursor:'pointer' }}>
                        <Unplug size={12} /> Déconnecter
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Disponibles */}
        {notConn.length > 0 && (
          <div>
            <SectionTitle title="Disponibles" t={t} />
            <div style={{ ...cardStyle(t), overflow:'hidden' }}>
              {notConn.map((p, idx) => (
                <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 15px', borderTop: idx>0?`1px solid ${t.border}`:'none' }}>
                  <span style={{ fontSize:26 }}>{PROVIDER_ICON[p.provider_code]??'🚗'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:t.text }}>{p.display_name}</div>
                    <div style={{ fontSize:10, color:t.text3, marginTop:1 }}>{TYPE_LABEL[p.provider_type]??p.provider_type}</div>
                    {p.isMockOnly && (
                      <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:4, fontSize:9, color:t.text3 }}>
                        <Lock size={9} color={t.text3} /> Connexion simulée
                      </div>
                    )}
                  </div>
                  {connected===p.provider_code ? (
                    <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:t.green, fontWeight:700 }}>
                      <CheckCircle size={14} color={t.green} /> Connecté!
                    </div>
                  ) : connecting===p.provider_code ? (
                    <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:t.amber }}>
                      <RefreshCw size={12} color={t.amber} style={{animation:'spin 1s linear infinite'}} /> Connexion…
                    </div>
                  ) : (
                    <button onClick={() => void handleConnect(p.provider_code)} style={{ padding:'8px 14px', borderRadius:11, background:'#003DA5', color:'white', fontSize:11, fontWeight:700, border:'none', cursor:'pointer', boxShadow:'0 3px 10px rgba(0,61,165,0.25)' }}>
                      Connecter
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Architecture */}
        <div style={{ ...cardStyle(t), padding:'14px 16px' }}>
          <SectionTitle title="Architecture de connexion" t={t} />
          {['Tu cliques "Connecter"','Taximètre.gov → OAuth provider','Tu autorises sur la plateforme','Token sécurisé — jamais ton mot de passe','Activités synchronisées automatiquement'].map((s, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderTop: i>0?`1px solid ${t.border}`:'none' }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background: dark?'rgba(0,61,165,0.20)':'rgba(0,61,165,0.10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:t.accent, flexShrink:0 }}>{i+1}</div>
              <span style={{ fontSize:11, color:t.text2 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
