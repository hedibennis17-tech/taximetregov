// POST /api/admin/seed-documents — Seed dossier documentaire pilote complet
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'

async function sb(path: string, body?: unknown, method = 'POST') {
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
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${path}: ${text}`)
  return text ? JSON.parse(text) as unknown[] : []
}

async function sbIgnore(path: string, body: unknown) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Config Supabase manquante')
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text()
    console.warn(`sbIgnore ${path}:`, t)
  }
}

export async function POST(req: NextRequest) {
  try {
    const steps: string[] = []
    const now = new Date()

    // ── 1. Trouver le driver ──────────────────────────────────
    const profiles = await sb(
      `driver_profiles?select=id,user_id,first_name,last_name,public_driver_id`,
      undefined
    ) as Array<{id:string;user_id:string;first_name:string;last_name:string;public_driver_id:string}>

    // Priorité: Hedi Bennis
    let profile = profiles.find(p => p.first_name?.toLowerCase().includes('hedi')) ?? profiles[0]
    if (!profile) return apiError('Aucun driver_profile trouvé — lancez le seed principal d\'abord', 404)

    const driverId = profile.id
    const userId   = profile.user_id
    steps.push(`✅ Driver: ${profile.first_name} ${profile.last_name} (${driverId})`)

    // ── 2. Upsert document_types complets ─────────────────────
    const TYPE_DEFS = [
      { code:'DRIVER_LICENSE',          label:'Driver License',              label_fr:'Permis de conduire',              owner_type:'DRIVER',  has_expiry_date:true,  default_validity_days:1825, renewal_notice_days:60  },
      { code:'TAXI_PERMIT',             label:'Taxi Permit',                 label_fr:'Permis de chauffeur de taxi',     owner_type:'DRIVER',  has_expiry_date:true,  default_validity_days:365,  renewal_notice_days:60  },
      { code:'TRANSPORT_AUTHORIZATION', label:'Transport Authorization',     label_fr:'Autorisation de transport',       owner_type:'DRIVER',  has_expiry_date:true,  default_validity_days:365,  renewal_notice_days:30  },
      { code:'VEHICLE_REGISTRATION',    label:'Vehicle Registration',        label_fr:'Immatriculation du véhicule',     owner_type:'VEHICLE', has_expiry_date:true,  default_validity_days:365,  renewal_notice_days:30  },
      { code:'VEHICLE_INSURANCE',       label:'Vehicle Insurance',           label_fr:'Assurance automobile',            owner_type:'DRIVER',  has_expiry_date:true,  default_validity_days:365,  renewal_notice_days:30  },
      { code:'VEHICLE_SAFETY_CERT',     label:'Vehicle Safety Certificate',  label_fr:'Certificat de sécurité véhicule',owner_type:'VEHICLE', has_expiry_date:true,  default_validity_days:365,  renewal_notice_days:30  },
      { code:'TAXIMETER_CERTIFICATE',   label:'Taximeter Certificate',       label_fr:'Certificat taximètre',            owner_type:'VEHICLE', has_expiry_date:true,  default_validity_days:730,  renewal_notice_days:60  },
      { code:'PROFESSIONAL_TRAINING',   label:'Professional Training',       label_fr:'Formation professionnelle',       owner_type:'DRIVER',  has_expiry_date:false, default_validity_days:null, renewal_notice_days:0   },
      { code:'FIRST_AID_CERT',          label:'First Aid Certificate',       label_fr:'Certificat premiers soins',       owner_type:'DRIVER',  has_expiry_date:true,  default_validity_days:730,  renewal_notice_days:30  },
      { code:'TPS_REGISTRATION',        label:'TPS Registration',            label_fr:'Inscription TPS',                 owner_type:'DRIVER',  has_expiry_date:false, default_validity_days:null, renewal_notice_days:0   },
    ]

    for (const t of TYPE_DEFS) {
      await sb('document_types', {
        code: t.code,
        label: t.label,
        label_fr: t.label_fr,
        owner_type: t.owner_type,
        has_expiry_date: t.has_expiry_date,
        has_issue_date: true,
        requires_verification: true,
        requires_manual_review: false,
        default_validity_days: t.default_validity_days,
        renewal_notice_days: t.renewal_notice_days,
        is_active: true,
      })
    }
    steps.push(`✅ ${TYPE_DEFS.length} types de documents upsertés`)

    // ── 3. Récupérer les IDs des types ────────────────────────
    const codes = TYPE_DEFS.map(t => t.code).join(',')
    const typeRows = await sb(
      `document_types?code=in.(${codes})&select=id,code`,
      undefined
    ) as Array<{id:string;code:string}>
    const typeMap: Record<string,string> = {}
    for (const t of typeRows) typeMap[t.code] = t.id

    // ── 4. Documents pilotes complets ─────────────────────────
    const d = (days: number) => new Date(now.getTime() + days * 86400000).toISOString().split('T')[0]!
    const DOCS = [
      {
        pid:     'HEDI-DOC-DL-001',
        code:    'DRIVER_LICENSE',
        status:  'APPROVED',
        issued:  d(-365*2),   // il y a 2 ans
        expires: d(365*3),    // dans 3 ans (5 ans total)
        last4:   '4417',
        alert:   'ok',
        notes:   'DEMO · Permis de conduire classe 5 — Données synthétiques pilote TAXIMETER.GOV',
        issuer:  'SAAQ — Société de l\'assurance automobile du Québec (PILOTE)',
      },
      {
        pid:     'HEDI-DOC-TAXI-001',
        code:    'TAXI_PERMIT',
        status:  'APPROVED',
        issued:  d(-180),
        expires: d(185),
        last4:   '0022',
        alert:   'ok',
        notes:   'DEMO · Permis chauffeur taxi classe T — Données synthétiques pilote',
        issuer:  'CTQ — Commission des transports du Québec (PILOTE)',
      },
      {
        pid:     'HEDI-DOC-AUTH-001',
        code:    'TRANSPORT_AUTHORIZATION',
        status:  'APPROVED',
        issued:  d(-90),
        expires: d(275),
        last4:   '0033',
        alert:   'ok',
        notes:   'DEMO · Autorisation transport rémunéré de personnes — Pilote',
        issuer:  'Ministère des Transports du Québec (PILOTE)',
      },
      {
        pid:     'HEDI-DOC-REG-001',
        code:    'VEHICLE_REGISTRATION',
        status:  'APPROVED',
        issued:  d(-60),
        expires: d(305),
        last4:   '7788',
        alert:   'ok',
        notes:   'DEMO · Immatriculation véhicule Toyota Camry 2022 — Données synthétiques',
        issuer:  'SAAQ (PILOTE)',
      },
      {
        pid:     'HEDI-DOC-INS-001',
        code:    'VEHICLE_INSURANCE',
        status:  'APPROVED',
        issued:  d(-30),
        expires: d(25),          // ← expiration dans 25 jours → ALERTE
        last4:   '5599',
        alert:   'warning',
        notes:   'DEMO · Assurance automobile transport rémunéré — EXPIRATION PROCHAINE — Données pilote',
        issuer:  'Intact Assurances (PILOTE)',
      },
      {
        pid:     'HEDI-DOC-SAFE-001',
        code:    'VEHICLE_SAFETY_CERT',
        status:  'APPROVED',
        issued:  d(-120),
        expires: d(245),
        last4:   null,
        alert:   'ok',
        notes:   'DEMO · Certificat de sécurité mécanique annuel — Données synthétiques',
        issuer:  'Contrôleur routier mandaté SAAQ (PILOTE)',
      },
      {
        pid:     'HEDI-DOC-TAXI-CERT-001',
        code:    'TAXIMETER_CERTIFICATE',
        status:  'APPROVED',
        issued:  d(-200),
        expires: d(530),
        last4:   null,
        alert:   'ok',
        notes:    'DEMO · Certificat d\'homologation taximètre · Série HEDI-TXM-0010 — Données pilote',
        issuer:  'Bureau de métrologie légale QC (PILOTE)',
      },
      {
        pid:     'HEDI-DOC-TRAIN-001',
        code:    'PROFESSIONAL_TRAINING',
        status:  'APPROVED',
        issued:  d(-300),
        expires: null,           // pas d'expiration
        last4:   null,
        alert:   'ok',
        notes:    'DEMO · Attestation de formation professionnelle transport rémunéré 40h — Données pilote',
        issuer:  'École de formation TAXI QC (PILOTE)',
      },
      {
        pid:     'HEDI-DOC-TPS-001',
        code:    'TPS_REGISTRATION',
        status:  'APPROVED',
        issued:  d(-400),
        expires: null,
        last4:   '0010',
        alert:   'ok',
        notes:   'DEMO · Inscription TPS/TVQ Revenu Québec — Données synthétiques pilote',
        issuer:  'Agence du revenu du Canada / Revenu Québec (PILOTE)',
      },
    ]

    for (const doc of DOCS) {
      const typeId = typeMap[doc.code]
      if (!typeId) { steps.push(`⚠ Type introuvable: ${doc.code}`); continue }

      await sb('documents', {
        public_document_id: doc.pid,
        document_type_id:   typeId,
        owner_type:         'DRIVER',
        driver_owner_id:    driverId,
        jurisdiction:       'QC',
        status:             doc.status,
        issued_at:          doc.issued,
        expires_at:         doc.expires,
        doc_number_last4:   doc.last4,
        ocr_status:         'OCR_COMPLETE',
        notes:              doc.notes,
      })
    }
    steps.push(`✅ ${DOCS.length} documents pilotes upsertés`)

    // ── 5. Vérifications gouvernementales (pilote) ─────────────
    const docRows = await sb(
      `documents?driver_owner_id=eq.${driverId}&select=id,public_document_id,status`,
      undefined
    ) as Array<{id:string;public_document_id:string;status:string}>

    // Trouver ou créer un user gouvernemental fictif pour les vérifications
    const govUsers = await sb(
      `users?user_type=eq.GOVERNMENT&select=id&limit=1`,
      undefined
    ) as Array<{id:string}>
    const govUserId = govUsers[0]?.id ?? userId // fallback au driver lui-même en mode pilote

    for (const doc of docRows) {
      if (doc.status !== 'APPROVED') continue
      await sbIgnore('document_verifications', {
        document_id:          doc.id,
        verification_status:  'VERIFIED',
        verification_method:  'DOCUMENT_REVIEW',
        verified_by:          govUserId,
        verified_at:          new Date(now.getTime() - Math.random()*30*86400000).toISOString(),
        review_notes:         'Vérification pilote synthétique — Mode démonstration gouvernementale TAXIMETER.GOV',
        reviewer_jurisdiction:'QC',
      })
    }
    steps.push(`✅ Vérifications pilote créées pour ${docRows.length} documents`)

    // ── 6. Audit trail initial ─────────────────────────────────
    for (const doc of docRows.slice(0, 5)) {
      await sbIgnore('document_audit_events', {
        document_id: doc.id,
        actor_id:    govUserId,
        actor_role:  'GOVERNMENT',
        action:      'DOCUMENT_APPROVED',
        metadata:    { source: 'PILOTE', note: 'Approbation initiale — données synthétiques' },
        occurred_at: new Date(now.getTime() - Math.random()*20*86400000).toISOString(),
      })
    }
    steps.push(`✅ Audit trail créé`)

    // ── 7. Compliance snapshot ────────────────────────────────
    const warningDocs = docRows.filter(d => DOCS.find(x => x.pid === d.public_document_id)?.alert === 'warning')
    await sb('compliance_snapshots', {
      owner_type:         'DRIVER',
      driver_owner_id:    driverId,
      service_type:       'TAXI',
      jurisdiction:       'QC',
      overall_status:     warningDocs.length > 0 ? 'REVIEW_REQUIRED' : 'COMPLIANT',
      missing_documents:  JSON.stringify([]),
      expired_documents:  JSON.stringify([]),
      expiring_documents: JSON.stringify(warningDocs.map(d => d.public_document_id)),
      completeness_score: 95,
      computed_at:        now.toISOString(),
      details:            JSON.stringify({ mode: 'PILOTE', source: 'seed-documents' }),
    })
    steps.push(`✅ Compliance snapshot créé`)

    return apiSuccess({
      driver: `${profile.first_name} ${profile.last_name}`,
      driverId,
      documentsCreated: DOCS.length,
      steps,
      message: 'Dossier documentaire pilote complet créé avec succès',
    })

  } catch (e) {
    return apiError((e as Error).message, 500)
  }
}
