'use client'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { useDriverProfile } from '@/lib/api'
import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface Doc { id:string; status:string; issued_at:string; expires_at:string; document_types:{label:string;code:string} }

const STATUS = {
  APPROVED:   { label:'Vérifié',      color:'text-green-400',  bg:'bg-green-500/10 border-green-500/30',  icon: CheckCircle },
  PENDING:    { label:'En attente',   color:'text-amber-400',  bg:'bg-amber-500/10 border-amber-500/30',  icon: Clock },
  SUBMITTED:  { label:'Soumis',       color:'text-blue-400',   bg:'bg-blue-500/10 border-blue-500/30',    icon: Clock },
  REJECTED:   { label:'Refusé',       color:'text-red-400',    bg:'bg-red-500/10 border-red-500/30',      icon: AlertTriangle },
  EXPIRED:    { label:'Expiré',       color:'text-red-400',    bg:'bg-red-500/10 border-red-500/30',      icon: AlertTriangle },
}

export default function DocumentsPage() {
  const { profile, loading: pLoading } = useDriverProfile()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    void (async () => {
      try {
        const sb = getSupabaseBrowserClient()
        const { data } = await sb.from('documents').select('id,status,issued_at,expires_at,document_types(label,code)').eq('driver_owner_id', profile.id).order('expires_at')
        setDocs((data ?? []) as unknown as Doc[])
      } finally { setLoading(false) }
    })()
  }, [profile?.id])

  const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-white">Mes documents</h1>
        <p className="text-xs text-slate-400 mt-0.5">Dossier gouvernemental · TAXIMETER.GOV</p>
      </div>
      <div className="px-4 space-y-3 pb-8">
        {(loading || pLoading) && <div className="py-12 text-center"><RefreshCw className="mx-auto animate-spin text-qc-blue" size={24} /></div>}
        {!loading && docs.length === 0 && (
          <Card className="p-8 text-center">
            <FileText size={32} className="mx-auto text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">Aucun document trouvé.</p>
            <p className="text-xs text-slate-500 mt-1">Vos documents apparaîtront ici après vérification.</p>
          </Card>
        )}
        {docs.map(doc => {
          const s = STATUS[doc.status as keyof typeof STATUS] ?? STATUS['PENDING']!
          const Icon = s.icon
          const days = daysUntil(doc.expires_at)
          return (
            <Card key={doc.id} className={`p-4 border ${s.bg}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={14} className={s.color} />
                    <span className="font-semibold text-white text-sm">{(doc.document_types as {label:string}).label}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
                </div>
                <div className="text-right text-[10px] text-slate-400">
                  {doc.expires_at && <div className={days < 30 ? 'text-amber-400 font-bold' : ''}>{days > 0 ? `Expire dans ${days}j` : 'Expiré'}</div>}
                  {doc.issued_at && <div>Émis: {new Date(doc.issued_at).toLocaleDateString('fr-CA')}</div>}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </AppShell>
  )
}
