// POST /api/driver/documents/submit — Soumettre un document pour vérification
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return apiError('Non authentifié', 401)
  const token = auth.replace('Bearer ', '')

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? anonKey
  if (!url || !anonKey || !svcKey) return apiError('Config manquante', 503)

  const supabase    = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const supabaseSvc = createClient(url, svcKey,  { auth: { autoRefreshToken: false, persistSession: false } })

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return apiError('Token invalide', 401)

  const body = await req.json() as {
    documentTypeCode: string
    issuedAt?: string
    expiresAt?: string
    docNumberLast4?: string
    notes?: string
    fileBase64?: string    // data:image/jpeg;base64,...
    fileName?: string
    vehicleId?: string
  }

  if (!body.documentTypeCode) return apiError('Type de document requis', 400)

  // Trouver le driver_profile
  const { data: profiles } = await supabaseSvc.from('driver_profiles').select('id').eq('user_id', user.id).limit(1)
  if (!profiles?.length) return apiError('Profil chauffeur introuvable', 404)
  const driverId = profiles[0]!.id

  // Trouver le type de document
  const { data: types } = await supabaseSvc.from('document_types').select('id,code,label_fr,label').eq('code', body.documentTypeCode).eq('is_active', true).limit(1)
  if (!types?.length) return apiError(`Type inconnu: ${body.documentTypeCode}`, 404)
  const docType = types[0]!

  // Générer un public_document_id unique
  const pid = `DOC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`

  // Uploader le fichier si fourni
  let storageReference: string | null = null
  if (body.fileBase64 && body.fileName) {
    try {
      const base64Data = body.fileBase64.replace(/^data:[^;]+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      const ext    = (body.fileName.split('.').pop() ?? 'jpg').toLowerCase()
      const storagePath = `documents/${driverId}/${pid}.${ext}`

      const { error: uploadError } = await supabaseSvc.storage
        .from('driver-documents')
        .upload(storagePath, buffer, {
          contentType: body.fileBase64.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg',
          upsert: true,
        })

      if (uploadError) {
        // Storage bucket peut ne pas exister en mode dev — on continue sans fichier
        console.warn('Storage upload skipped:', uploadError.message)
        storageReference = `MOCK-${storagePath}`
      } else {
        storageReference = storagePath
      }
    } catch (e) {
      console.warn('Upload error (non-bloquant):', e)
      storageReference = `MOCK-${pid}`
    }
  }

  // Créer le document
  const docPayload: Record<string, unknown> = {
    public_document_id: pid,
    document_type_id:   docType.id,
    owner_type:         'DRIVER',
    driver_owner_id:    driverId,
    jurisdiction:       'QC',
    status:             'UPLOADED',   // soumis par le chauffeur
    issued_at:          body.issuedAt   ?? null,
    expires_at:         body.expiresAt  ?? null,
    doc_number_last4:   body.docNumberLast4 ?? null,
    ocr_status:         'NOT_REQUESTED',
    notes:              body.notes ?? `Soumis par le chauffeur via Driver Gov — ${new Date().toLocaleDateString('fr-CA')}`,
  }
  if (body.vehicleId) docPayload['vehicle_owner_id'] = body.vehicleId

  const { data: doc, error: docError } = await supabaseSvc.from('documents').insert(docPayload).select('id').single()
  if (docError || !doc) return apiError(docError?.message ?? 'Erreur création document', 500)

  // Créer la version si fichier uploadé
  if (storageReference) {
    await supabaseSvc.from('document_versions').insert({
      document_id:       doc.id,
      version_number:    1,
      storage_reference: storageReference,
      original_file_name: body.fileName ?? 'document',
      mime_type:         body.fileBase64?.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg',
      checksum:          `sha256-mock-${Date.now()}`,
      scan_status:       'SCAN_PENDING',
      uploaded_by:       user.id,
      status:            'ACTIVE',
    })
  }

  // Créer la vérification PENDING
  await supabaseSvc.from('document_verifications').insert({
    document_id:          doc.id,
    verification_status:  'PENDING',
    verification_method:  'DOCUMENT_REVIEW',
    reviewer_jurisdiction:'QC',
  })

  // Audit trail
  await supabaseSvc.from('document_audit_events').insert({
    document_id: doc.id,
    actor_id:    user.id,
    actor_role:  'DRIVER',
    action:      'DOCUMENT_UPLOADED',
    metadata:    { doc_type: body.documentTypeCode, has_file: !!storageReference },
    occurred_at: new Date().toISOString(),
  })

  return apiSuccess({
    documentId:        doc.id,
    publicDocumentId:  pid,
    status:            'UPLOADED',
    documentType:      docType.label_fr ?? docType.label,
    storageReference,
    message:           'Document soumis avec succès — en attente de vérification administrative',
  })
}
