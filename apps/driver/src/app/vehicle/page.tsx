'use client'
import { AppShell } from '@/components/layout/AppShell'
import { TaximetreGovLoader } from '@/components/brand/Logo'
import { useDriverProfile } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import { getThemeTokens, cardStyle, cardAccentStyle, SectionTitle } from '@/lib/theme-helpers'
import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Car, CheckCircle, Plus, X } from 'lucide-react'
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
interface Inspection   { status:string; inspection_date:string; expiry_date:string; passed:boolean; certificate_ref:string }
interface Registration { status:string; valid_from:string; valid_until:string; registration_last4:string }

// ─── Constantes ───────────────────────────────────────────────
const MAKES = ['Toyota','Honda','Nissan','Ford','Chevrolet','Kia','Hyundai','Mazda','Subaru','BMW','Mercedes','Audi','Volkswagen','Dodge','Tesla','Mitsubishi','Acura','Lexus','Volvo','Autre']
const VEHICLE_TYPES = [{v:'SEDAN',l:'Berline'},{v:'SUV',l:'VUS'},{v:'MINIVAN',l:'Minivan'},{v:'HATCHBACK',l:'Hatchback'},{v:'PICKUP',l:'Camionnette'},{v:'COUPE',l:'Coupé'}]
const FUEL_TYPES    = [{v:'GASOLINE',l:'Essence'},{v:'HYBRID',l:'Hybride'},{v:'ELECTRIC',l:'Électrique'},{v:'DIESEL',l:'Diesel'}]
const FUEL_ICON: Record<string,string> = { GASOLINE:'⛽', HYBRID:'🔋', ELECTRIC:'⚡', DIESEL:'🛢️', GAS:'⛽', DEFAULT:'⛽' }
const STATUS_COLOR: Record<string,string> = { ACTIVE:'#059669', INACTIVE:'#4A6A9A', SUSPENDED:'#DC2626', PENDING:'#B45309', APPROVED:'#059669', REJECTED:'#DC2626' }
const STATUS_LABEL: Record<string,string> = { ACTIVE:'Actif', PENDING:'En attente', APPROVED:'Approuvé', REJECTED:'Rejeté', SUSPENDED:'Suspendu', INACTIVE:'Inactif' }

function fmtDate(d:string|null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-CA',{year:'numeric',month:'short',day:'numeric'}).format(new Date(d))
}

// ─── Wizard ajout véhicule ────────────────────────────────────
const STEPS = [
  {id:1, icon:'🚗', title:'Informations du véhicule'},
  {id:2, icon:'🔢', title:'Plaque & Identification'},
  {id:3, icon:'📋', title:'Confirmer & Soumettre'},
]

function AddVehicleWizard({ t, dark, token, onClose, onSaved }: {
  t:ReturnType<typeof getThemeTokens>; dark:boolean; token:string; onClose:()=>void; onSaved:()=>void
}) {
  const [step,setStep]       = useState(1)
  const [saving,setSaving]   = useState(false)
  const [error,setError]     = useState<string|null>(null)
  const [success,setSuccess] = useState(false)
  const [form,setForm] = useState({
    make:'', model:'', year:new Date().getFullYear()-1, color:'',
    vehicleType:'SEDAN', fuelType:'GASOLINE',
    licensePlateMasked:'', vinLastFour:'', seatingCapacity:4,
  })
  const set = (k:string, v:unknown) => setForm(f=>({...f,[k]:v}))
  const isValid = (s:number) => s===1 ? !!(form.make && form.model && form.year && form.color) : s===2 ? form.licensePlateMasked.length>=3 : true

  async function save() {
    setSaving(true); setError(null)
    try {
      const res  = await fetch('/api/driver/vehicles', {
        method:'POST',
        headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
        body: JSON.stringify({ make:form.make, model:form.model, year:form.year, color:form.color, vehicleType:form.vehicleType, fuelType:form.fuelType, licensePlateMasked:form.licensePlateMasked.toUpperCase(), vinLastFour:form.vinLastFour||undefined, seatingCapacity:form.seatingCapacity }),
      })
      const json = await res.json() as {ok:boolean;error?:string}
      if (!json.ok) throw new Error(json.error)
      setSuccess(true)
      setTimeout(()=>{ onSaved(); onClose() }, 2000)
    } catch(e) { setError((e as Error).message) }
    finally { setSaving(false) }
  }

  const cs = { borderRadius:16, background:dark?'rgba(255,255,255,0.04)':'rgba(0,61,165,0.04)', border:`1.5px solid ${t.border}`, padding:'16px' }
  const inp = (label:string, value:string|number, onChange:(v:string)=>void, type='text', placeholder='') => (
    <div>
      <div style={{fontSize:11,color:t.text3,fontWeight:600,marginBottom:5}}>{label}</div>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:'100%',padding:'11px 13px',borderRadius:10,border:`1.5px solid ${t.border}`,fontSize:13,color:t.text,background:dark?'rgba(5,14,28,0.8)':'#FFFFFF',outline:'none',boxSizing:'border-box' as const}}/>
    </div>
  )

  return (
    <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'flex-end',background:'rgba(0,0,0,0.72)'}} onClick={onClose}>
      <div style={{width:'100%',maxHeight:'94vh',overflowY:'auto',background:dark?'#0F1F38':'#FFFFFF',borderRadius:'20px 20px 0 0'}} onClick={e=>e.stopPropagation()}>
        {/* Handle + header */}
        <div style={{padding:'16px',position:'sticky',top:0,background:dark?'#0F1F38':'#FFFFFF',zIndex:10,borderBottom:`1px solid ${t.border}`}}>
          <div style={{width:40,height:4,borderRadius:2,background:t.border,margin:'0 auto 14px'}}/>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:t.text}}>{success?'✅ Véhicule soumis!':`${STEPS[step-1]!.icon} ${STEPS[step-1]!.title}`}</div>
              {!success&&<div style={{fontSize:10,color:t.text3,marginTop:2}}>Étape {step}/3</div>}
            </div>
            <button onClick={onClose} style={{padding:8,borderRadius:10,background:t.card2,border:`1px solid ${t.border}`,cursor:'pointer'}}><X size={16} color={t.text3}/></button>
          </div>
          {!success&&(
            <div style={{display:'flex',gap:4,marginTop:12}}>
              {STEPS.map(s=><div key={s.id} style={{flex:1,height:3,borderRadius:2,background:step>=s.id?'#003DA5':t.border,transition:'background 0.3s'}}/>)}
            </div>
          )}
        </div>

        {success ? (
          <div style={{padding:'48px 24px',textAlign:'center'}}>
            <div style={{width:64,height:64,borderRadius:'50%',background:'rgba(5,150,105,0.15)',border:'2px solid rgba(5,150,105,0.40)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
              <CheckCircle size={28} color="#059669"/>
            </div>
            <div style={{fontSize:18,fontWeight:800,color:t.text,marginBottom:6}}>Véhicule soumis!</div>
            <div style={{fontSize:12,color:t.text3,lineHeight:1.5}}>En attente d'approbation.<br/>Vous recevrez une notification.</div>
          </div>
        ) : (
          <div style={{padding:'16px',display:'flex',flexDirection:'column' as const,gap:14}}>
            {/* Étape 1 */}
            {step===1&&(
              <>
                <div style={cs}>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.10em',textTransform:'uppercase' as const,color:t.text3,marginBottom:10}}>Fabricant</div>
                  <div style={{display:'flex',flexWrap:'wrap' as const,gap:6,marginBottom:10}}>
                    {MAKES.slice(0,10).map(m=>(
                      <button key={m} onClick={()=>set('make',m)} style={{padding:'5px 12px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer',background:form.make===m?'#003DA5':'transparent',color:form.make===m?'white':t.text3,border:`1.5px solid ${form.make===m?'#003DA5':t.border}`}}>{m}</button>
                    ))}
                  </div>
                  <input value={form.make} onChange={e=>set('make',e.target.value)} placeholder="Ou tapez le fabricant…"
                    style={{width:'100%',padding:'10px 13px',borderRadius:10,border:`1.5px solid ${t.border}`,fontSize:13,color:t.text,background:dark?'rgba(5,14,28,0.8)':'#FFFFFF',outline:'none',boxSizing:'border-box' as const}}/>
                </div>
                <div style={cs}>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.10em',textTransform:'uppercase' as const,color:t.text3,marginBottom:12}}>Détails</div>
                  <div style={{display:'flex',flexDirection:'column' as const,gap:12}}>
                    {inp('Modèle *',form.model,v=>set('model',v),'text','Ex: Prius, Civic...')}
                    {inp('Année *',form.year,v=>set('year',parseInt(v)||new Date().getFullYear()-1),'number','2022')}
                    {inp('Couleur *',form.color,v=>set('color',v),'text','Ex: Blanc, Noir...')}
                  </div>
                </div>
                <div style={cs}>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.10em',textTransform:'uppercase' as const,color:t.text3,marginBottom:10}}>Type & Carburant</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap' as const,marginBottom:10}}>
                    {VEHICLE_TYPES.map(vt=>(
                      <button key={vt.v} onClick={()=>set('vehicleType',vt.v)} style={{padding:'7px 12px',borderRadius:12,fontSize:11,fontWeight:700,cursor:'pointer',background:form.vehicleType===vt.v?'rgba(0,61,165,0.15)':'transparent',color:form.vehicleType===vt.v?t.accent:t.text3,border:`1.5px solid ${form.vehicleType===vt.v?t.accent:t.border}`}}>{vt.l}</button>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    {FUEL_TYPES.map(ft=>(
                      <button key={ft.v} onClick={()=>set('fuelType',ft.v)} style={{flex:1,padding:'7px 4px',borderRadius:12,fontSize:10,fontWeight:700,cursor:'pointer',textAlign:'center' as const,background:form.fuelType===ft.v?'rgba(0,61,165,0.15)':'transparent',color:form.fuelType===ft.v?t.accent:t.text3,border:`1.5px solid ${form.fuelType===ft.v?t.accent:t.border}`}}>{FUEL_ICON[ft.v]} {ft.l}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {/* Étape 2 */}
            {step===2&&(
              <div style={cs}>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.10em',textTransform:'uppercase' as const,color:t.text3,marginBottom:14}}>🔢 Plaque & Identification</div>
                <div style={{display:'flex',flexDirection:'column' as const,gap:12}}>
                  {inp("Plaque d'immatriculation *",form.licensePlateMasked,v=>set('licensePlateMasked',v.toUpperCase()),'text','Ex: ABC-1234')}
                  {inp('4 derniers du VIN (optionnel)',form.vinLastFour??'',v=>set('vinLastFour',v),'text','Ex: 3X9F')}
                  <div>
                    <div style={{fontSize:11,color:t.text3,fontWeight:600,marginBottom:5}}>Capacité passagers</div>
                    <div style={{display:'flex',gap:6}}>
                      {[2,3,4,5,6,7,8].map(n=>(
                        <button key={n} onClick={()=>set('seatingCapacity',n)} style={{flex:1,padding:'9px 0',borderRadius:10,fontSize:12,fontWeight:800,cursor:'pointer',background:form.seatingCapacity===n?'#003DA5':'transparent',color:form.seatingCapacity===n?'white':t.text3,border:`1.5px solid ${form.seatingCapacity===n?'#003DA5':t.border}`}}>{n}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Étape 3 — Confirmation */}
            {step===3&&(
              <>
                <div style={cs}>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.10em',textTransform:'uppercase' as const,color:t.text3,marginBottom:12}}>📋 Récapitulatif</div>
                  {[
                    {label:'Véhicule',  val:`${form.year} ${form.make} ${form.model}`},
                    {label:'Couleur',   val:form.color},
                    {label:'Type',      val:VEHICLE_TYPES.find(v=>v.v===form.vehicleType)?.l??form.vehicleType},
                    {label:'Carburant', val:FUEL_TYPES.find(v=>v.v===form.fuelType)?.l??form.fuelType},
                    {label:'Plaque',    val:form.licensePlateMasked.toUpperCase()},
                    {label:'Passagers', val:`${form.seatingCapacity} places`},
                  ].map((r,idx)=>(
                    <div key={r.label} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderTop:idx>0?`1px solid ${t.border}`:'none'}}>
                      <span style={{fontSize:11,color:t.text3}}>{r.label}</span>
                      <span style={{fontSize:11,fontWeight:700,color:t.text}}>{r.val}</span>
                    </div>
                  ))}
                </div>
                <div style={{padding:'10px 13px',borderRadius:10,background:'rgba(180,83,9,0.08)',border:'1px solid rgba(180,83,9,0.25)'}}>
                  <div style={{fontSize:10,color:t.amber,lineHeight:1.5}}>⏳ Votre véhicule sera en attente d'approbation par un agent TAXIMETER.GOV.</div>
                </div>
                {error&&<div style={{fontSize:11,color:t.red,padding:'8px 12px',borderRadius:8,background:'rgba(220,38,38,0.08)'}}>{error}</div>}
              </>
            )}
            {/* Boutons nav */}
            <div style={{display:'flex',gap:10}}>
              {step>1&&<button onClick={()=>setStep(s=>s-1)} style={{flex:1,padding:'12px',borderRadius:12,background:t.card2,border:`1px solid ${t.border}`,color:t.text3,fontWeight:700,cursor:'pointer',fontSize:13}}>← Retour</button>}
              {step<3
                ? <button onClick={()=>isValid(step)?setStep(s=>s+1):setError('Remplissez tous les champs obligatoires')} style={{flex:2,padding:'12px',borderRadius:12,background:'#003DA5',color:'white',fontWeight:800,fontSize:13,border:'none',cursor:'pointer',boxShadow:'0 4px 12px rgba(0,61,165,0.30)'}}>Suivant →</button>
                : <button onClick={()=>void save()} disabled={saving} style={{flex:2,padding:'12px',borderRadius:12,background:saving?t.border:'#059669',color:saving?t.text3:'white',fontWeight:800,fontSize:13,border:'none',cursor:saving?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                    {saving?<><RefreshCw size={14} style={{animation:'spin 0.8s linear infinite'}}/> Soumission…</>:<>🚗 Enregistrer</>}
                  </button>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────
export default function VehiclePage() {
  const { profile } = useDriverProfile()
  const [tab,setTab]             = useState<'list'|'detail'>('list')
  const [vehicles,setVehicles]   = useState<Vehicle[]>([])
  const [vehicle,setVehicle]     = useState<Vehicle|null>(null)   // 1er actif
  const [inspection,setInspection]   = useState<Inspection|null>(null)
  const [registration,setRegistration] = useState<Registration|null>(null)
  const [loading,setLoading]     = useState(true)
  const [showWizard,setShowWizard] = useState(false)
  const [token,setToken]         = useState('')
  const [toast,setToast]         = useState<string|null>(null)
  const { theme } = useTheme()
  const dark = theme==='dark'
  const t = getThemeTokens(dark)

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(null),3500) }

  const load = useCallback(async () => {
    setLoading(true)
    const sb = getSupabaseBrowserClient()
    const { data:{session} } = await sb.auth.getSession()
    if (session?.access_token) setToken(session.access_token)
    if (!profile?.id) { setLoading(false); return }

    // Tous les véhicules
    const { data:vList } = await sb.from('vehicles').select('*').eq('driver_id',profile.id).is('deleted_at',null).order('created_at',{ascending:false})
    setVehicles(vList??[])

    // Véhicule actif pour le détail + inspection + immat
    const active = (vList??[]).find(v=>v.is_active) ?? vList?.[0] ?? null
    setVehicle(active)
    if (active) {
      const [i,r] = await Promise.all([
        sb.from('vehicle_inspections').select('*').eq('driver_id',profile.id).order('inspection_date',{ascending:false}).limit(1).single(),
        sb.from('vehicle_registrations').select('*').eq('driver_id',profile.id).single(),
      ])
      setInspection(i.data)
      setRegistration(r.data)
    }
    setLoading(false)
  },[profile?.id])

  async function setActive(vehicleId:string) {
    const sb = getSupabaseBrowserClient()
    await Promise.all((vehicles).map(v =>
      sb.from('vehicles').update({is_active:v.id===vehicleId}).eq('id',v.id)
    ))
    setVehicles(prev=>prev.map(v=>({...v,is_active:v.id===vehicleId})))
    setVehicle(vehicles.find(v=>v.id===vehicleId)??null)
    showToast('✅ Véhicule actif mis à jour')
  }

  useEffect(()=>{ void load() },[load])

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
      {toast&&<div style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',zIndex:400,background:'#003DA5',color:'white',padding:'10px 20px',borderRadius:14,fontSize:12,fontWeight:700,boxShadow:'0 4px 20px rgba(0,61,165,0.40)',maxWidth:'90%',textAlign:'center' as const}}>{toast}</div>}
      {showWizard&&<AddVehicleWizard t={t} dark={dark} token={token} onClose={()=>setShowWizard(false)} onSaved={()=>{ showToast('🚗 Véhicule soumis!'); void load() }}/>}

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
          <button onClick={()=>void load()} style={{width:38,height:38,borderRadius:12,background:t.card,border:`1.5px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
            <RefreshCw size={16} color={t.accent}/>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,padding:'0 16px 14px'}}>
        {[{k:'list' as const,l:'🚗 Mes véhicules'},{k:'detail' as const,l:'📋 Détails & Certifications'}].map(tb=>(
          <button key={tb.k} onClick={()=>setTab(tb.k)} style={{
            flex:1,padding:'9px 8px',borderRadius:12,fontSize:11,fontWeight:700,border:'none',cursor:'pointer',transition:'all 0.15s',
            background:tab===tb.k?'#003DA5':(dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)'),
            color:tab===tb.k?'#FFFFFF':t.text3,
            boxShadow:tab===tb.k?'0 4px 12px rgba(0,61,165,0.30)':'none',
          }}>{tb.l}</button>
        ))}
      </div>

      <div style={{padding:'0 16px',display:'flex',flexDirection:'column' as const,gap:14,paddingBottom:32}}>

        {/* ── TAB: MES VÉHICULES ── */}
        {tab==='list'&&(
          <>
            {vehicles.some(v=>v.status==='PENDING')&&(
              <div style={{padding:'10px 14px',borderRadius:12,background:'rgba(180,83,9,0.08)',border:'1.5px solid rgba(180,83,9,0.25)',borderLeft:'4px solid #B45309'}}>
                <div style={{fontSize:11,fontWeight:700,color:'#B45309',marginBottom:3}}>⏳ Vérification en cours</div>
                <div style={{fontSize:10,color:t.text2}}>Un ou plusieurs véhicules sont en attente d'approbation TAXIMETER.GOV.</div>
              </div>
            )}

            {vehicles.length===0 ? (
              <div style={{...cardStyle(t),padding:'48px 20px',textAlign:'center'}}>
                <Car size={44} color={t.text3} style={{margin:'0 auto 14px',display:'block'}}/>
                <div style={{fontSize:14,fontWeight:700,color:t.text,marginBottom:6}}>Aucun véhicule enregistré</div>
                <div style={{fontSize:12,color:t.text3,marginBottom:20}}>Ajoutez votre véhicule pour activer le service.</div>
                <button onClick={()=>setShowWizard(true)} style={{padding:'11px 22px',borderRadius:14,background:'#003DA5',color:'white',fontWeight:700,fontSize:13,border:'none',cursor:'pointer',boxShadow:'0 4px 16px rgba(0,61,165,0.35)',display:'flex',alignItems:'center',gap:8,margin:'0 auto'}}>
                  <Plus size={15}/> Ajouter mon véhicule
                </button>
              </div>
            ) : vehicles.map(v=>{
              const sc = STATUS_COLOR[v.status]??'#4A6A9A'
              const sl = STATUS_LABEL[v.status]??v.status
              return (
                <div key={v.id} style={{...cardStyle(t),padding:'16px',borderLeft:`4px solid ${v.is_active?'#003DA5':sc}`}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:12}}>
                    <div style={{width:46,height:46,borderRadius:13,background:v.is_active?'rgba(0,61,165,0.12)':'rgba(255,255,255,0.05)',border:`1px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
                      {FUEL_ICON[v.fuel_type]??'🚗'}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4,flexWrap:'wrap' as const}}>
                        <span style={{fontSize:14,fontWeight:800,color:t.text}}>{v.year} {v.make} {v.model}</span>
                        {v.is_active&&<span style={{fontSize:9,fontWeight:800,padding:'2px 8px',borderRadius:20,background:'rgba(0,61,165,0.15)',color:t.accent,border:`1px solid rgba(0,61,165,0.30)`}}>ACTIF</span>}
                        <span style={{fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20,background:`${sc}18`,color:sc,border:`1px solid ${sc}40`}}>{sl}</span>
                      </div>
                      <div style={{fontSize:11,color:t.text3}}>{v.license_plate_masked} · {v.color} · {v.seating_capacity}p</div>
                      <div style={{fontSize:10,color:t.text3,marginTop:2,fontFamily:'monospace'}}>{v.vehicle_number}</div>
                    </div>
                  </div>
                  {!v.is_active&&(v.status==='ACTIVE'||v.status==='APPROVED')&&(
                    <button onClick={()=>void setActive(v.id)} style={{width:'100%',padding:'9px',borderRadius:11,background:'rgba(0,61,165,0.08)',border:`1.5px solid rgba(0,61,165,0.25)`,color:t.accent,fontWeight:700,fontSize:12,cursor:'pointer'}}>
                      🔄 Utiliser ce véhicule
                    </button>
                  )}
                  {v.status==='PENDING'&&<div style={{fontSize:10,color:'#B45309',textAlign:'center' as const,fontStyle:'italic'}}>En attente de vérification administrative</div>}
                  {v.status==='REJECTED'&&<div style={{fontSize:10,color:t.red,textAlign:'center' as const,fontStyle:'italic'}}>❌ Refusé — Contactez le support</div>}
                </div>
              )
            })}
          </>
        )}

        {/* ── TAB: DÉTAILS & CERTIFICATIONS ── */}
        {tab==='detail'&&(
          !vehicle ? (
            <div style={{...cardStyle(t),padding:'48px 0',textAlign:'center'}}>
              <Car size={44} color={t.text3} style={{margin:'0 auto 12px',display:'block'}}/>
              <div style={{fontSize:14,color:t.text3,fontWeight:500}}>Aucun véhicule actif</div>
              <button onClick={()=>setTab('list')} style={{marginTop:12,padding:'9px 18px',borderRadius:12,background:'#003DA5',color:'white',fontWeight:700,fontSize:12,border:'none',cursor:'pointer'}}>
                Voir mes véhicules →
              </button>
            </div>
          ) : (
            <>
              {/* Carte hero */}
              <div style={{background:'linear-gradient(135deg,#003DA5 0%,#0B4F71 100%)',borderRadius:20,padding:'20px 18px',boxShadow:'0 8px 28px rgba(0,61,165,0.30)',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:-10,right:8,fontSize:100,color:'rgba(255,255,255,0.05)',pointerEvents:'none'}}>⚜</div>
                <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
                  <div style={{width:52,height:52,borderRadius:16,background:'rgba(255,255,255,0.12)',border:'2px solid rgba(255,255,255,0.20)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>
                    {FUEL_ICON[vehicle.fuel_type]??FUEL_ICON.DEFAULT}
                  </div>
                  <div>
                    <div style={{fontSize:20,fontWeight:800,color:'white',lineHeight:1.1}}>{vehicle.make} {vehicle.model}</div>
                    <div style={{fontSize:12,color:'rgba(255,255,255,0.60)',marginTop:2}}>{vehicle.year} · {vehicle.color}</div>
                    <div style={{display:'flex',alignItems:'center',gap:5,marginTop:5}}>
                      <div style={{width:7,height:7,borderRadius:'50%',background:STATUS_COLOR[vehicle.status]??'#4A6A9A'}}/>
                      <span style={{fontSize:11,fontWeight:700,color:STATUS_COLOR[vehicle.status]??'#4A6A9A'}}>
                        {STATUS_LABEL[vehicle.status]??vehicle.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {[
                    {label:'Plaque',       val:vehicle.license_plate_masked},
                    {label:'Type',         val:VEHICLE_TYPES.find(vt=>vt.v===vehicle.vehicle_type)?.l??vehicle.vehicle_type},
                    {label:'Carburant',    val:FUEL_TYPES.find(ft=>ft.v===vehicle.fuel_type)?.l??vehicle.fuel_type},
                    {label:'Passagers max.',val:String(vehicle.seating_capacity)},
                  ].map(row=>(
                    <div key={row.label} style={{background:'rgba(255,255,255,0.09)',borderRadius:10,padding:'9px 10px',border:'1px solid rgba(255,255,255,0.12)'}}>
                      <div style={{fontSize:9,color:'rgba(255,255,255,0.50)',fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'0.06em',marginBottom:3}}>{row.label}</div>
                      <div style={{fontSize:12,fontWeight:700,color:'white'}}>{row.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Taximètre */}
              <div style={{...cardAccentStyle(t),padding:'14px 16px'}}>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.10em',textTransform:'uppercase' as const,color:t.text3,marginBottom:10}}>📟 Taximètre</div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:t.text}}>Série: {vehicle.taximeter_serial_masked??'—'}</div>
                    <div style={{fontSize:11,color:t.text3,marginTop:3}}>Statut: {vehicle.taximeter_status}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:5}}>
                    <CheckCircle size={16} color={vehicle.taximeter_status==='CERTIFIED'?t.green:t.amber}/>
                    <span style={{fontSize:12,fontWeight:700,color:vehicle.taximeter_status==='CERTIFIED'?t.green:t.amber}}>
                      {vehicle.taximeter_status==='CERTIFIED'?'Certifié':vehicle.taximeter_status==='NOT_INSTALLED'?'Non installé':'En attente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inspection */}
              {inspection&&(
                <div>
                  <SectionTitle title="Dernière inspection" t={t}/>
                  <div style={{...cardStyle(t),padding:'14px 16px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:t.text}}>Réf: {inspection.certificate_ref}</div>
                        <div style={{fontSize:11,color:t.text3,marginTop:4}}>Date: {fmtDate(inspection.inspection_date)}</div>
                        <div style={{fontSize:11,color:t.text3,marginTop:2}}>Expiration: {fmtDate(inspection.expiry_date)}</div>
                      </div>
                      <div style={{padding:'4px 12px',borderRadius:20,background:inspection.passed?'rgba(5,150,105,0.12)':'rgba(220,38,38,0.10)',border:`1px solid ${inspection.passed?'rgba(5,150,105,0.25)':'rgba(220,38,38,0.25)'}`}}>
                        <span style={{fontSize:11,fontWeight:700,color:inspection.passed?t.green:t.red}}>
                          {inspection.passed?'✓ Réussie':'✗ Échec'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Immatriculation */}
              {registration&&(
                <div>
                  <SectionTitle title="Immatriculation" t={t}/>
                  <div style={{...cardStyle(t),padding:'14px 16px'}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                      {[
                        {label:'Statut',          val:registration.status},
                        {label:'No. (4 derniers)', val:registration.registration_last4},
                        {label:'Valide depuis',   val:fmtDate(registration.valid_from)},
                        {label:"Valide jusqu'au", val:fmtDate(registration.valid_until)},
                      ].map(row=>(
                        <div key={row.label}>
                          <div style={{fontSize:9,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'0.06em',color:t.text3,marginBottom:3}}>{row.label}</div>
                          <div style={{fontSize:13,fontWeight:700,color:t.text}}>{row.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )
        )}
      </div>
    </AppShell>
  )
}
