'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/ui'
import { useState } from 'react'
import { ChevronRight, X, ExternalLink, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { DEMO_PROVIDERS, DEMO_TRANSACTIONS, PILOT_BANNER } from '@/lib/demo-data'

// ── Design QC: bleu royal, blanc, gris léger ─────────────────
const QC_BLUE   = '#003DA5'
const QC_BLUE_L = '#EEF3FB'
const QC_GOLD   = '#F5A623'

const STATUS_CONF: Record<string,{label:string;color:string;bg:string;dot:string}> = {
  CONNECTED_DEMO:{ label:'Connecté — DEMO', color:'#059669', bg:'#ECFDF5', dot:'#059669' },
  SIMULATION:    { label:'Simulation',       color:'#92400E', bg:'#FFFBEB', dot:'#F59E0B' },
}

function StatCard({ label, value, icon, accent }: { label:string; value:string|number; icon:string; accent:string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm" style={{borderTop:`3px solid ${accent}`}}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-black" style={{color:accent}}>{value}</div>
      <div className="text-[10px] text-slate-500 font-medium mt-1">{label}</div>
    </div>
  )
}

function ProviderModal({ p, onClose }: { p: typeof DEMO_PROVIDERS[0]; onClose: ()=>void }) {
  const sc = STATUS_CONF[p.status] ?? STATUS_CONF['SIMULATION']!
  const txCount = DEMO_TRANSACTIONS.filter(t => t.provider === p.code).length
  const syncTime = p.lastSync ? new Date(p.lastSync).toLocaleTimeString('fr-CA',{hour:'2-digit',minute:'2-digit'}) : '—'

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div className="w-full max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl shadow-2xl" onClick={e=>e.stopPropagation()}>
        {/* Poignée */}
        <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto mt-4 mb-5"/>

        {/* Header fournisseur */}
        <div className="px-6 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm" style={{background:QC_BLUE_L}}>
                {p.icon}
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{p.name}</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">{p.id}</div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="w-2 h-2 rounded-full" style={{background:sc.dot}}/>
                  <span className="text-xs font-bold" style={{color:sc.color}}>{sc.label}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer">
              <X size={16} className="text-slate-500"/>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Bannière PILOTE */}
          <div className="flex items-center gap-2 p-3 rounded-xl border" style={{background:'#FFFBEB',borderColor:'#FCD34D'}}>
            <span className="text-base">⚠️</span>
            <div className="text-[10px] font-bold text-amber-800">{PILOT_BANNER}</div>
          </div>

          {/* Grille infos */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Détails de connexion</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                {label:'Type',        val:p.type},
                {label:'API',         val:p.api},
                {label:'OAuth',       val:p.oauth},
                {label:'Webhook',     val:p.webhook},
                {label:'Tx (pilote)', val:`${txCount}`},
                {label:'Qualité',     val:p.quality?`${p.quality}%`:'N/A'},
                {label:'Erreurs',     val:String(p.errorCount)},
                {label:'Sync',        val:syncTime},
              ].map(r=>(
                <div key={r.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{r.label}</div>
                  <div className="text-sm font-bold text-slate-800">{r.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Modules reliés */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Modules associés</div>
            <div className="flex flex-wrap gap-2">
              {[
                {label:'Transactions',  href:'/transactions',    icon:'💳'},
                {label:'Webhooks',      href:'/webhooks/engine', icon:'📡'},
                {label:'Réconciliation',href:'/reconciliation',  icon:'⚖️'},
              ].map(l=>(
                <a key={l.label} href={l.href}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs border transition-all hover:shadow-sm"
                  style={{background:QC_BLUE_L, color:QC_BLUE, borderColor:'#BFDBFE'}}>
                  <span>{l.icon}</span>{l.label}<ExternalLink size={10}/>
                </a>
              ))}
            </div>
          </div>

          {/* Note simulation */}
          <div className="p-3 rounded-xl border text-[10px] text-slate-500 leading-relaxed" style={{background:'#F8FAFC',borderColor:'#E2E8F0'}}>
            🏛️ Cette connexion est présentée à titre de démonstration uniquement. Aucune donnée réelle n'est échangée avec {p.name}. Une intégration officielle nécessiterait des ententes, API officielles et autorisations applicables.
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PlatformsPage() {
  const [selected, setSelected] = useState<typeof DEMO_PROVIDERS[0]|null>(null)

  const totalTx = DEMO_PROVIDERS.reduce((s,p)=>s+p.txToday,0)
  const connected = DEMO_PROVIDERS.filter(p=>p.status==='CONNECTED_DEMO').length

  return (
    <AppShell>
      {selected && <ProviderModal p={selected} onClose={()=>setSelected(null)}/>}

      {/* Header custom bleu QC */}
      <div className="px-6 pt-6 pb-4" style={{background:`linear-gradient(135deg, ${QC_BLUE} 0%, #1A56C4 100%)`}}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">⚜️</span>
              <span className="text-white/70 text-xs font-semibold tracking-widest uppercase">Gouvernement du Québec</span>
            </div>
            <h1 className="text-2xl font-black text-white">Connexions aux plateformes</h1>
            <p className="text-white/70 text-xs mt-1">Fournisseurs · Intégrations · Mode simulation · TAXIMETER.GOV</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold" style={{background:'rgba(255,255,255,0.15)',color:'white'}}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400"/>
              {connected} connecté(s)
            </div>
            <div className="px-2 py-1 rounded-lg text-[9px] font-bold" style={{background:QC_GOLD,color:'#78350F'}}>
              MODE PILOTE
            </div>
          </div>
        </div>

        {/* KPI dans le header */}
        <div className="grid grid-cols-4 gap-3 mt-5">
          {[
            {label:'Fournisseurs',   val:DEMO_PROVIDERS.length,  icon:'🔌'},
            {label:'Connectés DEMO', val:connected,               icon:'✅'},
            {label:'Simulation',     val:DEMO_PROVIDERS.length-connected, icon:'🔬'},
            {label:'Tx aujourd\'hui',val:totalTx,                 icon:'💳'},
          ].map(s=>(
            <div key={s.label} className="rounded-2xl p-3 text-center" style={{background:'rgba(255,255,255,0.12)'}}>
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xl font-black text-white">{s.val}</div>
              <div className="text-[9px] text-white/60 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-8 space-y-5 bg-slate-50 min-h-screen pt-5">
        {/* Bannière PILOTE */}
        <div className="flex items-center gap-3 p-3 rounded-xl border" style={{background:'#FFFBEB',borderColor:'#FCD34D'}}>
          <span>⚠️</span>
          <div className="text-[10px] font-bold text-amber-800">{PILOT_BANNER} · SIMULATION — AUCUNE CONNEXION FOURNISSEUR RÉELLE</div>
        </div>

        {/* Pipeline architecture */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:QC_BLUE_L}}>
              <span className="text-base">🔗</span>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Architecture d'intégration cible</div>
              <div className="text-[10px] text-slate-400">Flux d'une donnée fournisseur vers TAXIMETER.GOV</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 flex-nowrap">
            {[
              {l:'FOURNISSEUR',    bg:QC_BLUE,    tc:'white'},
              {l:'API Gateway',    bg:QC_BLUE_L,  tc:QC_BLUE},
              {l:'Auth',          bg:QC_BLUE_L,  tc:QC_BLUE},
              {l:'Validation',    bg:QC_BLUE_L,  tc:QC_BLUE},
              {l:'Webhook Engine',bg:'#EFF6FF',  tc:'#1E40AF'},
              {l:'Revenue Ledger',bg:'#F0FDF4',  tc:'#166534'},
              {l:'Moteur Fiscal', bg:'#FAF5FF',  tc:'#6B21A8'},
              {l:'Réconciliation',bg:'#FFF7ED',  tc:'#9A3412'},
              {l:'Rapport',       bg:'#F8FAFC',  tc:'#475569'},
            ].map((s,i)=>(
              <div key={s.l} className="flex items-center gap-1 shrink-0">
                {i>0&&<span className="text-slate-300 text-sm font-bold">›</span>}
                <span className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold border whitespace-nowrap" style={{background:s.bg,color:s.tc,borderColor:s.bg==='white'?'#E2E8F0':s.bg}}>
                  {s.l}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Grille fournisseurs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800">Fournisseurs partenaires (simulation)</h2>
            <span className="text-[9px] font-bold text-slate-400">Cliquer pour les détails</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {DEMO_PROVIDERS.map(p=>{
              const sc = STATUS_CONF[p.status]??STATUS_CONF['SIMULATION']!
              const txCount = DEMO_TRANSACTIONS.filter(t=>t.provider===p.code).length
              const syncTime = p.lastSync ? new Date(p.lastSync).toLocaleTimeString('fr-CA',{hour:'2-digit',minute:'2-digit'}) : '—'
              return (
                <div key={p.id} onClick={()=>setSelected(p)}
                  className="bg-white border border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    {/* Logo */}
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm" style={{background:QC_BLUE_L}}>
                      {p.icon}
                    </div>

                    {/* Info principale */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-base font-bold text-slate-900">{p.name}</span>
                        <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full" style={{background:sc.bg,color:sc.color}}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{background:sc.dot}}/>
                          {sc.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mb-2">{p.type} · {p.id}</div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1 text-[9px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                          <span className="font-bold text-slate-700">{p.api}</span> API
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                          <span className="font-bold text-slate-700">{p.webhook}</span> Webhook
                        </span>
                        {p.quality&&(
                          <span className="flex items-center gap-1 text-[9px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded-lg">
                            ✓ {p.quality}% qualité
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats droite */}
                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-slate-800">{p.txToday}</div>
                      <div className="text-[9px] text-slate-400">tx aujourd'hui</div>
                      {p.lastSync&&(
                        <div className="flex items-center gap-1 mt-2 text-[9px] text-slate-400 justify-end">
                          <RefreshCw size={9}/>{syncTime}
                        </div>
                      )}
                    </div>

                    <ChevronRight size={16} className="text-slate-300 shrink-0"/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Schéma webhook */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4" style={{background:`linear-gradient(135deg, ${QC_BLUE} 0%, #1A56C4 100%)`}}>
            <div className="text-sm font-bold text-white">Architecture Webhook — Méthode de connexion</div>
            <div className="text-[10px] text-white/70 mt-0.5">Chauffeur → Entreprise → TAXIMETER.GOV · Données synthétiques</div>
          </div>
          <div className="p-4">
            <img src="/webhook-architecture.png"
              alt="Architecture Webhook TAXIMETER.GOV — Mode Pilote"
              className="w-full h-auto rounded-xl border border-slate-100"
              style={{maxWidth:'100%',display:'block'}}/>
            <div className="mt-3 p-3 rounded-xl border text-[9px] font-bold" style={{background:'#FFFBEB',borderColor:'#FCD34D',color:'#92400E'}}>
              PILOTE · DONNÉES SYNTHÉTIQUES · Ce schéma représente l'architecture cible sous réserve des ententes, autorisations et intégrations disponibles.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
