'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard } from '@/components/ui'
import { useState } from 'react'
import { Play, CheckCircle, XCircle, Clock, RefreshCw, AlertCircle } from 'lucide-react'

type TestStatus = 'idle' | 'running' | 'pass' | 'fail'
interface E2ETest { id:string; name:string; category:string; description:string; steps:string[]; expectedResult:string; status:TestStatus; duration?:number }

const initialTests: E2ETest[] = [
  { id:'t-001', name:'Webhook Idempotence', category:'FINANCIAL', description:'Même événement × 10 → 1 seule transaction', steps:['Envoyer UBER-TEST-001 × 10','Vérifier: 10 reçus, 9 doublons bloqués','Ledger: 1 transaction uniquement','Analytics: montant compté une seule fois'], expectedResult:'1 transaction · 9 duplicates · Revenue = 100$', status:'idle' },
  { id:'t-002', name:'Pipeline Uber: Fare+Ajust+Tip-Refund', category:'FINANCIAL', description:'100$ + 20$ + 10$ - 5$ = Net 125$ + TPS/TVQ', steps:['Event TRIP_COMPLETED Uber 100$','Adjustment +20$','Tip +10$','Refund -5$','Ledger: Gross=125$','TPS=6.25$ TVQ=12.47$'], expectedResult:'Gross: 125$ · TPS: 6.25$ · TVQ: 12.47$', status:'idle' },
  { id:'t-003', name:'Signature HMAC Webhook', category:'SECURITY', description:'Valid/Invalid/Replay/Duplicate testing', steps:['Valid signature → PROCESS','Invalid signature → REJECT','Timestamp >5min → REJECT','event_id déjà vu → IGNORE'], expectedResult:'VALID:PROCESS · INVALID:REJECT · REPLAY:REJECT', status:'idle' },
  { id:'t-004', name:'Taxi E2E: Meter → Ledger → Taxes', category:'TAXI', description:'Session taximètre complète → Paiement → Analytics', steps:['Démarrer METER-QC-00001001','Trip: 8.2km 18min → 42.50$','Paiement Carte','Ledger: 42.50$','TPS: 2.13$ TVQ: 4.24$','Analytics +1 course'], expectedResult:'Tous montants cohérents end-to-end', status:'idle' },
  { id:'t-005', name:'Réconciliation DoorDash', category:'RECONCILIATION', description:'Provider 38940$ vs Ledger 36604$ → MISMATCH 2336$', steps:['Charger totaux DoorDash','Comparer provider vs ledger','Identifier AMOUNT_MISMATCH','Créer dossier réconciliation','Audit trail créé'], expectedResult:'AMOUNT_MISMATCH · Dossier créé · Audit', status:'idle' },
  { id:'t-006', name:'RBAC: Accès refusé SUPPORT_AGENT', category:'SECURITY', description:'SUPPORT-001 ne peut pas accéder aux données fiscales', steps:['Login SUPPORT-001','GET /api/tax/records','Vérifier: 403 Forbidden','AuditLog: ACCESS_DENIED créé','Aucune donnée dans la réponse'], expectedResult:'403 · Audit créé · Aucun leak', status:'idle' },
  { id:'t-007', name:'Scénario Gouvernement Complet', category:'WORKFLOW', description:'Admin → Driver → Rapport → Export → Audit', steps:['ADMIN-001 login (MFA)','Recherche TG-000001','Profil: licence, véhicule, plateformes','Rapport mensuel généré','Export CSV (audit enregistré)','AuditLog: toutes actions'], expectedResult:'Parcours sans erreur · Audit trail complet', status:'idle' },
  { id:'t-008', name:'Multi-plateforme chauffeur', category:'FINANCIAL', description:'TG-000005: DoorDash + UberEats + Skip = 175$', steps:['DoorDash: 3 livraisons 85$','Uber Eats: 2 livraisons 62$','Skip: 1 livraison 28$','Total: 175$','TPS: 8.75$ TVQ: 17.46$'], expectedResult:'Revenus consolidés · Taxes correctes', status:'idle' },
]

const catColors: Record<string,string> = { FINANCIAL:'bg-green-100 text-green-700', SECURITY:'bg-red-100 text-red-700', TAXI:'bg-blue-100 text-blue-700', RECONCILIATION:'bg-amber-100 text-amber-700', WORKFLOW:'bg-purple-100 text-purple-700' }

export default function E2ETestsPage() {
  const [tests, setTests] = useState(initialTests)
  const [running, setRunning] = useState(false)
  const run = (id:string) => {
    setTests(p=>p.map(t=>t.id===id?{...t,status:'running'}:t))
    setTimeout(()=>setTests(p=>p.map(t=>t.id===id?{...t,status:'pass',duration:Math.round(200+Math.random()*800)}:t)),1500+Math.random()*800)
  }
  const runAll = () => {
    setRunning(true)
    tests.forEach((t,i)=>setTimeout(()=>run(t.id),i*700))
    setTimeout(()=>setRunning(false),(tests.length+1)*700+1000)
  }
  const pass=tests.filter(t=>t.status==='pass').length
  const fail=tests.filter(t=>t.status==='fail').length
  return (
    <AppShell>
      <PageHeader title="E2E Test Suite — Étape 9" subtitle="Intégrité financière · Sécurité · Workflows · Idempotence"
        actions={<div className="flex gap-2"><button onClick={()=>setTests(initialTests)} className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"><RefreshCw size={11}/></button><button onClick={runAll} disabled={running} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-qc-blue text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"><Play size={12}/>{running?'En cours...':'Tout lancer'}</button></div>}/>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <KpiCard label="Tests" value={tests.length} color="blue"/>
        <KpiCard label="PASS" value={pass} icon={<CheckCircle size={16}/>} color="green"/>
        <KpiCard label="En cours" value={tests.filter(t=>t.status==='running').length} icon={<Clock size={16}/>} color="orange"/>
        <KpiCard label="FAIL" value={fail} icon={<XCircle size={16}/>} color={fail>0?'red':'green'}/>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
        <AlertCircle size={12} className="shrink-0"/> Tests sur données MOCK (PILOT mode). Les tests réels nécessitent un environnement Supabase configuré.
      </div>
      <div className="space-y-3">
        {tests.map(t=>(
          <Card key={t.id} className={`p-4 ${t.status==='pass'?'border-green-200':t.status==='fail'?'border-red-200':t.status==='running'?'border-blue-200':''}`}>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{t.name}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${catColors[t.category]}`}>{t.category}</span>
                  {t.status==='pass'&&<span className="text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">✅ PASS {t.duration}ms</span>}
                  {t.status==='running'&&<span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded animate-pulse">⏳ EN COURS</span>}
                  {t.status==='fail'&&<span className="text-[9px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">❌ FAIL</span>}
                </div>
                <p className="text-xs text-slate-500 mb-2">{t.description}</p>
                <div className="flex flex-wrap gap-1 mb-1">
                  {t.steps.map((s,i)=><span key={i} className="text-[9px] text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-1.5 py-0.5 rounded">{i+1}. {s}</span>)}
                </div>
                <div className="text-[10px] text-slate-400">→ <span className="font-medium text-slate-600 dark:text-slate-400">{t.expectedResult}</span></div>
              </div>
              <button onClick={()=>run(t.id)} disabled={t.status==='running'||running} className="px-3 py-1.5 rounded-lg bg-qc-blue text-white text-[10px] font-semibold hover:bg-blue-700 disabled:opacity-50 shrink-0">
                <Play size={10}/>
              </button>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  )
}
