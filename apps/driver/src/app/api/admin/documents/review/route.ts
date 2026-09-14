// POST /api/admin/documents/review — Approuver/Rejeter/Correction
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'
import { createClient } from '@supabase/supabase-js'

type Decision = 'APPROVE' | 'REJECT' | 'CORRECTION_REQUIRED'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return apiError('Non authentifié', 401)
  const token = auth.replace('Bearer ', '')

  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? anonKey
  if (!url || !anonKey || !svcKey) return apiError('Config manquante', 503)

  const sb    = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const sbSvc = createClient(url, svcKey,  { auth: { autoRefreshToken: false, persistSession: false } })

  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return apiError('Token invalide', 401)

  const body = await req.json() as {
    documentId:  string
    decision:    Decision
    note:        string   // obligatoire pour REJECT et CORRECTION_REQUIRED
    rejectionReason?: string
  }

  if (!body.documentId) return apiError('documentId requis', 400)
  if (!body.decision)   return apiError('decision requis', 400)
  if ((body.decision === 'REJECT' || body.decision === 'CORRECTION_REQUIRED') && !body.note) {
    return apiError('Motif obligatoire pour rejet ou correction', 400)
  }

  // Vérifier le document
  const { data: doc } = await sbSvc.from('documents').select('id,status,driver_owner_id,document_type_id').eq('id', body.documentId).single()
  if (!doc) return apiError('Document introuvable', 404)

  const newStatus = body.decision === 'APPROVE'             ? 'APPROVED'
                  : body.decision === 'REJECT'              ? 'REJECTED'
                  : /* CORRECTION_REQUIRED */                 'REJECTED' // mapped to REJECTED with note

  const oldStatus = doc.status

  // Mettre à jour le statut du document
  await sbSvc.from('documents').update({
    status:     newStatus,
    updated_at: new Date().toISOString(),
  }).eq('id', body.documentId)

  // Mettre à jour la vérification
  const verifUpdate: Record<string, unknown> = {
    verification_status:  body.decision === 'APPROVE' ? 'VERIFIED' : 'REJECTED',
    verification_method:  'DOCUMENT_REVIEW',
    verified_by:          user.id,
    verified_at:          new Date().toISOString(),
    review_notes:         body.note,
    reviewer_jurisdiction:'QC',
    updated_at:           new Date().toISOString(),
  }
  if (body.rejectionReason) verifUpdate['rejection_reason'] = body.rejectionReason
  if (body.decision === 'CORRECTION_REQUIRED') verifUpdate['rejection_note'] = body.note

  await sbSvc.from('document_verifications').update(verifUpdate).eq('document_id', body.documentId)

  // Audit trail
  const auditAction = body.decision === 'APPROVE' ? 'DOCUMENT_APPROVED'
                    : body.decision === 'REJECT'   ? 'DOCUMENT_REJECTED'
                    :                               'DOCUMENT_CORRECTION_REQUESTED'

  await sbSvc.from('document_audit_events').insert({
    document_id: body.documentId,
    actor_id:    user.id,
    actor_role:  'GOVERNMENT',
    action:      auditAction,
    metadata:    {
      old_status: oldStatus,
      new_status: newStatus,
      note:       body.note,
      decision:   body.decision,
    },
    occurred_at: new Date().toISOString(),
  })

  // Notification au chauffeur
  if (doc.driver_owner_id) {
    const { data: dt } = await sbSvc.from('document_types').select('label_fr,label').eq('id', doc.document_type_id).single()
    const docLabel = dt?.label_fr ?? dt?.label ?? 'Document'

    const notifTitle = body.decision === 'APPROVE'
      ? `✅ Document approuvé`
      : body.decision === 'REJECT'
      ? `❌ Document refusé`
      : `🟠 Correction requise`

    const notifBody = body.decision === 'APPROVE'
      ? `Votre document "${docLabel}" a été approuvé par TAXIMETER.GOV.`
      : body.decision === 'REJECT'
      ? `Votre document "${docLabel}" a été refusé. Motif: ${body.note}`
      : `Votre document "${docLabel}" nécessite une correction: ${body.note}`

    await sbSvc.from('driver_notifications').insert({
      driver_id:         doc.driver_owner_id,
      notification_type: 'DOCUMENT',
      title:             notifTitle,
      body:              notifBody,
      status:            'UNREAD',
      priority:          body.decision === 'REJECT' ? 'HIGH' : 'NORMAL',
      metadata:          { document_id: body.documentId, decision: body.decision },
    }).select()
  }

  return apiSuccess({
    documentId:  body.documentId,
    decision:    body.decision,
    newStatus,
    message:     `Document ${body.decision === 'APPROVE' ? 'approuvé' : body.decision === 'REJECT' ? 'refusé' : 'en correction'}`,
  })
}
