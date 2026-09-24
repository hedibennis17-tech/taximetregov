// GET /api/admin/sync-events — Événements système temps réel
// TAXIMETER.GOV · Gov Admin · PILOT
import { NextRequest } from 'next/server'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = () =>
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

function sbHeaders() {
  const key = SB_KEY()
  if (!key) throw new Error('Supabase key manquante')
  return {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': `Bearer ${key}`,
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!SB_URL) return Response.json({ error: 'Config Supabase manquante' }, { status: 500 })

    const { searchParams } = new URL(req.url)
    const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '50'), 200)
    const since  = searchParams.get('since') // ISO datetime optionnel
    const status = searchParams.get('status') // PROCESSED | DUPLICATE | QUARANTINED

    // Construction de la query Supabase REST
    let qs = `system_events?select=id,event_type,source,status,signature_valid,occurred_at,processed_at,created_at&order=occurred_at.desc&limit=${limit}`
    if (since)  qs += `&occurred_at=gte.${encodeURIComponent(since)}`
    if (status) qs += `&status=eq.${status}`

    const res = await fetch(`${SB_URL}/rest/v1/${qs}`, {
      headers: sbHeaders(),
      cache: 'no-store',
    })

    if (!res.ok) {
      const err = await res.text()
      // Table peut ne pas encore exister en base — retourner DEMO data
      console.warn('system_events fetch error:', err)
      return Response.json({
        events:  DEMO_EVENTS,
        source:  'DEMO_FALLBACK',
        note:    'system_events table non accessible — données DEMO retournées',
        total:   DEMO_EVENTS.length,
        pilot:   true,
      })
    }

    const events = await res.json() as unknown[]
    return Response.json({
      events,
      source: 'SUPABASE',
      total:  events.length,
      pilot:  true,
    })

  } catch (err) {
    // Fallback DEMO si Supabase inaccessible
    return Response.json({
      events:  DEMO_EVENTS,
      source:  'DEMO_FALLBACK',
      error:   String(err),
      total:   DEMO_EVENTS.length,
      pilot:   true,
    })
  }
}

// Données DEMO pour fallback (système non encore seedé)
const DEMO_EVENTS = [
  { id:'EVT-001', event_type:'TRIP_COMPLETED',   source:'uber-qc-demo', status:'PROCESSED',   signature_valid:true,  occurred_at:'2026-09-20T07:00:01Z', processed_at:'2026-09-20T07:00:03Z' },
  { id:'EVT-002', event_type:'TRIP_COMPLETED',   source:'uber-qc-demo', status:'PROCESSED',   signature_valid:true,  occurred_at:'2026-09-20T09:15:01Z', processed_at:'2026-09-20T09:15:03Z' },
  { id:'EVT-003', event_type:'DELIVERY_COMPLETED',source:'uber-qc-demo',status:'PROCESSED',   signature_valid:true,  occurred_at:'2026-09-20T12:00:01Z', processed_at:'2026-09-20T12:00:04Z' },
  { id:'EVT-004', event_type:'GREEN_TRIP_COMPLETED',source:'uber-qc-demo',status:'PROCESSED', signature_valid:true,  occurred_at:'2026-09-20T15:30:01Z', processed_at:'2026-09-20T15:30:03Z' },
  { id:'EVT-005', event_type:'GREEN_TRIP_COMPLETED',source:'uber-qc-demo',status:'PROCESSED', signature_valid:true,  occurred_at:'2026-09-20T18:00:01Z', processed_at:'2026-09-20T18:00:02Z' },
  { id:'EVT-006', event_type:'TRIP_COMPLETED',   source:'uber-qc-demo', status:'DUPLICATE',   signature_valid:true,  occurred_at:'2026-09-20T18:01:00Z', processed_at:null },
  { id:'EVT-007', event_type:'TRIP_COMPLETED',   source:'uber-qc-demo', status:'QUARANTINED', signature_valid:false, occurred_at:'2026-09-20T19:00:00Z', processed_at:null },
]
