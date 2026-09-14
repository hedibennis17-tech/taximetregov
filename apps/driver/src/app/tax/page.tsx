'use client'
import { AppShell } from '@/components/layout/AppShell'
import { TaximetreGovLoader } from '@/components/brand/Logo'
import { useDriverProfile, money } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import { getThemeTokens, cardStyle, SectionTitle } from '@/lib/theme-helpers'
import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertTriangle, CheckCircle, Clock, ExternalLink, Shield } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface TaxData {
  hasAccount:boolean; taxAccount:Record<string,string>|null; currentPeriod:Record<string,string>|null
  allPeriods:Array<Record<string,string>>
  fiscal:{ gross_revenue_taxable:number;tps_collected:number;tps_credits:number;tps_balance:number;tvq_collected:number;tvq_credits:number;tvq_balance:number;solde_total:number;is_estimate:boolean;calculation_status:string;tps_rate:string;tvq_rate:string }
  currentFiling:Record<string,string>|null; allFilings:Array<Record<string,string>>
  ruleSet:Record<string,string>; avertissement:string; mode_pilote:boolean; revenu_quebec_url:string
}

const TABS = [
  { key:'dashboard',   label:'Tableau',    emoji:'📊' },
  { key:'calculator',  label:'Calcul',     emoji:'🧮' },
  { key:'declaration', label:'Décla.',     emoji:'📋' },
  { key:'pay',         label:'Paiement',   emoji:'💳' },
  { key:'history',     label:'Historique', emoji:'📜' },
  { key:'obligations', label:'Obligations',emoji:'⏱️' },
]

const FILING_STATUS: Record<string,{label:string;color:string;bg:string;icon:string}> = {
  DRAFT:     { label:'Brouillon',  color:'#4A6A9A', bg:'rgba(74,106,154,0.10)',  icon:'✏️' },
  PREPARED:  { label:'Préparée',   color:'#003DA5', bg:'rgba(0,61,165,0.10)',    icon:'📋' },
  SUBMITTED: { label:'Soumise',    color:'#7C3AED', bg:'rgba(124,58,237,0.10)', icon:'📤' },
  ACCEPTED:  { label:'Acceptée',   color:'#059669', bg:'rgba(5,150,105,0.10)',   icon:'✅' },
  REJECTED:  { label:'Rejetée',    color:'#DC2626', bg:'rgba(220,38,38,0.10)',   icon:'❌' },
  AMENDED:   { label:'Modifiée',   color:'#B45309', bg:'rgba(180,83,9,0.10)',    icon:'🔄' },
}

const P_COLOR: Record<string,string> = {
  OPEN:'#003DA5', FILED:'#059669', ACCEPTED:'#059669', CLOSED:'#4A6A9A', READY_TO_FILE:'#7C3AED',
}

export default function TaxPage() {
  const { profile } = useDriverProfile()
  const [tab, setTab] = useState('dashboard')
  const [data, setData] = useState<TaxData|null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const t = getThemeTokens(dark)

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const sb = getSupabaseBrowserClient()
      const { data:{ session } } = await sb.auth.getSession()
      if (!session?.access_token) throw new Error('Non authentifié')
      const res = await fetch('/api/tax', { headers:{ Authorization:`Bearer ${session.access_token}` } })
      const json = await res.json() as { success:boolean; data:TaxData; error?:string }
      if (!json.success) throw new Error(json.error)
      setData(json.data)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const f      = data?.fiscal
  const period = data?.currentPeriod
  const filing = data?.currentFiling
  const daysUntil = (d:string) => Math.ceil((new Date(d).getTime()-Date.now())/86400000)
  const urgent    = period ? daysUntil(period['filing_due_date']??'') < 30 : false
  const filingStatus = FILING_STATUS[filing?.['filing_status']??'DRAFT'] ?? FILING_STATUS['DRAFT']!

  // ── Shared card style helper ──────────────────────────────
  const cs = cardStyle(t)

  const rowStyle = (idx:number):React.CSSProperties => ({
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'10px 0', borderTop: idx > 0 ? `1px solid ${t.border}` : 'none',
  })

  return (
    <AppShell>
      {/* Header */}
      <div style={{ padding:'16px 16px 0', borderBottom:`1px solid ${t.border}`, paddingBottom:12 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:800, color:t.text, margin:0, letterSpacing:'-0.01em' }}>Fiscalité & Déclarations</h1>
            <p style={{ fontSize:10, color:t.text3, margin:'3px 0 0' }}>
              {period ? `${period['period_start']} → ${period['period_end']}` : 'Aucune période active'} · TPS/TVQ · Québec
            </p>
          </div>
          <button onClick={() => void load()} style={{ padding:8, borderRadius:12, background:t.card, border:`1.5px solid ${t.border}`, cursor:'pointer' }}>
            <RefreshCw size={14} color={loading ? t.accent : t.text3} style={loading?{animation:'spin 1s linear infinite'}:undefined} />
          </button>
        </div>
        {/* Pipeline */}
        <div style={{ display:'flex', alignItems:'center', gap:4, overflowX:'auto', paddingBottom:2 }}>
          {['Activité','Transaction','Revenue Ledger','Fiscal Engine','Déclaration','Revenu QC'].map((s, i, arr) => (
            <span key={s} style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
              <span style={{ fontSize:8, padding:'2px 6px', borderRadius:4, fontWeight:700, background: i===arr.length-1 ? 'rgba(0,61,165,0.12)' : (dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)'), color: i===arr.length-1 ? t.accent : t.text3 }}>{s}</span>
              {i < arr.length-1 && <span style={{ fontSize:8, color:t.text3 }}>→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, padding:'8px 12px', overflowX:'auto', borderBottom:`1px solid ${t.border}` }}>
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            flexShrink:0, display:'flex', alignItems:'center', gap:4,
            padding:'7px 12px', borderRadius:10, fontSize:10, fontWeight:700, border:'none', cursor:'pointer', transition:'all 0.15s',
            background: tab===tb.key ? '#003DA5' : (dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)'),
            color: tab===tb.key ? '#FFFFFF' : t.text3,
            boxShadow: tab===tb.key ? '0 4px 12px rgba(0,61,165,0.30)' : 'none',
          }}>
            <span>{tb.emoji}</span>{tb.label}
          </button>
        ))}
      </div>

      <div style={{ padding:'16px 16px 32px', display:'flex', flexDirection:'column', gap:14 }}>
        {loading && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 0' }}>
            <TaximetreGovLoader message="Moteur fiscal en cours…" />
          </div>
        )}
        {error && (
          <div style={{ ...cs, padding:'20px 16px', textAlign:'center', borderColor:'rgba(220,38,38,0.30)' }}>
            <p style={{ fontSize:13, color:t.red, marginBottom:12 }}>{error}</p>
            <button onClick={() => void load()} style={{ padding:'9px 20px', borderRadius:12, background:'#003DA5', color:'white', fontWeight:700, border:'none', cursor:'pointer', fontSize:12 }}>
              Réessayer
            </button>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Avertissement */}
            <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', borderRadius:12, background:'rgba(180,83,9,0.08)', border:'1.5px solid rgba(180,83,9,0.25)' }}>
              <AlertTriangle size={13} color={t.amber} style={{ flexShrink:0, marginTop:1 }} />
              <p style={{ fontSize:9, color:t.amber, margin:0, flex:1 }}>{data.avertissement}</p>
              {data.mode_pilote && <span style={{ fontSize:8, padding:'2px 7px', borderRadius:20, background:'rgba(180,83,9,0.20)', color:t.amber, fontWeight:800, letterSpacing:'0.08em' }}>PILOTE</span>}
            </div>

            {!data.hasAccount && (
              <div style={{ ...cs, padding:'32px 16px', textAlign:'center' }}>
                <Shield size={32} color={t.text3} style={{ margin:'0 auto 12px', display:'block' }} />
                <p style={{ fontSize:14, fontWeight:700, color:t.text, margin:'0 0 6px' }}>Aucun compte fiscal configuré</p>
                <p style={{ fontSize:11, color:t.text3, margin:0 }}>Lancez le seed fiscal pour initialiser les données.</p>
              </div>
            )}

            {data.hasAccount && (
              <>
                {/* ── TABLEAU DE BORD ── */}
                {tab === 'dashboard' && (
                  <>
                    {/* Solde */}
                    <div style={{ borderRadius:20, background: f&&f.solde_total>0 ? 'linear-gradient(135deg,#B45309 0%,#92400E 100%)' : 'linear-gradient(135deg,#059669 0%,#065F46 100%)', padding:'20px 18px', boxShadow:'0 8px 28px rgba(0,0,0,0.20)', textAlign:'center', position:'relative', overflow:'hidden' }}>
                      <div style={{ position:'absolute', top:-10, right:8, fontSize:100, color:'rgba(255,255,255,0.05)', pointerEvents:'none' }}>⚜</div>
                      <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.14em', color:'rgba(255,255,255,0.60)', textTransform:'uppercase', marginBottom:6 }}>
                        SOLDE {f?.is_estimate ? 'ESTIMÉ' : 'CALCULÉ'} · {period ? `Q${Math.ceil(new Date(period['period_start']!).getMonth()/3)} ${new Date(period['period_start']!).getFullYear()}` : '—'}
                      </div>
                      <div style={{ fontSize:44, fontWeight:900, color:'#FFFFFF', letterSpacing:'-0.03em', lineHeight:1, marginBottom:8 }}>
                        {money(f?.solde_total ?? 0)}
                      </div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.60)' }}>TPS {money(f?.tps_balance??0)} · TVQ {money(f?.tvq_balance??0)}</div>
                      {period && <div style={{ marginTop:8, fontSize:11, fontWeight:700, color: urgent ? '#FCA5A5' : 'rgba(255,255,255,0.80)' }}>
                        {urgent ? '🔴' : '📅'} Échéance: {period['filing_due_date']} ({daysUntil(period['filing_due_date']!)}j)
                      </div>}
                    </div>

                    {/* Compte fiscal */}
                    <div style={{ ...cs, padding:'16px' }}>
                      <SectionTitle title="Mon dossier fiscal" t={t} />
                      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                        <div style={{ width:44, height:44, borderRadius:13, background:'rgba(0,61,165,0.10)', border:`1px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🏛️</div>
                        <div>
                          <div style={{ fontSize:14, fontWeight:700, color:t.text }}>{profile?.first_name} {profile?.last_name}</div>
                          <div style={{ fontSize:10, color:t.green, marginTop:2 }}>TPS: {data.taxAccount?.['tps_status']} · TVQ: {data.taxAccount?.['tvq_status']}</div>
                          <div style={{ fontSize:9, color:t.text3, marginTop:1 }}>Déclaration {data.taxAccount?.['filing_frequency']?.toLowerCase()}</div>
                        </div>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                        {[
                          { label:'No. TPS', val:data.taxAccount?.['tps_registration_masked']??'—' },
                          { label:'No. TVQ', val:data.taxAccount?.['tvq_registration_masked']??'—' },
                          { label:'Statut',  val:data.taxAccount?.['tax_account_status']??'—' },
                          { label:'Règle',   val:`${data.ruleSet?.['version']??'—'}` },
                        ].map(r => (
                          <div key={r.label} style={{ background: dark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)', borderRadius:10, padding:'9px 10px', border:`1px solid ${t.border}` }}>
                            <div style={{ fontSize:9, color:t.text3, marginBottom:3, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{r.label}</div>
                            <div style={{ fontSize:12, fontWeight:700, color:t.text }}>{r.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Filing status */}
                    <div style={{ ...cs, padding:'14px 16px', borderLeft:`4px solid ${filingStatus.color}`, background:`color-mix(in srgb, ${filingStatus.bg}, transparent)` }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div>
                          <div style={{ fontSize:9, color:t.text3, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Déclaration courante</div>
                          <div style={{ fontSize:14, fontWeight:700, color:filingStatus.color }}>{filingStatus.icon} {filingStatus.label}</div>
                          {filing?.['government_reference'] && <div style={{ fontSize:9, color:t.text3, marginTop:4, fontFamily:'monospace' }}>{filing['government_reference']}</div>}
                        </div>
                        <button onClick={() => setTab('declaration')} style={{ fontSize:11, fontWeight:700, color:t.accent, background:'none', border:'none', cursor:'pointer' }}>Voir →</button>
                      </div>
                    </div>

                    {/* Revenus par source */}
                    <div style={{ ...cs, padding:'14px 16px' }}>
                      <SectionTitle title="Revenus imposables" t={t} />
                      {[
                        { label:'Taxi',      val:parseFloat(period?.['gross_revenue_taxi']??'0'),      icon:'🚕' },
                        { label:'Rideshare', val:parseFloat(period?.['gross_revenue_rideshare']??'0'), icon:'🚗' },
                        { label:'Livraison', val:parseFloat(period?.['gross_revenue_delivery']??'0'),  icon:'📦' },
                        { label:'Autres',    val:parseFloat(period?.['gross_revenue_other']??'0'),     icon:'💼' },
                      ].filter(r => r.val > 0).map((r, idx) => (
                        <div key={r.label} style={rowStyle(idx)}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <span>{r.icon}</span>
                            <span style={{ fontSize:13, color:t.text }}>{r.label}</span>
                          </div>
                          <span style={{ fontSize:14, fontWeight:700, color:t.green }}>{money(r.val)}</span>
                        </div>
                      ))}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:10, marginTop:4, borderTop:`2px solid ${t.border}` }}>
                        <span style={{ fontSize:13, fontWeight:700, color:t.text }}>Total brut</span>
                        <span style={{ fontSize:18, fontWeight:900, color:t.text }}>{money(f?.gross_revenue_taxable??0)}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* ── CALCULATEUR ── */}
                {tab === 'calculator' && (
                  <div style={{ ...cs, padding:'16px' }}>
                    <SectionTitle title={`Calculateur fiscal · ${f?.is_estimate ? 'Revenue Ledger' : 'tax_calculations'}`} t={t} />
                    <div style={{ background: dark?'rgba(0,0,0,0.25)':'rgba(0,61,165,0.04)', borderRadius:14, padding:'14px', fontFamily:'monospace', fontSize:11, border:`1px solid ${t.border}` }}>
                      <div style={{ fontSize:9, fontWeight:800, color:t.accent, marginBottom:12, letterSpacing:'0.06em' }}>MOTEUR FISCAL TAXIMETER.GOV · {f?.is_estimate ? 'ESTIMATION' : f?.calculation_status}</div>
                      {[
                        { label:'Revenus bruts imposables',     val:money(f?.gross_revenue_taxable??0),     color:t.text },
                        { label:`TPS perçue (${f?.tps_rate})`,  val:money(f?.tps_collected??0),            color:'#7C3AED', sep:false },
                        { label:`TVQ perçue (${f?.tvq_rate})`,  val:money(f?.tvq_collected??0),            color:'#7C3AED' },
                        { label:'Crédits TPS (CTI)',            val:`− ${money(f?.tps_credits??0)}`,       color:t.green, sep:true },
                        { label:'Crédits TVQ',                  val:`− ${money(f?.tvq_credits??0)}`,       color:t.green },
                        { label:'TPS nette à remettre',         val:money(f?.tps_balance??0),              color:t.amber, sep:true },
                        { label:'TVQ nette à remettre',         val:money(f?.tvq_balance??0),              color:t.amber },
                      ].map((r, idx) => (
                        <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderTop: r.sep||idx===0 ? `1px solid ${t.border}` : 'none', marginTop: r.sep ? 4 : 0 }}>
                          <span style={{ color:t.text3, fontSize:10 }}>{r.label}</span>
                          <span style={{ fontWeight:700, color:r.color }}>{r.val}</span>
                        </div>
                      ))}
                      <div style={{ display:'flex', justifyContent:'space-between', paddingTop:12, marginTop:4, borderTop:`2px solid ${t.border}` }}>
                        <span style={{ fontSize:11, fontWeight:800, color:t.text }}>TOTAL À REMETTRE</span>
                        <span style={{ fontSize:14, fontWeight:900, color:t.amber }}>{money(f?.solde_total??0)}</span>
                      </div>
                    </div>
                    <div style={{ marginTop:10, padding:'10px 12px', borderRadius:10, background: dark?'rgba(0,0,0,0.20)':'rgba(0,0,0,0.03)', border:`1px solid ${t.border}` }}>
                      <p style={{ fontSize:9, color:t.text3, margin:0, lineHeight:1.5 }}>
                        Règle: {data.ruleSet?.['label']??'—'} · v{data.ruleSet?.['version']??'—'}<br/>
                        CTI = Crédits de taxe sur intrants estimés. Consultez un comptable pour le calcul exact.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── DÉCLARATION ── */}
                {tab === 'declaration' && (
                  <div style={{ ...cs, padding:'16px' }}>
                    <SectionTitle title="Déclaration préremplie" t={t} />
                    {period && (
                      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px', borderRadius:12, background: dark?'rgba(255,255,255,0.04)':'rgba(0,61,165,0.05)', border:`1px solid ${t.border}`, marginBottom:14 }}>
                        <span style={{ fontSize:24 }}>📅</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:t.text }}>Période: {period['period_start']} → {period['period_end']}</div>
                          <div style={{ fontSize:10, color: P_COLOR[period['period_status'] as string]??t.text3, marginTop:2 }}>
                            {period['period_status']}
                          </div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:9, color:t.text3 }}>Échéance</div>
                          <div style={{ fontSize:11, fontWeight:700, color: urgent ? t.red : t.text }}>{period['filing_due_date']}</div>
                        </div>
                      </div>
                    )}
                    <div style={{ background: dark?'rgba(0,0,0,0.25)':'rgba(0,61,165,0.04)', borderRadius:14, padding:'14px', fontFamily:'monospace', fontSize:11, border:`1px solid ${t.border}`, marginBottom:14 }}>
                      <div style={{ fontSize:9, fontWeight:800, color:t.accent, marginBottom:12, letterSpacing:'0.06em' }}>DÉCLARATION TPS/TVQ · SIMULATION · MODE PILOTE</div>
                      {[
                        { label:'Revenus bruts (case 101)',  val:money(f?.gross_revenue_taxable??0) },
                        { label:'TPS perçue (ligne 103)',    val:money(f?.tps_collected??0) },
                        { label:'TVQ perçue (ligne 205)',    val:money(f?.tvq_collected??0) },
                        { label:'CTI TPS (ligne 106)',       val:money(f?.tps_credits??0) },
                        { label:'CTI TVQ (ligne 206)',       val:money(f?.tvq_credits??0) },
                        { label:'TPS nette (ligne 109)',     val:money(f?.tps_balance??0) },
                        { label:'TVQ nette (ligne 210)',     val:money(f?.tvq_balance??0) },
                      ].map((r, idx) => (
                        <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${t.border}` }}>
                          <span style={{ color:t.text3, fontSize:10 }}>{r.label}</span>
                          <span style={{ fontWeight:700, color:t.text }}>{r.val}</span>
                        </div>
                      ))}
                      <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, marginTop:4 }}>
                        <span style={{ fontWeight:800, color:t.amber, fontSize:11 }}>MONTANT ESTIMÉ À REMETTRE</span>
                        <span style={{ fontWeight:900, color:t.amber, fontSize:14 }}>{money(f?.solde_total??0)}</span>
                      </div>
                    </div>
                    <a href={data.revenu_quebec_url} target="_blank" rel="noopener noreferrer" style={{
                      display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                      padding:'13px', borderRadius:14, background:'#003DA5', color:'white',
                      fontWeight:700, fontSize:13, textDecoration:'none',
                      boxShadow:'0 4px 16px rgba(0,61,165,0.35)',
                    }}>
                      <ExternalLink size={16} />
                      Accéder à mon dossier Revenu Québec
                    </a>
                    <p style={{ fontSize:9, color:t.text3, textAlign:'center', marginTop:8 }}>TAXIMETER.GOV ne demande jamais vos identifiants Revenu Québec</p>
                  </div>
                )}

                {/* ── PAIEMENT ── */}
                {tab === 'pay' && (
                  <>
                    <div style={{ borderRadius:20, background: urgent ? 'linear-gradient(135deg,#DC2626 0%,#991B1B 100%)' : 'linear-gradient(135deg,#B45309 0%,#92400E 100%)', padding:'20px 18px', textAlign:'center', boxShadow:'0 8px 28px rgba(0,0,0,0.20)' }}>
                      <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.14em', color:'rgba(255,255,255,0.60)', textTransform:'uppercase', marginBottom:6 }}>MONTANT {f?.is_estimate?'ESTIMÉ':'CALCULÉ'} À PAYER</div>
                      <div style={{ fontSize:44, fontWeight:900, color:'#FFFFFF', letterSpacing:'-0.03em', lineHeight:1, marginBottom:8 }}>{money(f?.solde_total??0)}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.60)' }}>TPS {money(f?.tps_balance??0)} · TVQ {money(f?.tvq_balance??0)}</div>
                      {period && <div style={{ marginTop:8, fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>Échéance: {period['filing_due_date']} · {daysUntil(period['filing_due_date']!)} jours</div>}
                    </div>
                    <div style={{ ...cs, padding:'14px 16px' }}>
                      <SectionTitle title="Workflow paiement" t={t} />
                      {['Paiement initié','Paiement confirmé','Rapprochement','Ledger fiscal','Historique'].map((s, i) => (
                        <div key={s} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom: i < 4 ? `1px solid ${t.border}` : 'none' }}>
                          <div style={{ width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, flexShrink:0, background: i===0 ? 'rgba(180,83,9,0.15)' : (dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)'), color: i===0 ? t.amber : t.text3 }}>{i+1}</div>
                          <span style={{ fontSize:12, color: i===0 ? t.amber : t.text3 }}>{s}</span>
                        </div>
                      ))}
                    </div>
                    <a href={data.revenu_quebec_url} target="_blank" rel="noopener noreferrer" style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'16px', borderRadius:16, background:'#003DA5', color:'white',
                      fontWeight:700, textDecoration:'none', boxShadow:'0 4px 16px rgba(0,61,165,0.35)',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <span style={{ fontSize:24 }}>🏛️</span>
                        <div>
                          <div style={{ fontSize:13 }}>Payer sur Revenu Québec</div>
                          <div style={{ fontSize:10, color:'rgba(255,255,255,0.60)', marginTop:2 }}>Mon dossier · Paiement officiel</div>
                        </div>
                      </div>
                      <ExternalLink size={18} />
                    </a>
                    <p style={{ fontSize:9, color:t.text3, textAlign:'center', margin:0 }}>Aucune confirmation de paiement ne sera fabriquée · Mode pilote</p>
                  </>
                )}

                {/* ── HISTORIQUE ── */}
                {tab === 'history' && (
                  <>
                    <SectionTitle title="Toutes mes déclarations" t={t} />
                    {data.allFilings.length === 0 ? (
                      <div style={{ ...cs, padding:'32px 0', textAlign:'center' }}>
                        <div style={{ fontSize:11, color:t.text3 }}>Aucune déclaration encore.</div>
                      </div>
                    ) : (
                      <div style={{ ...cs, overflow:'hidden' }}>
                        {data.allFilings.map((f2, idx) => {
                          const st = FILING_STATUS[f2['filing_status']??'DRAFT'] ?? FILING_STATUS['DRAFT']!
                          const p2 = data.allPeriods.find(p3 => p3['id'] === f2['tax_period_id'])
                          return (
                            <div key={f2['id']} style={{ padding:'12px 14px', borderTop: idx>0 ? `1px solid ${t.border}` : 'none', borderLeft:`3px solid ${st.color}` }}>
                              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                                <div>
                                  <div style={{ fontSize:13, fontWeight:700, color:st.color }}>{st.icon} {st.label}</div>
                                  <div style={{ fontSize:10, color:t.text3, marginTop:2 }}>{p2 ? `${p2['period_start']} → ${p2['period_end']}` : '—'}</div>
                                  {f2['government_reference'] && <div style={{ fontSize:9, color:t.text3, marginTop:2, fontFamily:'monospace' }}>{f2['government_reference']}</div>}
                                  {f2['accepted_at'] && <div style={{ fontSize:9, color:t.green, marginTop:2 }}>✓ Acceptée: {new Date(f2['accepted_at']).toLocaleDateString('fr-CA')}</div>}
                                </div>
                                <div style={{ fontSize:9, color:t.text3 }}>{f2['filing_type']}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <SectionTitle title="Toutes les périodes" t={t} />
                    <div style={{ ...cs, overflow:'hidden' }}>
                      {data.allPeriods.map((p3, idx) => (
                        <div key={p3['id']} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', borderTop: idx>0 ? `1px solid ${t.border}` : 'none' }}>
                          <div>
                            <div style={{ fontSize:12, fontWeight:700, color:t.text }}>{p3['period_start']} → {p3['period_end']}</div>
                            <div style={{ fontSize:10, color: P_COLOR[p3['period_status'] as string]??t.text3, marginTop:2 }}>{p3['period_status']}</div>
                          </div>
                          <div style={{ textAlign:'right', fontSize:10, color:t.text3 }}>
                            <div>Taxi: {money(parseFloat(p3['gross_revenue_taxi']??'0'))}</div>
                            <div>Éch.: {p3['filing_due_date']}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ── OBLIGATIONS ── */}
                {tab === 'obligations' && (
                  <>
                    <div style={{ ...cs, padding:'14px 16px' }}>
                      <SectionTitle title="Centre des obligations fiscales" t={t} />
                      <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                        {[
                          { label:'✅ Dossier fiscal configuré',  done:true,   dot:t.green, desc:'TPS/TVQ enregistrés' },
                          { label:'✅ Revenus calculés',          done:true,   dot:t.green, desc:`${money(f?.gross_revenue_taxable??0)} bruts imposables` },
                          { label:`${filing?.['filing_status']==='ACCEPTED'?'✅':'🟡'} Déclaration ${filingStatus.label}`, done:filing?.['filing_status']==='ACCEPTED', dot: filing?.['filing_status']==='ACCEPTED'?t.green:t.amber, desc:'Période courante' },
                          { label:`${urgent?'🔴':'🟡'} Déclaration à produire`,  done:false,  dot:urgent?t.red:t.amber,  desc: period ? `Échéance ${period['filing_due_date']}` : '—' },
                          { label:'🔴 Paiement à effectuer',      done:false,  dot:t.red,   desc:`${money(f?.solde_total??0)} estimé` },
                          { label:'⚪ Confirmation reçue',        done:false,  dot:t.text3, desc:'Après transmission' },
                        ].map((item, i, arr) => (
                          <div key={i} style={{ display:'flex', gap:12 }}>
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                              <div style={{ width:12, height:12, borderRadius:'50%', background:item.dot, flexShrink:0, marginTop:2 }} />
                              {i < arr.length-1 && <div style={{ width:1, flex:1, background:t.border, margin:'4px 0' }} />}
                            </div>
                            <div style={{ paddingBottom:12, paddingTop:0 }}>
                              <div style={{ fontSize:12, fontWeight:600, color:t.text }}>{item.label}</div>
                              <div style={{ fontSize:10, color:t.text3, marginTop:2 }}>{item.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Alertes */}
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {urgent && (
                        <div style={{ display:'flex', gap:12, padding:'12px 14px', borderRadius:12, background:'rgba(220,38,38,0.08)', border:'1.5px solid rgba(220,38,38,0.25)' }}>
                          <span style={{ fontSize:20 }}>🔴</span>
                          <div>
                            <div style={{ fontSize:12, fontWeight:700, color:t.red }}>Déclaration bientôt due</div>
                            <div style={{ fontSize:10, color:t.text3, marginTop:2 }}>{period?.['filing_due_date']} · {daysUntil(period?.['filing_due_date']??'')}j restants</div>
                          </div>
                        </div>
                      )}
                      {(f?.solde_total??0) > 0 && (
                        <div style={{ display:'flex', gap:12, padding:'12px 14px', borderRadius:12, background:'rgba(180,83,9,0.08)', border:'1.5px solid rgba(180,83,9,0.25)' }}>
                          <span style={{ fontSize:20 }}>🟡</span>
                          <div>
                            <div style={{ fontSize:12, fontWeight:700, color:t.amber }}>Paiement à prévoir</div>
                            <div style={{ fontSize:10, color:t.text3, marginTop:2 }}>{money(f?.solde_total??0)} estimé · TPS + TVQ</div>
                          </div>
                        </div>
                      )}
                      <div style={{ display:'flex', gap:12, padding:'12px 14px', borderRadius:12, background:'rgba(0,61,165,0.07)', border:'1.5px solid rgba(0,61,165,0.20)' }}>
                        <span style={{ fontSize:20 }}>ℹ️</span>
                        <div>
                          <div style={{ fontSize:12, fontWeight:700, color:t.accent }}>SEV 2e génération</div>
                          <div style={{ fontSize:10, color:t.text3, marginTop:2 }}>Requis depuis le 1er janvier 2026 pour transport rémunéré</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
