'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock, Car, ChevronRight, X } from 'lucide-react'

interface Vehicle {
  id:string; vehicle_number:string; make:string; model:string; year:number
  color:string; vehicle_type:string; fuel_type:string
  license_plate_masked:string; vin_last_four:string|null
  seating_capacity:number; status:string; vehicle_status:string
  is_active:boolean; taximeter_status:string
  taximeter_serial_masked:string|null; notes:string|null; created_at:string
  driver_profiles:{id:string;first_name:string;last_name:string;driver_number:string}|null
}

const STATUS_CONF: Record<string,{label:string;color:string;bg:string;cls:string}> = {
  PENDING:   {label:'En attente',  color:'#B45309', bg:'rgba(180,83,9,0.12)',   cls:'text-amber-400 bg-amber-500/10 border-amber-500/25'},
  ACTIVE:    {label:'Actif',       color:'#059669', bg:'rgba(5,150,105,0.12)',  cls:'text-green-400 bg-green-500/10 border-green-500/25'},
  APPROVED:  {label:'Approuvé',    color:'#059669', bg:'rgba(5,150,105,0.12)',  cls:'text-green-400 bg-green-500/10 border-green-500/25'},
  SUSPENDED: {label:'Suspendu',    color:'#7C3AED', bg:'rgba(124,58,237,0.12)',cls:'text-purple-400 bg-purple-500/10 border-purple-500/25'},
  REJECTED:  {label:'Rejeté',     color:'#DC2626', bg:'rgba(220,38,38,0.12)',  cls:'text-red-400 bg-red-500/10 border-red-500/25'},
  INACTIVE:  {label:'Inactif',    color:'#4A6A9A', bg:'rgba(74,106,154,0.12)', cls:'text-slate-400 bg-slate-500/10 border-slate-500/25'},
}

const FUEL_ICON: Record<string,string> = {GASOLINE:'⛽',HYBRID:'🔋',ELECTRIC:'⚡',DIESEL:'🛢️'}

const REJECTION_REASONS = [
  'Véhicule non conforme aux normes','Informations invalides',
  'Plaque non reconnue','Véhicule trop ancien (>10 ans)',
  'Assurance insuffisante','Inspection requise',
  'Taximètre non certifié','Document manquant',
]

function fmtDate(d:string) { return new Intl.DateTimeFormat('fr-CA',{year:'numeric',month:'short',day:'numeric'}).format(new Date(d)) }

// ── Modal vérification véhicule ────────────────────────────────
function ReviewModal({v,onClose,onDone}:{v:Vehicle;onClose:()=>void;onDone:()=>void}) {
  const [decision,setDecision] = useState<'APPROVE'|'REJECT'|'SUSPEND'|null>(null)
  const [note,setNote]   = useState('')
  const [reason,setReason] = useState('')
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState<string|null>(null)

  async function submit() {
    if (decision!=='APPROVE' && !note) { setError('Motif obligatoire'); return }
    setLoading(true)
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = typeof window !== 'undefined'
        ? (localStorage.getItem('sb-access-token') ?? sessionStorage.getItem('sb-access-token') ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '')
        : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '')
      if (!url) throw new Error('Config manquante')

      const newStatus = decision==='APPROVE'?'ACTIVE':decision==='REJECT'?'REJECTED':'SUSPENDED'
      await fetch(`${url}/rest/v1/vehicles?id=eq.${v.id}`, {
        method:'PATCH',
        headers:{'Content-Type':'application/json','apikey':key,'Authorization':`Bearer ${key}`},
        body: JSON.stringify({ status:newStatus, vehicle_status:newStatus, ...(note?{notes:note}:{}) }),
      })

      // Notification driver
      if (v.driver_profiles?.id) {
        await fetch(`${url}/rest/v1/driver_notifications`, {
          method:'POST',
          headers:{'Content-Type':'application/json','apikey':key,'Authorization':`Bearer ${key}`,'Prefer':'resolution=ignore-duplicates,return=minimal'},
          body: JSON.stringify({
            driver_id:         v.driver_profiles.id,
            notification_type: 'SYSTEM',
            title:             decision==='APPROVE'?'✅ Véhicule approuvé':decision==='REJECT'?'❌ Véhicule refusé':'⏸️ Véhicule suspendu',
            body:              decision==='APPROVE'
              ?`Votre ${v.year} ${v.make} ${v.model} a été approuvé par TAXIMETER.GOV.`
              :`Votre ${v.year} ${v.make} ${v.model} a été ${decision==='REJECT'?'refusé':'suspendu'}. Motif: ${note}`,
            status:'UNREAD', priority:decision==='REJECT'?'HIGH':'NORMAL',
          }),
        })
      }
      onDone()
    } catch(e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70" onClick={onClose}>
      <div className="w-full max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-t-2xl p-5" onClick={e=>e.stopPropagation()}>
        <div className="w-10 h-1 rounded bg-slate-600 mx-auto mb-4"/>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-base font-bold text-white">{v.year} {v.make} {v.model}</div>
            <div className="text-[10px] text-slate-400 mt-1">{v.vehicle_number} · {v.license_plate_masked}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 border border-slate-600 cursor-pointer">
            <X size={14} className="text-slate-400"/>
          </button>
        </div>

        {/* Infos véhicule */}
        <Card className="p-3 mb-4 space-y-2">
          {[
            {label:'Chauffeur',   val:`${v.driver_profiles?.first_name} ${v.driver_profiles?.last_name} · ${v.driver_profiles?.driver_number}`},
            {label:'Couleur',     val:v.color},
            {label:'Type',        val:`${FUEL_ICON[v.fuel_type]??''} ${v.fuel_type}`},
            {label:'Capacité',    val:`${v.seating_capacity} places`},
            {label:'VIN (fin)',   val:v.vin_last_four?`••••${v.vin_last_four}`:'—'},
            {label:'Taximètre',   val:v.taximeter_status},
            {label:'Soumis',      val:fmtDate(v.created_at)},
          ].map(r=>(
            <div key={r.label} className="flex justify-between text-xs">
              <span className="text-slate-400">{r.label}</span>
              <span className="text-white font-semibold">{r.val}</span>
            </div>
          ))}
        </Card>

        {v.notes && (
          <Card className="p-3 mb-4 border-l-2 border-l-amber-500">
            <div className="text-[10px] font-bold text-slate-400 mb-1">NOTES CHAUFFEUR</div>
            <div className="text-xs text-slate-300">{v.notes}</div>
          </Card>
        )}

        {/* Décision */}
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Décision</div>
        <div className="flex flex-col gap-2 mb-4">
          {[
            {val:'APPROVE' as const, label:'✅ Approuver le véhicule', color:'#059669', bg:'rgba(5,150,105,0.12)',  bdr:'rgba(5,150,105,0.30)'},
            {val:'REJECT'  as const, label:'❌ Refuser le véhicule',   color:'#DC2626', bg:'rgba(220,38,38,0.12)',  bdr:'rgba(220,38,38,0.30)'},
            {val:'SUSPEND' as const, label:'⏸️ Suspendre',             color:'#7C3AED', bg:'rgba(124,58,237,0.10)',bdr:'rgba(124,58,237,0.30)'},
          ].map(d=>(
            <button key={d.val} onClick={()=>setDecision(d.val)} style={{
              padding:'12px 16px',borderRadius:12,fontSize:13,fontWeight:700,cursor:'pointer',textAlign:'left',
              background:decision===d.val?d.bg:'transparent',
              border:`1.5px solid ${decision===d.val?d.bdr:'rgba(255,255,255,0.08)'}`,
              color:decision===d.val?d.color:'#94A3B8',
            }}>{d.label}</button>
          ))}
        </div>

        {decision && decision!=='APPROVE' && (
          <>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Motif (obligatoire)</div>
            <select value={reason} onChange={e=>{setReason(e.target.value);setNote(e.target.value)}} className="w-full mb-3 p-2 rounded-lg bg-slate-800 border border-slate-600 text-xs text-white">
              <option value="">Sélectionner un motif…</option>
              {REJECTION_REASONS.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Précision obligatoire…" rows={2}
              className="w-full mb-4 p-3 rounded-xl bg-slate-800 border border-slate-600 text-xs text-white resize-none outline-none"/>
          </>
        )}
        {decision==='APPROVE' && (
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Note optionnelle…" rows={2}
            className="w-full mb-4 p-3 rounded-xl bg-slate-800 border border-slate-600 text-xs text-white resize-none outline-none"/>
        )}

        {error && <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">{error}</div>}

        <button onClick={()=>void submit()} disabled={!decision||loading}
          className={`w-full p-3 rounded-xl text-sm font-bold ${!decision||loading?'bg-slate-700 text-slate-500 cursor-not-allowed':'bg-qc-blue text-white cursor-pointer'}`}>
          {loading?'Traitement…':'Confirmer la décision'}
        </button>
      </div>
    </div>
  )
}

// ── Page Admin Véhicules ───────────────────────────────────────
export default function AdminVehiclesPage() {
  const [vehicles,setVehicles] = useState<Vehicle[]>([])
  const [filter,setFilter]     = useState('')
  const [loading,setLoading]   = useState(true)
  const [selected,setSelected] = useState<Vehicle|null>(null)
  const [error,setError]       = useState<string|null>(null)
  const [stats,setStats]       = useState({pending:0,active:0,rejected:0,total:0})

  const FILTERS = [
    {key:'',        label:'Tous'},
    {key:'PENDING', label:`En attente (${stats.pending})`},
    {key:'ACTIVE',  label:'Actifs'},
    {key:'REJECTED',label:'Refusés'},
    {key:'SUSPENDED',label:'Suspendus'},
  ]

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''
      if (!url) throw new Error('Config manquante')
      let q = `${url}/rest/v1/vehicles?select=id,vehicle_number,make,model,year,color,vehicle_type,fuel_type,license_plate_masked,vin_last_four,seating_capacity,status,vehicle_status,is_active,taximeter_status,taximeter_serial_masked,notes,created_at,driver_profiles(id,first_name,last_name,driver_number)&is.deleted_at=null&order=created_at.desc&limit=100`
      if (filter) q += `&status=eq.${filter}`
      const res  = await fetch(q, { headers:{ apikey:key, Authorization:`Bearer ${key}` } })
      const data = await res.json() as Vehicle[]
      setVehicles(data)
      // Stats
      const allRes  = await fetch(`${url}/rest/v1/vehicles?select=status&is.deleted_at=null`, { headers:{apikey:key,Authorization:`Bearer ${key}`} })
      const allData = await allRes.json() as Array<{status:string}>
      setStats({
        total:   allData.length,
        pending: allData.filter(v=>v.status==='PENDING').length,
        active:  allData.filter(v=>['ACTIVE','APPROVED'].includes(v.status)).length,
        rejected:allData.filter(v=>v.status==='REJECTED').length,
      })
    } catch(e) { setError((e as Error).message) }
    finally { setLoading(false) }
  },[filter])

  useEffect(()=>{ void load() },[load])

  return (
    <AppShell>
      {selected && <ReviewModal v={selected} onClose={()=>setSelected(null)} onDone={()=>{ setSelected(null); void load() }}/>}

      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Administration des véhicules</h1>
          <p className="text-xs text-slate-400 mt-1">Table: vehicles · TAXIMETER.GOV</p>
        </div>
        <button onClick={()=>void load()} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-400 hover:border-qc-blue">
          <RefreshCw size={13}/> Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 mb-4 grid grid-cols-4 gap-2">
        {[
          {label:'Total',      val:stats.total,   color:'text-blue-400',   bg:'bg-blue-500/10'  },
          {label:'En attente', val:stats.pending,  color:'text-amber-400',  bg:'bg-amber-500/10' },
          {label:'Actifs',     val:stats.active,   color:'text-green-400',  bg:'bg-green-500/10' },
          {label:'Refusés',    val:stats.rejected, color:'text-red-400',    bg:'bg-red-500/10'   },
        ].map(s=>(
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-white/5`}>
            <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
            <div className="text-[9px] text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alerte véhicules en attente */}
      {stats.pending > 0 && (
        <div className="mx-4 mb-4 flex items-center gap-3 p-3 rounded-xl bg-amber-500/8 border border-amber-500/25 border-l-4 border-l-amber-500">
          <Clock size={15} className="text-amber-400 shrink-0"/>
          <div>
            <div className="text-xs font-bold text-amber-400">{stats.pending} véhicule(s) en attente de vérification</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Cliquez sur un véhicule pour approuver ou refuser</div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="px-4 mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map(f=>(
          <button key={f.key} onClick={()=>setFilter(f.key)} style={{
            padding:'7px 14px',borderRadius:20,fontSize:11,fontWeight:700,
            border:'none',cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.15s',
            background:filter===f.key?'#003DA5':'rgba(255,255,255,0.06)',
            color:filter===f.key?'#FFFFFF':'#94A3B8',
            boxShadow:filter===f.key?'0 4px 12px rgba(0,61,165,0.30)':'none',
          }}>{f.label}</button>
        ))}
      </div>

      {/* Liste */}
      <div className="px-4 pb-8 space-y-3">
        {loading && <div className="py-12 text-center"><RefreshCw size={20} className="mx-auto animate-spin text-qc-blue"/></div>}
        {error && <Card className="p-4 text-center text-sm text-red-400">{error}</Card>}
        {!loading && vehicles.length===0 && (
          <Card className="py-12 text-center">
            <Car size={32} className="mx-auto mb-3 text-slate-500"/>
            <p className="text-sm text-slate-400">Aucun véhicule {filter?'avec ce filtre':'enregistré'}</p>
          </Card>
        )}

        {vehicles.map(v => {
          const sc = STATUS_CONF[v.status] ?? STATUS_CONF['PENDING']!
          const needsReview = v.status==='PENDING'
          return (
            <Card key={v.id} className={`p-4 cursor-pointer hover:border-qc-blue transition-colors ${needsReview?'border-l-4 border-l-amber-500':v.status==='ACTIVE'||v.status==='APPROVED'?'border-l-4 border-l-green-500':v.status==='REJECTED'?'border-l-4 border-l-red-500':''}`}
              onClick={()=>setSelected(v)}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-xl shrink-0">
                  {FUEL_ICON[v.fuel_type]??'🚗'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-white">{v.year} {v.make} {v.model}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${sc.cls}`}>{sc.label}</span>
                    {v.is_active && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20">ACTIF</span>}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    👤 {v.driver_profiles?.first_name} {v.driver_profiles?.last_name} · {v.driver_profiles?.driver_number}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                    <span className="font-mono">{v.license_plate_masked}</span>
                    <span>{v.color} · {v.seating_capacity}p</span>
                    <span>{v.vehicle_number}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Soumis: {fmtDate(v.created_at)}</div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {needsReview && <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg"><Clock size={9}/> Vérifier</div>}
                  {(v.status==='ACTIVE'||v.status==='APPROVED') && <CheckCircle size={15} className="text-green-400"/>}
                  {v.status==='REJECTED'   && <XCircle size={15} className="text-red-400"/>}
                  {v.status==='SUSPENDED'  && <AlertTriangle size={15} className="text-purple-400"/>}
                  <ChevronRight size={14} className="text-slate-500"/>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </AppShell>
  )
}
