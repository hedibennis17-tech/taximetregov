'use client'
import { AppShell } from '@/components/layout/AppShell'
import { useDriverDetail, money } from '@/lib/api'
import { useParams } from 'next/navigation'
import { RefreshCw, ArrowLeft, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const TPS=0.05; const TVQ=0.09975; const r2=(n:number)=>Math.round(n*100)/100
const fmtDate=(s:string|null)=>{ if(!s) return '—'; return new Intl.DateTimeFormat('fr-CA',{year:'numeric',month:'short',day:'numeric'}).format(new Date(s)) }

// DEMO data pour affichage si Supabase ne retourne rien
const DEMO_DETAIL: Record<string, {
  profile: { id:string; driver_number:string; first_name:string; last_name:string; email:string; status:string; identity_verification_status:string; created_at:string; city:string }
  vehicle: { make:string; model:string; year:number; color:string; plate:string; status:string; insurance_expiry:string; inspection_due:string }
  services: { name:string; icon:string; authorized:boolean; reason:string; docRequired:string }[]
  docs: { type:string; label:string; status:string; expires:string|null; number:string }[]
  revenue: { source_type:string; gross:string; tips:string; net:string; count:string }[]
  platforms: { provider:string; icon:string; status:string; lastSync:string; events:number }[]
  taxAccount: { tps_status:string; tvq_status:string; filing_frequency:string } | null
  fiscal: { brut:number; tips:number; tps:number; tvq:number; tpsCredits:number; tvqCredits:number; tpsNet:number; tvqNet:number; solde:number }
  audit: { at:string; action:string; obj:string; by:string; note:string }[]
}> = {
  'drv-demo-001': {
    profile:{ id:'drv-demo-001', driver_number:'DRV-QC-0001', first_name:'Jean', last_name:'Tremblay', email:'jean.tremblay.demo@taximetregov.qc', status:'ACTIVE', identity_verification_status:'APPROVED', created_at:'2026-01-15T09:00:00Z', city:'Montréal' },
    vehicle:{ make:'Toyota', model:'Camry', year:2022, color:'Blanc', plate:'DEMO-ABC-001', status:'ACTIVE', insurance_expiry:'2027-03-15', inspection_due:'2027-09-01' },
    services:[
      {name:'Taxi', icon:'🚕', authorized:true,  reason:'Licence valide · Assurance valide · Véhicule conforme', docRequired:'Toutes licences en règle'},
      {name:'Rideshare', icon:'🚗', authorized:true, reason:'Autorisation VTC active', docRequired:'Toutes autorisations en règle'},
      {name:'Livraison', icon:'📦', authorized:false, reason:'Permis livraison non soumis', docRequired:'Permis livraison requis'},
    ],
    docs:[
      {type:'DRIVER_LICENSE',      label:'Permis de conduire',  status:'APPROVED', expires:'2029-06-15', number:'DEMO-DL-001'},
      {type:'VEHICLE_REGISTRATION',label:'Immatriculation',     status:'APPROVED', expires:'2027-03-15', number:'DEMO-VR-001'},
      {type:'INSURANCE',           label:'Assurance',           status:'APPROVED', expires:'2027-03-15', number:'DEMO-INS-001'},
      {type:'VEHICLE_INSPECTION',  label:'Inspection mécanique',status:'APPROVED', expires:'2027-09-01', number:'DEMO-VEH-001'},
      {type:'TAXI_AUTHORIZATION',  label:'Autorisation taxi',   status:'APPROVED', expires:'2027-01-01', number:'DEMO-TAXI-001'},
    ],
    revenue:[
      {source_type:'TAXI',      gross:'17120', tips:'1712', net:'16294', count:'125'},
      {source_type:'RIDESHARE', gross:'14980', tips:'1498', net:'11984', count:'187'},
      {source_type:'DELIVERY',  gross:'10700', tips:'1070', net:'8560',  count:'0'},
    ],
    platforms:[
      {provider:'UBER',     icon:'⬛', status:'SIMULATION', lastSync:'Il y a 2h',   events:89 },
      {provider:'LYFT',     icon:'🟣', status:'SIMULATION', lastSync:'Il y a 4h',   events:67 },
      {provider:'TAXI',     icon:'🚕', status:'SIMULATION', lastSync:'Il y a 1h',   events:125},
    ],
    taxAccount:{ tps_status:'REGISTERED', tvq_status:'REGISTERED', filing_frequency:'QUARTERLY' },
    fiscal:{ brut:42800, tips:4280, tps:r2((42800+4280)*TPS), tvq:r2((42800+4280)*TVQ), tpsCredits:r2(42800*0.20*TPS), tvqCredits:r2(42800*0.20*TVQ), tpsNet:r2((42800+4280)*TPS-42800*0.20*TPS), tvqNet:r2((42800+4280)*TVQ-42800*0.20*TVQ), solde:r2(((42800+4280)*TPS-42800*0.20*TPS)+((42800+4280)*TVQ-42800*0.20*TVQ)) },
    audit:[
      {at:'2026-09-17T08:41:00Z', action:'REVENUE_LEDGER_UPDATED', obj:'RL-TAXI-DRV-QC-0001',  by:'SYSTEM',       note:'Activité taxi enregistrée'},
      {at:'2026-09-05T14:00:00Z', action:'DOCUMENT_APPROVED',      obj:'DOC-DL-DRV-QC-0001',   by:'ADMIN-GOV-01', note:'Permis de conduire vérifié et approuvé'},
      {at:'2026-01-15T09:00:00Z', action:'DRIVER_CREATED',         obj:'DRV-QC-0001',            by:'SYSTEM',       note:'Profil chauffeur créé'},
    ],
  },
}

const DOC_STATUS_CONF: Record<string,{label:string;color:string;bg:string}> = {
  APPROVED:      {label:'Approuvé',    color:'#059669', bg:'rgba(5,150,105,0.12)'},
  PENDING_REVIEW:{label:'En révision', color:'#003DA5', bg:'rgba(0,61,165,0.10)'},
  UNDER_REVIEW:  {label:'En révision', color:'#003DA5', bg:'rgba(0,61,165,0.10)'},
  REJECTED:      {label:'Rejeté',      color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
  EXPIRED:       {label:'Expiré',      color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
  UPLOADED:      {label:'Soumis',      color:'#7C3AED', bg:'rgba(124,58,237,0.12)'},
}

const TABS = ['Identité','Véhicule','Documents','Services','Revenus','Fiscalité','Plateformes','Audit'] as const
type Tab = typeof TABS[number]

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { driverDetail, loading, error, refresh } = useDriverDetail(id)
  const [tab, setTab] = useState<Tab>('Identité')

  const demo = DEMO_DETAIL[id]

  if (loading) return (
    <AppShell>
      <div className="py-20 text-center"><RefreshCw className="mx-auto animate-spin text-qc-blue" size={24}/></div>
    </AppShell>
  )

  // Use Supabase data OR DEMO fallback
  type DriverProfile = { id: string; driver_number: string; first_name: string; last_name: string; email: string; status: string; identity_verification_status: string; created_at: string }
  const profile = (driverDetail as {profile?: DriverProfile} | null)?.profile ?? demo?.profile
  if (!profile) return (
    <AppShell>
      <div className="px-6 py-8">
        <Link href="/drivers" className="flex items-center gap-2 text-xs text-qc-blue mb-4"><ArrowLeft size={12}/> Retour</Link>
        <p className="text-sm text-red-400 mb-2">Chauffeur non trouvé dans Supabase.</p>
        <p className="text-xs text-slate-400">Lancez le seed: <code className="text-blue-400">POST /api/admin/seed-pilots</code></p>
      </div>
    </AppShell>
  )

  const dd = demo ?? {
    profile, vehicle:null, services:[], docs:[], revenue:[], platforms:[], taxAccount:null,
    fiscal:{brut:0,tips:0,tps:0,tvq:0,tpsCredits:0,tvqCredits:0,tpsNet:0,tvqNet:0,solde:0},
    audit:[]
  }

  type Revenue = { source_type: string; gross: string; tips: string; net: string; count: string }
  const revenueData = (driverDetail as {revenue?: Revenue[]} | null)?.revenue ?? dd.revenue
  const totalBrut = revenueData.reduce((s: number, r: Revenue) => s + parseFloat(r.gross||'0'), 0)
  const totalTips = revenueData.reduce((s: number, r: Revenue) => s + parseFloat(r.tips||'0'), 0)

  const statusColor = profile.status === 'ACTIVE' ? 'text-green-400' : profile.status === 'SUSPENDED' ? 'text-red-400' : 'text-amber-400'
  const verifColor  = profile.identity_verification_status === 'APPROVED' ? 'text-green-400' : profile.identity_verification_status === 'UNDER_REVIEW' ? 'text-blue-400' : 'text-amber-400'

  return (
    <AppShell>
      <div className="px-4 md:px-6 pb-8">
        {/* Back */}
        <div className="flex items-center gap-3 py-4">
          <Link href="/drivers" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"><ArrowLeft size={12}/> Chauffeurs</Link>
          <span className="text-slate-700">›</span>
          <span className="text-xs text-white">{profile.first_name} {profile.last_name}</span>
        </div>

        {/* Header chauffeur */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-qc-blue flex items-center justify-center text-lg font-black text-white shrink-0">
              {profile.first_name[0]}{profile.last_name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-lg font-bold text-white">{profile.first_name} {profile.last_name}</h1>
                <span className={`text-xs font-bold ${statusColor}`}>{profile.status}</span>
                <span className={`text-[10px] font-bold ${verifColor}`}>{profile.identity_verification_status}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mb-2">{profile.driver_number} · {profile.email}</div>
              <div className="flex flex-wrap gap-2">
                {dd.services.filter(s=>s.authorized).map(s=>(
                  <span key={s.name} className="text-[9px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full font-bold">{s.icon} {s.name}</span>
                ))}
                {totalBrut>0 && <span className="text-[9px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full font-bold">{money(totalBrut)} revenus Q3</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[9px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full font-bold mb-2">PILOTE</div>
              <button onClick={refresh} className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"><RefreshCw size={11} className="text-slate-400"/></button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto mb-4">
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all" style={{
              background:tab===t?'#003DA5':'rgba(255,255,255,0.04)',
              color:tab===t?'white':'#94A3B8',
              borderColor:tab===t?'#003DA5':'rgba(255,255,255,0.08)',
            }}>{t}</button>
          ))}
        </div>

        {/* ── IDENTITÉ ── */}
        {tab==='Identité'&&(
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <div className="text-[9px] font-bold text-slate-400 uppercase mb-3">Dossier professionnel gouvernemental (DEMO)</div>
              {[
                {l:'Driver ID',         v:profile.id.slice(0,20)+'…'},
                {l:'No. chauffeur',     v:profile.driver_number},
                {l:'Nom complet',       v:`${profile.first_name} ${profile.last_name}`},
                {l:'Email',             v:profile.email},
                {l:'Statut',           v:profile.status, c:statusColor},
                {l:'Vérification',     v:profile.identity_verification_status, c:verifColor},
                {l:'Membre depuis',    v:fmtDate(profile.created_at)},
                {l:'Ville / Zone',     v:(dd.profile as {city?:string}).city||'—'},
              ].map(r=>(
                <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0">
                  <span className="text-[10px] text-slate-400">{r.l}</span>
                  <span className={`text-[10px] font-bold ${r.c||'text-white'} font-mono`}>{r.v}</span>
                </div>
              ))}
            </div>
            {/* Chaîne complète */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <div className="text-[9px] font-bold text-slate-400 uppercase mb-3">Chaîne de données TAXIMETER.GOV</div>
              <div className="flex flex-col gap-1">
                {[
                  {label:`${profile.first_name} ${profile.last_name}`, id:profile.driver_number, color:'text-blue-400'},
                  {label:'Véhicule', id:dd.vehicle?`${dd.vehicle.make} ${dd.vehicle.model} ${dd.vehicle.year}`:'—', color:'text-slate-300'},
                  {label:'Documents', id:`${dd.docs.filter(d=>d.status==='APPROVED').length}/${dd.docs.length} approuvés`, color:'text-green-400'},
                  {label:'Revenue Ledger Q3', id:money(totalBrut), color:'text-green-400'},
                  {label:'TPS estimée', id:money(r2(totalBrut*TPS)), color:'text-purple-400'},
                  {label:'TVQ estimée', id:money(r2(totalBrut*TVQ)), color:'text-purple-400'},
                ].map((item,i)=>(
                  <div key={item.label} className="flex items-center gap-2">
                    {i>0&&<div className="w-px h-3 bg-slate-700 ml-3"/>}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{item.label}:</span>
                      <span className={`text-[10px] font-bold ${item.color}`}>{item.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── VÉHICULE ── */}
        {tab==='Véhicule'&&dd.vehicle&&(
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🚗</span>
              <div>
                <div className="text-sm font-bold text-white">{dd.vehicle.year} {dd.vehicle.make} {dd.vehicle.model}</div>
                <div className="text-[10px] text-slate-400">{dd.vehicle.color} · {dd.vehicle.plate}</div>
              </div>
              <span className={`ml-auto text-[9px] px-2 py-0.5 rounded-full font-bold ${dd.vehicle.status==='ACTIVE'?'text-green-400 bg-green-500/10':'text-amber-400 bg-amber-500/10'}`}>{dd.vehicle.status}</span>
            </div>
            {[
              {l:'Assurance expiration',    v:fmtDate(dd.vehicle.insurance_expiry), c: new Date(dd.vehicle.insurance_expiry)<new Date()?'text-red-400':'text-green-400'},
              {l:'Inspection prochaine',    v:fmtDate(dd.vehicle.inspection_due), c:'text-slate-300'},
              {l:'Plaque (DEMO)',           v:dd.vehicle.plate, c:'text-slate-300'},
            ].map(r=>(
              <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-800 last:border-0">
                <span className="text-[10px] text-slate-400">{r.l}</span>
                <span className={`text-[10px] font-bold ${r.c}`}>{r.v}</span>
              </div>
            ))}
            <Link href="/vehicles" className="text-[10px] text-blue-400 flex items-center gap-1 mt-2 hover:underline">→ Voir dans Admin Véhicules</Link>
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {tab==='Documents'&&(
          <div className="space-y-2">
            {dd.docs.map(doc=>{
              const sc = DOC_STATUS_CONF[doc.status] ?? DOC_STATUS_CONF['UPLOADED']!
              const daysLeft = doc.expires ? Math.ceil((new Date(doc.expires).getTime()-Date.now())/86400000) : null
              return (
                <div key={doc.type} className="bg-slate-900 border border-slate-700 rounded-xl p-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0">📄</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-white">{doc.label}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                        {daysLeft !== null && daysLeft < 90 && <span className="text-[8px] text-amber-400 bg-amber-500/10 px-1.5 rounded-full">⏳ {daysLeft}j restants</span>}
                      </div>
                      <div className="text-[9px] text-slate-400">{doc.number} · Expire: {fmtDate(doc.expires)}</div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div className="p-2 text-[9px] text-amber-400 bg-amber-500/8 border border-amber-500/15 rounded-lg">PILOTE · Documents synthétiques · Aucun document officiel</div>
          </div>
        )}

        {/* ── SERVICES ── */}
        {tab==='Services'&&(
          <div className="space-y-2">
            {dd.services.map(s=>(
              <div key={s.name} className={`bg-slate-900 border rounded-xl p-4 ${s.authorized?'border-green-500/25':'border-amber-500/25'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-white">{s.name}</div>
                    <div className={`text-[10px] font-bold ${s.authorized?'text-green-400':'text-amber-400'}`}>{s.authorized?'✓ Autorisé':'⚠ Non autorisé'}</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-300 mt-1">{s.reason}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">Requis: {s.docRequired}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── REVENUS ── */}
        {tab==='Revenus'&&(
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                {l:'Brut Q3', v:money(totalBrut), c:'text-green-400', bg:'bg-green-500/8'},
                {l:'Pourboires', v:money(totalTips), c:'', bg:'bg-yellow-500/8', style:{color:'#F5C842'}},
                {l:'Activités', v:revenueData.reduce((s: number,r: Revenue)=>s+parseInt(r.count||'0'),0).toString(), c:'text-blue-400', bg:'bg-blue-500/8'},
              ].map(s=>(
                <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center border border-white/5`}>
                  <div className="text-sm font-black" style={(s as {style?:object}).style}>{s.v}</div>
                  <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
                </div>
              ))}
            </div>
            {revenueData.map((r: Revenue)=>(
              <div key={r.source_type} className="bg-slate-900 border border-slate-700 rounded-xl p-3">
                <div className="flex justify-between mb-2">
                  <div className="text-xs font-bold text-white">
                    {r.source_type==='TAXI'?'🚕':r.source_type==='RIDESHARE'?'🚗':'📦'} {r.source_type}
                  </div>
                  <div className="text-xs font-black text-green-400">{money(parseFloat(r.gross))}</div>
                </div>
                {[
                  {l:'Pourboires', v:money(parseFloat(r.tips))},
                  {l:'Net', v:money(parseFloat(r.net))},
                  {l:'Activités', v:r.count},
                ].map(row=>(
                  <div key={row.l} className="flex justify-between text-[10px] py-1 border-t border-slate-800">
                    <span className="text-slate-400">{row.l}</span><span className="text-white font-bold">{row.v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── FISCALITÉ ── */}
        {tab==='Fiscalité'&&(
          <div className="space-y-3">
            <div className="p-2.5 text-[9px] text-amber-400 bg-amber-500/8 border border-amber-500/20 rounded-lg">ESTIMATION · MODE PILOTE · À VALIDER AVANT TOUTE TRANSMISSION OFFICIELLE</div>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <div className="text-[9px] font-bold text-slate-400 uppercase mb-3">Calcul TPS/TVQ — Q3 2026 (pilote)</div>
              {[
                {l:'Revenus bruts',               v:money(dd.fiscal.brut),        c:'text-white'},
                {l:'+ Pourboires taxables',        v:money(dd.fiscal.tips),        c:'#F5C842'},
                {l:'= Base taxable',               v:money(dd.fiscal.brut+dd.fiscal.tips), c:'text-green-400'},
                {l:'TPS collectée (5%)',           v:money(dd.fiscal.tps),         c:'text-purple-400'},
                {l:'TVQ collectée (9,975%)',       v:money(dd.fiscal.tvq),         c:'text-purple-400'},
                {l:'Crédits TPS (CTI ~20% frais)',v:`− ${money(dd.fiscal.tpsCredits)}`, c:'text-slate-400'},
                {l:'Crédits TVQ (CTI ~20% frais)',v:`− ${money(dd.fiscal.tvqCredits)}`, c:'text-slate-400'},
                {l:'TPS NETTE À REMETTRE',         v:money(dd.fiscal.tpsNet),      c:'text-purple-300'},
                {l:'TVQ NETTE À REMETTRE',         v:money(dd.fiscal.tvqNet),      c:'text-purple-300'},
                {l:'SOLDE TOTAL ESTIMÉ',           v:money(dd.fiscal.solde),       c:'text-green-300'},
              ].map((r,i)=>(
                <div key={r.l} className={`flex justify-between py-1.5 ${i>0?'border-t border-slate-800':''}`}>
                  <span className="text-[10px] text-slate-400">{r.l}</span>
                  <span className={`text-[10px] font-bold ${r.c.startsWith('#')?'':r.c}`} style={r.c.startsWith('#')?{color:r.c}:{}}>{r.v}</span>
                </div>
              ))}
            </div>
            <Link href="/tax/center" className="block text-center text-[10px] text-blue-400 hover:underline">→ Voir Centre Fiscal Gouvernemental</Link>
          </div>
        )}

        {/* ── PLATEFORMES ── */}
        {tab==='Plateformes'&&(
          <div className="space-y-2">
            <div className="p-2.5 text-[9px] text-amber-400 bg-amber-500/8 border border-amber-500/20 rounded-lg">SIMULATION — AUCUNE CONNEXION RÉELLE AUX PLATEFORMES</div>
            {dd.platforms.map(p=>(
              <div key={p.provider} className="bg-slate-900 border border-slate-700 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white">{p.provider}</div>
                    <div className="text-[9px] text-slate-400">Dernière sync: {p.lastSync} · {p.events} événements</div>
                  </div>
                  <span className="text-[9px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold">{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── AUDIT ── */}
        {tab==='Audit'&&(
          <div className="space-y-2">
            {dd.audit.map((a,i)=>(
              <div key={i} className="bg-slate-900 border border-slate-700 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0">📋</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-bold text-white">{a.action}</span>
                      <span className="text-[8px] text-blue-400 bg-blue-500/10 px-1.5 rounded-full">{a.by}</span>
                    </div>
                    <div className="text-[9px] text-slate-400">{a.obj} · {new Date(a.at).toLocaleString('fr-CA')}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">{a.note}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
