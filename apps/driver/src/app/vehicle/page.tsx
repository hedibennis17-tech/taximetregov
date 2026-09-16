'use client'
import { AppShell } from '@/components/layout/AppShell'
import { TaximetreGovLoader } from '@/components/brand/Logo'
import { useTheme } from '@/lib/theme'
import { getThemeTokens, cardStyle, SectionTitle } from '@/lib/theme-helpers'
import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, CheckCircle, Clock, XCircle, AlertTriangle, Plus, Car, ChevronRight, X } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────
interface Vehicle {
  id:string; vehicle_number:string; make:string; model:string; year:number
  color:string; vehicle_type:string; fuel_type:string
  license_plate_masked:string; vin_last_four:string|null
  seating_capacity:number; status:string; vehicle_status:string
  is_active:boolean; taximeter_status:string
  taximeter_serial_masked:string|null; notes:string|null; created_at:string
}

// ─── Constantes ───────────────────────────────────────────────
const MAKES = ['Toyota','Honda','Nissan','Ford','Chevrolet','Kia','Hyundai','Mazda','Subaru','BMW','Mercedes','Audi','Volkswagen','Dodge','Chrysler','Jeep','Ram','GMC','Cadillac','Tesla','Mitsubishi','Infiniti','Acura','Lexus','Volvo','Autre']
const VEHICLE_TYPES = [{v:'SEDAN',l:'Berline'},{v:'SUV',l:'VUS'},{v:'MINIVAN',l:'Minivan'},{v:'HATCHBACK',l:'Hatchback'},{v:'PICKUP',l:'Camionnette'},{v:'COUPE',l:'Coupé'}]
const FUEL_TYPES   = [{v:'GASOLINE',l:'Essence'},{v:'HYBRID',l:'Hybride'},{v:'ELECTRIC',l:'Électrique'},{v:'DIESEL',l:'Diesel'}]

const STATUS_CONF: Record<string,{label:string;color:string;bg:string;bdr:string;icon:string}> = {
  PENDING:   {label:'En attente admin',  color:'#B45309', bg:'rgba(180,83,9,0.10)',   bdr:'rgba(180,83,9,0.25)',   icon:'⏳'},
  ACTIVE:    {label:'Actif',             color:'#059669', bg:'rgba(5,150,105,0.10)',  bdr:'rgba(5,150,105,0.25)',  icon:'✅'},
  APPROVED:  {label:'Approuvé',          color:'#059669', bg:'rgba(5,150,105,0.10)',  bdr:'rgba(5,150,105,0.25)',  icon:'✅'},
  SUSPENDED: {label:'Suspendu',          color:'#7C3AED', bg:'rgba(124,58,237,0.10)',bdr:'rgba(124,58,237,0.25)', icon:'⏸️'},
  REJECTED:  {label:'Rejeté',            color:'#DC2626', bg:'rgba(220,38,38,0.10)',  bdr:'rgba(220,38,38,0.25)',  icon:'❌'},
  INACTIVE:  {label:'Inactif',           color:'#4A6A9A', bg:'rgba(74,106,154,0.10)',bdr:'rgba(74,106,154,0.20)', icon:'⚫'},
}

const FUEL_ICON: Record<string,string> = {GASOLINE:'⛽',HYBRID:'🔋',ELECTRIC:'⚡',DIESEL:'🛢️'}

function fmtDate(d:string) { return new Intl.DateTimeFormat('fr-CA',{year:'numeric',month:'short',day:'numeric'}).format(new Date(d)) }

// ─── Wizard ajout véhicule ────────────────────────────────────
const STEPS = [
  {id:1, icon:'🚗', title:'Informations du véhicule',  fields:['make','model','year','color','vehicleType','fuelType']},
  {id:2, icon:'🔢', title:'Plaque & Immatriculation',  fields:['licensePlateMasked','vinLastFour','seatingCapacity']},
  {id:3, icon:'📋', title:'Confirmer & Soumettre',     fields:[]},
]

function AddVehicleWizard({t,dark,token,onClose,onSaved}:{t:ReturnType<typeof getThemeTokens>;dark:boolean;token:string;onClose:()=>void;onSaved:()=>void}) {
  const [step,setStep]     = useState(1)
  const [saving,setSaving] = useState(false)
  const [error,setError]   = useState<string|null>(null)
  const [success,setSuccess] = useState(false)

  const [form,setForm] = useState({
    make:'', model:'', year: new Date().getFullYear() - 1, color:'',
    vehicleType:'SEDAN', fuelType:'GASOLINE',
    licensePlateMasked:'', vinLastFour:'', seatingCapacity:4,
  })

  const set = (k:string, v:unknown) => setForm(f => ({...f,[k]:v}))

  function isStepValid(s:number) {
    if (s===1) return form.make && form.model && form.year && form.color
    if (s===2) return form.licensePlateMasked.length >= 3
    return true
  }

  async function save() {
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/driver/vehicles', {
        method:'POST',
        headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
        body: JSON.stringify({
          make: form.make, model: form.model, year: form.year, color: form.color,
          vehicleType: form.vehicleType, fuelType: form.fuelType,
          licensePlateMasked: form.licensePlateMasked.toUpperCase(),
          vinLastFour: form.vinLastFour || undefined,
          seatingCapacity: form.seatingCapacity,
        }),
      })
      const json = await res.json() as {ok:boolean;error?:string}
      if (!json.ok) throw new Error(json.error)
      setSuccess(true)
      setTimeout(()=>{ onSaved(); onClose() }, 2000)
    } catch(e) { setError((e as Error).message) }
    finally { setSaving(false) }
  }

  const inp = (label:string, value:string|number, onChange:(v:string)=>void, type='text', placeholder='') => (
    <div>
      <div style={{fontSize:11,color:t.text3,fontWeight:600,marginBottom:5}}>{label}</div>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:'100%',padding:'11px 13px',borderRadius:10,border:`1.5px solid ${t.border}`,fontSize:13,color:t.text,background:dark?'rgba(5,14,28,0.8)':'#FFFFFF',outline:'none',boxSizing:'border-box' as const}}/>
    </div>
  )

  const cs = {borderRadius:16,background:dark?'rgba(255,255,255,0.04)':'rgba(0,61,165,0.04)',border:`1.5px solid ${t.border}`,padding:'16px'}

  return (
    <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'flex-end',background:'rgba(0,0,0,0.72)'}} onClick={onClose}>
      <div style={{width:'100%',maxHeight:'94vh',overflowY:'auto',background:dark?'#0F1F38':'#FFFFFF',borderRadius:'20px 20px 0 0'}} onClick={e=>e.stopPropagation()}>

        {/* Handle + Header */}
        <div style={{padding:'16px',position:'sticky',top:0,background:dark?'#0F1F38':'#FFFFFF',zIndex:10,borderBottom:`1px solid ${t.border}`}}>
          <div style={{width:40,height:4,borderRadius:2,background:t.border,margin:'0 auto 14px'}}/>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:t.text}}>
                {success ? '✅ Véhicule soumis!' : `${STEPS[step-1]!.icon} ${STEPS[step-1]!.title}`}
              </div>
              {!success && <div style={{fontSize:10,color:t.text3,marginTop:2}}>Étape {step}/3</div>}
            </div>
            <button onClick={onClose} style={{padding:8,borderRadius:10,background:t.card2,border:`1px solid ${t.border}`,cursor:'pointer'}}>
              <X size={16} color={t.text3}/>
            </button>
          </div>
          {/* Barre progression */}
          {!success && (
            <div style={{display:'flex',gap:4,marginTop:12}}>
              {STEPS.map(s => (
                <div key={s.id} style={{flex:1,height:3,borderRadius:2,background:step>=s.id?'#003DA5':t.border,transition:'background 0.3s'}}/>
              ))}
            </div>
          )}
        </div>

        {success ? (
          <div style={{padding:'48px 24px',textAlign:'center'}}>
            <div style={{width:64,height:64,borderRadius:'50%',background:'rgba(5,150,105,0.15)',border:'2px solid rgba(5,150,105,0.40)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
              <CheckCircle size={28} color="#059669"/>
            </div>
            <div style={{fontSize:18,fontWeight:800,color:t.text,marginBottom:6}}>Véhicule soumis!</div>
            <div style={{fontSize:13,color:t.text3,lineHeight:1.5}}>En attente d'approbation administrative.<br/>Vous recevrez une notification.</div>
          </div>
        ) : (
          <div style={{padding:'16px',display:'flex',flexDirection:'column',gap:14}}>

            {/* ── Étape 1 ── */}
            {step===1 && (
              <>
                <div style={cs}>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.10em',textTransform:'uppercase' as const,color:t.text3,marginBottom:12}}>Fabricant</div>
                  {/* Pills rapides */}
                  <div style={{display:'flex',flexWrap:'wrap' as const,gap:6,marginBottom:10}}>
                    {MAKES.slice(0,10).map(m => (
                      <button key={m} onClick={()=>set('make',m)} style={{
                        padding:'5px 12px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer',
                        background:form.make===m?'#003DA5':'transparent',
                        color:form.make===m?'white':t.text3,
                        border:`1.5px solid ${form.make===m?'#003DA5':t.border}`,
                      }}>{m}</button>
                    ))}
                  </div>
                  <input value={form.make} onChange={e=>set('make',e.target.value)} placeholder="Ou tapez le fabricant…"
                    style={{width:'100%',padding:'10px 13px',borderRadius:10,border:`1.5px solid ${t.border}`,fontSize:13,color:t.text,background:dark?'rgba(5,14,28,0.8)':'#FFFFFF',outline:'none',boxSizing:'border-box' as const}}/>
                </div>

                <div style={cs}>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.10em',textTransform:'uppercase' as const,color:t.text3,marginBottom:12}}>Détails</div>
                  <div style={{display:'flex',flexDirection:'column' as const,gap:12}}>
                    {inp('Modèle *', form.model, v=>set('model',v), 'text', 'Ex: Prius, Civic, CX-5...')}
                    {inp('Année *',  form.year,  v=>set('year',parseInt(v)||new Date().getFullYear()-1), 'number', '2022')}
                    {inp('Couleur *',form.color, v=>set('color',v), 'text', 'Ex: Blanc, Noir, Gris...')}
                  </div>
                </div>

                <div style={cs}>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.10em',textTransform:'uppercase' as const,color:t.text3,marginBottom:10}}>Type & Carburant</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap' as const,marginBottom:10}}>
                    {VEHICLE_TYPES.map(vt => (
                      <button key={vt.v} onClick={()=>set('vehicleType',vt.v)} style={{
                        padding:'7px 14px',borderRadius:12,fontSize:11,fontWeight:700,cursor:'pointer',
                        background:form.vehicleType===vt.v?'rgba(0,61,165,0.15)':'transparent',
                        color:form.vehicleType===vt.v?t.accent:t.text3,
                        border:`1.5px solid ${form.vehicleType===vt.v?t.accent:t.border}`,
                      }}>{vt.l}</button>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    {FUEL_TYPES.map(ft => (
                      <button key={ft.v} onClick={()=>set('fuelType',ft.v)} style={{
                        flex:1,padding:'7px 6px',borderRadius:12,fontSize:10,fontWeight:700,cursor:'pointer',textAlign:'center' as const,
                        background:form.fuelType===ft.v?'rgba(0,61,165,0.15)':'transparent',
                        color:form.fuelType===ft.v?t.accent:t.text3,
                        border:`1.5px solid ${form.fuelType===ft.v?t.accent:t.border}`,
                      }}>{FUEL_ICON[ft.v]} {ft.l}</button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Étape 2 ── */}
            {step===2 && (
              <div style={cs}>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.10em',textTransform:'uppercase' as const,color:t.text3,marginBottom:14}}>🔢 Plaque & Identification</div>
                <div style={{display:'flex',flexDirection:'column' as const,gap:12}}>
                  {inp('Plaque d\'immatriculation * (masquée)',form.licensePlateMasked,v=>set('licensePlateMasked',v.toUpperCase()),'text','Ex: ABC-1234')}
                  {inp('4 derniers du VIN (optionnel)',form.vinLastFour??'',v=>set('vinLastFour',v),'text','Ex: 3X9F')}
                  <div>
                    <div style={{fontSize:11,color:t.text3,fontWeight:600,marginBottom:5}}>Capacité passagers</div>
                    <div style={{display:'flex',gap:6}}>
                      {[2,3,4,5,6,7,8].map(n => (
                        <button key={n} onClick={()=>set('seatingCapacity',n)} style={{
                          flex:1,padding:'9px 0',borderRadius:10,fontSize:12,fontWeight:800,cursor:'pointer',
                          background:form.seatingCapacity===n?'#003DA5':'transparent',
                          color:form.seatingCapacity===n?'white':t.text3,
                          border:`1.5px solid ${form.seatingCapacity===n?'#003DA5':t.border}`,
                        }}>{n}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Étape 3 — Confirmation ── */}
            {step===3 && (
              <>
                <div style={cs}>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.10em',textTransform:'uppercase' as const,color:t.text3,marginBottom:12}}>📋 Récapitulatif</div>
                  {[
                    {label:'Véhicule',  val:`${form.year} ${form.make} ${form.model}`},
                    {label:'Couleur',   val:form.color},
                    {label:'Type',      val:VEHICLE_TYPES.find(v=>v.v===form.vehicleType)?.l??form.vehicleType},
                    {label:'Carburant', val:FUEL_TYPES.find(v=>v.v===form.fuelType)?.l??form.fuelType},
                    {label:'Plaque',    val:form.licensePlateMasked.toUpperCase()},
                    {label:'VIN (fin)', val:form.vinLastFour||'—'},
                    {label:'Passagers', val:`${form.seatingCapacity} places`},
                  ].map((r,idx) => (
                    <div key={r.label} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderTop:idx>0?`1px solid ${t.border}`:'none'}}>
                      <span style={{fontSize:11,color:t.text3}}>{r.label}</span>
                      <span style={{fontSize:11,fontWeight:700,color:t.text}}>{r.val}</span>
                    </div>
                  ))}
                </div>
                <div style={{padding:'10px 13px',borderRadius:10,background:'rgba(180,83,9,0.08)',border:'1px solid rgba(180,83,9,0.25)'}}>
                  <div style={{fontSize:10,color:t.amber,lineHeight:1.5}}>⏳ Après soumission, votre véhicule sera en attente d'approbation par un agent administratif TAXIMETER.GOV.</div>
                </div>
                {error && <div style={{fontSize:11,color:t.red,padding:'8px 12px',borderRadius:8,background:'rgba(220,38,38,0.08)'}}>{error}</div>}
              </>
            )}

            {/* Boutons navigation */}
            <div style={{display:'flex',gap:10}}>
              {step>1 && (
                <button onClick={()=>setStep(s=>s-1)} style={{flex:1,padding:'12px',borderRadius:12,background:t.card2,border:`1px solid ${t.border}`,color:t.text3,fontWeight:700,cursor:'pointer',fontSize:13}}>
                  ← Retour
                </button>
              )}
              {step<3 ? (
                <button onClick={()=>isStepValid(step)?setStep(s=>s+1):setError('Remplissez tous les champs obligatoires')}
                  style={{flex:2,padding:'12px',borderRadius:12,background:'#003DA5',color:'white',fontWeight:800,fontSize:13,border:'none',cursor:'pointer',boxShadow:'0 4px 12px rgba(0,61,165,0.30)'}}>
                  Suivant →
                </button>
              ) : (
                <button onClick={()=>void save()} disabled={saving} style={{flex:2,padding:'12px',borderRadius:12,background:saving?t.border:'#059669',color:saving?t.text3:'white',fontWeight:800,fontSize:13,border:'none',cursor:saving?'not-allowed':'pointer',boxShadow:saving?'none':'0 4px 12px rgba(5,150,105,0.30)',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                  {saving ? <><RefreshCw size={14} style={{animation:'spin 0.8s linear infinite'}}/> Soumission…</> : <>🚗 Enregistrer le véhicule</>}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────
export default function VehiclePage() {
  const [vehicles,setVehicles]   = useState<Vehicle[]>([])
  const [loading,setLoading]     = useState(true)
  const [showWizard,setShowWizard] = useState(false)
  const [token,setToken]         = useState('')
  const [error,setError]         = useState<string|null>(null)
  const [toast,setToast]         = useState<string|null>(null)
  const { theme } = useTheme()
  const dark = theme==='dark'
  const t = getThemeTokens(dark)

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(null),3500) }

  const loadVehicles = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const sb = getSupabaseBrowserClient()
      const { data:{session} } = await sb.auth.getSession()
      if (!session?.access_token) throw new Error('Non authentifié')
      setToken(session.access_token)
      const res  = await fetch('/api/driver/vehicles', { headers:{ Authorization:`Bearer ${session.access_token}` } })
      const json = await res.json() as {ok:boolean;vehicles:Vehicle[];error?:string}
      if (!json.ok) throw new Error(json.error)
      setVehicles(json.vehicles)
    } catch(e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [])

  async function setActive(vehicleId:string) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url||!key) return
      // Désactiver tous
      await Promise.all(vehicles.map(v =>
        fetch(`${url}/rest/v1/vehicles?id=eq.${v.id}`, {
          method:'PATCH', headers:{'Content-Type':'application/json','apikey':key,'Authorization':`Bearer ${token}`},
          body: JSON.stringify({is_active: v.id===vehicleId}),
        })
      ))
      setVehicles(prev => prev.map(v=>({...v,is_active:v.id===vehicleId})))
      showToast('✅ Véhicule actif mis à jour')
    } catch(e) { showToast('❌ Erreur: '+(e as Error).message) }
  }

  useEffect(()=>{ void loadVehicles() },[loadVehicles])

  if (loading) return (
    <AppShell>
      <div style={{minHeight:'70vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <TaximetreGovLoader message="Chargement des véhicules…"/>
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      {/* Toast */}
      {toast && (
        <div style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',zIndex:400,background:'#003DA5',color:'white',padding:'10px 20px',borderRadius:14,fontSize:12,fontWeight:700,boxShadow:'0 4px 20px rgba(0,61,165,0.40)',maxWidth:'90%',textAlign:'center' as const}}>
          {toast}
        </div>
      )}
      {showWizard && <AddVehicleWizard t={t} dark={dark} token={token} onClose={()=>setShowWizard(false)} onSaved={()=>{ showToast('🚗 Véhicule soumis pour approbation!'); void loadVehicles() }}/>}

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 16px 12px'}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:800,color:t.text,margin:0,letterSpacing:'-0.01em'}}>Mon véhicule</h1>
          <p style={{fontSize:11,color:t.text3,margin:'3px 0 0'}}>Dossier certifié · SAAQ · TAXIMETER.GOV</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>setShowWizard(true)} style={{width:38,height:38,borderRadius:12,background:'#003DA5',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 4px 12px rgba(0,61,165,0.30)'}}>
            <Plus size={18} color="white"/>
          </button>
          <button onClick={()=>void loadVehicles()} style={{width:38,height:38,borderRadius:12,background:t.card,border:`1.5px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
            <RefreshCw size={16} color={t.accent}/>
          </button>
        </div>
      </div>

      <div style={{padding:'0 16px',display:'flex',flexDirection:'column',gap:14,paddingBottom:32}}>
        {error && <div style={{...cardStyle(t),padding:'14px',textAlign:'center',color:t.red,fontSize:12}}>{error}</div>}

        {vehicles.length===0 ? (
          <div style={{...cardStyle(t),padding:'48px 20px',textAlign:'center'}}>
            <Car size={48} color={t.text3} style={{margin:'0 auto 16px',display:'block'}}/>
            <div style={{fontSize:15,fontWeight:700,color:t.text,marginBottom:6}}>Aucun véhicule enregistré</div>
            <div style={{fontSize:12,color:t.text3,marginBottom:20,lineHeight:1.5}}>
              Ajoutez votre véhicule pour activer le service de transport rémunéré.
            </div>
            <button onClick={()=>setShowWizard(true)} style={{padding:'12px 24px',borderRadius:14,background:'#003DA5',color:'white',fontWeight:700,fontSize:13,border:'none',cursor:'pointer',boxShadow:'0 4px 16px rgba(0,61,165,0.35)',display:'flex',alignItems:'center',gap:8,margin:'0 auto'}}>
              <Plus size={16}/> Ajouter mon véhicule
            </button>
          </div>
        ) : (
          <>
            {/* Banner approbation en attente */}
            {vehicles.some(v=>v.status==='PENDING') && (
              <div style={{padding:'10px 14px',borderRadius:12,background:'rgba(180,83,9,0.08)',border:'1.5px solid rgba(180,83,9,0.25)',borderLeft:'4px solid #B45309'}}>
                <div style={{fontSize:11,fontWeight:700,color:'#B45309',marginBottom:3}}>⏳ Vérification en cours</div>
                <div style={{fontSize:10,color:t.text2}}>Un ou plusieurs véhicules sont en attente d'approbation par l'équipe TAXIMETER.GOV.</div>
              </div>
            )}

            {/* Liste véhicules */}
            <SectionTitle title="Mes véhicules" t={t}/>
            {vehicles.map(v => {
              const sc = STATUS_CONF[v.status] ?? STATUS_CONF['PENDING']!
              return (
                <div key={v.id} style={{
                  ...cardStyle(t),
                  borderLeft:`4px solid ${v.is_active?'#003DA5':sc.color}`,
                  padding:'16px',
                }}>
                  {/* Header véhicule */}
                  <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:12}}>
                    <div style={{width:48,height:48,borderRadius:14,background:v.is_active?'rgba(0,61,165,0.12)':'rgba(255,255,255,0.05)',border:`1px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
                      {FUEL_ICON[v.fuel_type]??'🚗'}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap' as const}}>
                        <span style={{fontSize:15,fontWeight:800,color:t.text}}>{v.year} {v.make} {v.model}</span>
                        {v.is_active && <span style={{fontSize:9,fontWeight:800,padding:'2px 8px',borderRadius:20,background:'rgba(0,61,165,0.15)',color:t.accent,border:`1px solid rgba(0,61,165,0.30)`}}>ACTIF</span>}
                        <span style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20,background:sc.bg,color:sc.color,border:`1px solid ${sc.bdr}`}}>{sc.icon} {sc.label}</span>
                      </div>
                      <div style={{fontSize:11,color:t.text3}}>
                        {v.license_plate_masked} · {v.color} · {v.seating_capacity} places
                      </div>
                      <div style={{fontSize:10,color:t.text3,marginTop:2}}>
                        {v.vehicle_number} · Ajouté {fmtDate(v.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Détails */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                    {[
                      {label:'Type',       val:VEHICLE_TYPES.find(vt=>vt.v===v.vehicle_type)?.l??v.vehicle_type},
                      {label:'Carburant',  val:`${FUEL_ICON[v.fuel_type]??''} ${FUEL_TYPES.find(ft=>ft.v===v.fuel_type)?.l??v.fuel_type}`},
                      {label:'VIN (fin)',  val:v.vin_last_four?`••••${v.vin_last_four}`:'—'},
                      {label:'Taximètre', val:v.taximeter_status==='CERTIFIED'?'✅ Certifié':v.taximeter_status==='NOT_INSTALLED'?'Non installé':'En attente'},
                    ].map(r => (
                      <div key={r.label} style={{background:dark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)',borderRadius:10,padding:'8px 10px',border:`1px solid ${t.border}`}}>
                        <div style={{fontSize:9,color:t.text3,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'0.05em',marginBottom:3}}>{r.label}</div>
                        <div style={{fontSize:11,fontWeight:700,color:t.text}}>{r.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  {!v.is_active && v.status==='ACTIVE' && (
                    <button onClick={()=>void setActive(v.id)} style={{width:'100%',padding:'10px',borderRadius:12,background:'rgba(0,61,165,0.10)',border:`1.5px solid rgba(0,61,165,0.25)`,color:t.accent,fontWeight:700,fontSize:12,cursor:'pointer'}}>
                      🔄 Utiliser ce véhicule
                    </button>
                  )}
                  {v.status==='PENDING' && (
                    <div style={{fontSize:10,color:'#B45309',textAlign:'center' as const,fontStyle:'italic'}}>En attente de vérification administrative</div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>
    </AppShell>
  )
}
