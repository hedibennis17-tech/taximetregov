// GET /api/admin/documents — File de vérification documentaire admin
import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/db'

async function sbSvc(path: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Config manquante')
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${path}: ${text.slice(0,200)}`)
  return text ? (JSON.parse(text) as unknown[]) : []
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filterStatus = searchParams.get('status') ?? ''

  try {
    const now = new Date()

    // Docs avec info type + driver
    let query = `documents?select=id,public_document_id,status,issued_at,expires_at,doc_number_last4,notes,created_at,updated_at,owner_type,document_types(code,label,label_fr),driver_profiles(id,first_name,last_name,driver_number)&order=created_at.desc&limit=100`
    if (filterStatus) query += `&status=eq.${filterStatus}`

    const docs = await sbSvc(query) as Array<{
      id:string; public_document_id:string; status:string; issued_at:string|null;
      expires_at:string|null; doc_number_last4:string|null; notes:string|null;
      created_at:string; updated_at:string; owner_type:string;
      document_types:{code:string;label:string;label_fr:string|null}|null;
      driver_profiles:{id:string;first_name:string;last_name:string;driver_number:string}|null;
    }>

    // Vérifications
    const docIds = docs.map(d => d.id)
    let verifs: Array<{document_id:string;verification_status:string;verified_at:string|null;review_notes:string|null;rejection_note:string|null}> = []
    if (docIds.length > 0) {
      verifs = await sbSvc(`document_verifications?document_id=in.(${docIds.join(',')})&select=document_id,verification_status,verified_at,review_notes,rejection_note`) as typeof verifs
    }
    const verifMap: Record<string, typeof verifs[0]> = {}
    for (const v of verifs) verifMap[v.document_id] = v

    // Enrichir
    const enriched = docs.map(doc => {
      const verif = verifMap[doc.id]
      const expires = doc.expires_at ? new Date(doc.expires_at) : null
      const daysUntil = expires ? Math.ceil((expires.getTime() - now.getTime()) / 86400000) : null
      const daysPending = Math.ceil((now.getTime() - new Date(doc.created_at).getTime()) / 86400000)

      return {
        ...doc,
        label:        doc.document_types?.label_fr ?? doc.document_types?.label ?? 'Document',
        daysUntil,
        daysPending,
        alertLevel:   daysUntil !== null && daysUntil <= 0 ? 'expired'
                    : daysUntil !== null && daysUntil <= 30 ? 'warning' : 'ok',
        verif:        verif ?? null,
        driver:       doc.driver_profiles,
        isPilot:      (doc.notes ?? '').includes('PILOTE'),
      }
    })

    // Stats globales
    const allDocs = await sbSvc(`documents?select=id,status,expires_at`) as Array<{id:string;status:string;expires_at:string|null}>
    const stats = {
      toReview:     allDocs.filter(d => ['UPLOADED','PENDING_REVIEW','UNDER_REVIEW'].includes(d.status)).length,
      approved:     allDocs.filter(d => d.status === 'APPROVED').length,
      rejected:     allDocs.filter(d => d.status === 'REJECTED').length,
      expiringSOon: allDocs.filter(d => {
        if (!d.expires_at) return false
        const days = Math.ceil((new Date(d.expires_at).getTime() - now.getTime()) / 86400000)
        return days > 0 && days <= 30
      }).length,
      expired: allDocs.filter(d => {
        if (!d.expires_at) return false
        return new Date(d.expires_at) < now
      }).length,
    }

    return apiSuccess({ documents: enriched, stats, total: enriched.length })
  } catch (e) {
    return apiError((e as Error).message, 500)
  }
}
