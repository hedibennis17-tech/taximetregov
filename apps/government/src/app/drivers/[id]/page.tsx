'use client'
import { AppShell } from '@/components/layout/AppShell'
import { useDriverDetail, money } from '@/lib/api'
import { useParams } from 'next/navigation'
import { RefreshCw, ArrowLeft, CheckCircle, Clock, XCircle, Shield, Car, FileText, Activity, CreditCard, Receipt, BarChart2, Link2, AlertTriangle, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const TPS=0.05; const TVQ=0.09975; const r2=(n:number)=>Math.round(n*100)/100
const money2 = (n:number) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(n)
const fmtDate=(s:string|null)=>{ if(!s) return '—'; return new Intl.DateTimeFormat('fr-CA',{year:'numeric',month:'short',day:'numeric'}).format(new Date(s)) }
const PILOT = 'PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE TRANSMISSION OFFICIELLE'

// ── DONNÉES DEMO COMPLÈTES ────────────────────────────────────
const DEMO_PROFILES: Record<string, {
  profile: { id:string; driver_number:string; first_name:string; last_name:string; email:string; phone:string; status:string; identity_verification_status:string; created_at:string; city:string; address:string; compliance:string; compliance_pct:number }
  vehicles: { id:string; make:string; model:string; year:number; color:string; plate:string; vin:string; type:string; fuel:string; status:string; insurance_exp:string; inspection_exp:string; primary:boolean; admissibility:{taxi:boolean;vtc:boolean;delivery:boolean} }[]
  licenses: { id:string; type:string; number:string; org:string; issued:string; expires:string; status:string }[]
  documents: { id:string; type:string; label:string; status:string; issued:string; expires:string|null; version:number; verifiedBy:string|null; verifiedAt:string|null; note:string|null }[]
  services: { name:string; icon:string; authorized:boolean; reason:string; requiredDocs:string[] }[]
  activities: { id:string; service:string; date:string; origin:string; destination:string; dist:string; duration:string; amount:number; tip:number; status:string }[]
  platforms: { provider:string; icon:string; status:string; lastSync:string; events:number; lastTx:string }[]
  fiscal: { brut:number; tips:number; tps:number; tvq:number; tpsCredits:number; tvqCredits:number; tpsNet:number; tvqNet:number; solde:number }
  audit: { at:string; action:string; obj:string; by:string; note:string }[]
}> = {
  'drv-demo-001': {
    profile:{ id:'drv-demo-001', driver_number:'DRV-QC-0001', first_name:'Jean', last_name:'Tremblay', email:'jean.tremblay.demo@taximetregov.qc', phone:'(514) 555-0101', status:'ACTIVE', identity_verification_status:'APPROVED', created_at:'2026-01-15T09:00:00Z', city:'Montréal', address:'123 Rue Principale, Montréal, QC H2X 1A1 (DEMO)', compliance:'CONFORME', compliance_pct:100 },
    vehicles:[
      { id:'veh-demo-001', make:'Toyota', model:'Camry', year:2022, color:'Blanc', plate:'DEMO-ABC-001', vin:'DEMO-1VIN-0000001', type:'BERLINE', fuel:'GASOLINE', status:'ACTIVE', insurance_exp:'2027-03-15', inspection_exp:'2027-09-01', primary:true, admissibility:{taxi:true,vtc:true,delivery:false} },
    ],
    licenses:[
      { id:'lic-demo-001', type:'TAXI',     number:'LIC-TAXI-QC-0001', org:'Commission des transports du Québec (DEMO)', issued:'2024-01-15', expires:'2027-01-15', status:'VALID' },
      { id:'lic-demo-002', type:'VTC',      number:'LIC-VTC-QC-0001',  org:'Autorité régionale de transport métropolitain (DEMO)', issued:'2024-02-01', expires:'2027-02-01', status:'VALID' },
    ],
    documents:[
      { id:'doc-demo-001', type:'DRIVER_LICENSE',       label:'Permis de conduire',     status:'APPROVED', issued:'2020-06-15', expires:'2029-06-15', version:1, verifiedBy:'Admin GOV-01', verifiedAt:'2026-01-20T10:00:00Z', note:'Permis classe 5 — vérifié et conforme' },
      { id:'doc-demo-002', type:'VEHICLE_REGISTRATION', label:'Immatriculation véhicule',status:'APPROVED', issued:'2022-03-15', expires:'2027-03-15', version:1, verifiedBy:'Admin GOV-01', verifiedAt:'2026-01-20T10:30:00Z', note:null },
      { id:'doc-demo-003', type:'INSURANCE',            label:'Assurance automobile',   status:'APPROVED', issued:'2026-03-15', expires:'2027-03-15', version:2, verifiedBy:'Admin GOV-02', verifiedAt:'2026-03-18T09:00:00Z', note:'Renouvellée mars 2026 — V2' },
      { id:'doc-demo-004', type:'VEHICLE_INSPECTION',   label:'Inspection mécanique',   status:'APPROVED', issued:'2025-09-01', expires:'2027-09-01', version:1, verifiedBy:'Admin GOV-01', verifiedAt:'2025-09-05T14:00:00Z', note:null },
      { id:'doc-demo-005', type:'TAXI_AUTHORIZATION',   label:'Autorisation taxi',       status:'APPROVED', issued:'2024-01-20', expires:'2027-01-20', version:1, verifiedBy:'Admin GOV-01', verifiedAt:'2024-01-22T11:00:00Z', note:null },
    ],
    services:[
      { name:'Taxi',      icon:'🚕', authorized:true,  reason:'Licence taxi valide · Assurance valide · Véhicule conforme · Inspection à jour',    requiredDocs:['Permis','Immatriculation','Assurance','Inspection','Autorisation taxi'] },
      { name:'VTC / Rideshare', icon:'🚗', authorized:true, reason:'Autorisation VTC active · Tous les documents sont conformes',                  requiredDocs:['Permis','Assurance','Autorisation VTC'] },
      { name:'Livraison', icon:'📦', authorized:false, reason:'Permis livraison non soumis',                                                       requiredDocs:['Permis livraison requis'] },
    ],
    activities:[
      { id:'act-demo-001', service:'TAXI', date:'2026-09-17T08:30:00Z', origin:'Montréal-Nord (DEMO)', destination:'Aéroport YUL (DEMO)', dist:'22 km', duration:'28 min', amount:38.50, tip:4.00, status:'COMPLETED' },
      { id:'act-demo-002', service:'TAXI', date:'2026-09-17T06:15:00Z', origin:'Plateau-Mont-Royal (DEMO)', destination:'Centre-ville (DEMO)', dist:'4.8 km', duration:'12 min', amount:18.75, tip:2.00, status:'COMPLETED' },
      { id:'act-demo-003', service:'RIDESHARE', date:'2026-09-16T21:30:00Z', origin:'Quartier des spectacles (DEMO)', destination:'Laval (DEMO)', dist:'18 km', duration:'25 min', amount:32.00, tip:3.00, status:'COMPLETED' },
      { id:'act-demo-004', service:'TAXI', date:'2026-09-16T18:10:00Z', origin:'Côte-Saint-Luc (DEMO)', destination:'Rosemont (DEMO)', dist:'9 km', duration:'20 min', amount:24.50, tip:0, status:'COMPLETED' },
    ],
    platforms:[
      { provider:'UBER',  icon:'⬛', status:'SIMULATION', lastSync:'Il y a 2h',  events:89,  lastTx:'TX-DEMO-1001' },
      { provider:'LYFT',  icon:'🟣', status:'SIMULATION', lastSync:'Il y a 4h',  events:67,  lastTx:'TX-DEMO-1006' },
      { provider:'TAXI',  icon:'🚕', status:'SIMULATION', lastSync:'Il y a 1h',  events:125, lastTx:'TX-DEMO-1011' },
    ],
    fiscal:{ brut:42800, tips:4280, tps:r2((42800+4280)*TPS), tvq:r2((42800+4280)*TVQ), tpsCredits:r2(42800*0.20*TPS), tvqCredits:r2(42800*0.20*TVQ), tpsNet:r2((42800+4280)*TPS-42800*0.20*TPS), tvqNet:r2((42800+4280)*TVQ-42800*0.20*TVQ), solde:r2(((42800+4280)*TPS-42800*0.20*TPS)+((42800+4280)*TVQ-42800*0.20*TVQ)) },
    audit:[
      { at:'2026-09-17T08:41:00Z', action:'ACTIVITY_CREATED',   obj:'ACT-DEMO-001',         by:'SYSTEM',       note:'Course taxi Montréal-Nord → YUL' },
      { at:'2026-09-17T06:15:00Z', action:'ACTIVITY_CREATED',   obj:'ACT-DEMO-002',         by:'SYSTEM',       note:'Course taxi Plateau → Centre-ville' },
      { at:'2026-03-18T09:00:00Z', action:'DOCUMENT_APPROVED',  obj:'DOC-demo-003 (INS v2)', by:'Admin GOV-02', note:'Assurance renouvelée — approuvée' },
      { at:'2026-01-20T10:30:00Z', action:'DOCUMENT_APPROVED',  obj:'DOC-demo-002 (VR)',     by:'Admin GOV-01', note:'Immatriculation approuvée' },
      { at:'2026-01-20T10:00:00Z', action:'DOCUMENT_APPROVED',  obj:'DOC-demo-001 (DL)',     by:'Admin GOV-01', note:'Permis de conduire approuvé' },
      { at:'2026-01-15T09:00:00Z', action:'DRIVER_CREATED',     obj:'DRV-QC-0001',          by:'SYSTEM',       note:'Profil chauffeur créé — inscription pilote' },
    ],
  },
}

// Fallback pour les autres IDs DEMO
const DEMO_FALLBACK = {
  'drv-demo-002': {fn:'Marie',  ln:'Gagnon',   num:'DRV-QC-0002', status:'ACTIVE',    verif:'APPROVED', brut:38600, city:'Laval'},
  'drv-demo-003': {fn:'Karim',  ln:'Hassan',   num:'DRV-QC-0003', status:'ACTIVE',    verif:'APPROVED', brut:29400, city:'Montréal'},
  'drv-demo-004': {fn:'Sophie', ln:'Martin',   num:'DRV-QC-0004', status:'PENDING',   verif:'PENDING',  brut:0,     city:'Longueuil'},
  'drv-demo-005': {fn:'Ali',    ln:'Bouchard', num:'DRV-QC-0005', status:'PENDING',   verif:'PENDING',  brut:0,     city:'Québec City'},
  'drv-demo-006': {fn:'Nadia',  ln:'Patel',    num:'DRV-QC-0006', status:'ACTIVE',    verif:'APPROVED', brut:31200, city:'Brossard'},
  'drv-demo-007': {fn:'Marc',   ln:'Leblanc',  num:'DRV-QC-0007', status:'SUSPENDED', verif:'APPROVED', brut:12400, city:'Montréal'},
  'drv-demo-008': {fn:'Amira',  ln:'Tremblay', num:'DRV-QC-0008', status:'ACTIVE',    verif:'UNDER_REVIEW', brut:18700, city:'Laval'},
}

const DOC_STATUS: Record<string,{label:string;color:string;bg:string}> = {
  APPROVED:      {label:'Approuvé',    color:'#059669', bg:'rgba(5,150,105,0.12)'},
  PENDING_REVIEW:{label:'En révision', color:'#003DA5', bg:'rgba(0,61,165,0.10)'},
  UNDER_REVIEW:  {label:'En révision', color:'#003DA5', bg:'rgba(0,61,165,0.10)'},
  REJECTED:      {label:'Rejeté',      color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
  EXPIRED:       {label:'Expiré',      color:'#DC2626', bg:'rgba(220,38,38,0.10)'},
  EXPIRING:      {label:'Expirant',    color:'#B45309', bg:'rgba(180,83,9,0.10)'},
  UPLOADED:      {label:'Soumis',      color:'#7C3AED', bg:'rgba(124,58,237,0.12)'},
}
const LIC_STATUS: Record<string,{label:string;color:string}> = {
  VALID:    {label:'✓ Valide',        color:'text-green-600 dark:text-green-400'},
  PENDING:  {label:'⏳ En attente',   color:'text-amber-600 dark:text-amber-400'},
  EXPIRING: {label:'⚠ Expirante',     color:'text-orange-600 dark:text-orange-400'},
  EXPIRED:  {label:'✗ Expirée',       color:'text-red-600 dark:text-red-400'},
  SUSPENDED:{label:'⏸ Suspendue',     color:'text-purple-600 dark:text-purple-400'},
}

const TABS = [
  {k:'identite',    l:'Identité',     icon:Shield},
  {k:'vehicule',    l:'Véhicule',     icon:Car},
  {k:'licences',    l:'Licences',     icon:FileText},
  {k:'documents',   l:'Documents',    icon:ClipboardList},
  {k:'services',    l:'Services',     icon:CheckCircle},
  {k:'activites',   l:'Activités',    icon:Activity},
  {k:'revenus',     l:'Revenus',      icon:BarChart2},
  {k:'fiscalite',   l:'Fiscalité',    icon:Receipt},
  {k:'plateformes', l:'Plateformes',  icon:Link2},
  {k:'conformite',  l:'Conformité',   icon:Shield},
  {k:'audit',       l:'Audit',        icon:ClipboardList},
] as const
type Tab = typeof TABS[number]['k']

export default function DriverDetailPage() {
  const { id } = useParams<{id:string}>()
  const { driverDetail, loading, refresh } = useDriverDetail(id)
  const [tab, setTab] = useState<Tab>('identite')
  const [docModal, setDocModal] = useState<string|null>(null)

  const demo = DEMO_PROFILES[id]
  const fb = DEMO_FALLBACK[id as keyof typeof DEMO_FALLBACK]

  type DriverProfile = { id:string; driver_number:string; first_name:string; last_name:string; email:string; status:string; identity_verification_status:string; created_at:string }
  const supProfile = (driverDetail as {profile?:DriverProfile}|null)?.profile

  // Build profile from Supabase OR demo
  const profile = supProfile ?? demo?.profile ?? (fb ? {
    id, driver_number:fb.num, first_name:fb.fn, last_name:fb.ln,
    email:`${fb.fn.toLowerCase()}.${fb.ln.toLowerCase()}.demo@taximetregov.qc`,
    phone:'(514) 555-0000', status:fb.status, identity_verification_status:fb.verif,
    created_at:'2026-01-01T09:00:00Z', city:fb.city, address:'Adresse DEMO',
    compliance:fb.status==='ACTIVE'&&fb.verif==='APPROVED'?'CONFORME':fb.status==='PENDING'?'EN VÉRIFICATION':'SUSPENDU',
    compliance_pct:fb.status==='ACTIVE'&&fb.verif==='APPROVED'?100:fb.status==='PENDING'?60:30,
  } : null)

  if (loading) return (
    <AppShell><div className="py-20 text-center"><RefreshCw className="mx-auto animate-spin text-qc-blue" size={24}/></div></AppShell>
  )
  if (!profile) return (
    <AppShell>
      <div className="px-6 py-8">
        <Link href="/drivers" className="flex items-center gap-2 text-xs text-qc-blue mb-4"><ArrowLeft size={12}/> Chauffeurs</Link>
        <p className="text-sm text-red-600 dark:text-red-400">Chauffeur non trouvé. ID: {id}</p>
      </div>
    </AppShell>
  )

  const dd = demo ?? {
    profile, vehicles:[], licenses:[], documents:[], services:[], activities:[], platforms:[],
    fiscal:{brut:fb?.brut??0, tips:r2((fb?.brut??0)*0.10), tps:r2((fb?.brut??0)*1.10*TPS), tvq:r2((fb?.brut??0)*1.10*TVQ), tpsCredits:r2((fb?.brut??0)*0.20*TPS), tvqCredits:r2((fb?.brut??0)*0.20*TVQ), tpsNet:r2((fb?.brut??0)*1.10*TPS-(fb?.brut??0)*0.20*TPS), tvqNet:r2((fb?.brut??0)*1.10*TVQ-(fb?.brut??0)*0.20*TVQ), solde:r2(((fb?.brut??0)*1.10*(TPS+TVQ)-(fb?.brut??0)*0.20*(TPS+TVQ)))},
    audit:[],
  }

  const p = profile as unknown as { compliance?:string; compliance_pct?:number; phone?:string; city?:string; address?:string }
  const compColor = p.compliance==='CONFORME'?'text-green-600 dark:text-green-400':p.compliance==='SUSPENDU'?'text-red-600 dark:text-red-400':'text-amber-600 dark:text-amber-400'
  const statusColor = profile.status==='ACTIVE'?'text-green-600 dark:text-green-400':profile.status==='SUSPENDED'?'text-red-600 dark:text-red-400':'text-amber-600 dark:text-amber-400'

  return (
    <AppShell>
      <div className="px-4 md:px-6 pb-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 py-4 text-xs text-slate-500">
          <Link href="/drivers" className="flex items-center gap-1 hover:text-qc-blue"><ArrowLeft size={11}/> Chauffeurs</Link>
          <span>›</span><span className="text-slate-700 dark:text-slate-200">{profile.first_name} {profile.last_name}</span>
        </div>

        {/* Header dossier */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-qc-blue flex items-center justify-center text-xl font-black text-white shrink-0">
              {profile.first_name[0]}{profile.last_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">{profile.first_name} {profile.last_name} <span className="text-sm font-normal text-slate-400">— DEMO</span></h1>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{profile.driver_number} · {profile.email}</div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 ${statusColor}`}>{profile.status}</span>
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-1 rounded-full">PILOTE</span>
                </div>
              </div>
              {/* Barre conformité */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold ${compColor}`}>DOSSIER {profile.compliance} — {profile.compliance_pct}%</span>
                  <span className="text-[9px] text-slate-400">{profile.city}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{
                    width:`${profile.compliance_pct}%`,
                    background:profile.compliance_pct===100?'#059669':profile.compliance_pct>60?'#B45309':'#DC2626'
                  }}/>
                </div>
              </div>
            </div>
            <button onClick={refresh} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0">
              <RefreshCw size={12} className="text-slate-500"/>
            </button>
          </div>

          {/* KPI rapides */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {[
              {l:'Véhicules',   v:dd.vehicles.length||'1', c:'text-blue-600 dark:text-blue-400', bg:'bg-blue-50 dark:bg-blue-500/10'},
              {l:'Documents',   v:`${dd.documents.filter(d=>d.status==='APPROVED').length||5}/${dd.documents.length||5}`, c:'text-green-600 dark:text-green-400', bg:'bg-green-50 dark:bg-green-500/10'},
              {l:'Revenus Q3',  v:money2(dd.fiscal.brut), c:'text-green-600 dark:text-green-400', bg:'bg-green-50 dark:bg-green-500/10'},
              {l:'Solde fiscal',v:money2(dd.fiscal.solde), c:'text-purple-600 dark:text-purple-400', bg:'bg-purple-50 dark:bg-purple-500/10'},
            ].map(s=>(
              <div key={s.l} className={`${s.bg} rounded-xl p-2.5 text-center`}>
                <div className={`text-sm font-black ${s.c}`}>{s.v}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chaîne complète */}
        <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-xl px-4 py-2.5 mb-4">
          <div className="flex items-center gap-1.5 flex-wrap text-[9px] font-bold text-blue-600 dark:text-blue-400">
            <span>👤 {profile.driver_number}</span>
            {['→','🚗 Véhicule','→','📜 Licences','→','📄 Documents','→','✅ Services','→','📍 Activités','→','💳 Transactions','→','💰 Revenus','→','🧾 TPS/TVQ','→','📋 Déclaration','→','🛡️ Conformité','→','📊 Audit'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-blue-300 dark:text-blue-700':''}>{s}</span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto mb-4 pb-1">
          {TABS.map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all" style={{
              background:tab===t.k?'#003DA5':'transparent',
              color:tab===t.k?'white':'#64748B',
              borderColor:tab===t.k?'#003DA5':'rgba(148,163,184,0.30)',
            }}>
              <t.icon size={10}/> {t.l}
            </button>
          ))}
        </div>

        {/* ── IDENTITÉ ── */}
        {tab==='identite'&&(
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-3">Dossier professionnel gouvernemental · {PILOT}</div>
            <div className="space-y-0">
              {[
                {l:'Identifiant',          v:profile.driver_number},
                {l:'Nom complet',          v:`${profile.first_name} ${profile.last_name}`},
                {l:'Email (DEMO)',         v:profile.email},
                {l:'Téléphone (DEMO)',     v:p.phone??'—'},
                {l:'Ville',               v:p.city??'—'},
                {l:'Adresse (DEMO)',       v:p.address??'—'},
                {l:'Statut',              v:profile.status, c:statusColor},
                {l:'Vérification identité',v:profile.identity_verification_status, c:profile.identity_verification_status==='APPROVED'?'text-green-600 dark:text-green-400':'text-amber-600 dark:text-amber-400'},
                {l:'Conformité',          v:p.compliance??'—', c:compColor},
                {l:'Membre depuis',       v:fmtDate(profile.created_at)},
              ].map(r=>(
                <div key={r.l} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-[10px] text-slate-500">{r.l}</span>
                  <span className={`text-[10px] font-semibold ${r.c||'text-slate-800 dark:text-slate-200'} font-mono`}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VÉHICULE ── */}
        {tab==='vehicule'&&(
          <div className="space-y-3">
            {(dd.vehicles.length>0?dd.vehicles:[{id:'veh-demo-001',make:'Toyota',model:'Camry',year:2022,color:'Blanc',plate:'DEMO-ABC-001',vin:'DEMO-VIN-001',type:'BERLINE',fuel:'Essence',status:'ACTIVE',insurance_exp:'2027-03-15',inspection_exp:'2027-09-01',primary:true,admissibility:{taxi:true,vtc:true,delivery:false}}]).map(v=>(
              <div key={v.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">🚗</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{v.year} {v.make} {v.model}</span>
                      {v.primary&&<span className="text-[8px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">PRINCIPAL</span>}
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${v.status==='ACTIVE'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-amber-600 bg-amber-50'}`}>{v.status}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{v.color} · {v.plate} · {v.type}</div>
                  </div>
                </div>
                {[
                  {l:'Assurance expiration', v:fmtDate(v.insurance_exp), c:new Date(v.insurance_exp)<new Date()?'text-red-600':'text-green-600 dark:text-green-400'},
                  {l:'Inspection prochaine', v:fmtDate(v.inspection_exp), c:'text-slate-700 dark:text-slate-300'},
                  {l:'VIN (DEMO)',           v:v.vin, c:'text-slate-500'},
                ].map(r=>(
                  <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-[10px] text-slate-500">{r.l}</span>
                    <span className={`text-[10px] font-semibold ${r.c}`}>{r.v}</span>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Admissibilité aux services</div>
                  <div className="flex gap-2 flex-wrap">
                    {[{n:'Taxi',ic:'🚕',ok:v.admissibility.taxi},{n:'VTC',ic:'🚗',ok:v.admissibility.vtc},{n:'Livraison',ic:'📦',ok:v.admissibility.delivery}].map(s=>(
                      <div key={s.n} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold ${s.ok?'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10':'text-slate-400 bg-slate-100 dark:bg-slate-800'}`}>
                        <span>{s.ic}</span><span>{s.n}</span><span>{s.ok?'✓':'—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <Link href="/vehicles" className="block text-center text-[10px] text-qc-blue hover:underline py-1">→ Voir dans Administration des véhicules</Link>
          </div>
        )}

        {/* ── LICENCES ── */}
        {tab==='licences'&&(
          <div className="space-y-2">
            {(dd.licenses.length>0?dd.licenses:[
              {id:'lic-d001',type:'TAXI',number:'LIC-TAXI-QC-0001',org:'Commission des transports QC (DEMO)',issued:'2024-01-15',expires:'2027-01-15',status:'VALID'},
            ]).map(l=>{
              const lc = LIC_STATUS[l.status]??LIC_STATUS['PENDING']!
              const daysLeft = Math.ceil((new Date(l.expires).getTime()-Date.now())/86400000)
              return (
                <div key={l.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-2xl">📜</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{l.type}</span>
                        <span className={`text-[9px] font-bold ${lc.color}`}>{lc.label}</span>
                        {daysLeft<90&&<span className="text-[8px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-1.5 rounded-full">⏳ {daysLeft}j</span>}
                      </div>
                      <div className="text-[9px] text-slate-400">{l.number} · {l.org}</div>
                    </div>
                  </div>
                  {[
                    {l:'Émise le',  v:fmtDate(l.issued)},
                    {l:'Expire le', v:fmtDate(l.expires), c:daysLeft<90?'text-orange-600':daysLeft<0?'text-red-600':''},
                  ].map(r=>(
                    <div key={r.l} className="flex justify-between text-[10px] py-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">{r.l}</span>
                      <span className={`font-semibold ${r.c||'text-slate-700 dark:text-slate-300'}`}>{r.v}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {tab==='documents'&&(
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                {l:'Total',       v:dd.documents.length||5,                                      c:'text-blue-600 dark:text-blue-400',  bg:'bg-blue-50 dark:bg-blue-500/10'},
                {l:'Approuvés',   v:dd.documents.filter(d=>d.status==='APPROVED').length||5,     c:'text-green-600 dark:text-green-400',bg:'bg-green-50 dark:bg-green-500/10'},
                {l:'À vérifier',  v:dd.documents.filter(d=>d.status!=='APPROVED').length||0,     c:'text-amber-600 dark:text-amber-400',bg:'bg-amber-50 dark:bg-amber-500/10'},
              ].map(s=>(
                <div key={s.l} className={`${s.bg} rounded-xl p-2.5 text-center`}>
                  <div className={`text-lg font-black ${s.c}`}>{s.v}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
            {(dd.documents.length>0?dd.documents:[
              {id:'doc-d001',type:'DRIVER_LICENSE',label:'Permis de conduire',status:'APPROVED',issued:'2020-06-15',expires:'2029-06-15',version:1,verifiedBy:'Admin GOV-01',verifiedAt:'2026-01-20T10:00:00Z',note:'Valide'},
              {id:'doc-d002',type:'VEHICLE_REGISTRATION',label:'Immatriculation',status:'APPROVED',issued:'2022-03-15',expires:'2027-03-15',version:1,verifiedBy:'Admin GOV-01',verifiedAt:'2026-01-20T10:30:00Z',note:null},
              {id:'doc-d003',type:'INSURANCE',label:'Assurance',status:'APPROVED',issued:'2026-03-15',expires:'2027-03-15',version:2,verifiedBy:'Admin GOV-02',verifiedAt:'2026-03-18T09:00:00Z',note:'Renouvelée'},
            ]).map(doc=>{
              const sc = DOC_STATUS[doc.status]??DOC_STATUS['UPLOADED']!
              const daysLeft = doc.expires?Math.ceil((new Date(doc.expires).getTime()-Date.now())/86400000):null
              return (
                <div key={doc.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0">📄</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{doc.label}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                        {daysLeft!==null&&daysLeft<90&&<span className="text-[8px] text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-1.5 rounded-full">⏳ {daysLeft}j</span>}
                        <span className="text-[8px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 rounded-full">v{doc.version}</span>
                      </div>
                      <div className="text-[9px] text-slate-400">Émis: {fmtDate(doc.issued)} · Expire: {fmtDate(doc.expires)}</div>
                      {doc.verifiedBy&&<div className="text-[9px] text-slate-400">Vérifié par {doc.verifiedBy} · {fmtDate(doc.verifiedAt)}</div>}
                      {doc.note&&<div className="text-[9px] text-slate-500 mt-0.5 italic">{doc.note}</div>}
                    </div>
                  </div>
                </div>
              )
            })}
            <div className="p-2 text-[9px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/15 rounded-lg">{PILOT} · Documents synthétiques uniquement</div>
          </div>
        )}

        {/* ── SERVICES ── */}
        {tab==='services'&&(
          <div className="space-y-2">
            {(dd.services.length>0?dd.services:[
              {name:'Taxi',icon:'🚕',authorized:true,reason:'Licence taxi valide · Assurance valide · Véhicule conforme',requiredDocs:['Permis','Immatriculation','Assurance','Autorisation taxi']},
              {name:'VTC / Rideshare',icon:'🚗',authorized:true,reason:'Autorisation VTC active',requiredDocs:['Permis','Assurance','Auth VTC']},
              {name:'Livraison',icon:'📦',authorized:false,reason:'Permis livraison non soumis',requiredDocs:['Permis livraison requis']},
            ]).map(s=>(
              <div key={s.name} className={`bg-white dark:bg-slate-900 rounded-xl p-4 border ${s.authorized?'border-green-200 dark:border-green-500/25':'border-amber-200 dark:border-amber-500/25'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{s.name}</div>
                    <div className={`text-[10px] font-bold ${s.authorized?'text-green-600 dark:text-green-400':'text-amber-600 dark:text-amber-400'}`}>{s.authorized?'✓ Autorisé':'⚠ Non autorisé'}</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-600 dark:text-slate-300">{s.reason}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {s.requiredDocs.map(d=><span key={d} className="text-[8px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{d}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ACTIVITÉS ── */}
        {tab==='activites'&&(
          <div className="space-y-2">
            {(dd.activities.length>0?dd.activities:[
              {id:'act-d001',service:'TAXI',date:'2026-09-17T08:30:00Z',origin:'Montréal-Nord (DEMO)',destination:'Aéroport YUL (DEMO)',dist:'22 km',duration:'28 min',amount:38.50,tip:4.00,status:'COMPLETED'},
              {id:'act-d002',service:'RIDESHARE',date:'2026-09-16T21:30:00Z',origin:'Centre-ville (DEMO)',destination:'Laval (DEMO)',dist:'18 km',duration:'25 min',amount:32.00,tip:3.00,status:'COMPLETED'},
            ]).map(a=>(
              <div key={a.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-slate-900 dark:text-white font-mono">{a.id}</span>
                      <span className="text-[8px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-1.5 rounded-full font-bold">{a.status}</span>
                      <span className="text-[8px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 rounded-full">{a.service}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{new Date(a.date).toLocaleString('fr-CA')}</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-1">📍 {a.origin} → {a.destination}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{a.dist} · {a.duration}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-green-600 dark:text-green-400">{money2(a.amount)}</div>
                    {a.tip>0&&<div className="text-[9px]" style={{color:'#B45309'}}>+{money2(a.tip)} tip</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── REVENUS ── */}
        {tab==='revenus'&&(
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                {l:'Brut Q3 2026',  v:money2(dd.fiscal.brut),                      c:'text-slate-900 dark:text-white', bg:'bg-white dark:bg-slate-900'},
                {l:'Pourboires',    v:money2(dd.fiscal.tips),                      c:'',                              bg:'bg-yellow-50 dark:bg-yellow-500/8',style:{color:'#B45309'}},
                {l:'Total brut+tip',v:money2(dd.fiscal.brut+dd.fiscal.tips),        c:'text-green-600 dark:text-green-400', bg:'bg-green-50 dark:bg-green-500/8'},
                {l:'Net estimé',    v:money2(dd.fiscal.brut-r2(dd.fiscal.brut*0.20)), c:'text-blue-600 dark:text-blue-400', bg:'bg-blue-50 dark:bg-blue-500/8'},
              ].map(s=>(
                <div key={s.l} className={`${s.bg} border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center`}>
                  <div className={`text-sm font-black ${s.c}`} style={(s as {style?:object}).style}>{s.v}</div>
                  <div className="text-[9px] text-slate-500 mt-1">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <div className="text-[9px] font-bold text-slate-400 uppercase mb-3">Répartition par source</div>
              {[
                {ic:'🚕',l:'Taxi',      v:dd.fiscal.brut*0.40},
                {ic:'🚗',l:'Rideshare', v:dd.fiscal.brut*0.35},
                {ic:'📦',l:'Livraison', v:dd.fiscal.brut*0.25},
              ].map(r=>(
                <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-[10px] text-slate-500">{r.ic} {r.l}</span>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{money2(r.v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FISCALITÉ ── */}
        {tab==='fiscalite'&&(
          <div className="space-y-3">
            <div className="p-2.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20 rounded-lg">ESTIMATION FISCALE · MODE PILOTE · À VALIDER AVANT TOUTE TRANSMISSION OFFICIELLE</div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <div className="text-[9px] font-bold text-slate-400 uppercase mb-3">Calcul TPS/TVQ — Q3 2026</div>
              {[
                {l:'Revenus bruts',                v:money2(dd.fiscal.brut),            c:'text-slate-800 dark:text-slate-200'},
                {l:'+ Pourboires taxables',         v:money2(dd.fiscal.tips),            style:{color:'#B45309'}},
                {l:'= Base taxable',                v:money2(dd.fiscal.brut+dd.fiscal.tips), c:'text-green-600 dark:text-green-400'},
                {l:`TPS collectée (${(TPS*100).toFixed(0)}%)`, v:money2(dd.fiscal.tps), c:'text-purple-600 dark:text-purple-400'},
                {l:`TVQ collectée (${(TVQ*100).toFixed(3)}%)`, v:money2(dd.fiscal.tvq), c:'text-purple-600 dark:text-purple-400'},
                {l:'Crédits TPS (CTI ~20%)',        v:`− ${money2(dd.fiscal.tpsCredits)}`, c:'text-slate-400'},
                {l:'Crédits TVQ (CTI ~20%)',        v:`− ${money2(dd.fiscal.tvqCredits)}`, c:'text-slate-400'},
                {l:'TPS NETTE',                    v:money2(dd.fiscal.tpsNet),          c:'text-purple-600 dark:text-purple-400'},
                {l:'TVQ NETTE',                    v:money2(dd.fiscal.tvqNet),          c:'text-purple-600 dark:text-purple-400'},
                {l:'SOLDE ESTIMÉ À REMETTRE',      v:money2(dd.fiscal.solde),           c:'text-green-600 dark:text-green-400'},
              ].map((r,i)=>(
                <div key={r.l} className={`flex justify-between py-1.5 ${i>0?'border-t border-slate-100 dark:border-slate-800':''}`}>
                  <span className="text-[10px] text-slate-500">{r.l}</span>
                  <span className={`text-[10px] font-bold ${(r as {c?:string}).c??''}`} style={(r as {style?:object}).style}>{r.v}</span>
                </div>
              ))}
            </div>
            <Link href="/tax/center" className="block text-center text-[10px] text-qc-blue hover:underline">→ Voir Centre Fiscal Gouvernemental</Link>
          </div>
        )}

        {/* ── PLATEFORMES ── */}
        {tab==='plateformes'&&(
          <div className="space-y-2">
            <div className="p-2.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/15 rounded-lg">SIMULATION · AUCUNE CONNEXION RÉELLE AUX PLATEFORMES</div>
            {(dd.platforms.length>0?dd.platforms:[
              {provider:'UBER',icon:'⬛',status:'SIMULATION',lastSync:'Il y a 2h',events:89,lastTx:'TX-DEMO-1001'},
              {provider:'LYFT',icon:'🟣',status:'SIMULATION',lastSync:'Il y a 4h',events:67,lastTx:'TX-DEMO-1006'},
            ]).map(p=>(
              <div key={p.provider} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{p.provider}</div>
                    <div className="text-[9px] text-slate-400">Sync: {p.lastSync} · {p.events} événements · {p.lastTx}</div>
                  </div>
                  <span className="text-[8px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CONFORMITÉ ── */}
        {tab==='conformite'&&(
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <div className="text-[9px] font-bold text-slate-400 uppercase mb-3">Statut de conformité global</div>
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-500/8 border border-green-200 dark:border-green-500/20">
                <CheckCircle size={20} className="text-green-600 dark:text-green-400 shrink-0"/>
                <div>
                  <div className="text-sm font-bold text-green-700 dark:text-green-400">{p.compliance??'CONFORME'}</div>
                  <div className="text-[9px] text-green-600 dark:text-green-400">{p.compliance_pct??100}% des critères satisfaits</div>
                </div>
              </div>
              {[
                {l:'Identité vérifiée',    ok:profile.identity_verification_status==='APPROVED', note:''},
                {l:'Véhicule conforme',    ok:true,  note:'Toyota Camry 2022 — inspection à jour'},
                {l:'Licence valide',       ok:true,  note:'Licence taxi valide jusqu\'au 2027-01-15'},
                {l:'Assurance valide',     ok:true,  note:'Expire 2027-03-15 — conforme'},
                {l:'Documents complets',   ok:true,  note:'5/5 documents approuvés'},
                {l:'Services autorisés',   ok:true,  note:'Taxi + VTC actifs'},
              ].map(r=>(
                <div key={r.l} className="flex items-start gap-2 py-2 border-t border-slate-100 dark:border-slate-800">
                  {r.ok?<CheckCircle size={13} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5"/>:<AlertTriangle size={13} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"/>}
                  <div>
                    <div className={`text-[10px] font-semibold ${r.ok?'text-slate-800 dark:text-slate-200':'text-amber-700 dark:text-amber-400'}`}>{r.l}</div>
                    {r.note&&<div className="text-[9px] text-slate-400">{r.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AUDIT ── */}
        {tab==='audit'&&(
          <div className="space-y-2">
            {(dd.audit.length>0?dd.audit:[
              {at:'2026-09-17T08:30:00Z',action:'ACTIVITY_CREATED',  obj:'ACT-DEMO-001',by:'SYSTEM',       note:'Course taxi créée'},
              {at:'2026-01-20T10:00:00Z',action:'DOCUMENT_APPROVED', obj:'DOC-DEMO-001', by:'Admin GOV-01', note:'Permis de conduire approuvé'},
              {at:'2026-01-15T09:00:00Z',action:'DRIVER_CREATED',    obj:profile.driver_number,by:'SYSTEM',note:'Profil créé — inscription pilote'},
            ]).map((a,i)=>(
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <ClipboardList size={11} className="text-blue-600 dark:text-blue-400"/>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{a.action}</span>
                      <span className="text-[8px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 rounded-full">{a.by}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">{a.obj} · {new Date(a.at).toLocaleString('fr-CA')}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{a.note}</div>
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
