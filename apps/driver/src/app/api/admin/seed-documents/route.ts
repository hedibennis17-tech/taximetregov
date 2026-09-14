// POST /api/admin/seed-documents — Seed dossier documentaire pilote IDEMPOTENT
// Utilise ON CONFLICT DO NOTHING — jamais de doublon, jamais de crash
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'

async function sbService(path: string, body?: unknown, method = 'POST') {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Config Supabase manquante')
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: body ? method : 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      // TOUJOURS ignore-duplicates pour l'idempotence
      'Prefer': body ? 'resolution=ignore-duplicates,return=representation' : 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  // 409 conflict = déjà existant → OK pour nous
  if (!res.ok && res.status !== 409) throw new Error(`${path} (${res.status}): ${text.slice(0,200)}`)
  return text ? (JSON.parse(text) as unknown[]) : []
}

async function sbGet(path: string) {
  return sbService(path, undefined, 'GET')
}

export async function POST(_req: NextRequest) {
  try {
    const steps: string[] = []
    const now = new Date()
    const d = (days: number) => new Date(now.getTime() + days * 86400000).toISOString().split('T')[0]!

    // ── 1. Trouver le driver ────────────────────────────────────
    const profiles = await sbGet(`driver_profiles?select=id,user_id,first_name,last_name,driver_number&order=created_at.asc&limit=10`) as Array<{id:string;user_id:string;first_name:string;last_name:string;driver_number:string}>
    const profile  = profiles.find(p => p.first_name?.toLowerCase().includes('hedi')) ?? profiles[0]
    if (!profile) return apiError('Aucun driver_profile trouvé — lancez le seed principal d\'abord', 404)
    const driverId = profile.id
    const userId   = profile.user_id
    steps.push(`✅ Driver: ${profile.first_name} ${profile.last_name} (${driverId})`)

    // ── 2. Trouver le véhicule ─────────────────────────────────
    const vehicles = await sbGet(`vehicles?driver_id=eq.${driverId}&select=id,make,model&limit=1`) as Array<{id:string;make:string;model:string}>
    const vehicleId = vehicles[0]?.id ?? null
    steps.push(vehicleId ? `✅ Véhicule: ${vehicles[0]!.make} ${vehicles[0]!.model}` : '⚠ Aucun véhicule trouvé — docs véhicule sans association')

    // ── 3. Inventorier les types existants (NE PAS recréer) ────
    const existingTypes = await sbGet(`document_types?select=id,code`) as Array<{id:string;code:string}>
    const existingCodes = new Set(existingTypes.map(t => t.code))
    const typeMap: Record<string, string> = {}
    for (const t of existingTypes) typeMap[t.code] = t.id
    steps.push(`📋 Types existants: ${[...existingCodes].join(', ')}`)

    // ── 4. Ajouter SEULEMENT les types manquants ───────────────
    const TYPES_TO_ADD = [
      { code:'AUTHORIZED_DRIVER_PERMIT',         label:'Authorized Driver Permit',        label_fr:'Permis de chauffeur autorisé',         owner_type:'DRIVER',  has_expiry_date:true,  default_validity_days:365,  renewal_notice_days:60,  requires_manual_review:true  },
      { code:'CRIMINAL_RECORD_CHECK',             label:'Criminal Record Check',           label_fr:'Vérification des antécédents judiciaires',owner_type:'DRIVER', has_expiry_date:true, default_validity_days:365,  renewal_notice_days:30,  requires_manual_review:true  },
      { code:'TRAINING_CERTIFICATE',             label:'Training Certificate',            label_fr:'Attestation de formation professionnelle',owner_type:'DRIVER', has_expiry_date:false, default_validity_days:null, renewal_notice_days:0,   requires_manual_review:false },
      { code:'AUTHORIZED_VEHICLE_ATTESTATION',   label:'Authorized Vehicle Attestation',  label_fr:'Attestation de véhicule autorisé',       owner_type:'VEHICLE',has_expiry_date:true,  default_validity_days:365,  renewal_notice_days:30,  requires_manual_review:true  },
      { code:'TAXIMETER_COMPLIANCE_CERTIFICATE', label:'Taximeter Compliance Certificate',label_fr:'Certificat de conformité du taximètre',  owner_type:'VEHICLE',has_expiry_date:true,  default_validity_days:730,  renewal_notice_days:60,  requires_manual_review:true  },
      { code:'TPS_REGISTRATION',                 label:'TPS Registration',                label_fr:'Inscription TPS — Revenu Québec',        owner_type:'DRIVER', has_expiry_date:false, default_validity_days:null, renewal_notice_days:0,   requires_manual_review:false },
      { code:'TVQ_REGISTRATION',                 label:'TVQ Registration',                label_fr:'Inscription TVQ — Revenu Québec',        owner_type:'DRIVER', has_expiry_date:false, default_validity_days:null, renewal_notice_days:0,   requires_manual_review:false },
    ]

    let added = 0
    for (const t of TYPES_TO_ADD) {
      if (existingCodes.has(t.code)) continue // ← JAMAIS recréer
      const result = await sbService('document_types', {
        code: t.code, label: t.label, label_fr: t.label_fr,
        owner_type: t.owner_type, has_expiry_date: t.has_expiry_date,
        has_issue_date: true, requires_verification: true,
        requires_manual_review: t.requires_manual_review,
        default_validity_days: t.default_validity_days,
        renewal_notice_days: t.renewal_notice_days, is_active: true,
      }) as Array<{id:string;code:string}>
      if (result[0]) { typeMap[result[0].code] = result[0].id; added++ }
    }
    // Re-fetch pour avoir tous les IDs à jour
    const allTypes = await sbGet(`document_types?select=id,code&is_active=eq.true`) as Array<{id:string;code:string}>
    for (const t of allTypes) typeMap[t.code] = t.id
    steps.push(`✅ ${added} nouveaux types ajoutés (existants préservés)`)

    // ── 5. Documents pilotes à créer ───────────────────────────
    // Mapping code → (pid, statut, dates, notes pilote)
    // Utilise les codes EXISTANTS en priorité
    const PILOT_DOCS = [
      {
        code: 'DRIVER_LICENSE', pid: 'HEDI-DL-001',
        status: 'APPROVED', owner: 'DRIVER',
        issued: d(-730), expires: d(1095),
        last4: '4417', alert: 'ok',
        notes: 'PILOTE-SYNTHÉTIQUE · Permis de conduire classe 5 — SAAQ (données fictives, aucune valeur légale)',
      },
      {
        code: 'TAXI_PERMIT', pid: 'HEDI-TAXI-001',
        status: 'APPROVED', owner: 'DRIVER',
        issued: d(-180), expires: d(185),
        last4: '0022', alert: 'ok',
        notes: 'PILOTE-SYNTHÉTIQUE · Permis chauffeur taxi T — CTQ (données fictives)',
      },
      {
        code: 'AUTHORIZED_DRIVER_PERMIT', pid: 'HEDI-AUTH-001',
        status: 'UNDER_REVIEW', owner: 'DRIVER',
        issued: d(-10), expires: d(355),
        last4: '0033', alert: 'ok',
        notes: 'PILOTE-SYNTHÉTIQUE · Autorisation transport rémunéré — MTQ (en cours de vérification)',
      },
      {
        code: 'CRIMINAL_RECORD_CHECK', pid: 'HEDI-CRC-001',
        status: 'APPROVED', owner: 'DRIVER',
        issued: d(-90), expires: d(275),
        last4: null, alert: 'ok',
        notes: 'PILOTE-SYNTHÉTIQUE · Vérification judiciaire — Corps de police local (données fictives)',
      },
      {
        code: 'TRAINING_CERTIFICATE', pid: 'HEDI-TRAIN-001',
        status: 'APPROVED', owner: 'DRIVER',
        issued: d(-365), expires: null,
        last4: null, alert: 'ok',
        notes: 'PILOTE-SYNTHÉTIQUE · Formation prof. 40h transport rémunéré (données fictives)',
      },
      {
        code: 'VEHICLE_REGISTRATION', pid: 'HEDI-REG-001',
        status: 'APPROVED', owner: vehicleId ? 'VEHICLE' : 'DRIVER',
        issued: d(-60), expires: d(305),
        last4: '7788', alert: 'ok',
        notes: 'PILOTE-SYNTHÉTIQUE · Immatriculation Toyota Camry 2022 — SAAQ (données fictives)',
      },
      {
        code: 'VEHICLE_INSURANCE', pid: 'HEDI-INS-001',
        status: 'APPROVED', owner: 'DRIVER',
        issued: d(-30), expires: d(20), // ← ALERTE expiration dans 20j
        last4: '5599', alert: 'warning',
        notes: 'PILOTE-SYNTHÉTIQUE · Assurance transport rémunéré — Intact (EXPIRATION PROCHAINE — données fictives)',
      },
      {
        code: 'TAXIMETER_CERTIFICATE', pid: 'HEDI-TAXIM-001',
        status: 'APPROVED', owner: vehicleId ? 'VEHICLE' : 'DRIVER',
        issued: d(-200), expires: d(530),
        last4: null, alert: 'ok',
        notes: 'PILOTE-SYNTHÉTIQUE · Certification taximètre homologué — Bureau de métrologie QC (données fictives)',
      },
      {
        code: 'TPS_REGISTRATION', pid: 'HEDI-TPS-001',
        status: 'APPROVED', owner: 'DRIVER',
        issued: d(-400), expires: null,
        last4: '0010', alert: 'ok',
        notes: 'PILOTE-SYNTHÉTIQUE · Inscription TPS/TVQ — ARC/Revenu QC (données fictives)',
      },
    ]

    let created = 0; let skipped = 0
    const createdDocIds: Array<{id:string;code:string;pid:string;status:string}> = []

    for (const doc of PILOT_DOCS) {
      const typeId = typeMap[doc.code]
      if (!typeId) { steps.push(`⚠ Type introuvable: ${doc.code} — ignoré`); continue }

      // Vérifier si déjà existant
      const existing = await sbGet(`documents?public_document_id=eq.${doc.pid}&select=id,status`) as Array<{id:string;status:string}>
      if (existing[0]) {
        createdDocIds.push({ id: existing[0].id, code: doc.code, pid: doc.pid, status: existing[0].status })
        skipped++; continue
      }

      const payload: Record<string, unknown> = {
        public_document_id: doc.pid,
        document_type_id:   typeId,
        owner_type:         doc.owner,
        driver_owner_id:    driverId,
        jurisdiction:       'QC',
        status:             doc.status,
        issued_at:          doc.issued,
        expires_at:         doc.expires,
        doc_number_last4:   doc.last4,
        ocr_status:         'NOT_REQUESTED',
        notes:              doc.notes,
      }
      if (doc.owner === 'VEHICLE' && vehicleId) payload['vehicle_owner_id'] = vehicleId

      const result = await sbService('documents', payload) as Array<{id:string}>
      if (result[0]) {
        createdDocIds.push({ id: result[0].id, code: doc.code, pid: doc.pid, status: doc.status })
        created++
      }
    }
    steps.push(`✅ Documents: ${created} créés, ${skipped} déjà existants`)

    // ── 6. Vérifications gouvernementales pour APPROVED ────────
    const govUsers = await sbGet(`users?user_type=eq.GOVERNMENT&select=id&limit=1`) as Array<{id:string}>
    const govUserId = govUsers[0]?.id ?? userId

    let verifCreated = 0
    for (const doc of createdDocIds.filter(d => d.status === 'APPROVED')) {
      const existing = await sbGet(`document_verifications?document_id=eq.${doc.id}&select=id&limit=1`) as Array<{id:string}>
      if (existing[0]) continue
      await sbService('document_verifications', {
        document_id:          doc.id,
        verification_status:  'VERIFIED',
        verification_method:  'DOCUMENT_REVIEW',
        verified_by:          govUserId,
        verified_at:          new Date(now.getTime() - Math.random() * 20 * 86400000).toISOString(),
        review_notes:         'Vérification pilote synthétique — Mode démonstration TAXIMETER.GOV · Aucune valeur légale',
        reviewer_jurisdiction:'QC',
      })
      verifCreated++
    }
    // Vérification UNDER_REVIEW = en attente
    for (const doc of createdDocIds.filter(d => d.status === 'UNDER_REVIEW')) {
      const existing = await sbGet(`document_verifications?document_id=eq.${doc.id}&select=id&limit=1`) as Array<{id:string}>
      if (existing[0]) continue
      await sbService('document_verifications', {
        document_id:          doc.id,
        verification_status:  'IN_REVIEW',
        verification_method:  'DOCUMENT_REVIEW',
        reviewer_jurisdiction:'QC',
      })
    }
    steps.push(`✅ ${verifCreated} vérifications créées`)

    // ── 7. Audit trail ─────────────────────────────────────────
    for (const doc of createdDocIds.slice(0, 6)) {
      await sbService('document_audit_events', {
        document_id: doc.id,
        actor_id:    doc.status === 'APPROVED' ? govUserId : userId,
        actor_role:  doc.status === 'APPROVED' ? 'GOVERNMENT' : 'DRIVER',
        action:      doc.status === 'APPROVED' ? 'DOCUMENT_APPROVED' : 'DOCUMENT_CREATED',
        metadata:    { source: 'PILOTE', note: 'Données synthétiques de démonstration TAXIMETER.GOV' },
        occurred_at: new Date(now.getTime() - Math.random() * 15 * 86400000).toISOString(),
      })
    }
    steps.push(`✅ Audit trail créé`)

    // ── 8. Compliance snapshot ─────────────────────────────────
    const warningCount = PILOT_DOCS.filter(d => d.alert === 'warning').length
    const underReview  = createdDocIds.filter(d => d.status === 'UNDER_REVIEW').length
    await sbService('compliance_snapshots', {
      owner_type:         'DRIVER',
      driver_owner_id:    driverId,
      service_type:       'TAXI',
      jurisdiction:       'QC',
      overall_status:     warningCount > 0 || underReview > 0 ? 'REVIEW_REQUIRED' : 'COMPLIANT',
      missing_documents:  JSON.stringify([]),
      expired_documents:  JSON.stringify([]),
      expiring_documents: JSON.stringify(['HEDI-INS-001']),
      completeness_score: Math.round(((PILOT_DOCS.length - underReview) / PILOT_DOCS.length) * 100),
      computed_at:        now.toISOString(),
      details:            JSON.stringify({ mode: 'PILOTE', source: 'seed-documents-v2' }),
    })
    steps.push(`✅ Compliance snapshot (${PILOT_DOCS.length - underReview}/${PILOT_DOCS.length} docs approuvés)`)

    return apiSuccess({
      driver:           `${profile.first_name} ${profile.last_name}`,
      driverId,
      vehicleId,
      documentsCreated: created,
      documentsSkipped: skipped,
      totalDocs:        PILOT_DOCS.length,
      steps,
      message:          `✅ Dossier pilote opérationnel — ${created + skipped} documents`,
    })

  } catch (e) {
    return apiError((e as Error).message, 500)
  }
}
