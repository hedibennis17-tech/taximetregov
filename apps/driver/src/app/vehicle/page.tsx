'use client'
import { AppShell } from '@/components/layout/AppShell'
import { TaximetreGovLoader } from '@/components/brand/Logo'
import { useDriverProfile } from '@/lib/api'
import { useTheme } from '@/lib/theme'
import { getThemeTokens, cardStyle, cardAccentStyle, SectionTitle } from '@/lib/theme-helpers'
import { useState, useEffect } from 'react'
import { RefreshCw, Car, CheckCircle } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface Vehicle { id:string; make:string; model:string; year:number; color:string; license_plate_masked:string; vehicle_type:string; fuel_type:string; seating_capacity:number; vehicle_status:string; taximeter_status:string; taximeter_serial_masked:string }
interface Inspection { status:string; inspection_date:string; expiry_date:string; passed:boolean; certificate_ref:string }
interface Registration { status:string; valid_from:string; valid_until:string; registration_last4:string }

const FUEL_ICON: Record<string,string> = { ELECTRIC:'⚡', HYBRID:'🔋', GAS:'⛽', DIESEL:'🛢️', DEFAULT:'⛽' }
const STATUS_COLOR: Record<string,string> = { ACTIVE:'#059669', INACTIVE:'#4A6A9A', SUSPENDED:'#DC2626', PENDING:'#B45309' }

function fmtDate(d:string|null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-CA',{year:'numeric',month:'short',day:'numeric'}).format(new Date(d))
}

export default function VehiclePage() {
  const { profile } = useDriverProfile()
  const [vehicle, setVehicle] = useState<Vehicle|null>(null)
  const [inspection, setInspection] = useState<Inspection|null>(null)
  const [registration, setRegistration] = useState<Registration|null>(null)
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const t = getThemeTokens(dark)

  async function load() {
    if (!profile?.id) return
    setLoading(true)
    const sb = getSupabaseBrowserClient()
    const [v, i, r] = await Promise.all([
      sb.from('vehicles').select('*').eq('driver_id', profile.id).single(),
      sb.from('vehicle_inspections').select('*').eq('driver_id', profile.id).order('inspection_date', { ascending:false }).limit(1).single(),
      sb.from('vehicle_registrations').select('*').eq('driver_id', profile.id).single(),
    ])
    setVehicle(v.data)
    setInspection(i.data)
    setRegistration(r.data)
    setLoading(false)
  }

  useEffect(() => { void load() }, [profile?.id])

  if (loading) return (
    <AppShell>
      <div style={{ minHeight:'70vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <TaximetreGovLoader message="Chargement du véhicule…" />
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 16px 12px' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:t.text, margin:0, letterSpacing:'-0.01em' }}>Mon véhicule</h1>
          <p style={{ fontSize:11, color:t.text3, margin:'3px 0 0' }}>Dossier certifié · SAAQ</p>
        </div>
        <button onClick={load} style={{ width:38, height:38, borderRadius:12, background:t.card, border:`1.5px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:t.shadow }}>
          <RefreshCw size={16} color={t.accent} />
        </button>
      </div>

      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:16, paddingBottom:32 }}>
        {!vehicle ? (
          <div style={{ ...cardStyle(t), padding:'48px 0', textAlign:'center' }}>
            <Car size={44} color={t.text3} style={{ margin:'0 auto 12px', display:'block' }} />
            <div style={{ fontSize:14, color:t.text3, fontWeight:500 }}>Aucun véhicule enregistré</div>
          </div>
        ) : (
          <>
            {/* Carte véhicule hero */}
            <div style={{ background:'linear-gradient(135deg,#003DA5 0%,#0B4F71 100%)', borderRadius:20, padding:'20px 18px', boxShadow:'0 8px 28px rgba(0,61,165,0.30)', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:-10, right:8, fontSize:100, color:'rgba(255,255,255,0.05)', pointerEvents:'none' }}>⚜</div>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                <div style={{ width:52, height:52, borderRadius:16, background:'rgba(255,255,255,0.12)', border:'2px solid rgba(255,255,255,0.20)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>
                  {FUEL_ICON[vehicle.fuel_type] ?? FUEL_ICON.DEFAULT}
                </div>
                <div>
                  <div style={{ fontSize:20, fontWeight:800, color:'white', lineHeight:1.1 }}>
                    {vehicle.make} {vehicle.model}
                  </div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.60)', marginTop:2 }}>{vehicle.year} · {vehicle.color}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:STATUS_COLOR[vehicle.vehicle_status] ?? '#4A6A9A' }} />
                    <span style={{ fontSize:11, fontWeight:700, color:STATUS_COLOR[vehicle.vehicle_status] ?? '#4A6A9A' }}>
                      {vehicle.vehicle_status}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  { label:'Plaque',          val:vehicle.license_plate_masked },
                  { label:'Type',            val:vehicle.vehicle_type },
                  { label:'Carburant',       val:vehicle.fuel_type },
                  { label:'Passagers max.',  val:String(vehicle.seating_capacity) },
                ].map(row => (
                  <div key={row.label} style={{ background:'rgba(255,255,255,0.09)', borderRadius:10, padding:'9px 10px', border:'1px solid rgba(255,255,255,0.12)' }}>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.50)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>{row.label}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:'white' }}>{row.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Taximètre */}
            <div style={{ ...cardAccentStyle(t), padding:'14px 16px' }}>
              <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.10em', textTransform:'uppercase', color:t.text3, marginBottom:10 }}>📟 Taximètre</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:t.text }}>Série: {vehicle.taximeter_serial_masked}</div>
                  <div style={{ fontSize:11, color:t.text3, marginTop:3 }}>Statut: {vehicle.taximeter_status}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <CheckCircle size={16} color={vehicle.taximeter_status === 'CERTIFIED' ? t.green : t.amber} />
                  <span style={{ fontSize:12, fontWeight:700, color:vehicle.taximeter_status === 'CERTIFIED' ? t.green : t.amber }}>
                    {vehicle.taximeter_status === 'CERTIFIED' ? 'Certifié' : vehicle.taximeter_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Inspection */}
            {inspection && (
              <div>
                <SectionTitle title="Dernière inspection" t={t} />
                <div style={{ ...cardStyle(t), padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:t.text }}>
                        Réf: {inspection.certificate_ref}
                      </div>
                      <div style={{ fontSize:11, color:t.text3, marginTop:4 }}>
                        Date: {fmtDate(inspection.inspection_date)}
                      </div>
                      <div style={{ fontSize:11, color:t.text3, marginTop:2 }}>
                        Expiration: {fmtDate(inspection.expiry_date)}
                      </div>
                    </div>
                    <div style={{ padding:'4px 12px', borderRadius:20, background: inspection.passed ? 'rgba(5,150,105,0.12)' : 'rgba(220,38,38,0.10)', border:`1px solid ${inspection.passed ? 'rgba(5,150,105,0.25)' : 'rgba(220,38,38,0.25)'}` }}>
                      <span style={{ fontSize:11, fontWeight:700, color: inspection.passed ? t.green : t.red }}>
                        {inspection.passed ? '✓ Réussie' : '✗ Échec'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Immatriculation */}
            {registration && (
              <div>
                <SectionTitle title="Immatriculation" t={t} />
                <div style={{ ...cardStyle(t), padding:'14px 16px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {[
                      { label:'Statut',          val:registration.status },
                      { label:'No. (4 derniers)', val:registration.registration_last4 },
                      { label:'Valide depuis',   val:fmtDate(registration.valid_from) },
                      { label:'Valide jusqu\'au',val:fmtDate(registration.valid_until) },
                    ].map(row => (
                      <div key={row.label}>
                        <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:t.text3, marginBottom:3 }}>{row.label}</div>
                        <div style={{ fontSize:13, fontWeight:700, color:t.text }}>{row.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
