export const runtime = 'nodejs'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ ok: false, error: 'Non authentifié' }, { status: 401 })
  const token = auth.replace('Bearer ', '')

  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? anonKey
  if (!url || !anonKey || !svcKey) return NextResponse.json({ ok: false, error: 'Config manquante' }, { status: 503 })

  const sb    = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const sbSvc = createClient(url, svcKey,  { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return NextResponse.json({ ok: false, error: 'Token invalide' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ ok: false, error: 'Aucun fichier' }, { status: 400 })
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ ok: false, error: 'Max 10 Mo' }, { status: 400 })

  const ALLOWED = ['image/jpeg','image/jpg','image/png','image/webp','application/pdf']
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ ok: false, error: 'JPG, PNG, PDF uniquement' }, { status: 400 })

  const ext    = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path   = `drivers/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await sbSvc.storage
    .from('driver-documents')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    // Bucket inexistant en dev → mock
    const mockUrl = `MOCK://${path}`
    return NextResponse.json({ ok: true, url: mockUrl, path, isMock: true })
  }

  const { data: signedData } = await sbSvc.storage
    .from('driver-documents')
    .createSignedUrl(path, 60 * 60 * 24 * 365)

  return NextResponse.json({ ok: true, url: signedData?.signedUrl ?? path, path, isMock: false })
}
