// GET /api/driver/documents — Dossier documentaire complet du chauffeur connecté
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'

async function sbQuery(path: string, token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Config Supabase manquante')
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`DB: ${text}`)
  return text ? JSON.parse(text) as unknown[] : []
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return apiError('Non authentifié', 401)
  const token = auth.replace('Bearer ', '')

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    if (!url || !key) throw new Error('Config manquante')

    // 1. Trouver le driver_profile de l'utilisateur connecté
    const profiles = await sbQuery(
      `driver_profiles?select=id,first_name,last_name,public_driver_id,verification_status`,
      token
    ) as Array<{id:string;first_name:string;last_name:string;public_driver_id:string;verification_status:string}>

    if (!profiles.length) return apiError('Profil chauffeur introuvable', 404)
    const driverId = profiles[0]!.id

    // 2. Documents du chauffeur avec type + vérifications
    const docs = await sbQuery(
      `documents?driver_owner_id=eq.${driverId}&select=id,public_document_id,status,issued_at,expires_at,doc_number_last4,notes,ocr_status,created_at,updated_at,document_types(id,code,label,label_fr,owner_type,renewal_notice_days)&order=created_at.desc`,
      token
    ) as Array<{
      id:string; public_document_id:string; status:string; issued_at:string|null;
      expires_at:string|null; doc_number_last4:string|null; notes:string|null;
      ocr_status:string; created_at:string; updated_at:string;
      document_types:{id:string;code:string;label:string;label_fr:string|null;owner_type:string;renewal_notice_days:number}
    }>

    // 3. Vérifications par document
    const docIds = docs.map(d => d.id)
    let verifications: Array<{document_id:string;verification_status:string;verification_method:string;verified_at:string|null;review_notes:string|null}> = []
    if (docIds.length > 0) {
      verifications = await sbQuery(
        `document_verifications?document_id=in.(${docIds.join(',')})&select=document_id,verification_status,verification_method,verified_at,review_notes&order=created_at.desc`,
        token
      ) as typeof verifications
    }

    // 4. Audit events des documents (derniers 5 par doc)
    let auditEvents: Array<{document_id:string;action:string;occurred_at:string;actor_role:string|null;metadata:Record<string,unknown>}> = []
    if (docIds.length > 0) {
      auditEvents = await sbQuery(
        `document_audit_events?document_id=in.(${docIds.join(',')})&select=document_id,action,occurred_at,actor_role,metadata&order=occurred_at.desc&limit=50`,
        token
      ) as typeof auditEvents
    }

    // 5. Compliance snapshot
    const snapshots = await sbQuery(
      `compliance_snapshots?driver_owner_id=eq.${driverId}&select=overall_status,completeness_score,missing_documents,expiring_documents,computed_at&order=computed_at.desc&limit=1`,
      token
    ) as Array<{overall_status:string;completeness_score:number;missing_documents:unknown[];expiring_documents:unknown[];computed_at:string}>

    // 6. Enrich chaque document
    const now = new Date()
    const enriched = docs.map(doc => {
      const verif = verifications.find(v => v.document_id === doc.id)
      const events = auditEvents.filter(e => e.document_id === doc.id)
      const expires = doc.expires_at ? new Date(doc.expires_at) : null
      const daysUntilExpiry = expires ? Math.ceil((expires.getTime() - now.getTime()) / 86400000) : null
      const renewalNotice = doc.document_types?.renewal_notice_days ?? 30

      // Statut d'alerte calculé
      let alertLevel: 'ok' | 'warning' | 'expired' | 'missing' = 'ok'
      if (doc.status === 'EXPIRED') alertLevel = 'expired'
      else if (daysUntilExpiry !== null && daysUntilExpiry <= 0) alertLevel = 'expired'
      else if (daysUntilExpiry !== null && daysUntilExpiry <= renewalNotice) alertLevel = 'warning'

      return {
        ...doc,
        label: doc.document_types?.label_fr ?? doc.document_types?.label ?? 'Document',
        code: doc.document_types?.code,
        category: getCategoryFromCode(doc.document_types?.code ?? ''),
        daysUntilExpiry,
        alertLevel,
        verification: verif ?? null,
        auditTrail: events.slice(0, 5),
        isPilot: doc.notes?.includes('DEMO') || doc.notes?.includes('pilote') || doc.public_document_id.startsWith('HEDI-'),
      }
    })

    // Stats
    const stats = {
      total: enriched.length,
      valid: enriched.filter(d => ['APPROVED'].includes(d.status) && d.alertLevel === 'ok').length,
      warning: enriched.filter(d => d.alertLevel === 'warning').length,
      expired: enriched.filter(d => d.alertLevel === 'expired' || d.status === 'EXPIRED').length,
      pending: enriched.filter(d => ['DRAFT','UPLOADED','PENDING_REVIEW','UNDER_REVIEW'].includes(d.status)).length,
    }

    // Grouper par catégorie
    const categories: Record<string, typeof enriched> = {}
    for (const doc of enriched) {
      const cat = doc.category
      if (!categories[cat]) categories[cat] = []
      categories[cat].push(doc)
    }

    return apiSuccess({
      driver: profiles[0],
      documents: enriched,
      categories,
      stats,
      compliance: snapshots[0] ?? null,
      syncStatus: 'MODE_PILOTE',
      generatedAt: now.toISOString(),
    })
  } catch (e) {
    return apiError((e as Error).message, 500)
  }
}

function getCategoryFromCode(code: string): string {
  if (['DRIVER_LICENSE','IDENTITY_CARD','PASSPORT'].includes(code))              return 'Identité'
  if (['TAXI_PERMIT','TRANSPORT_AUTHORIZATION','CHAUFFEUR_PERMIT'].includes(code)) return 'Transport rémunéré'
  if (['VEHICLE_REGISTRATION','VEHICLE_INSURANCE','VEHICLE_SAFETY_CERT'].includes(code)) return 'Véhicule'
  if (['TAXIMETER_CERTIFICATE','TAXIMETER_CALIBRATION'].includes(code))          return 'Taximètre'
  if (['PROFESSIONAL_TRAINING','FIRST_AID_CERT','DEFENSIVE_DRIVING'].includes(code)) return 'Formation'
  if (['TAX_REGISTRATION','TPS_REGISTRATION','TVQ_REGISTRATION'].includes(code)) return 'Fiscalité'
  return 'Autre'
}
