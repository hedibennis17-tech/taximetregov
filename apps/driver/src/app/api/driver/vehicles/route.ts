// GET /api/driver/vehicles    — liste véhicules du chauffeur
// POST /api/driver/vehicles   — ajouter un véhicule
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function sb(key: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}
const SVC = () => sb(process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '')
const ANON= () => sb(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '')

async function getDriver(token: string) {
  const { data: { user } } = await ANON().auth.getUser(token)
  if (!user) return null
  const { data } = await SVC().from('driver_profiles').select('id,first_name,last_name,driver_number').eq('user_id', user.id).limit(1).single()
  return data ? { ...data, userId: user.id } : null
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ ok: false, error: 'Non authentifié' }, { status: 401 })
  const driver = await getDriver(token)
  if (!driver) return NextResponse.json({ ok: false, error: 'Profil introuvable' }, { status: 404 })

  const { data: vehicles, error } = await SVC()
    .from('vehicles')
    .select('id,vehicle_number,make,model,year,color,vehicle_type,fuel_type,license_plate_masked,vin_last_four,seating_capacity,status,vehicle_status,is_active,taximeter_status,taximeter_serial_masked,notes,created_at')
    .eq('driver_id', driver.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, vehicles: vehicles ?? [], driver })
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ ok: false, error: 'Non authentifié' }, { status: 401 })
  const driver = await getDriver(token)
  if (!driver) return NextResponse.json({ ok: false, error: 'Profil introuvable' }, { status: 404 })

  const body = await req.json() as {
    make: string; model: string; year: number; color: string
    vehicleType: string; fuelType?: string
    licensePlateMasked: string; vinLastFour?: string
    seatingCapacity?: number; odometerAtRegistration?: number
    insurer?: string; insuranceExpiry?: string; insurancePolicyMasked?: string
    taximeterSerial?: string; notes?: string
  }

  if (!body.make || !body.model || !body.year || !body.licensePlateMasked) {
    return NextResponse.json({ ok: false, error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  // Générer vehicle_number unique
  const count = await SVC().from('vehicles').select('id', { count: 'exact', head: true }).eq('driver_id', driver.id)
  const seq   = String((count.count ?? 0) + 1).padStart(4, '0')
  const vehicleNumber = `V-QC-${driver.driver_number?.replace('DRV-','') ?? Date.now().toString(36).toUpperCase()}-${seq}`

  // Vérifier si premier véhicule
  const { count: existing } = await SVC().from('vehicles').select('id', { count: 'exact', head: true }).eq('driver_id', driver.id).is('deleted_at', null)
  const isFirst = (existing ?? 0) === 0

  const { data: vehicle, error } = await SVC().from('vehicles').insert({
    driver_id:            driver.id,
    vehicle_number:       vehicleNumber,
    make:                 body.make,
    model:                body.model,
    year:                 body.year,
    color:                body.color,
    vehicle_type:         body.vehicleType ?? 'SEDAN',
    fuel_type:            body.fuelType ?? 'GASOLINE',
    license_plate_masked: body.licensePlateMasked,
    license_plate_region: 'QC',
    vin_last_four:        body.vinLastFour ?? null,
    seating_capacity:     body.seatingCapacity ?? 4,
    odometer_at_registration: body.odometerAtRegistration ?? null,
    status:               'PENDING',
    vehicle_status:       'PENDING',
    is_active:            isFirst,
    taximeter_status:     'NOT_INSTALLED',
    taximeter_serial_masked: body.taximeterSerial ?? null,
    notes: body.notes ?? `Ajouté par le chauffeur le ${new Date().toLocaleDateString('fr-CA')} · Mode pilote`,
  }).select('id,vehicle_number,make,model,year,color,license_plate_masked,status,is_active').single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  // Notification admin
  await SVC().from('driver_notifications').insert({
    driver_id:         driver.id,
    notification_type: 'SYSTEM',
    title:             '🚗 Véhicule soumis pour vérification',
    body:              `Votre ${body.year} ${body.make} ${body.model} (${body.licensePlateMasked}) a été soumis. En attente d'approbation administrative.`,
    status:            'UNREAD',
    priority:          'NORMAL',
  }).catch(() => {})

  return NextResponse.json({ ok: true, vehicle, vehicleNumber, isFirst, message: 'Véhicule soumis — en attente d\'approbation' })
}
