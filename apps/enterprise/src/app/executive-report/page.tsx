'use client'
import React, { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/lib/auth/AuthProvider'
import {
  PILOT, money2,
  CURRENT_ENT, ENT_DRIVERS, ENT_VEHICLES, DEPARTMENTS,
  SIM_ACTIVITIES, SIM_DECLARATION, SIM_PAYMENT,
  REVENUE, ANOMALIES,
} from '@/lib/data'

// Local constants (not exported from data.ts)
const TPS_R  = 0.05
const TVQ_R  = 0.09975
const r2     = (n: number) => Math.round(n * 100) / 100
const GROSS_Q3 = 412_800

// ─── STATIC CONTENT ────────────────────────────────────────────────────────────

const PROBLEMS = [
  { icon:'🔀', title:'Fragmentation des données',      desc:'Les activités de transport et livraison sont réparties sur plusieurs plateformes sans point de consolidation unique.' },
  { icon:'📊', title:'Visibilité financière limitée',  desc:'Les revenus bruts, pourboires, commissions et taxes ne sont pas structurés de façon homogène entre les sources.' },
  { icon:'🔍', title:'Difficulté de rapprochement',    desc:'Les montants déclarés par les plateformes ne sont pas systématiquement comparés aux données de règlement effectif.' },
  { icon:'📄', title:'Conformité documentaire',        desc:'Le suivi des licences, permis et documents réglementaires des chauffeurs et véhicules est fragmenté.' },
  { icon:'🧾', title:'Préparation fiscale',            desc:'Les données nécessaires à la production des déclarations TPS/TVQ ne sont pas consolidées de façon automatisable.' },
  { icon:'📋', title:'Auditabilité',                   desc:'Les actions, corrections et événements ne sont pas systématiquement journalisés avec traçabilité complète.' },
  { icon:'🛡️', title:'Gouvernance des données',       desc:'L\'isolation des données entre entreprises, départements et chauffeurs n\'est pas garantie structurellement.' },
]

const APPS = [
  {
    id:'gov', icon:'🏛️', title:'Government Admin', color:'#002B7A',
    desc:'Interface de supervision gouvernementale du système pilote.',
    features:['Entreprises et chauffeurs inscrits','Activités et transactions','Fiscalité globale','Réconciliation','Rapports et conformité','Pipeline Center','Audit et sécurité','Alertes et anomalies'],
  },
  {
    id:'ent', icon:'🏢', title:'Enterprise Gov', color:'#0047C0',
    desc:'Portail des entreprises partenaires du pilote.',
    features:['Profil légal et NEQ','Départements et unités','Chauffeurs et véhicules','Documents et conformité','Activités et transactions','Revenus — TPS / TVQ','Déclarations et paiements','API · Webhooks · Réconciliation'],
  },
  {
    id:'drv', icon:'👤', title:'Driver Gov', color:'#7C3AED',
    desc:'Portail individuel du chauffeur inscrit au pilote.',
    features:['Identité et licence','Véhicules et documents','Services et activités','Revenus et pourboires','TPS / TVQ individuelles','Déclarations et historique','Conformité et notifications','Accès sécurisé par token'],
  },
]

const DATA_FLOW = [
  { icon:'🌐', label:'PLATFORM / ENTERPRISE', sub:'Source des événements' },
  { icon:'📡', label:'API / WEBHOOK',          sub:'Signal entrant horodaté et signé' },
  { icon:'✅', label:'VALIDATION',             sub:'Signature · Idempotency · Schéma' },
  { icon:'📍', label:'ACTIVITY',               sub:'Registre opérationnel' },
  { icon:'💰', label:'TRANSACTION',            sub:'Gross · Tips · Fees · TPS · TVQ · Net' },
  { icon:'📒', label:'REVENUE LEDGER',         sub:'Registre financier structuré' },
  { icon:'🏦', label:'SETTLEMENT',             sub:'Rapprochement plateforme' },
  { icon:'🔄', label:'RECONCILIATION',         sub:'4 sources · MATCH / MISMATCH' },
  { icon:'🧾', label:'FISCAL REGISTER',        sub:'TPS · TVQ · Période · POSTED' },
  { icon:'📤', label:'DECLARATION',            sub:'DEMO READY · NON TRANSMIS' },
  { icon:'📋', label:'AUDIT',                  sub:'Timeline immuable · WHO/WHAT/WHEN' },
]

const RECON_STATUSES = [
  { s:'MATCHED',       c:'#059669', desc:'4 sources concordantes · écart 0,00 $' },
  { s:'PARTIAL MATCH', c:'#B45309', desc:'Écart détecté · non effacé · tracé' },
  { s:'MISMATCH',      c:'#DC2626', desc:'Divergence significative · REVIEW requis' },
  { s:'MISSING',       c:'#7C3AED', desc:'Source absente d\'un des registres' },
  { s:'DUPLICATE',     c:'#64748B', desc:'Événement dupliqué · traitement bloqué' },
  { s:'REVIEW',        c:'#1D4ED8', desc:'Escalade manuelle requise' },
]

const SECURITY_ITEMS = [
  { icon:'🔑', label:'Authentication',    detail:'Supabase Auth · JWT · sessions sécurisées' },
  { icon:'🎭', label:'RBAC',              detail:'9 rôles · 42 permissions · contrôle granulaire' },
  { icon:'🛡️', label:'RLS',              detail:'Row-Level Security · isolation par enterprise_id' },
  { icon:'📋', label:'Audit Trail',       detail:'DELETE=FALSE · UPDATE=FALSE · immuable' },
  { icon:'🔒', label:'Data Isolation',    detail:'Enterprise A ≠ Enterprise B · anti-IDOR' },
  { icon:'✅', label:'Event Integrity',   detail:'SHA-256 · signature webhook · payload immuable' },
  { icon:'🔁', label:'Idempotency',       detail:'webhook_event_id UNIQUE · 0 doublon en base' },
]

const PILOT_OBJECTIVES = [
  'Centraliser les données des activités de transport et livraison',
  'Améliorer la traçabilité de l\'événement source au registre fiscal',
  'Vérifier les événements entrants (signature, montant, schéma)',
  'Rapprocher les sources : Event · Activity · Transaction · Settlement',
  'Structurer les données financières (brut / pourboires / commissions / taxes / net)',
  'Préparer les données fiscales (TPS · TVQ · période · déclaration)',
  'Améliorer l\'auditabilité de chaque action dans le système',
  'Améliorer la gouvernance des données (RBAC · RLS · isolation)',
  'Détecter automatiquement les incohérences et anomalies',
  'Créer une architecture évolutive prête aux intégrations gouvernementales futures',
]

const LIMITATIONS = [
  { label:'Intégrations gouvernementales officielles', status:'NON DISPONIBLE', note:'Aucune connexion à Revenu Québec, SAAQ ou autre organisme' },
  { label:'API gouvernementale',                       status:'NON DISPONIBLE', note:'Requiert autorisation, cahier des charges, sécurité officielle' },
  { label:'Transmission déclarations fiscales',        status:'NON DISPONIBLE', note:'SUBMITTED-DEMO ≠ transmission réelle à Revenu Québec' },
  { label:'Paiement fiscal réel',                      status:'NON DISPONIBLE', note:'PAID-DEMO · aucun virement bancaire ou gouvernemental' },
  { label:'Données officielles plateformes',           status:'NON DISPONIBLE', note:'Données Uber synthétiques · estimation illustrative uniquement' },
  { label:'Validation réglementaire',                  status:'NON DISPONIBLE', note:'Pilote non certifié par un organisme de réglementation' },
  { label:'Supabase RLS en production',                status:'EN COURS',       note:'Policies SQL définies · déploiement en base à compléter' },
  { label:'Realtime push system_events',               status:'EN COURS',       note:'Infrastructure disponible · activation dans Supabase requise' },
]

const STATUS_TABLE = [
  { component:'Supabase Auth · JWT · sessions',       status:'RÉEL',         color:'#059669' },
  { component:'Schéma Supabase (155 tables)',          status:'RÉEL',         color:'#059669' },
  { component:'RBAC (9 rôles · 42 permissions)',       status:'RÉEL',         color:'#059669' },
  { component:'Audit trail immuable',                  status:'RÉEL',         color:'#059669' },
  { component:'Middleware sécurité Next.js',           status:'RÉEL',         color:'#059669' },
  { component:'3 applications déployées (Vercel)',     status:'RÉEL',         color:'#059669' },
  { component:'Entreprise Uber Québec (DEMO)',         status:'PILOTE',       color:'#1D4ED8' },
  { component:'6 chauffeurs · 5 véhicules DEMO',      status:'PILOTE',       color:'#1D4ED8' },
  { component:'13 activités · 10 transactions DEMO',  status:'PILOTE',       color:'#1D4ED8' },
  { component:'Logique TPS/TVQ (5% · 9,975%)',        status:'PILOTE',       color:'#1D4ED8' },
  { component:'Pipeline Center (flux de données)',     status:'PILOTE',       color:'#1D4ED8' },
  { component:'Déclaration DECL-Q3-2026',             status:'PILOTE',       color:'#1D4ED8' },
  { component:'Webhook · Signature · Idempotency',    status:'SIMULÉ',       color:'#B45309' },
  { component:'API Verification (Uber sandbox)',       status:'SIMULÉ',       color:'#B45309' },
  { component:'Paiement PAY-Q3-2026',                 status:'SIMULÉ',       color:'#B45309' },
  { component:'Settlement · Réconciliation DEMO',     status:'SIMULÉ',       color:'#B45309' },
  { component:'Revenu Québec',                        status:'NON CONNECTÉ', color:'#DC2626' },
  { component:'API gouvernementale officielle',        status:'NON CONNECTÉ', color:'#DC2626' },
  { component:'Transmission déclarations',            status:'NON CONNECTÉ', color:'#DC2626' },
  { component:'Paiement fiscal réel',                 status:'NON CONNECTÉ', color:'#DC2626' },
]

const ROADMAP = [
  { phase:'PHASE 1', title:'Validation Pilote',             desc:'Architecture · flux de données · modules DEMO · validation E2E · rapport exécutif', current:true },
  { phase:'PHASE 2', title:'Intégrations contrôlées',       desc:'Connexion sandbox plateformes partenaires · tests API · validation technique' },
  { phase:'PHASE 3', title:'Intégration API gouvernementale',desc:'Sous réserve autorisation · cahier des charges · sécurité · juridique · Revenu Québec' },
  { phase:'PHASE 4', title:'Validation sécurité / légale',  desc:'Audit sécurité · conformité LPRPDE / loi 25 · validation organisme réglementaire' },
  { phase:'PHASE 5', title:'Pilote élargi',                 desc:'Plusieurs entreprises · chauffeurs réels · données réelles · supervision gouvernementale' },
  { phase:'PHASE 6', title:'Décision production',           desc:'Déploiement officiel · ou arrêt · basé sur les résultats du pilote élargi' },
]

const GOV_KPI = [
  { icon:'🏢', label:'Entreprises pilotes',  value:'1',          sub:'ENT-DEMO-001' },
  { icon:'🏗️', label:'Départements',        value:'6',          sub:'Uber Rides/Green/Eats/Grocery/Courier/Taxi' },
  { icon:'👤', label:'Chauffeurs',           value:ENT_DRIVERS.length.toString(), sub:'DEMO · DRV-QC-0001..0006' },
  { icon:'🚗', label:'Véhicules',            value:ENT_VEHICLES.length.toString(), sub:'DEMO · JKL-3456 etc.' },
  { icon:'📍', label:'Activités Q3',         value:'13',         sub:'DEMO · 10 COMPLETED · 3 EXCEPTION' },
  { icon:'💰', label:'Transactions Q3',      value:'10',         sub:'DEMO · calculées depuis activités' },
  { icon:'💵', label:'Revenu brut Q3',       value:money2((SIM_DECLARATION as any).grossRevenue ?? GROSS_Q3), sub:'PILOT DATA · extrapolé' },
  { icon:'🧮', label:'TPS nette Q3',         value:money2((SIM_DECLARATION as any).tpsNet ?? r2(GROSS_Q3 * TPS_R)), sub:'PILOT DATA · 5%' },
  { icon:'🧾', label:'TVQ nette Q3',         value:money2((SIM_DECLARATION as any).tvqNet ?? r2(GROSS_Q3 * TVQ_R)), sub:'PILOT DATA · 9,975%' },
  { icon:'✅', label:'Réconciliées',         value:'85 %',       sub:'DEMO · MATCHED / PARTIAL' },
  { icon:'⚖️', label:'Conformité',          value:'91 %',       sub:'DEMO · documents / licences' },
  { icon:'⚠️', label:'Anomalies actives',   value:'2 CRITIQUE', sub:'DEMO · alertes détectées' },
]

const TABS = [
  {id:'summary',    label:'📋 Synthèse'},
  {id:'problem',   label:'❓ Problématique'},
  {id:'solution',  label:'🏗️ Solution'},
  {id:'apps',      label:'📱 Applications'},
  {id:'dataflow',  label:'🔄 Data Flow'},
  {id:'financial', label:'💰 Financier'},
  {id:'fiscal',    label:'🧾 Fiscal'},
  {id:'recon',     label:'🔁 Réconciliation'},
  {id:'security',  label:'🔐 Sécurité'},
  {id:'kpi',       label:'📊 KPI Gov'},
  {id:'roadmap',   label:'🗺️ Feuille de route'},
  {id:'status',    label:'⚠️ Statut Pilote'},
  {id:'decision',  label:'🏛️ Décision'},
  {id:'exec',      label:'📄 Vue Exécutive'},
]

type TabId = typeof TABS[number]['id']

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function ExecutiveReportPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<TabId>('summary')
  if (!user) return null

  const tabStyle = (id: string): React.CSSProperties => ({
    background:   tab === id ? '#003DA5' : 'transparent',
    color:        tab === id ? 'white' : '#64748B',
    border:       'none',
    cursor:       'pointer',
    padding:      '7px 13px',
    borderRadius: '10px',
    fontSize:     '12px',
    fontWeight:   700,
    whiteSpace:   'nowrap',
    transition:   'all 0.15s',
  })

  const card = (children: React.ReactNode, extra = '') => (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm ${extra}`}>
      {children}
    </div>
  )

  const sectionTitle = (t: string) => (
    <div className="text-sm font-black text-slate-700 dark:text-white mb-4">{t}</div>
  )

  return (
    <AppShell>
      <div className="px-4 md:px-6 py-4 space-y-4 max-w-6xl mx-auto">

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl overflow-hidden shadow-lg"
          style={{background:'linear-gradient(135deg,#001A4D 0%,#002B7A 45%,#003DA5 80%,#0047C0 100%)'}}>
          <div className="px-6 py-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">🍁</span>
                  <div>
                    <div className="text-white font-black text-2xl md:text-3xl" style={{letterSpacing:'-0.03em'}}>TAXIMETER.GOV</div>
                    <div className="text-sm font-bold" style={{color:'rgba(255,255,255,0.55)'}}>Government Executive Report</div>
                  </div>
                  <span className="px-2 py-1 rounded-lg text-xs font-black"
                    style={{background:'rgba(255,200,0,0.2)',color:'#FCD34D',border:'1px solid rgba(255,200,0,0.3)'}}>
                    PILOT
                  </span>
                </div>
                <div className="text-sm mt-3 leading-relaxed" style={{color:'rgba(255,255,255,0.55)'}}>
                  Présentation exécutive du projet pilote d'infrastructure numérique fiscale,
                  transactionnelle et de traçabilité · Québec, Canada
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {['Infrastructure numérique','Traçabilité fiscale','Réconciliation multi-sources','Auditabilité','Gouvernance des données'].map(l=>(
                    <span key={l} className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.65)',border:'1px solid rgba(255,255,255,0.12)'}}>
                      {l}
                    </span>
                  ))}
                </div>
              </div>
              <div className="hidden md:flex flex-col items-end gap-2 shrink-0 text-right">
                <div className="text-xs font-bold" style={{color:'rgba(255,255,255,0.35)'}}>ENTREPRISE DÉMO</div>
                <div className="text-sm font-black text-amber-400">{CURRENT_ENT.tradeName}</div>
                <div className="text-xs font-bold mt-1" style={{color:'rgba(255,255,255,0.35)'}}>REVENU QUÉBEC</div>
                <div className="text-sm font-black text-red-400">NON CONNECTÉ</div>
                <div className="text-xs font-bold mt-1" style={{color:'rgba(255,255,255,0.35)'}}>RAPPORT</div>
                <div className="text-sm font-black text-green-400">EXÉCUTIF ✓</div>
              </div>
            </div>
          </div>

          {/* Pilot banner */}
          <div className="px-6 pb-4">
            <div className="px-4 py-2 rounded-xl text-xs font-bold"
              style={{background:'rgba(255,193,7,0.15)',color:'#FCD34D',border:'1px solid rgba(255,193,7,0.25)'}}>
              ⚠️ {PILOT} · Rapport Exécutif Gouvernemental · Données synthétiques uniquement
            </div>
          </div>
        </div>

        {/* ══ TABS ═════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex gap-1 p-2 overflow-x-auto border-b border-slate-100 dark:border-slate-800">
            {TABS.map(t => (
              <button key={t.id} onClick={()=>setTab(t.id as TabId)} style={tabStyle(t.id)}>{t.label}</button>
            ))}
          </div>

          <div className="p-5">

            {/* ── SYNTHÈSE ────────────────────────────────────────────────── */}
            {tab === 'summary' && (
              <div className="space-y-5">
                {sectionTitle("📋 Qu'est-ce que TAXIMETER.GOV ?")}
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-5">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>TAXIMETER.GOV</strong> est une infrastructure numérique pilote destinée à structurer, vérifier, réconcilier et auditer
                    les activités de transport et de livraison provenant des entreprises, chauffeurs, véhicules, plateformes et systèmes transactionnels.
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                    Le projet vise à démontrer la faisabilité technique d'une infrastructure qui permettrait de consolider
                    les données fiscales et transactionnelles du secteur du transport rémunéré de personnes et de la livraison,
                    en préparation à une éventuelle intégration gouvernementale officielle.
                  </p>
                  <div className="mt-4 px-3 py-2 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-400"
                    style={{background:'rgba(180,83,9,0.08)',border:'1px solid rgba(180,83,9,0.15)'}}>
                    ⚠️ Ce document décrit un projet PILOTE. TAXIMETER.GOV n'est pas actuellement utilisé par le gouvernement du Québec.
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {n:'3',     label:'Applications',         sub:'Gov · Enterprise · Driver'},
                    {n:'155',   label:'Tables Supabase',      sub:'Schéma complet déployé'},
                    {n:'9',     label:'Rôles RBAC',           sub:'42 permissions définies'},
                    {n:'Phase 39', label:'Rapport exécutif',  sub:'Validation E2E complète'},
                  ].map(k=>(
                    <div key={k.label} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-700">
                      <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{k.n}</div>
                      <div className="text-xs font-black text-slate-600 dark:text-slate-300 mt-1">{k.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{k.sub}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {icon:'🔍', title:'CAPTURER',    desc:'Événements webhooks des plateformes · signature · idempotency · hash SHA-256'},
                    {icon:'✅', title:'VÉRIFIER',    desc:'API confirmation · schéma · montant · source · avant tout traitement financier'},
                    {icon:'🔄', title:'RÉCONCILIER', desc:'4 sources comparées : Event · Activity · Transaction · Settlement'},
                    {icon:'🧾', title:'STRUCTURER',  desc:'Données fiscales issues de la couche financière vérifiée · jamais du webhook brut'},
                    {icon:'📋', title:'AUDITER',     desc:'Timeline immuable · DELETE=FALSE · actor/action/before/after/timestamp'},
                    {icon:'🛡️', title:'GOUVERNER',  desc:'RBAC · RLS · isolation enterprise · anti-IDOR · journalisation sécurité'},
                  ].map(p=>(
                    <div key={p.title} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                      <div className="text-xl mb-1">{p.icon}</div>
                      <div className="text-sm font-black text-slate-700 dark:text-white">{p.title}</div>
                      <div className="text-xs text-slate-500 mt-1 leading-relaxed">{p.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── PROBLÉMATIQUE ───────────────────────────────────────────── */}
            {tab === 'problem' && (
              <div className="space-y-4">
                {sectionTitle('❓ Problématique — Objectifs du pilote')}
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Ces éléments représentent les défis identifiés que le pilote cherche à adresser — ils ne constituent pas des conclusions gouvernementales déjà démontrées.
                </div>
                <div className="space-y-3">
                  {PROBLEMS.map((p,i)=>(
                    <div key={i} className="flex items-start gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl shrink-0">{p.icon}</div>
                      <div>
                        <div className="text-sm font-black text-slate-800 dark:text-white mb-1">{p.title}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{p.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SOLUTION ────────────────────────────────────────────────── */}
            {tab === 'solution' && (
              <div className="space-y-5">
                {sectionTitle('🏗️ Architecture conceptuelle')}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Flux entité → fiscal</div>
                    {['🏢 ENTERPRISE','🏗️ DEPARTMENTS','👤 DRIVERS','🚗 VEHICLES','📍 ACTIVITIES','💳 TRANSACTIONS','💰 REVENUE','🧮 TPS / TVQ','📤 DECLARATIONS','💵 PAYMENTS','🔄 RECONCILIATION','⚖️ COMPLIANCE','📋 AUDIT'].map((step,i,arr)=>(
                      <div key={step}>
                        <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <span className="text-sm">{step}</span>
                        </div>
                        {i < arr.length-1 && <div className="text-center text-slate-300 text-xs py-0.5">↓</div>}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Flux plateforme → structuré</div>
                    {['🌐 PLATFORMS','📡 API / WEBHOOK','✅ TAXIMETER.GOV','🔍 VERIFICATION','📋 REGISTERS','🧾 FISCAL STRUCTURE'].map((step,i,arr)=>(
                      <div key={step}>
                        <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <span className="text-sm">{step}</span>
                        </div>
                        {i < arr.length-1 && <div className="text-center text-slate-300 text-xs py-0.5">↓</div>}
                      </div>
                    ))}
                    <div className="mt-6">
                      <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">🔄 Pipeline Center</div>
                      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Le <strong className="text-slate-800 dark:text-white">Pipeline Center</strong> est le module de suivi de
                        la circulation et du traitement des données dans TAXIMETER.GOV. Il permet de visualiser
                        chaque couche de traitement, de l'événement source au registre fiscal, avec les statuts
                        et les anomalies en temps réel.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── APPLICATIONS ────────────────────────────────────────────── */}
            {tab === 'apps' && (
              <div className="space-y-4">
                {sectionTitle('📱 Trois environnements applicatifs')}
                {APPS.map(app=>(
                  <div key={app.id} className="border-2 rounded-2xl overflow-hidden" style={{borderColor:app.color+'30'}}>
                    <div className="px-5 py-4 flex items-center gap-3"
                      style={{background:`linear-gradient(135deg,${app.color}12,${app.color}06)`}}>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl text-white shadow-sm"
                        style={{background:app.color}}>{app.icon}</div>
                      <div>
                        <div className="text-base font-black text-slate-800 dark:text-white">{app.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{app.desc}</div>
                      </div>
                    </div>
                    <div className="px-5 py-3 bg-white dark:bg-slate-900">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {app.features.map(f=>(
                          <div key={f} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 py-1">
                            <span className="text-green-500 font-bold shrink-0">✓</span>{f}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── DATA FLOW ───────────────────────────────────────────────── */}
            {tab === 'dataflow' && (
              <div className="space-y-3">
                {sectionTitle('🔄 Data Flow — De l\'événement à l\'audit')}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    {DATA_FLOW.map((node,i)=>(
                      <div key={i}>
                        <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm shrink-0">{node.icon}</div>
                          <div>
                            <div className="text-xs font-black text-slate-700 dark:text-slate-300">{node.label}</div>
                            <div className="text-xs text-slate-400">{node.sub}</div>
                          </div>
                        </div>
                        {i < DATA_FLOW.length-1 && <div className="text-center text-slate-300 text-xs py-0.5">↓</div>}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4">
                      <div className="text-sm font-black text-blue-800 dark:text-blue-300 mb-3">Principes clés</div>
                      {[
                        '1 événement valide = 1 activité opérationnelle (jamais plus)',
                        'Les données fiscales sont issues de la couche financière vérifiée — jamais du webhook brut',
                        'Chaque couche est distincte et traçable individuellement',
                        'Tout écart entre sources est détecté, journalisé et escaladé',
                        'Le payload source est conservé immuable (hash SHA-256)',
                        'L\'audit est immuable : DELETE=FALSE · UPDATE=FALSE',
                      ].map((p,i)=>(
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 py-1.5 border-b border-blue-100 dark:border-blue-500/10 last:border-0">
                          <span className="text-blue-500 font-bold shrink-0">→</span>{p}
                        </div>
                      ))}
                    </div>
                    <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl p-4">
                      <div className="text-sm font-black text-green-700 dark:text-green-300 mb-2">Data Lineage</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Depuis n'importe quel registre fiscal, il est possible de remonter jusqu'au payload source original :
                        <strong> FSC → FIN → SET → TX → ACT → DRV → VEH → ENT → EVT → PAYLOAD</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── FINANCIER ───────────────────────────────────────────────── */}
            {tab === 'financial' && (
              <div className="space-y-4">
                {sectionTitle('💰 Modèle financier — Composantes et relations')}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {label:'Revenu brut',    formula:'Tarif de la course',        color:'#003DA5'},
                    {label:'Pourboire',      formula:'Séparé · jamais fusionné',  color:'#7C3AED'},
                    {label:'Commission',     formula:'Gross × 27,5 % (DEMO)',     color:'#B45309'},
                    {label:'TPS',           formula:'Gross × 5 %',               color:'#059669'},
                    {label:'TVQ',           formula:'Gross × 9,975 %',           color:'#059669'},
                    {label:'Net chauffeur', formula:'Gross × 72,5 % − TPS − TVQ',color:'#0891B2'},
                    {label:'Settlement',    formula:'Montant versé par plateforme',color:'#1D4ED8'},
                    {label:'Montant dû',    formula:'TPS nette + TVQ nette',      color:'#DC2626'},
                  ].map(k=>(
                    <div key={k.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                      <div className="text-xs font-black mb-1" style={{color:k.color}}>{k.label}</div>
                      <div className="text-xs text-slate-500">{k.formula}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 text-xs font-black text-slate-400 uppercase tracking-widest">
                    Exemple — Activité Uber Green DEMO (24,00 $)
                  </div>
                  {[
                    {l:'Gross',             v: money2(24.00),   c:'text-slate-800 dark:text-slate-200'},
                    {l:'Pourboire',         v: money2(2.00),    c:'text-purple-600'},
                    {l:'Commission (27,5%)',v: money2(6.60),    c:'text-amber-600'},
                    {l:'TPS (5%)',          v: money2(1.20),    c:'text-green-600'},
                    {l:'TVQ (9,975%)',      v: money2(2.39),    c:'text-green-600'},
                    {l:'Net chauffeur',     v: money2(13.81),   c:'text-blue-600 font-black'},
                  ].map(({l,v,c})=>(
                    <div key={l} className="flex justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <span className="text-xs font-semibold text-slate-500">{l}</span>
                      <span className={`text-xs font-mono font-bold ${c}`}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  ⚠️ DEMO DATA — Ces montants sont illustratifs. Les taux de commission réels d'Uber ne sont pas publics.
                </div>
              </div>
            )}

            {/* ── FISCAL ──────────────────────────────────────────────────── */}
            {tab === 'fiscal' && (
              <div className="space-y-4">
                {sectionTitle('🧾 Modèle fiscal — TPS / TVQ · Déclarations')}
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  Le pilote démontre la capacité à structurer les données nécessaires à une logique fiscale complète.
                  Les données fiscales sont générées à partir des données financières vérifiées et réconciliées — jamais directement depuis le webhook brut.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 text-xs font-black text-slate-400 uppercase tracking-widest">Déclaration Q3 2026 — DEMO</div>
                    {[
                      {l:'Période',          v:(SIM_DECLARATION as any).period ?? 'Q3 2026'},
                      {l:'Revenu brut',      v:money2((SIM_DECLARATION as any).grossRevenue ?? 0), badge:'PILOT DATA'},
                      {l:'Pourboires',       v:money2((SIM_DECLARATION as any).tipsTotal    ?? 0), badge:'PILOT DATA'},
                      {l:'TPS collectée',    v:money2((SIM_DECLARATION as any).tpsCollected ?? 0), badge:'5%'},
                      {l:'TVQ collectée',    v:money2((SIM_DECLARATION as any).tvqCollected ?? 0), badge:'9,975%'},
                      {l:'TPS nette',        v:money2((SIM_DECLARATION as any).tpsNet       ?? 0)},
                      {l:'TVQ nette',        v:money2((SIM_DECLARATION as any).tvqNet       ?? 0)},
                      {l:'Total dû',         v:money2((SIM_DECLARATION as any).totalDue     ?? 0), badge:'DEMO'},
                      {l:'Statut',           v:(SIM_DECLARATION as any).status ?? 'READY'},
                    ].map(({l,v,badge})=>(
                      <div key={l} className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <span className="text-xs font-semibold text-slate-500">{l}</span>
                        <div className="flex items-center gap-2">
                          {badge && <span className="text-xs font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{badge}</span>}
                          <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{v}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl p-4">
                      <div className="text-sm font-black text-green-700 dark:text-green-300 mb-2">Paiement DEMO</div>
                      {[
                        {l:'Référence',  v:(SIM_PAYMENT as any).id ?? 'PAY-Q3-2026'},
                        {l:'Montant',    v:money2((SIM_PAYMENT as any).amount ?? 0)},
                        {l:'Échéance',   v:(SIM_PAYMENT as any).due ?? '2026-10-31'},
                        {l:'Statut',     v:(SIM_PAYMENT as any).status ?? 'PAID-DEMO'},
                        {l:'Méthode',    v:'VIREMENT-DEMO'},
                      ].map(({l,v})=>(
                        <div key={l} className="flex justify-between py-1.5 border-b border-green-100 dark:border-green-500/10 last:border-0">
                          <span className="text-xs font-semibold text-slate-500">{l}</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3">
                      <div className="text-xs font-black text-red-700 dark:text-red-400 mb-1">⚠️ Important</div>
                      <div className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
                        Aucune déclaration n'est actuellement transmise à Revenu Québec.
                        PAID-DEMO ne représente aucun mouvement bancaire ou gouvernemental réel.
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-3">
                      <div className="text-xs font-black text-blue-700 dark:text-blue-400 mb-1">Intégration gouvernementale future</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                        La connexion à Revenu Québec nécessitera : autorisation officielle · API gouvernementale · cadre légal · audit de sécurité.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── RÉCONCILIATION ──────────────────────────────────────────── */}
            {tab === 'recon' && (
              <div className="space-y-4">
                {sectionTitle('🔁 Réconciliation — Élément central du pilote')}
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  La réconciliation est le cœur du système. Elle compare <strong>4 sources indépendantes</strong> pour chaque transaction :
                  Event source · Registre d'activité · Transaction financière · Settlement plateforme.
                  Tout écart est détecté, journalisé et escaladé automatiquement.
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {RECON_STATUSES.map(r=>(
                    <div key={r.s} className="p-4 rounded-xl border" style={{background:r.c+'0D',borderColor:r.c+'30'}}>
                      <span className="text-xs font-black px-2 py-1 rounded-full text-white inline-block mb-2" style={{background:r.c}}>{r.s}</span>
                      <div className="text-xs text-slate-600 dark:text-slate-400">{r.desc}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Exemple de flux de réconciliation</div>
                  {[
                    {from:'Source (Uber API)',     to:'24,00 $'},
                    {from:'Registre d\'activité', to:'24,00 $'},
                    {from:'Transaction financière',to:'24,00 $'},
                    {from:'Settlement reçu',       to:'24,00 $'},
                    {from:'Écart',                 to:'0,00 $ → MATCHED ✅'},
                  ].map((r,i)=>(
                    <div key={i} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <span className="text-xs font-semibold text-slate-500">{r.from}</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{r.to}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SÉCURITÉ ────────────────────────────────────────────────── */}
            {tab === 'security' && (
              <div className="space-y-4">
                {sectionTitle('🔐 Architecture de sécurité et gouvernance')}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SECURITY_ITEMS.map(s=>(
                    <div key={s.label} className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                      <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">{s.icon}</div>
                      <div>
                        <div className="text-sm font-black text-slate-700 dark:text-slate-300">{s.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{s.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4">
                  <div className="text-sm font-black text-slate-700 dark:text-white mb-3">Auditabilité — WHO · WHAT · WHEN · WHERE</div>
                  {[
                    {l:'WHO',    v:'Actor identifié (user_id · role · enterprise_id)'},
                    {l:'WHAT',   v:'Action précise (LOGIN · UPLOAD · APPROVE · RECONCILE · CORRECT…)'},
                    {l:'WHEN',   v:'Timestamp UTC horodaté · immuable'},
                    {l:'WHERE',  v:'Resource type + resource_id (document_id · tx_id…)'},
                    {l:'BEFORE', v:'Valeur précédente conservée'},
                    {l:'AFTER',  v:'Nouvelle valeur enregistrée'},
                    {l:'SOURCE', v:'Payload original conservé (hash SHA-256)'},
                  ].map(({l,v})=>(
                    <div key={l} className="flex items-start gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <span className="text-xs font-black px-2 py-0.5 rounded bg-blue-100 text-blue-700 shrink-0 w-16 text-center">{l}</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── KPI GOV ─────────────────────────────────────────────────── */}
            {tab === 'kpi' && (
              <div className="space-y-4">
                {sectionTitle('📊 KPI Gouvernementaux — DEMO DATA')}
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  ⚠️ Tous les indicateurs affichés sont des DEMO DATA · estimations synthétiques · non représentatifs de données gouvernementales réelles.
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {GOV_KPI.map(k=>(
                    <div key={k.label} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-700">
                      <div className="text-2xl mb-1">{k.icon}</div>
                      <div className="text-xl font-black text-slate-800 dark:text-white">{k.value}</div>
                      <div className="text-xs font-bold text-slate-500 mt-1 leading-tight">{k.label}</div>
                      <div className="text-xs text-slate-400 mt-1 leading-tight">{k.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(DEPARTMENTS as any[]).slice(0,3).map((d:any)=>(
                    <div key={d.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{d.emoji}</span>
                        <div className="text-sm font-black text-slate-700 dark:text-slate-300">{d.name}</div>
                        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">DEMO</span>
                      </div>
                      {[
                        {l:'Chauffeurs', v:d.drivers},
                        {l:'Activités',  v:(d.activities??0).toLocaleString('fr-CA')},
                        {l:'Gross',      v:money2(d.gross??0)},
                      ].map(({l,v})=>(
                        <div key={l} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700 last:border-0">
                          <span className="text-xs text-slate-400">{l}</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{v}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ROADMAP ─────────────────────────────────────────────────── */}
            {tab === 'roadmap' && (
              <div className="space-y-4">
                {sectionTitle('🗺️ Feuille de route — Projet pilote → Production')}
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-3 text-xs font-semibold text-blue-700 dark:text-blue-400">
                  Cette feuille de route est présentée à titre indicatif. Elle ne constitue pas un engagement gouvernemental.
                </div>
                <div className="space-y-3">
                  {ROADMAP.map((r,i)=>(
                    <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border-2 ${r.current ? 'border-blue-300 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/8' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                      <div className="w-20 shrink-0">
                        <div className="text-xs font-black px-2 py-1 rounded-lg text-center"
                          style={{background:r.current?'#003DA5':'#E2E8F0',color:r.current?'white':'#64748B'}}>
                          {r.phase}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                          {r.title}
                          {r.current && <span className="text-xs font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700">EN COURS</span>}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{r.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── STATUT PILOTE ───────────────────────────────────────────── */}
            {tab === 'status' && (
              <div className="space-y-4">
                {sectionTitle('⚠️ Statut Pilote — Réel / Pilote / Simulé / Non connecté')}
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-3 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                    <div>COMPOSANT</div><div>STATUT</div><div className="hidden md:block">NOTE</div>
                  </div>
                  {STATUS_TABLE.map((row,i)=>(
                    <div key={i} className={`grid grid-cols-3 items-center px-4 py-3 border-t border-slate-100 dark:border-slate-800 ${i%2===0?'bg-white dark:bg-slate-900':'bg-slate-50/50 dark:bg-slate-800/50'}`}>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{row.component}</div>
                      <div><span className="text-xs font-black px-2 py-1 rounded-lg text-white" style={{background:row.color}}>{row.status}</span></div>
                      <div className="hidden md:block text-xs text-slate-400">&nbsp;</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-black text-slate-700 dark:text-white">Limitations actuelles du pilote</div>
                  {LIMITATIONS.map((l,i)=>(
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${l.status==='EN COURS'?'bg-amber-50 border-amber-200 dark:bg-amber-500/8 dark:border-amber-500/20':'bg-red-50 border-red-200 dark:bg-red-500/8 dark:border-red-500/20'}`}>
                      <span className="text-xs font-black px-2 py-0.5 rounded-full text-white shrink-0 mt-0.5"
                        style={{background:l.status==='EN COURS'?'#B45309':'#DC2626',fontSize:'10px'}}>{l.status}</span>
                      <div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{l.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{l.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── DÉCISION ────────────────────────────────────────────────── */}
            {tab === 'decision' && (
              <div className="space-y-4">
                {sectionTitle('🏛️ Décision requise — Continuité du pilote')}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-green-50 dark:bg-green-500/10 border-2 border-green-200 dark:border-green-500/30 rounded-2xl p-5">
                    <div className="text-base font-black text-green-700 dark:text-green-300 mb-3">✅ CONTINUER LE PILOTE</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                      Si le projet est accepté, les prochaines étapes seraient :
                    </div>
                    {['Développement complémentaire des modules','Études d\'intégration avec les systèmes gouvernementaux','Revue de sécurité officielle','Définition des exigences API gouvernementales','Cadre juridique et de confidentialité (Loi 25)','Extension du pilote à d\'autres entreprises partenaires','Validation réglementaire indépendante'].map((s,i)=>(
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 py-1">
                        <span className="text-green-500 font-bold shrink-0">→</span>{s}
                      </div>
                    ))}
                  </div>
                  <div className="bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/30 rounded-2xl p-5">
                    <div className="text-base font-black text-red-700 dark:text-red-400 mb-3">✕ NE PAS CONTINUER</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                      Si le projet n'est pas retenu :
                    </div>
                    {['Le développement s\'arrête ou demeure au statut pilote / démo','Aucun déploiement gouvernemental n\'a lieu','L\'infrastructure technique reste disponible pour d\'autres usages','Aucune donnée réelle n\'a été collectée à ce stade'].map((s,i)=>(
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 py-1">
                        <span className="text-red-400 font-bold shrink-0">×</span>{s}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong className="text-slate-800 dark:text-white block mb-1">Note importante</strong>
                  Cette présentation est soumise à l'appréciation des décideurs gouvernementaux concernés. Elle ne préjuge pas d'une décision favorable et ne constitue pas une demande d'engagement officiel.
                </div>
              </div>
            )}

            {/* ── VUE EXÉCUTIVE ────────────────────────────────────────────── */}
            {tab === 'exec' && (
              <div className="space-y-4">
                {sectionTitle('📄 Vue Exécutive — Une page · Imprimable')}
                <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-5 print:shadow-none">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                      <div className="text-xl font-black text-slate-900">🍁 TAXIMETER.GOV</div>
                      <div className="text-xs text-slate-500 mt-0.5">Projet pilote · Infrastructure numérique fiscale et transactionnelle · Québec</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded">PILOT / DEMO</div>
                      <div className="text-xs text-slate-400 mt-1">Septembre 2026</div>
                    </div>
                  </div>
                  {/* Sections */}
                  {[
                    {title:'OBJECTIF', content:'Structurer, vérifier, réconcilier et auditer les activités de transport et livraison pour préparer une infrastructure de conformité fiscale gouvernementale.'},
                    {title:'ARCHITECTURE', content:'3 applications (Gov Admin · Enterprise · Driver) · 155 tables Supabase · Pipeline Center · RBAC 9 rôles · 42 permissions · Audit immuable · Déployé sur Vercel.'},
                    {title:'PILOTE', content:'Entreprise DEMO (Uber Québec) · 6 départements · 6 chauffeurs · 13 activités Q3 · 10 transactions · TPS/TVQ calculées · Réconciliation 4 sources · Déclaration DEMO.'},
                    {title:'RÉSULTATS DISPONIBLES', content:'Flux complet Event→Fiscal documenté · Data Lineage 10 nœuds traceable · Réconciliation MATCHED/PARTIAL/MISMATCH · Audit timeline immuable · Score E2E 89%.'},
                    {title:'LIMITATIONS', content:'Aucune connexion à Revenu Québec · Aucune transmission déclaration réelle · Données synthétiques uniquement · Validation réglementaire non effectuée · Paiements DEMO.'},
                    {title:'DÉCISION SUIVANTE', content:'Continuer le pilote → intégrations contrôlées · revue sécurité · API gov · cadre légal · Loi 25. Ne pas continuer → développement s\'arrête au statut pilote.'},
                  ].map(s=>(
                    <div key={s.title} className="grid grid-cols-4 gap-3">
                      <div className="text-xs font-black text-slate-400 pt-0.5">{s.title}</div>
                      <div className="col-span-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{s.content}</div>
                    </div>
                  ))}
                  {/* Footer */}
                  <div className="border-t border-slate-200 pt-3 flex justify-between">
                    <div className="text-xs text-slate-400">⚠️ {PILOT}</div>
                    <div className="text-xs text-slate-400">TAXIMETER.GOV · {CURRENT_ENT.id} · Rapport Exécutif</div>
                  </div>
                </div>
                <button onClick={()=>window.print()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border cursor-pointer transition-all hover:bg-slate-50"
                  style={{borderColor:'#E2E8F0',color:'#64748B'}}>
                  🖨️ Imprimer / PDF
                </button>
              </div>
            )}

          </div>
        </div>

        {/* ══ FOOTER ═══════════════════════════════════════════════════════ */}
        <div className="text-xs text-slate-400 text-center py-2">
          {PILOT} · Rapport Exécutif Gouvernemental · TAXIMETER.GOV · {CURRENT_ENT.id} · 🍁 Québec
        </div>
      </div>
    </AppShell>
  )
}
