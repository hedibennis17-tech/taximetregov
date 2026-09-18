'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/ui'
import { useState } from 'react'
import { CheckCircle, Clock, XCircle, AlertTriangle, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const PILOT = 'PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE TRANSMISSION OFFICIELLE'

const DEMO_LICENSES = [
  // Jean Tremblay — DRV-QC-0001
  { id:'LIC-001', driver:'Jean Tremblay',     driverNum:'DRV-QC-0001', driverId:'drv-demo-001', type:'TAXI',     label:'Licence Taxi',          number:'LIC-TAXI-QC-0001', org:'Commission des transports du Québec (DEMO)', issued:'2024-01-15', expires:'2027-01-15', status:'VALID',    note:'Licence classe A — véhicule 4 places' },
  { id:'LIC-002', driver:'Jean Tremblay',     driverNum:'DRV-QC-0001', driverId:'drv-demo-001', type:'VTC',      label:'Autorisation VTC',      number:'LIC-VTC-QC-0001',  org:'ARTM — Autorité régionale (DEMO)',           issued:'2024-02-01', expires:'2027-02-01', status:'VALID',    note:'Autorisation rideshare Montréal' },
  // Marie Gagnon — DRV-QC-0002
  { id:'LIC-003', driver:'Marie Gagnon',      driverNum:'DRV-QC-0002', driverId:'drv-demo-002', type:'VTC',      label:'Autorisation VTC',      number:'LIC-VTC-QC-0002',  org:'ARTM (DEMO)',                                issued:'2024-03-01', expires:'2027-03-01', status:'VALID',    note:null },
  { id:'LIC-004', driver:'Marie Gagnon',      driverNum:'DRV-QC-0002', driverId:'drv-demo-002', type:'DELIVERY', label:'Permis Livraison',      number:'LIC-DEL-QC-0002',  org:'Ville de Montréal (DEMO)',                   issued:'2024-04-01', expires:'2025-04-01', status:'EXPIRED',  note:'Renouvellement requis' },
  // Karim Hassan — DRV-QC-0003
  { id:'LIC-005', driver:'Karim Hassan',      driverNum:'DRV-QC-0003', driverId:'drv-demo-003', type:'DELIVERY', label:'Permis Livraison',      number:'LIC-DEL-QC-0003',  org:'Ville de Montréal (DEMO)',                   issued:'2025-01-01', expires:'2028-01-01', status:'VALID',    note:null },
  // Sophie Martin — DRV-QC-0004 (en attente)
  { id:'LIC-006', driver:'Sophie Martin',     driverNum:'DRV-QC-0004', driverId:'drv-demo-004', type:'TAXI',     label:'Licence Taxi',          number:'LIC-TAXI-QC-0004', org:'Commission des transports du Québec (DEMO)', issued:'2026-08-20', expires:'2029-08-20', status:'PENDING',  note:'Vérification en cours' },
  // Nadia Patel — DRV-QC-0006
  { id:'LIC-007', driver:'Nadia Patel',       driverNum:'DRV-QC-0006', driverId:'drv-demo-006', type:'DELIVERY', label:'Permis Livraison',      number:'LIC-DEL-QC-0006',  org:'Ville de Brossard (DEMO)',                   issued:'2025-03-01', expires:'2026-10-01', status:'EXPIRING', note:'Expire dans 14 jours' },
  // Marc Leblanc — DRV-QC-0007 (suspendu)
  { id:'LIC-008', driver:'Marc Leblanc',      driverNum:'DRV-QC-0007', driverId:'drv-demo-007', type:'TAXI',     label:'Licence Taxi',          number:'LIC-TAXI-QC-0007', org:'Commission des transports du Québec (DEMO)', issued:'2023-06-01', expires:'2026-06-01', status:'SUSPENDED', note:'Suspendue — assurance expirée' },
  // Amira Tremblay — DRV-QC-0008
  { id:'LIC-009', driver:'Amira Tremblay',    driverNum:'DRV-QC-0008', driverId:'drv-demo-008', type:'VTC',      label:'Autorisation VTC',      number:'LIC-VTC-QC-0008',  org:'ARTM (DEMO)',                                issued:'2025-06-01', expires:'2028-06-01', status:'VALID',    note:'En cours de révision administrative' },
  // Ali Bouchard — DRV-QC-0005
  { id:'LIC-010', driver:'Ali Bouchard',      driverNum:'DRV-QC-0005', driverId:'drv-demo-005', type:'VTC',      label:'Autorisation VTC',      number:'LIC-VTC-QC-0005',  org:'ARTM (DEMO)',                                issued:'2026-08-25', expires:'2029-08-25', status:'PENDING',  note:'Documents requis en attente' },
]

const STATUS_CONF: Record<string,{label:string;color:string;bg:string;bdr:string;icon:typeof CheckCircle}> = {
  VALID:    {label:'Valide',       color:'#059669',bg:'rgba(5,150,105,0.12)', bdr:'rgba(5,150,105,0.30)', icon:CheckCircle},
  PENDING:  {label:'En attente',  color:'#B45309', bg:'rgba(180,83,9,0.10)',  bdr:'rgba(180,83,9,0.30)',   icon:Clock},
  EXPIRING: {label:'Expirante',   color:'#EA580C', bg:'rgba(234,88,12,0.10)', bdr:'rgba(234,88,12,0.30)',  icon:AlertTriangle},
  EXPIRED:  {label:'Expirée',     color:'#DC2626', bg:'rgba(220,38,38,0.10)', bdr:'rgba(220,38,38,0.25)', icon:XCircle},
  SUSPENDED:{label:'Suspendue',   color:'#7C3AED', bg:'rgba(124,58,237,0.12)',bdr:'rgba(124,58,237,0.30)',icon:XCircle},
  REFUSED:  {label:'Refusée',     color:'#DC2626', bg:'rgba(220,38,38,0.10)', bdr:'rgba(220,38,38,0.25)', icon:XCircle},
}
const TYPE_ICONS: Record<string,string> = { TAXI:'🚕', VTC:'🚗', DELIVERY:'📦', PROFESSIONAL:'📜' }
const TYPE_LABELS: Record<string,string> = { TAXI:'Taxi', VTC:'VTC / Rideshare', DELIVERY:'Livraison', PROFESSIONAL:'Professionnel' }
const fmtDate = (s:string) => new Intl.DateTimeFormat('fr-CA',{year:'numeric',month:'short',day:'numeric'}).format(new Date(s))

const FILTERS = ['Tous','VALID','PENDING','EXPIRING','EXPIRED','SUSPENDED']
const TYPES   = ['Tous types','TAXI','VTC','DELIVERY']

export default function LicensesPage() {
  const [filter, setFilter] = useState('Tous')
  const [type,   setType]   = useState('Tous types')
  const [search, setSearch] = useState('')

  const filtered = DEMO_LICENSES.filter(l => {
    if (filter !== 'Tous' && l.status !== filter) return false
    if (type !== 'Tous types' && l.type !== type) return false
    if (search && !`${l.driver} ${l.number} ${l.driverNum}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const stats = {
    total:    DEMO_LICENSES.length,
    valid:    DEMO_LICENSES.filter(l=>l.status==='VALID').length,
    pending:  DEMO_LICENSES.filter(l=>l.status==='PENDING').length,
    expiring: DEMO_LICENSES.filter(l=>l.status==='EXPIRING').length,
    expired:  DEMO_LICENSES.filter(l=>['EXPIRED','SUSPENDED'].includes(l.status)).length,
  }

  return (
    <AppShell>
      <PageHeader title="Centre de licences" subtitle="Licences · Permis · Autorisations · TAXIMETER.GOV"/>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <div className="p-2.5 rounded-xl text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20">{PILOT}</div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {l:'Total licences', v:stats.total,   c:'text-blue-600 dark:text-blue-400',  bg:'bg-blue-50 dark:bg-blue-500/10',   icon:'📜'},
            {l:'Valides',        v:stats.valid,   c:'text-green-600 dark:text-green-400',bg:'bg-green-50 dark:bg-green-500/10', icon:'✅'},
            {l:'En attente',     v:stats.pending, c:'text-amber-600 dark:text-amber-400',bg:'bg-amber-50 dark:bg-amber-500/10', icon:'⏳'},
            {l:'Alertes',        v:stats.expiring+stats.expired, c:'text-red-600 dark:text-red-400', bg:'bg-red-50 dark:bg-red-500/10', icon:'🚨'},
          ].map(s=>(
            <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center border border-transparent`}>
              <div className="text-xl mb-1">{s.icon}</div>
              <div className={`text-xl font-black ${s.c}`}>{s.v}</div>
              <div className="text-[9px] text-slate-500 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Alertes */}
        {(stats.expiring > 0 || stats.expired > 0) && (
          <div className="p-3 bg-red-50 dark:bg-red-500/8 border border-red-200 dark:border-red-500/25 rounded-xl">
            <div className="text-xs font-bold text-red-700 dark:text-red-400 mb-2">🚨 Licences nécessitant attention</div>
            {DEMO_LICENSES.filter(l=>['EXPIRING','EXPIRED','SUSPENDED'].includes(l.status)).map(l=>(
              <div key={l.id} className="flex items-center justify-between text-[10px] py-1.5 border-b border-red-100 dark:border-red-500/15 last:border-0">
                <span className="text-slate-700 dark:text-slate-300">{l.driver} — {l.label}</span>
                <span className={`font-bold ${l.status==='EXPIRING'?'text-orange-600 dark:text-orange-400':'text-red-600 dark:text-red-400'}`}>{STATUS_CONF[l.status]!.label} · {fmtDate(l.expires)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Filtres */}
        <div className="space-y-2">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Chauffeur, numéro de licence…"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white outline-none focus:border-qc-blue"/>
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(f=>(
              <button key={f} onClick={()=>setFilter(f)} className="px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all" style={{
                background:filter===f?'#003DA5':'transparent',
                color:filter===f?'white':'#64748B',
                borderColor:filter===f?'#003DA5':'rgba(148,163,184,0.30)',
              }}>{f==='Tous'?`Toutes (${DEMO_LICENSES.length})`:STATUS_CONF[f]?.label??f}</button>
            ))}
            {TYPES.map(t=>(
              <button key={t} onClick={()=>setType(t)} className="px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all" style={{
                background:type===t?'#003DA5':'transparent',
                color:type===t?'white':'#64748B',
                borderColor:type===t?'#003DA5':'rgba(148,163,184,0.30)',
              }}>{t==='Tous types'?'Tous types':`${TYPE_ICONS[t]??''} ${TYPE_LABELS[t]??t}`}</button>
            ))}
          </div>
        </div>

        {/* Liste licences */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-800 dark:text-white">{filtered.length} licence(s)</div>
            <span className="text-[9px] text-amber-600 dark:text-amber-400">DONNÉES PILOTES</span>
          </div>
          {filtered.map(l=>{
            const sc = STATUS_CONF[l.status]??STATUS_CONF['PENDING']!
            const daysLeft = Math.ceil((new Date(l.expires).getTime()-Date.now())/86400000)
            return (
              <div key={l.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                style={{borderLeft:`3px solid ${sc.bdr}`}}>
                <span className="text-2xl shrink-0">{TYPE_ICONS[l.type]??'📜'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{l.label}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{color:sc.color,background:sc.bg}}>{sc.label}</span>
                    {daysLeft < 30 && daysLeft > 0 && <span className="text-[8px] text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-1.5 rounded-full font-bold">⏳ {daysLeft}j</span>}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">{l.number}</div>
                  <div className="flex items-center gap-3 mt-1 text-[9px] text-slate-400 flex-wrap">
                    <Link href={`/drivers/${l.driverId}`} className="text-qc-blue hover:underline font-semibold">{l.driver} · {l.driverNum}</Link>
                    <span>{l.org}</span>
                  </div>
                  {l.note && <div className="text-[9px] text-slate-500 italic mt-0.5">{l.note}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">Émise: {fmtDate(l.issued)}</div>
                  <div className={`text-[10px] font-bold mt-0.5 ${daysLeft<0?'text-red-600 dark:text-red-400':daysLeft<90?'text-orange-500':'text-slate-500'}`}>Expire: {fmtDate(l.expires)}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
