'use client'
import React, { useState, useEffect, useRef } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth/AuthProvider'
import {
  PILOT, money2,
  CURRENT_ENT, ENT_DRIVERS, ENT_VEHICLES, DEPARTMENTS,
  SIM_ACTIVITIES, SIM_TRANSACTIONS, SIM_LEDGER, SIM_RECON,
  SIM_DECLARATION, SIM_PAYMENT, SIM_AUDIT, ANOMALIES,
} from '@/lib/data'

const SIM_TPS_R = 0.05
const SIM_TVQ_R = 0.09975
const simR2 = (n: number) => Math.round(n * 100) / 100

// ─── DEMO SCENARIO DATA ────────────────────────────────────────────────────────
const DRIVER_DEMO = ENT_DRIVERS.find(d => d.id === 'DRV-QC-0004')!
const VEH_DEMO    = ENT_VEHICLES.find(v => v.driver === 'DRV-QC-0004')!
const ACT_DEMO    = SIM_ACTIVITIES.find(a => a.id === 'SIM-ACT-005')!
const TX_DEMO     = SIM_TRANSACTIONS.find((t:any) => t.driverId === 'DRV-QC-0004')
const DEPT_DEMO   = DEPARTMENTS.find((d:any) => d.id === 'DEPT-003' || d.slug === 'green' || d.name.includes('Green'))
  || DEPARTMENTS.find((d:any) => d.id === 'DEPT-001')!
const LEDGER_DEMO = (SIM_LEDGER as any[]).find(l => l.driverId === 'DRV-QC-0004') || (SIM_LEDGER as any[])[0]
const RECON_DEMO  = (SIM_RECON as any[]).find(r => r.status === 'MATCH' || r.status === 'MATCHED') || (SIM_RECON as any[])[0]
const AUDIT_DEMO  = (SIM_AUDIT as any[]).slice(0, 9)

const GROSS = ACT_DEMO?.fare ?? 24.00
const TIP   = ACT_DEMO?.tip  ?? 2.00
const TPS   = simR2(GROSS * SIM_TPS_R)
const TVQ   = simR2(GROSS * SIM_TVQ_R)
const FEES  = simR2(GROSS * 0.275)
const NET   = simR2(GROSS * 0.725 - TPS - TVQ)

// ─── 12-STEP SCENARIO ─────────────────────────────────────────────────────────
type Step = {
  id:    number
  icon:  string
  title: string
  tag:   string
  color: string
  what:  string
  why:   string
  status: string
  data:  { label: string; value: string; badge?: string }[]
  next:  string
}

const STEPS: Step[] = [
  {
    id:1, icon:'🏢', title:'Enterprise', tag:'ENT-DEMO-001', color:'#003DA5',
    what:`L'entreprise partenaire du pilote — Uber Québec (DEMO).`,
    why:`Point d'entrée de toutes les données économiques déclarées à la plateforme.`,
    status:'ACTIVE',
    data:[
      {label:'Entreprise',      value:CURRENT_ENT.legalName},
      {label:'Marque',          value:CURRENT_ENT.tradeName},
      {label:'ID',              value:CURRENT_ENT.id},
      {label:'NEQ (DEMO)',      value:'8765432100'},
      {label:'TPS enregistrée', value:'Oui — 5 %'},
      {label:'TVQ enregistrée', value:'Oui — 9,975 %'},
      {label:'Départements',    value:'6 actifs'},
    ],
    next:'Département Uber Green',
  },
  {
    id:2, icon:'🏗️', title:'Département', tag:'UBER GREEN', color:'#059669',
    what:`Unité de service d'Uber dédiée au transport écoresponsable.`,
    why:`Chaque activité est rattachée à un département pour la traçabilité financière.`,
    status:'ACTIVE',
    data:[
      {label:'Département',   value: DEPT_DEMO?.name ?? 'Uber Green'},
      {label:'Service',       value:'Transport écoresponsable'},
      {label:'Chauffeurs',    value:(DEPT_DEMO as any)?.drivers?.toString() ?? '48'},
      {label:'Véhicules',     value:(DEPT_DEMO as any)?.vehicles?.toString() ?? '45'},
      {label:'Activités Q3',  value:(DEPT_DEMO as any)?.activities?.toLocaleString('fr-CA') ?? '2 840'},
      {label:'Revenu brut Q3',value:money2((DEPT_DEMO as any)?.gross ?? 1_200_000), badge:'DEMO DATA'},
    ],
    next:'Chauffeur Ali Bouchard',
  },
  {
    id:3, icon:'👤', title:'Chauffeur', tag:'DRV-QC-0004', color:'#7C3AED',
    what:`Profil complet du chauffeur inscrit à la plateforme.`,
    why:`Chaque revenu, chaque activité et chaque obligation fiscale est rattaché au profil chauffeur.`,
    status: DRIVER_DEMO?.status ?? 'ACTIVE',
    data:[
      {label:'Nom',         value: DRIVER_DEMO?.name ?? 'Ali Bouchard'},
      {label:'ID',          value: DRIVER_DEMO?.id   ?? 'DRV-QC-0004'},
      {label:'Département', value:'Uber Green'},
      {label:'Statut',      value: DRIVER_DEMO?.status ?? 'ACTIVE'},
      {label:'Type',        value: DRIVER_DEMO?.relation ?? 'CONTRACTOR'},
      {label:'Activités Q3',value:(DRIVER_DEMO?.actQ3 ?? 980).toString()},
      {label:'Documents',   value: DRIVER_DEMO?.docs ?? 'EXPIRING', badge: DRIVER_DEMO?.docs === 'EXPIRING' ? '⚠️ EXPIRING' : undefined},
    ],
    next:'Véhicule JKL-3456',
  },
  {
    id:4, icon:'🚗', title:'Véhicule', tag: VEH_DEMO?.id ?? 'TXM-004', color:'#0891B2',
    what:`Véhicule enregistré et rattaché au chauffeur sur la plateforme.`,
    why:`Chaque activité de transport est liée à un véhicule précis pour l'audit et la conformité.`,
    status: VEH_DEMO?.status ?? 'ACTIVE',
    data:[
      {label:'Véhicule',    value:`${VEH_DEMO?.year ?? 2024} ${VEH_DEMO?.make ?? 'Toyota'} ${VEH_DEMO?.model ?? 'Prius'}`},
      {label:'Plaque',      value: VEH_DEMO?.plate  ?? 'JKL-3456', badge:'DEMO'},
      {label:'VIN (DEMO)',  value: VEH_DEMO?.vin    ?? '1HGBH41JXMN109186'},
      {label:'Chauffeur',   value: DRIVER_DEMO?.name ?? 'Ali Bouchard'},
      {label:'Assurance',   value: VEH_DEMO?.insurance ?? '2027-01-15'},
      {label:'Inspection',  value: VEH_DEMO?.inspection ?? '2027-09-01'},
    ],
    next:'Activité de transport',
  },
  {
    id:5, icon:'📍', title:'Activité', tag:'SIM-ACT-005', color:'#B45309',
    what:`Une course Uber Green complétée par Ali Bouchard le 20 sept. 2026.`,
    why:`Chaque activité terrain devient une donnée financière structurée. C'est le noyau du système.`,
    status:'COMPLETED',
    data:[
      {label:'Activité',    value: ACT_DEMO?.id  ?? 'SIM-ACT-005'},
      {label:'Service',     value: ACT_DEMO?.deptName ?? 'Uber Green'},
      {label:'Origine',     value: ACT_DEMO?.origin   ?? 'Mile-Ex'},
      {label:'Destination', value: ACT_DEMO?.dest     ?? 'Rosemont'},
      {label:'Distance',    value:`${ACT_DEMO?.dist ?? 6.8} km`},
      {label:'Durée',       value:`${ACT_DEMO?.dur  ?? 16} min`},
      {label:'Tarif brut',  value: money2(GROSS)},
      {label:'Pourboire',   value: money2(TIP)},
      {label:'Source',      value: ACT_DEMO?.source ?? 'UBER_API'},
    ],
    next:'Événement webhook reçu',
  },
  {
    id:6, icon:'📡', title:'Webhook', tag:'EVT-004', color:'#BE185D',
    what:`Signal numérique envoyé par Uber vers TAXIMETER.GOV dès la fin de la course.`,
    why:`Capture l'événement brut à la source — immuable, horodaté, signé numériquement.`,
    status:'PROCESSED',
    data:[
      {label:'Event ID',     value:'EVT-004', badge:'SIMULATED WEBHOOK'},
      {label:'Source',       value:'Uber API (DEMO)'},
      {label:'Reçu à',       value:'2026-09-20 07:45:01'},
      {label:'Signature',    value:'SHA-256 · VALID'},
      {label:'Montant',      value: money2(GROSS)},
      {label:'Idempotency',  value:'Activé — 0 doublon'},
      {label:'Statut',       value:'PROCESSED'},
    ],
    next:'Vérification API',
  },
  {
    id:7, icon:'🔌', title:'API Vérification', tag:'VERIFIED', color:'#065F46',
    what:`Confrontation du montant webhook avec l'API officielle Uber (DEMO).`,
    why:`Garantit que le montant déclaré par le webhook correspond aux données source de la plateforme.`,
    status:'VERIFIED',
    data:[
      {label:'Montant webhook', value: money2(GROSS)},
      {label:'Montant API',     value: money2(GROSS), badge:'SIMULATED API'},
      {label:'Écart',           value: money2(0)},
      {label:'Résultat',        value:'VERIFIED ✅'},
      {label:'Scénario MISMATCH',value:'Webhook 26,50 $ / API 24,50 $ → REVIEW_REQUIRED'},
    ],
    next:'Transaction financière',
  },
  {
    id:8, icon:'💰', title:'Transaction', tag:'SIM-TX-005', color:'#1D4ED8',
    what:`Enregistrement financier structuré généré depuis l'activité vérifiée.`,
    why:`Sépare chaque composante financière : brut, pourboire, commission, taxes, net.`,
    status:'RECONCILED',
    data:[
      {label:'Transaction',  value:(TX_DEMO as any)?.id ?? 'SIM-TX-005'},
      {label:'Gross',        value: money2(GROSS)},
      {label:'Pourboire',    value: money2(TIP),  badge:'SÉPARÉ'},
      {label:'Commission',   value: money2(FEES),  badge:'27,5 %'},
      {label:'TPS',          value: money2(TPS),   badge:'5 %'},
      {label:'TVQ',          value: money2(TVQ),   badge:'9,975 %'},
      {label:'Net chauffeur',value: money2(NET)},
    ],
    next:'Revenue Ledger',
  },
  {
    id:9, icon:'📒', title:'Revenue Ledger', tag:'REC-2026-09', color:'#5B21B6',
    what:`Registre financier structuré — couche entre le webhook brut et le registre fiscal.`,
    why:`Permet la réconciliation multi-sources avant toute déclaration fiscale.`,
    status:'POSTED',
    data:[
      {label:'Registre',     value:(LEDGER_DEMO as any)?.id ?? 'RL-DEMO-004'},
      {label:'Période',      value:'Q3 2026'},
      {label:'Gross',        value: money2(GROSS)},
      {label:'Pourboires',   value: money2(TIP)},
      {label:'Taxes brutes', value: money2(TPS + TVQ)},
      {label:'Net',          value: money2(NET)},
      {label:'Statut',       value:'POSTED (immuable)'},
    ],
    next:'Rapprochement Settlement',
  },
  {
    id:10, icon:'🔄', title:'Réconciliation', tag:'MATCHED', color:'#0F766E',
    what:`Comparaison de 4 sources : Event · Activity · Transaction · Settlement.`,
    why:`Détecte automatiquement toute divergence avant la production des données fiscales.`,
    status:'MATCHED',
    data:[
      {label:'Cas',           value:(RECON_DEMO as any)?.id ?? 'REC-DEMO-004'},
      {label:'Event source',  value: money2(GROSS)},
      {label:'Transaction',   value: money2(GROSS)},
      {label:'Settlement',    value: money2(GROSS)},
      {label:'Registre fiscal',value: money2(GROSS)},
      {label:'Écart',         value: money2(0)},
      {label:'Résultat',      value:'MATCHED ✅'},
      {label:'Scénario MISMATCH',value:'Fiscal 22,00 $ vs Rest 24,00 $ → PARTIAL_MATCH'},
    ],
    next:'Registre fiscal',
  },
  {
    id:11, icon:'🧾', title:'Registre Fiscal', tag:'Q3 2026', color:'#92400E',
    what:`Données fiscales structurées issues des données financières vérifiées et réconciliées.`,
    why:`Jamais générées depuis le webhook brut — toujours depuis la couche financière validée.`,
    status:'POSTED',
    data:[
      {label:'Période',       value:'Q3 2026'},
      {label:'Revenu taxable',value: money2(SIM_DECLARATION.grossRevenue ?? GROSS)},
      {label:'Pourboires',    value: money2(SIM_DECLARATION.tipsTotal   ?? TIP)},
      {label:'TPS nette',     value: money2(SIM_DECLARATION.tpsCollected ?? TPS)},
      {label:'TVQ nette',     value: money2(SIM_DECLARATION.tvqCollected ?? TVQ)},
      {label:'Statut',        value:'POSTED', badge:'IMMUABLE'},
      {label:'Note',          value:'NON TRANSMIS À REVENU QUÉBEC', badge:'PILOT'},
    ],
    next:'Déclaration DEMO',
  },
  {
    id:12, icon:'📤', title:'Déclaration & Audit', tag:'DECL-Q3-2026', color:'#1E40AF',
    what:`Déclaration DEMO prête à soumettre — alimentée par les données fiscales vérifiées.`,
    why:`Démontre la capacité du système à préparer les données gouvernementales de façon structurée et auditable.`,
    status:'READY',
    data:[
      {label:'Déclaration',  value:SIM_DECLARATION.id ?? 'DECL-Q3-2026'},
      {label:'Période',      value: SIM_DECLARATION.period ?? 'Q3 2026'},
      {label:'Revenu brut',  value: money2(SIM_DECLARATION.grossRevenue ?? 0)},
      {label:'TPS due',      value: money2(SIM_DECLARATION.tpsCollected  ?? 0)},
      {label:'TVQ due',      value: money2(SIM_DECLARATION.tvqCollected  ?? 0)},
      {label:'Total dû',     value: money2(SIM_DECLARATION.totalDue ?? 0)},
      {label:'Paiement',     value:SIM_PAYMENT.status ?? 'PAID-DEMO', badge:'DEMO'},
      {label:'⚠️ Statut',   value:'NON TRANSMIS À REVENU QUÉBEC', badge:'PILOT'},
    ],
    next:'Démonstration complète ✅',
  },
]

// ─── WORKFLOW NODES ───────────────────────────────────────────────────────────
const FLOW_NODES = [
  {id:'platform', label:'PLATFORM', sub:'Uber API', icon:'🌐'},
  {id:'event',    label:'EVENT',    sub:'Webhook reçu', icon:'📡'},
  {id:'validate', label:'VALIDATE', sub:'Signature · Idempotency', icon:'✅'},
  {id:'normalize',label:'NORMALIZE',sub:'Schema · Mapping', icon:'🔧'},
  {id:'ops',      label:'OPERATIONAL', sub:'Register · Activity', icon:'📋'},
  {id:'fin',      label:'FINANCIAL',   sub:'Register · Ledger', icon:'💰'},
  {id:'settle',   label:'SETTLEMENT',  sub:'Rapprochement', icon:'🏦'},
  {id:'recon',    label:'RECONCILE',   sub:'4 sources · MATCH/MISMATCH', icon:'🔄'},
  {id:'fiscal',   label:'FISCAL',      sub:'TPS · TVQ · Période', icon:'🧾'},
  {id:'decl',     label:'DECLARATION', sub:'DEMO READY', icon:'📤'},
  {id:'audit',    label:'AUDIT',       sub:'Timeline immuable', icon:'📋'},
]

// ─── DEMO STATUS TABLE ─────────────────────────────────────────────────────────
const DEMO_STATUS = [
  {component:'Uber Connector',        status:'DEMO',          ok:false, note:'Simulé — aucune connexion Uber réelle'},
  {component:'Webhook',               status:'SIMULATED',     ok:false, note:'Événements synthétiques uniquement'},
  {component:'API Verification',      status:'SIMULATED',     ok:false, note:'Validation démo — non branchée Uber sandbox'},
  {component:'Revenu Québec',         status:'NOT CONNECTED', ok:false, note:'Aucune transmission gouvernementale réelle'},
  {component:'Dépôt gouvernemental',  status:'NOT CONNECTED', ok:false, note:'Non connecté à ce stade du pilote'},
  {component:'Paiement',              status:'DEMO',          ok:false, note:'Virement DEMO — aucun mouvement bancaire réel'},
  {component:'Données financières',   status:'PILOT DATA',    ok:false, note:'Données synthétiques · estimations publiques'},
  {component:'Auth / RLS',            status:'ACTIVE',        ok:true,  note:'Supabase Auth actif · RLS en cours de déploiement'},
  {component:'Audit trail',           status:'ACTIVE',        ok:true,  note:'Fonctionnel · immuable · horodaté'},
  {component:'Schéma Supabase',       status:'DEPLOYED',      ok:true,  note:'155 tables · migrations 0001–0030 appliquées'},
]

// ─── GOV KPI ─────────────────────────────────────────────────────────────────
const GOV_KPI = [
  {icon:'🏢', label:'Entreprises pilotes', value:'1',        badge:'DEMO'},
  {icon:'👤', label:'Chauffeurs inscrits', value:'6',        badge:'DEMO DATA'},
  {icon:'🚗', label:'Véhicules enregistrés',value:'5',       badge:'DEMO DATA'},
  {icon:'📍', label:'Activités Q3',         value:'13',      badge:'DEMO DATA'},
  {icon:'💰', label:'Transactions Q3',      value:'10',      badge:'DEMO DATA'},
  {icon:'💵', label:'Revenu brut (DEMO)',   value:money2((SIM_DECLARATION as any).grossRevenue ?? 328_560), badge:'PILOT DATA'},
  {icon:'🧮', label:'TPS nette (DEMO)',     value:money2((SIM_DECLARATION as any).tpsCollected ?? 14_022),  badge:'PILOT DATA'},
  {icon:'🧾', label:'TVQ nette (DEMO)',     value:money2((SIM_DECLARATION as any).tvqCollected ?? 27_919),  badge:'PILOT DATA'},
  {icon:'✅', label:'Réconciliées',         value:'85 %',    badge:'DEMO'},
  {icon:'⚖️', label:'Conformité',          value:'91 %',    badge:'DEMO'},
]

// ─── AUDIT TIMELINE ──────────────────────────────────────────────────────────
const AUDIT_TIMELINE = [
  {time:'07:45:01', event:'EVENT_RECEIVED',   actor:'system',       label:'Événement reçu depuis Uber API (DEMO)'},
  {time:'07:45:01', event:'SIG_VALIDATED',    actor:'system',       label:'Signature vérifiée — SHA-256 VALID'},
  {time:'07:45:02', event:'IDEMPOTENCY_OK',   actor:'system',       label:'Pas de doublon détecté'},
  {time:'07:45:02', event:'API_VERIFIED',     actor:'system',       label:'Montant confirmé par API (DEMO) — VERIFIED'},
  {time:'07:45:03', event:'ACTIVITY_CREATED', actor:'system',       label:'Activité SIM-ACT-005 créée dans le registre opérationnel'},
  {time:'07:45:03', event:'TX_CREATED',       actor:'system',       label:'Transaction financière structurée — TPS + TVQ calculées'},
  {time:'07:45:04', event:'SETTLEMENT_RECV',  actor:'system',       label:'Settlement reçu — Uber Green Q3'},
  {time:'07:45:04', event:'RECON_MATCH',      actor:'recon_engine', label:'Réconciliation 4 sources — MATCHED · écart 0,00 $'},
  {time:'07:45:05', event:'FISCAL_POSTED',    actor:'system',       label:'Registre fiscal Q3-2026 · POSTED · immuable'},
  {time:'07:45:05', event:'DECL_READY',       actor:'system',       label:'Déclaration DECL-Q3-2026 — DEMO READY'},
]

// ─── WHY TAXIMETER ────────────────────────────────────────────────────────────
const WHY = [
  {n:1, icon:'🔍', title:'Traçabilité complète', desc:'Chaque dollar de revenu est tracé de l\'événement source au registre fiscal.'},
  {n:2, icon:'🔗', title:'Rapprochement multi-sources', desc:'4 sources comparées automatiquement : Event · Activity · Transaction · Settlement.'},
  {n:3, icon:'📊', title:'Visibilité financière structurée', desc:'Revenu brut, pourboires, commissions, taxes — séparés et audités.'},
  {n:4, icon:'🧾', title:'Préparation fiscale', desc:'TPS et TVQ calculées à partir des données financières vérifiées, pas du webhook brut.'},
  {n:5, icon:'⚠️', title:'Détection des incohérences', desc:'Tout écart entre sources est détecté, journalisé et escaladé automatiquement.'},
  {n:6, icon:'📋', title:'Auditabilité totale', desc:'Timeline immuable · chaque action consignée · qui · quoi · quand · avant · après.'},
  {n:7, icon:'🛡️', title:'Gouvernance des données', desc:'RBAC · RLS · isolation enterprise · anti-IDOR · journalisation sécurité.'},
  {n:8, icon:'🚀', title:'Architecture évolutive', desc:'155 tables Supabase · Next.js · API-first · prêt à connecter Revenu Québec.'},
]

// ─────────────────────────────────────────────────────────────────────────────
export default function DemoPage() {
  const { user } = useAuth()
  const [activeStep, setActiveStep] = useState<number>(0)          // 0 = not started
  const [running,    setRunning]    = useState(false)
  const [activeFlow, setActiveFlow] = useState<string | null>(null)
  const [tab,        setTab]        = useState<'workflow'|'enterprise'|'departments'|'driver'|'lineage'|'audit'|'gov'|'why'|'status'>('workflow')
  const stepRef = useRef<HTMLDivElement>(null)

  if (!user) return null

  const currentStep = STEPS[activeStep - 1] ?? null

  const startDemo = () => {
    setActiveStep(1)
    setRunning(true)
    setTab('workflow')
    setTimeout(() => stepRef.current?.scrollIntoView({behavior:'smooth', block:'center'}), 100)
  }
  const nextStep = () => {
    if (activeStep < STEPS.length) {
      setActiveStep(s => s + 1)
      setTimeout(() => stepRef.current?.scrollIntoView({behavior:'smooth', block:'center'}), 100)
    } else {
      setRunning(false)
    }
  }
  const prevStep = () => { if (activeStep > 1) setActiveStep(s => s - 1) }
  const resetDemo = () => { setActiveStep(0); setRunning(false); setActiveFlow(null) }

  const pct = activeStep > 0 ? Math.round(activeStep / STEPS.length * 100) : 0

  const tabStyle = (t: string) => ({
    background: tab === t ? '#003DA5' : 'transparent',
    color: tab === t ? 'white' : '#64748B',
    border: 'none', cursor: 'pointer',
    padding: '8px 14px', borderRadius: '10px',
    fontSize: '13px', fontWeight: 700, transition: 'all 0.15s',
  } as React.CSSProperties)

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-4 space-y-5 max-w-6xl mx-auto">

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl overflow-hidden shadow-lg"
          style={{background:'linear-gradient(135deg,#001A4D 0%,#002B7A 45%,#0047C0 100%)'}}>
          <div className="px-6 py-6 md:py-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">🍁</span>
                  <span className="text-white font-black text-2xl md:text-3xl" style={{letterSpacing:'-0.03em'}}>
                    TAXIMETER.GOV
                  </span>
                  <span className="px-2 py-1 rounded-lg text-xs font-black"
                    style={{background:'rgba(255,200,0,0.2)',color:'#FCD34D',border:'1px solid rgba(255,200,0,0.3)'}}>
                    PILOT
                  </span>
                </div>
                <div className="text-white font-bold text-lg md:text-xl" style={{color:'rgba(255,255,255,0.85)'}}>
                  Government Pilot Demonstration Center
                </div>
                <div className="mt-2 text-sm leading-relaxed" style={{color:'rgba(255,255,255,0.5)'}}>
                  Infrastructure numérique de traçabilité, réconciliation et préparation fiscale
                  des activités de transport et de livraison · Québec
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['🔍 CAPTURER','✅ VÉRIFIER','🔄 RÉCONCILIER','🧾 STRUCTURER','📋 AUDITER'].map(l => (
                    <span key={l} className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.75)',border:'1px solid rgba(255,255,255,0.15)'}}>
                      {l}
                    </span>
                  ))}
                </div>
              </div>
              <div className="hidden md:block shrink-0 text-right">
                <div className="text-sm font-bold" style={{color:'rgba(255,255,255,0.35)'}}>DONNÉES</div>
                <div className="text-sm font-black text-amber-400">SYNTHÉTIQUES</div>
                <div className="text-sm font-bold mt-2" style={{color:'rgba(255,255,255,0.35)'}}>CONNEXION GOV</div>
                <div className="text-sm font-black text-red-400">NON ACTIVE</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="px-6 pb-6 flex items-center gap-3 flex-wrap">
            {activeStep === 0 ? (
              <button onClick={startDemo}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm cursor-pointer transition-all hover:scale-105 active:scale-95"
                style={{background:'#FCD34D',color:'#001A4D',boxShadow:'0 4px 20px rgba(252,211,77,0.4)'}}>
                ▶ START GOVERNMENT DEMO
              </button>
            ) : (
              <button onClick={resetDemo}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm cursor-pointer border"
                style={{background:'rgba(255,255,255,0.1)',color:'white',borderColor:'rgba(255,255,255,0.2)'}}>
                ↺ RESET DEMO
              </button>
            )}
            <span className="text-xs font-semibold" style={{color:'rgba(255,255,255,0.4)'}}>
              {PILOT}
            </span>
          </div>
        </div>

        {/* ══ PROGRESS BAR (when running) ══════════════════════════════════ */}
        {activeStep > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-black text-slate-700 dark:text-slate-300">
                Scénario — Ali Bouchard · Uber Green · DEMO
              </div>
              <div className="text-sm font-bold text-slate-500">
                Étape {activeStep}/{STEPS.length} — {pct}%
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-3">
              <div className="h-2 rounded-full transition-all duration-500"
                style={{width:`${pct}%`,background:'linear-gradient(90deg,#003DA5,#0047C0)'}}/>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {STEPS.map(s => (
                <button key={s.id} onClick={() => setActiveStep(s.id)}
                  className="w-8 h-8 rounded-lg text-xs font-black cursor-pointer transition-all"
                  style={{
                    background: activeStep === s.id ? s.color : activeStep > s.id ? '#D1FAE5' : '#F1F5F9',
                    color: activeStep === s.id ? 'white' : activeStep > s.id ? '#059669' : '#94A3B8',
                    border: activeStep === s.id ? `2px solid ${s.color}` : '2px solid transparent',
                  }}>
                  {activeStep > s.id ? '✓' : s.id}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ STEP CARD (when running) ══════════════════════════════════════ */}
        {currentStep && (
          <div ref={stepRef} className="rounded-2xl overflow-hidden shadow-md border"
            style={{borderColor: currentStep.color + '40'}}>
            {/* Step header */}
            <div className="px-5 py-4 flex items-center justify-between"
              style={{background:`linear-gradient(135deg,${currentStep.color}15,${currentStep.color}08)`}}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                  style={{background:currentStep.color}}>
                  {currentStep.icon}
                </div>
                <div>
                  <div className="text-xs font-bold" style={{color:currentStep.color}}>
                    ÉTAPE {currentStep.id}/12
                  </div>
                  <div className="text-lg font-black text-slate-800 dark:text-white">{currentStep.title}</div>
                  <div className="text-xs font-mono font-bold text-slate-400">{currentStep.tag}</div>
                </div>
              </div>
              <span className="text-xs font-black px-3 py-1.5 rounded-full text-white"
                style={{background:currentStep.color}}>
                {currentStep.status}
              </span>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 space-y-4">
              {/* What / Why */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <div className="text-xs font-black text-slate-400 mb-1">WHAT</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">{currentStep.what}</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-3">
                  <div className="text-xs font-black text-blue-400 mb-1">WHY</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">{currentStep.why}</div>
                </div>
              </div>

              {/* Data table */}
              <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-black text-slate-400 uppercase tracking-widest">
                  DATA
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentStep.data.map((row, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2">
                      <span className="text-xs font-semibold text-slate-500">{row.label}</span>
                      <div className="flex items-center gap-2">
                        {row.badge && (
                          <span className="text-xs font-black px-1.5 py-0.5 rounded"
                            style={{background: row.badge.includes('⚠️') ? '#FEF3C7' : row.badge === 'SÉPARÉ' || row.badge === 'IMMUABLE' ? '#EFF6FF' : '#F0FDF4',
                                    color:      row.badge.includes('⚠️') ? '#B45309' : row.badge === 'SÉPARÉ' || row.badge === 'IMMUABLE' ? '#1D4ED8' : '#059669'}}>
                            {row.badge}
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">{row.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next step */}
              {activeStep < STEPS.length && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Prochaine étape :</span>
                  <span className="font-bold text-slate-600 dark:text-slate-300">→ {currentStep.next}</span>
                </div>
              )}

              {/* Nav buttons */}
              <div className="flex items-center justify-between pt-1">
                <button onClick={prevStep} disabled={activeStep <= 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border cursor-pointer disabled:opacity-30"
                  style={{borderColor:'#E2E8F0',color:'#64748B'}}>
                  ← Précédent
                </button>
                {activeStep < STEPS.length ? (
                  <button onClick={nextStep}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-black cursor-pointer text-white transition-all hover:scale-105"
                    style={{background:currentStep.color}}>
                    Suivant → {STEPS[activeStep]?.icon}
                  </button>
                ) : (
                  <button onClick={resetDemo}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-black cursor-pointer text-white"
                    style={{background:'#059669'}}>
                    ✅ Démo complète · Recommencer
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ TABS ═════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex gap-1 p-2 overflow-x-auto border-b border-slate-100 dark:border-slate-800">
            {([
              {id:'workflow',    label:'🔄 Workflow'},
              {id:'enterprise',  label:'🏢 Enterprise'},
              {id:'departments', label:'🏗️ Departments'},
              {id:'driver',      label:'👤 Driver'},
              {id:'lineage',     label:'🔗 Data Lineage'},
              {id:'audit',       label:'📋 Audit'},
              {id:'gov',         label:'🏛️ Gov View'},
              {id:'why',         label:'💡 Why'},
              {id:'status',      label:'⚠️ Demo Status'},
            ] as const).map(t => (
              <button key={t.id} onClick={() => setTab(t.id as typeof tab)} style={tabStyle(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">

            {/* ── WORKFLOW TAB ─────────────────────────────────────────────── */}
            {tab === 'workflow' && (
              <div className="space-y-4">
                <div className="text-sm font-black text-slate-700 dark:text-white mb-3">
                  De l'activité terrain à la donnée gouvernementale vérifiable
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {FLOW_NODES.map((node, i) => (
                    <button key={node.id}
                      onClick={() => setActiveFlow(activeFlow === node.id ? null : node.id)}
                      className="relative p-3 rounded-xl border-2 text-left cursor-pointer transition-all hover:scale-[1.02]"
                      style={{
                        borderColor: activeFlow === node.id ? '#003DA5' : '#E2E8F0',
                        background:  activeFlow === node.id ? '#EFF6FF' : 'white',
                      }}>
                      <div className="text-xl mb-1">{node.icon}</div>
                      <div className="text-xs font-black text-slate-800" style={{color: activeFlow === node.id ? '#003DA5' : undefined}}>{node.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{node.sub}</div>
                      {i < FLOW_NODES.length - 1 && (
                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 text-slate-300 text-xs hidden md:block">→</div>
                      )}
                    </button>
                  ))}
                </div>
                {activeFlow && (() => {
                  const info: Record<string, {what:string; why:string; data:string; source:string; next:string}> = {
                    platform:  {what:'Plateforme partenaire (Uber, taxi, livraison)',  why:'Source primaire des événements de revenu', data:'Provider ID · API credentials · Webhook URL', source:'provider_integrations', next:'EVENT'},
                    event:     {what:'Événement brut reçu depuis la plateforme',      why:'Point d\'entrée immuable dans le système',  data:'event_id · payload_hash · signature · timestamp', source:'system_events', next:'VALIDATE'},
                    validate:  {what:'Vérification signature + idempotency',          why:'Garantit l\'intégrité et l\'unicité',       data:'SHA-256 · webhook_event_id UNIQUE · SIG_FAIL→quarantine', source:'dead_letter_queue', next:'NORMALIZE'},
                    normalize: {what:'Mapping webhook → schéma métier interne',       why:'Découple le format plateforme du modèle métier', data:'provider_event_mappings · schema validation', source:'provider_events', next:'OPERATIONAL'},
                    ops:       {what:'Registre opérationnel — activité structurée',   why:'1 event valide = 1 activité métier',       data:'driver · vehicle · dept · origin · dest · dist · dur', source:'provider_activities', next:'FINANCIAL'},
                    fin:       {what:'Registre financier — calcul exact de chaque composante', why:'Séparation gross/tips/fees/tps/tvq/net', data:'gross · tip · fees · tps · tvq · net · snapshot_version', source:'provider_transaction_snapshots', next:'SETTLEMENT'},
                    settle:    {what:'Settlement reçu de la plateforme',              why:'Comparer le ledger au montant effectivement versé', data:'settlement_gross · settlement_net · period · currency', source:'provider_settlements', next:'RECONCILE'},
                    recon:     {what:'Réconciliation 4 sources',                      why:'Détecter tout écart avant la fiscalité',   data:'MATCHED · PARTIAL_MATCH · MISMATCH · MISSING · DUPLICATE', source:'provider_reconciliation_items', next:'FISCAL'},
                    fiscal:    {what:'Registre fiscal Q3 — TPS/TVQ structurées',      why:'Données fiscales issues de la couche financière vérifiée', data:'tax_period · taxable_amount · tps · tvq · POSTED', source:'provider_tax_records', next:'DECLARATION'},
                    decl:      {what:'Déclaration DEMO prête',                        why:'Préparer la soumission future à Revenu Québec', data:'DECL-Q3-2026 · tpsNet · tvqNet · totalDue · DEMO READY', source:'tax_filings', next:'AUDIT'},
                    audit:     {what:'Timeline d\'audit immuable',                    why:'Chaque action est journalisée · qui · quoi · quand', data:'actor · action · before · after · timestamp · DELETE=FALSE', source:'audit_logs / document_audit_events', next:'—'},
                  }
                  const n = info[activeFlow]
                  if (!n) return null
                  return (
                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 space-y-3">
                      <div className="text-sm font-black text-blue-800 dark:text-blue-300">{activeFlow.toUpperCase()}</div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        {([['WHAT',n.what],['WHY',n.why],['DATA',n.data],['STATUS','ACTIVE ✅'],['SOURCE TABLE',n.source],['NEXT STEP →',n.next]] as [string,string][]).map(([l,v])=>(
                          <div key={l} className="bg-white/60 dark:bg-black/20 rounded-lg p-2">
                            <div className="font-black text-slate-400 mb-0.5">{l}</div>
                            <div className="text-slate-700 dark:text-slate-300 font-semibold">{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* ── ENTERPRISE TAB ────────────────────────────────────────────── */}
            {tab === 'enterprise' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/8">
                  <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-white font-black text-sm shrink-0">uber</div>
                  <div>
                    <div className="font-black text-slate-800 dark:text-white">{CURRENT_ENT.legalName}</div>
                    <div className="text-sm text-slate-500">{CURRENT_ENT.tradeName}</div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">DEMO / PILOT DATA</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">ACTIVE</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    {l:'Enterprise ID',  v:CURRENT_ENT.id},
                    {l:'Nom légal',      v:CURRENT_ENT.legalName},
                    {l:'Marque',         v:CURRENT_ENT.tradeName},
                    {l:'NEQ (DEMO)',     v:'8765432100'},
                    {l:'TPS',           v:'Enregistrée · 5 %'},
                    {l:'TVQ',           v:'Enregistrée · 9,975 %'},
                    {l:'Départements',  v:'6 actifs'},
                    {l:'Chauffeurs',    v:'6 DEMO'},
                    {l:'Véhicules',     v:'5 DEMO'},
                    {l:'Statut',        v:'ACTIVE ✅'},
                  ].map(({l,v}) => (
                    <div key={l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                      <div className="text-xs font-bold text-slate-400">{l}</div>
                      <div className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  ⚠️ DONNÉES SYNTHÉTIQUES — Aucun lien avec les états financiers réels d'Uber Technologies Inc. ou de ses filiales.
                </div>
              </div>
            )}

            {/* ── DEPARTMENTS TAB ────────────────────────────────────────────── */}
            {tab === 'departments' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">6 départements · ENT-DEMO-001 · DONNÉES SYNTHÉTIQUES</div>
                {(DEPARTMENTS as any[]).map((d:any) => (
                  <div key={d.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{d.emoji ?? '🏗️'}</span>
                      <div>
                        <div className="text-sm font-black text-slate-800 dark:text-white">{d.name}</div>
                        <div className="text-xs text-slate-400">{d.id}</div>
                      </div>
                      <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{d.status}</span>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {[
                        {l:'Chauffeurs', v: d.drivers},
                        {l:'Véhicules',  v: d.vehicles},
                        {l:'Activités',  v:(d.activities??0).toLocaleString('fr-CA')},
                        {l:'Gross',      v:money2(d.gross??0)},
                        {l:'TPS',        v:money2(d.tps??0)},
                        {l:'TVQ',        v:money2(d.tvq??0)},
                      ].map(({l,v}) => (
                        <div key={l} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center">
                          <div className="text-xs font-bold text-slate-400">{l}</div>
                          <div className="text-xs font-black text-slate-700 dark:text-slate-300 mt-0.5">{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs font-semibold text-amber-700">
                  ⚠️ Chiffres synthétiques — estimations illustratives uniquement · DEMO DATA
                </div>
              </div>
            )}

            {/* ── DRIVER TAB ────────────────────────────────────────────────── */}
            {tab === 'driver' && (
              <div className="space-y-4">
                <div className="text-sm font-black text-slate-500 uppercase tracking-wide">DRIVER PROFILE — DEMO</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Profile card */}
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-500/10 dark:to-blue-500/10 border border-purple-100 dark:border-purple-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-black text-xl">
                        {DRIVER_DEMO?.name?.[0] ?? 'A'}
                      </div>
                      <div>
                        <div className="font-black text-slate-800 dark:text-white text-lg">{DRIVER_DEMO?.name ?? 'Ali Bouchard'}</div>
                        <div className="text-xs font-mono text-slate-400">{DRIVER_DEMO?.id}</div>
                        <span className="text-xs font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700">{DRIVER_DEMO?.status}</span>
                      </div>
                    </div>
                    {[
                      {l:'Département',  v:'Uber Green'},
                      {l:'Véhicule',     v:`${VEH_DEMO?.year} ${VEH_DEMO?.make} ${VEH_DEMO?.model}`},
                      {l:'Plaque',       v: VEH_DEMO?.plate ?? 'JKL-3456'},
                      {l:'Type contrat', v: DRIVER_DEMO?.relation ?? 'CONTRACTOR'},
                      {l:'Activités Q3', v:(DRIVER_DEMO?.actQ3 ?? 980).toLocaleString('fr-CA')},
                      {l:'Documents',    v: DRIVER_DEMO?.docs ?? 'EXPIRING'},
                    ].map(({l,v}) => (
                      <div key={l} className="flex justify-between py-1.5 border-b border-purple-100 dark:border-purple-500/20 last:border-0">
                        <span className="text-xs font-semibold text-slate-500">{l}</span>
                        <span className={`text-xs font-bold ${v==='EXPIRING'?'text-amber-600':'text-slate-800 dark:text-slate-200'}`}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Activity card */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5">
                    <div className="text-xs font-black text-slate-400 mb-3">ACTIVITÉ DEMO — SIM-ACT-005</div>
                    {[
                      {l:'Service',      v: ACT_DEMO?.deptName ?? 'Uber Green'},
                      {l:'Origine',      v: ACT_DEMO?.origin   ?? 'Mile-Ex'},
                      {l:'Destination',  v: ACT_DEMO?.dest     ?? 'Rosemont'},
                      {l:'Distance',     v:`${ACT_DEMO?.dist ?? 6.8} km`},
                      {l:'Durée',        v:`${ACT_DEMO?.dur  ?? 16} min`},
                      {l:'Gross',        v: money2(GROSS)},
                      {l:'Pourboire',    v: money2(TIP)},
                      {l:'Commission',   v: money2(FEES)+' (27,5%)'},
                      {l:'TPS',          v: money2(TPS)+' (5%)'},
                      {l:'TVQ',          v: money2(TVQ)+' (9,975%)'},
                      {l:'Net chauffeur',v: money2(NET)},
                      {l:'Statut',       v:'COMPLETED ✅'},
                    ].map(({l,v}) => (
                      <div key={l} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <span className="text-xs font-semibold text-slate-400">{l}</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{v}</span>
                      </div>
                    ))}
                    <div className="mt-3 px-3 py-2 bg-green-50 dark:bg-green-500/10 rounded-xl text-xs font-black text-green-700 dark:text-green-400 text-center cursor-pointer hover:bg-green-100 transition-colors" onClick={() => setTab('lineage')}>
                      🔗 VIEW COMPLETE DRIVER JOURNEY →
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── DATA LINEAGE TAB ──────────────────────────────────────────── */}
            {tab === 'lineage' && (
              <div className="space-y-3">
                <div className="text-sm font-black text-slate-700 dark:text-white">🔗 Follow the Money — Data Lineage</div>
                <div className="text-xs text-slate-400 mb-2">Chaque nœud représente une couche de traitement · Cliquer pour voir la table source</div>
                {[
                  {icon:'🧾', label:'REGISTRE FISCAL',    table:'provider_tax_records',           value:'RL-2026-Q3-004 · TPS 1,20 $ · TVQ 2,39 $ · POSTED'},
                  {icon:'💰', label:'REGISTRE FINANCIER', table:'provider_transaction_snapshots',  value:'SIM-TX-005 · Gross 24,00 $ · Fees 6,60 $ · Net 14,01 $'},
                  {icon:'🏦', label:'SETTLEMENT',         table:'provider_settlements',            value:'SET-004 · Uber Green Q3 · 24,00 $ · MATCHED'},
                  {icon:'💼', label:'TRANSACTION',        table:'provider_transaction_snapshots',  value:'SIM-TX-005 · actId=SIM-ACT-005 · driver=DRV-QC-0004'},
                  {icon:'📍', label:'ACTIVITÉ',           table:'provider_activities',             value:'SIM-ACT-005 · Mile-Ex→Rosemont · 6,8km · 16min'},
                  {icon:'👤', label:'CHAUFFEUR',          table:'driver_profiles',                 value:'DRV-QC-0004 · Ali Bouchard · Uber Green'},
                  {icon:'🚗', label:'VÉHICULE',           table:'vehicles',                        value:'TXM-004 · JKL-3456 · Prius 2024'},
                  {icon:'🏢', label:'ENTERPRISE',         table:'enterprises (driver_profiles)',   value:'ENT-DEMO-001 · Uber Québec (DEMO)'},
                  {icon:'📡', label:'ÉVÉNEMENT SOURCE',   table:'system_events',                   value:'EVT-004 · TRIP_COMPLETED · signature VALID · PROCESSED'},
                  {icon:'📦', label:'PAYLOAD ORIGINAL',   table:'system_events.source_payload',   value:'JSON immuable · hash SHA-256 · jamais modifié'},
                ].map((node, i) => (
                  <div key={i}>
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-200 transition-colors cursor-default">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm shrink-0">{node.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-black text-slate-700 dark:text-slate-300">{node.label}</span>
                          <span className="text-xs font-mono text-blue-500 dark:text-blue-400">{node.table}</span>
                        </div>
                        <div className="text-xs text-slate-500">{node.value}</div>
                      </div>
                    </div>
                    {i < 9 && <div className="text-center text-slate-300 text-sm py-0.5">↓</div>}
                  </div>
                ))}
              </div>
            )}

            {/* ── AUDIT TAB ─────────────────────────────────────────────────── */}
            {tab === 'audit' && (
              <div className="space-y-3">
                <div className="text-sm font-black text-slate-700 dark:text-white">📋 Timeline d'audit — 20 sept. 2026 · Ali Bouchard · Uber Green (DEMO)</div>
                <div className="space-y-2">
                  {AUDIT_TIMELINE.map((e,i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">{e.time}</div>
                      <div className="w-px bg-slate-200 dark:bg-slate-600 self-stretch mx-1 shrink-0"/>
                      <div>
                        <div className="text-xs font-black text-slate-500">{e.event}</div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{e.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">actor: {e.actor}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-3 text-xs font-bold text-green-700 dark:text-green-400">
                  ✅ Timeline immuable · DELETE=FALSE · UPDATE=FALSE · RLS audit_no_delete · audit_no_update
                </div>
              </div>
            )}

            {/* ── GOV VIEW TAB ──────────────────────────────────────────────── */}
            {tab === 'gov' && (
              <div className="space-y-4">
                <div className="text-sm font-black text-slate-700 dark:text-white">🏛️ Government Perspective — Tableau de bord décideur</div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {GOV_KPI.map(k => (
                    <div key={k.label} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 text-center">
                      <div className="text-xl mb-1">{k.icon}</div>
                      <div className="text-lg font-black text-slate-800 dark:text-white">{k.value}</div>
                      <div className="text-xs text-slate-400 leading-tight mt-0.5">{k.label}</div>
                      <div className="text-xs font-black px-1.5 py-0.5 rounded mt-1 inline-block"
                        style={{background:'#FEF3C7',color:'#B45309'}}>{k.badge}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {icon:'⚠️', title:'Anomalies actives',  value:'2 CRITIQUE · 3 HAUTE', color:'#DC2626', bg:'#FEF2F2'},
                    {icon:'📄', title:'Documents expirants', value:'4 EXPIRING · 2 EXPIRED',color:'#B45309', bg:'#FEF3C7'},
                    {icon:'🔍', title:'En réconciliation',   value:'1 REVIEW_REQUIRED',      color:'#7C3AED', bg:'#F5F3FF'},
                  ].map(c => (
                    <div key={c.title} className="rounded-xl p-3 border" style={{background:c.bg,borderColor:c.color+'30'}}>
                      <div className="text-sm font-bold" style={{color:c.color}}>{c.icon} {c.title}</div>
                      <div className="text-sm font-black text-slate-800 mt-1">{c.value}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-bold text-amber-700">
                  ⚠️ Tous les indicateurs affichés sont des DEMO DATA · estimations synthétiques · non représentatifs de données gouvernementales réelles.
                </div>
              </div>
            )}

            {/* ── WHY TAB ───────────────────────────────────────────────────── */}
            {tab === 'why' && (
              <div className="space-y-3">
                <div className="text-sm font-black text-slate-700 dark:text-white mb-1">💡 Why TAXIMETER.GOV? — Pilot Objectives</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {WHY.map(w => (
                    <div key={w.n} className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                        style={{background:'#003DA5',color:'white',fontWeight:900}}>{w.n}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm">{w.icon}</span>
                          <span className="text-sm font-black text-slate-700 dark:text-slate-300">{w.title}</span>
                        </div>
                        <div className="text-xs text-slate-500">{w.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
                  <div className="text-sm font-black text-blue-800 dark:text-blue-300 mb-1">Architecture</div>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {['Next.js 15','TypeScript','Supabase','155 tables','Vercel','RLS/RBAC'].map(t=>(
                      <div key={t} className="bg-white/60 dark:bg-black/20 rounded-lg py-2 text-center text-xs font-bold text-blue-700 dark:text-blue-400">{t}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── DEMO STATUS TAB ────────────────────────────────────────────── */}
            {tab === 'status' && (
              <div className="space-y-3">
                <div className="text-sm font-black text-red-600">⚠️ DEMO STATUS — Transparence obligatoire</div>
                <div className="text-xs text-slate-400">Ce tableau indique clairement ce qui est réel vs simulé dans cette démonstration.</div>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-3 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                    <div>COMPOSANT</div><div>STATUT</div><div>NOTE</div>
                  </div>
                  {DEMO_STATUS.map((row,i) => (
                    <div key={i} className={`grid grid-cols-3 items-center px-4 py-3 border-t border-slate-100 dark:border-slate-800 ${i%2===0?'bg-white dark:bg-slate-900':'bg-slate-50/50 dark:bg-slate-800/50'}`}>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{row.component}</div>
                      <div>
                        <span className="text-xs font-black px-2 py-1 rounded-lg"
                          style={{
                            background: row.ok ? '#D1FAE5' : row.status === 'NOT CONNECTED' ? '#FEE2E2' : '#FEF3C7',
                            color:      row.ok ? '#065F46' : row.status === 'NOT CONNECTED' ? '#DC2626' : '#B45309',
                          }}>
                          {row.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">{row.note}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                  <div className="text-sm font-black text-red-700 dark:text-red-400 mb-2">Ce que TAXIMETER.GOV N'EST PAS (encore)</div>
                  {[
                    'Aucune connexion à Revenu Québec dans ce pilote',
                    'Aucune transmission de données réelles au gouvernement',
                    'Aucun paiement de taxes réel — PAID-DEMO uniquement',
                    'Les données Uber affichées sont synthétiques et illustratives',
                    'Ce n\'est pas encore un système certifié de conformité fiscale',
                  ].map((t,i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 py-0.5">
                      <span className="shrink-0 font-bold">✕</span><span>{t}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-4">
                  <div className="text-sm font-black text-green-700 dark:text-green-400 mb-2">Ce que TAXIMETER.GOV EST (déjà)</div>
                  {[
                    'Infrastructure technique complète — 155 tables · API-first · Next.js 15',
                    'Architecture de traçabilité complète de l\'event au registre fiscal',
                    'Schéma de réconciliation 4 sources fonctionnel',
                    'RBAC · 9 rôles · 42 permissions · RLS en déploiement',
                    'Audit trail immuable · DELETE=FALSE · horodaté',
                    'Prêt pour connexion Revenu Québec et plateformes partenaires',
                  ].map((t,i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-green-700 dark:text-green-400 py-0.5">
                      <span className="shrink-0 font-bold">✓</span><span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ══ PILOT FOOTER ════════════════════════════════════════════════ */}
        <div className="text-center text-xs text-slate-400 py-2">
          {PILOT} · Phase 38 · Government Demonstration Center · TAXIMETER.GOV · 🍁 Québec
        </div>

      </div>
    </AppShell>
  )
}
