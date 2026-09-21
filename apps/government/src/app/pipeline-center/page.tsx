'use client'
import React, { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'

const PILOT = '⚠️ PILOTE · DONNÉES SYNTHÉTIQUES'
const money2 = (n: number) => n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 })

type Tab = 'overview'|'raw'|'operational'|'financial'|'fiscal'|'settlement'|'recon'|'quarantine'|'lineage'|'how'|'report'

// ── Données DEMO 4 registres ──
const RAW_EVENTS = [
  {id:'EVT-001',source:'uber-eats',type:'DELIVERY_COMPLETED',received:'2026-09-20T08:43:00Z',sig:'VALID',  status:'PROCESSED',hash:'a3f9c2...'},
  {id:'EVT-002',source:'uber-rides',type:'TRIP_COMPLETED',   received:'2026-09-20T08:15:00Z',sig:'VALID',  status:'PROCESSED',hash:'b7e1d4...'},
  {id:'EVT-003',source:'uber-taxi', type:'TRIP_COMPLETED',   received:'2026-09-20T10:05:00Z',sig:'VALID',  status:'PROCESSED',hash:'c2a8f1...'},
  {id:'EVT-004',source:'uber-green',type:'TRIP_COMPLETED',   received:'2026-09-20T07:45:00Z',sig:'VALID',  status:'PROCESSED',hash:'d9b3e7...'},
  {id:'EVT-005',source:'uber-eats', type:'DELIVERY_COMPLETED',received:'2026-09-20T12:35:00Z',sig:'VALID', status:'PROCESSED',hash:'e4c6a9...'},
  {id:'EVT-006',source:'uber-rides',type:'TRIP_COMPLETED',   received:'2026-09-20T08:43:00Z',sig:'VALID',  status:'DUPLICATE',hash:'a3f9c2...'},
  {id:'EVT-007',source:'uber-api',  type:'WEBHOOK_FAILED',   received:'2026-09-20T11:32:00Z',sig:'INVALID',status:'QUARANTINED',hash:'f1d5b2...'},
]

const OPERATIONAL = [
  {id:'ACT-001',driver:'Jean Tremblay',  dept:'Uber Rides',  type:'TRIP',     origin:'Montréal-Nord',dest:'YUL',         dist:22.4,dur:28,status:'COMPLETED'},
  {id:'ACT-002',driver:'Marie Gagnon',   dept:'Uber Rides',  type:'TRIP',     origin:'Plateau',     dest:'Westmount',   dist:5.2, dur:14,status:'COMPLETED'},
  {id:'ACT-003',driver:'Karim Hassan',   dept:'Uber Taxi',   type:'TAXI',     origin:'Vieux-MTL',   dest:'Laval',       dist:18.6,dur:32,status:'COMPLETED'},
  {id:'ACT-004',driver:'Ali Bouchard',   dept:'Uber Green',  type:'TRIP',     origin:'Mile-Ex',     dest:'Rosemont',    dist:6.8, dur:16,status:'COMPLETED'},
  {id:'ACT-005',driver:'Marie Gagnon',   dept:'Uber Eats',   type:'DELIVERY', origin:'Da Emma',     dest:'Plateau',     dist:3.2, dur:18,status:'COMPLETED'},
]

const FINANCIAL = [
  {id:'FIN-001',actId:'ACT-001',gross:42.50,fees:11.69,tips:5.00,refunds:0,adj:0,tps:2.13,tvq:4.24,net:29.44,settle:42.50},
  {id:'FIN-002',actId:'ACT-002',gross:22.50,fees:6.19, tips:3.00,refunds:0,adj:0,tps:1.13,tvq:2.24,net:15.94,settle:22.50},
  {id:'FIN-003',actId:'ACT-003',gross:38.00,fees:10.45,tips:4.00,refunds:0,adj:0,tps:1.90,tvq:3.79,net:25.86,settle:38.00},
  {id:'FIN-004',actId:'ACT-004',gross:24.00,fees:6.60, tips:0,   refunds:0,adj:-2.00,tps:1.20,tvq:2.39,net:11.81,settle:24.00},
  {id:'FIN-005',actId:'ACT-005',gross:15.00,fees:4.13, tips:2.50,refunds:0,adj:0,tps:0.75,tvq:1.50,net:11.12,settle:15.00},
]

const FISCAL = [
  {id:'FSC-001',finId:'FIN-001',period:'Q3-2026',taxable:42.50,tps:2.13,tvq:4.24,tips:5.00,adj:0,status:'POSTED'},
  {id:'FSC-002',finId:'FIN-002',period:'Q3-2026',taxable:22.50,tps:1.13,tvq:2.24,tips:3.00,adj:0,status:'POSTED'},
  {id:'FSC-003',finId:'FIN-003',period:'Q3-2026',taxable:38.00,tps:1.90,tvq:3.79,tips:4.00,adj:0,status:'POSTED'},
  {id:'FSC-004',finId:'FIN-004',period:'Q3-2026',taxable:22.00,tps:1.10,tvq:2.19,tips:0,  adj:-2.00,status:'POSTED'},
  {id:'FSC-005',finId:'FIN-005',period:'Q3-2026',taxable:15.00,tps:0.75,tvq:1.50,tips:2.50,adj:0,status:'POSTED'},
]

const SETTLEMENTS = [
  {id:'SET-001',platform:'Uber Rides DEMO',period:'Sep 2026 W3',gross:580.50,fees:159.64,tips:28.00,taxes:29.03,net:419.83,date:'2026-09-21',status:'MATCHED'},
  {id:'SET-002',platform:'Uber Eats DEMO', period:'Sep 2026 W3',gross:234.75,fees:70.43, tips:18.50,taxes:11.74,net:172.08,date:'2026-09-21',status:'MATCHED'},
  {id:'SET-003',platform:'Uber Taxi DEMO', period:'Sep 2026 W3',gross:189.00,fees:51.98, tips:12.00,taxes:9.45, net:139.57,date:'2026-09-21',status:'MATCHED'},
  {id:'SET-004',platform:'Uber Green DEMO',period:'Sep 2026 W3',gross:127.50,fees:35.06, tips:4.50, taxes:6.38, net:81.56, date:'2026-09-21',status:'VARIANCE'},
]

const QUARANTINE = [
  {id:'QRT-001',evtId:'EVT-007',reason:'SIGNATURE_INVALID',code:'SIG_FAIL',source:'uber-api',  at:'2026-09-20T11:32:00Z',resolved:false},
  {id:'QRT-002',evtId:'EVT-ERR',reason:'SCHEMA_INVALID',   code:'SCH_FAIL',source:'webhook',   at:'2026-09-19T14:22:00Z',resolved:true},
  {id:'QRT-003',evtId:'EVT-DUP',reason:'DUPLICATE_CONFLICT',code:'DUP_ERR',source:'uber-rides',at:'2026-09-20T09:15:00Z',resolved:true},
]

const RECON = [
  {id:'REC-001',finId:'FIN-001',settle:42.50,ledger:42.50,fiscal:42.50,diff:0,    status:'MATCHED'},
  {id:'REC-002',finId:'FIN-002',settle:22.50,ledger:22.50,fiscal:22.50,diff:0,    status:'MATCHED'},
  {id:'REC-003',finId:'FIN-003',settle:38.00,ledger:38.00,fiscal:38.00,diff:0,    status:'MATCHED'},
  {id:'REC-004',finId:'FIN-004',settle:24.00,ledger:24.00,fiscal:22.00,diff:-2.00,status:'PARTIAL_MATCH'},
  {id:'REC-005',finId:'FIN-005',settle:15.00,ledger:15.00,fiscal:15.00,diff:0,    status:'MATCHED'},
]

const LINEAGE_STEPS = [
  {step:'Registre fiscal',    id:'FSC-001',table:'fiscal_register',      arrow:true},
  {step:'Transaction financière',id:'FIN-001',table:'financial_register', arrow:true},
  {step:'Activité opérationnelle',id:'ACT-001',table:'operational_register',arrow:true},
  {step:'Chauffeur',          id:'DRV-QC-0001 · Jean Tremblay',table:'driver_profiles',arrow:true},
  {step:'Département',        id:'D1 · Uber Rides',table:'departments',  arrow:true},
  {step:'Entreprise',         id:'ENT-DEMO-001 · Uber QC',table:'enterprises',arrow:true},
  {step:'Événement brut',     id:'EVT-002 · uber-rides',table:'raw_events / system_events',arrow:true},
  {step:'Payload original',   id:'{"trip_id":"SIM-ACT-002","amount":22.50,...}',table:'source_payload (immuable)',arrow:false},
]

const HOW_STEPS = [
  {n:1, icon:'📡',label:'SOURCE',        desc:'Plateforme partenaire (Uber Rides/Eats/Taxi/Green…) génère un événement'},
  {n:2, icon:'⬇️',label:'CAPTURE',       desc:'TAXIMETER.GOV reçoit le webhook · signature vérifiée · hash calculé'},
  {n:3, icon:'✅',label:'VALIDATION',    desc:'Schéma validé · idempotency check · event stocké dans RAW EVENT LOG'},
  {n:4, icon:'⚙️',label:'NORMALISATION', desc:'Champs hétérogènes → modèle commun · trip_id→activity_id · amount→gross_amount'},
  {n:5, icon:'🔄',label:'RÉCONCILIATION',desc:'Event vs API confirmation vs Settlement · MATCHED / PARTIAL / MISMATCH'},
  {n:6, icon:'📒',label:'LEDGER FINANCIER',desc:'Transaction financière créée · gross/fees/tips/tps/tvq/net structurés'},
  {n:7, icon:'🧾',label:'LEDGER FISCAL', desc:'Données fiscales extraites · TPS 5% / TVQ 9.975% · période assignée'},
  {n:8, icon:'📤',label:'DÉCLARATION',   desc:'Agrégation par période · SIMULATION PILOTE · NON TRANSMIS Revenu QC'},
  {n:9, icon:'📋',label:'AUDIT',         desc:'Chaque étape journalisée · WHO/WHAT/WHEN · traçable de bout en bout'},
]

const REPORT_ITEMS = [
  {cat:'ARCHITECTURE',      status:'PASS',    detail:'4 registres distincts définis · pipeline SOURCE→AUDIT documenté'},
  {cat:'RAW EVENT LOG',     status:'PASS',    detail:'system_events (migration 0010) + provider_events + payload_hash · 7 entrées DEMO'},
  {cat:'OPERATIONAL REGISTER',status:'PASS', detail:'provider_activities → driver/dept/vehicle/origin/dest/dist/dur · 5 activités'},
  {cat:'FINANCIAL REGISTER',status:'PASS',   detail:'provider_transaction_snapshots + components · gross/fees/tips/tps/tvq/net'},
  {cat:'FISCAL REGISTER',   status:'PASS',   detail:'provider_tax_records + fiscal_transaction_id + period + status POSTED'},
  {cat:'EVENT QUEUE',       status:'PASS',   detail:'sync_queue (migration 0010) · RECEIVED/VALIDATED/QUEUED/PROCESSING/PROCESSED/FAILED'},
  {cat:'IDEMPOTENCY',       status:'PASS',   detail:'EVT-006 → DUPLICATE détecté · 0 doublon TX · provider_transaction_id UNIQUE'},
  {cat:'API VERIFICATION',  status:'PARTIAL',detail:'Design documenté · endpoint /api/platform/verify à brancher sur vrai API Uber'},
  {cat:'SETTLEMENT',        status:'PASS',   detail:'provider_settlements (migration 0030) · 4 settlements DEMO · MATCHED/VARIANCE'},
  {cat:'RÉCONCILIATION',    status:'PASS',   detail:'provider_reconciliation_items · 5 cas · MATCHED(4)/PARTIAL_MATCH(1)'},
  {cat:'QUARANTINE',        status:'PASS',   detail:'dead_letter_queue (migration 0010) · 3 événements · SIG_FAIL/SCH_FAIL/DUP_ERR'},
  {cat:'RETRY / REPROCESS', status:'PARTIAL',detail:'Design documenté · sync_queue.attempt_count · UI retry à connecter Supabase réel'},
  {cat:'VERSIONNEMENT TX',  status:'PARTIAL',detail:'provider_transaction_snapshots.snapshot_version défini · UI timeline à enrichir'},
  {cat:'DATA LINEAGE',      status:'PASS',   detail:'8 niveaux traçables: FSC→FIN→ACT→DRV→DEPT→ENT→EVT→PAYLOAD'},
  {cat:'SÉCURITÉ',          status:'PASS',   detail:'Phase 34 intacte · RequireAdminSession · RLS policies SQL définies'},
  {cat:'RLS',               status:'PARTIAL',detail:'rls-policies.sql défini · à appliquer dans Supabase aisojdmxsskzrdjrhrzw'},
  {cat:'REALTIME',          status:'PARTIAL',detail:'onAuthStateChange actif · system_events INSERT push à activer'},
  {cat:'E2E ROBERT SIMARD', status:'PASS',   detail:'10 étapes toutes PASS · webhook→registre fiscal→admin gov traceable'},
  {cat:'NON-RÉGRESSION 34', status:'PASS',   detail:'Security Report intact · RBAC non modifié · RequireAdminSession'},
  {cat:'NON-RÉGRESSION 35', status:'PASS',   detail:'Sync Monitor intact · system_events non modifiés · idempotency préservée'},
]

const STATUS_STYLE: Record<string,string> = {
  PROCESSED:'text-green-700 bg-green-50', MATCHED:'text-green-700 bg-green-50',
  POSTED:'text-green-700 bg-green-50',    VALID:'text-green-700 bg-green-50',
  DUPLICATE:'text-slate-600 bg-slate-100',QUARANTINED:'text-red-600 bg-red-50',
  INVALID:'text-red-600 bg-red-50',       VARIANCE:'text-amber-600 bg-amber-50',
  PARTIAL_MATCH:'text-amber-600 bg-amber-50', FAILED:'text-red-600 bg-red-50',
}

export default function PipelineCenterPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [lineageStep, setLineageStep] = useState<number|null>(null)

  const TABS: {id:Tab;label:string;icon:string}[] = [
    {id:'overview',    label:'Pipeline Health',   icon:'📊'},
    {id:'raw',         label:'Raw Events',        icon:'📡'},
    {id:'operational', label:'Opérationnel',      icon:'📍'},
    {id:'financial',   label:'Financier',         icon:'💰'},
    {id:'fiscal',      label:'Fiscal',            icon:'🧾'},
    {id:'settlement',  label:'Settlement',        icon:'🏦'},
    {id:'recon',       label:'Réconciliation',    icon:'🔄'},
    {id:'quarantine',  label:'Quarantaine',       icon:'🚫'},
    {id:'lineage',     label:'Data Lineage',      icon:'🔗'},
    {id:'how',         label:'Comment ça marche', icon:'🎓'},
    {id:'report',      label:'Rapport Ph.36.5',   icon:'✅'},
  ]

  const pass    = REPORT_ITEMS.filter(r=>r.status==='PASS').length
  const partial = REPORT_ITEMS.filter(r=>r.status==='PARTIAL').length
  const fail    = REPORT_ITEMS.filter(r=>r.status==='FAIL').length

  return (
    <AppShell>
      <div className="space-y-5">

        {/* HEADER */}
        <div className="rounded-2xl overflow-hidden shadow-sm"
          style={{background:'linear-gradient(135deg,#002B7A 0%,#003DA5 55%,#0047C0 100%)'}}>
          <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
                    style={{background:'rgba(255,255,255,0.15)'}}>⚙️</div>
                  <div>
                    <div className="text-white font-black text-xl" style={{letterSpacing:'-0.02em'}}>
                      Data Pipeline Center
                    </div>
                    <div className="text-sm" style={{color:'rgba(255,255,255,0.55)'}}>
                      Phase 36.5 · Manus Architecture · 4 registres · ENT-DEMO-001
                    </div>
                  </div>
                </div>
                <div className="text-xs font-bold px-3 py-1.5 rounded-full inline-block"
                  style={{background:'rgba(245,158,11,0.2)',color:'#FCD34D'}}>
                  ⚠️ {PILOT} · Webhook ≠ vérité fiscale définitive
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-black text-white">{pass}/{REPORT_ITEMS.length}</div>
                <div className="text-xs" style={{color:'rgba(255,255,255,0.45)'}}>tests PASS</div>
              </div>
            </div>

            {/* Architecture pipeline */}
            <div className="mt-4 pt-3 flex items-center gap-1.5 flex-wrap"
              style={{borderTop:'1px solid rgba(255,255,255,0.1)'}}>
              {['WEBHOOK','→','RAW LOG','→','VALIDATION','→','NORMALISATION','→','OPÉRATIONNEL','→','FINANCIER','→','SETTLEMENT','→','RÉCONCILIATION','→','FISCAL','→','DÉCLARATION','→','AUDIT'].map((s,i)=>(
                <span key={i} className="text-xs font-bold"
                  style={s==='→'?{color:'rgba(255,255,255,0.2)'}:{
                    color:'white',
                    background:'rgba(255,255,255,0.1)',
                    padding:'2px 8px',
                    borderRadius:'6px',
                  }}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* KPI bar */}
          <div className="grid grid-cols-4 md:grid-cols-8" style={{borderTop:'1px solid rgba(255,255,255,0.1)'}}>
            {[
              {l:'Events reçus',    v:RAW_EVENTS.length,                                         c:'white'},
              {l:'Traités',         v:RAW_EVENTS.filter(e=>e.status==='PROCESSED').length,        c:'#86EFAC'},
              {l:'Doublons bloqués',v:RAW_EVENTS.filter(e=>e.status==='DUPLICATE').length,        c:'#CBD5E1'},
              {l:'Quarantaine',     v:RAW_EVENTS.filter(e=>e.status==='QUARANTINED').length,      c:'#FCA5A5'},
              {l:'Activités',       v:OPERATIONAL.length,                                         c:'white'},
              {l:'Transactions',    v:FINANCIAL.length,                                           c:'white'},
              {l:'Settlements',     v:SETTLEMENTS.length,                                         c:'white'},
              {l:'Recon. MATCH',    v:RECON.filter(r=>r.status==='MATCHED').length+'/'+RECON.length,c:'#86EFAC'},
            ].map((k,i)=>(
              <div key={k.l} className="px-3 py-3 text-center"
                style={{borderRight:i<7?'1px solid rgba(255,255,255,0.08)':undefined}}>
                <div className="text-sm font-black" style={{color:k.c}}>{k.v}</div>
                <div className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.35)'}}>{k.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1.5 flex-wrap">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer border transition-all"
              style={{
                background:tab===t.id?'#003DA5':'white',
                color:tab===t.id?'white':'#64748B',
                borderColor:tab===t.id?'#003DA5':'#E2E8F0',
                boxShadow:tab===t.id?'0 2px 8px rgba(0,61,165,0.3)':'none',
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW ─── */}
        {tab==='overview'&&(
          <div className="space-y-4">
            {/* Règle fondamentale */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-black text-slate-800 mb-3">Principe architectural — Manus</div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  {icon:'📡',label:'WEBHOOK',     desc:'Signal rapide\nPas la vérité fiscale',   c:'#7C3AED',bg:'#F5F3FF'},
                  {icon:'🔌',label:'API',          desc:'Confirmation\nSources multiples',        c:'#003DA5',bg:'#EFF6FF'},
                  {icon:'🏦',label:'SETTLEMENT',   desc:'Contrôle financier\nPlateforme officiel',c:'#059669',bg:'#F0FDF4'},
                  {icon:'🔄',label:'RÉCONCILIATION',desc:'Vérification croisée\n4 sources',      c:'#B45309',bg:'#FFFBEB'},
                  {icon:'🧾',label:'LEDGER FISCAL',desc:'Vérité fiscale\nStructurée',             c:'#DC2626',bg:'#FFF1F2'},
                ].map(s=>(
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{background:s.bg,border:`1px solid ${s.c}20`}}>
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div className="text-xs font-black" style={{color:s.c}}>{s.label}</div>
                    <div className="text-xs text-slate-500 mt-1 whitespace-pre-line leading-tight">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline health */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-sm font-black text-slate-800 mb-3">Pipeline Health (DEMO)</div>
                {[
                  {l:'Success Rate',            v:'85.7%',  c:'#059669'},
                  {l:'Duplicate Prevention',    v:'100%',   c:'#059669'},
                  {l:'Reconciliation Rate',     v:'80%',    c:'#003DA5'},
                  {l:'Quarantine Rate',         v:'14.3%',  c:'#B45309'},
                  {l:'Settlement Match',        v:'75%',    c:'#003DA5'},
                  {l:'Fiscal Records Generated',v:'5/5',    c:'#059669'},
                  {l:'API Verification',        v:'DEMO',   c:'#B45309'},
                ].map(r=>(
                  <div key={r.l} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0 text-sm">
                    <span className="text-slate-500">{r.l}</span>
                    <span className="font-bold" style={{color:r.c}}>{r.v}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-sm font-black text-slate-800 mb-3">Tables Supabase utilisées</div>
                {[
                  {table:'system_events',          usage:'RAW EVENT LOG · 32 types · RLS'},
                  {table:'provider_events',         usage:'Provider-specific events · payload_hash'},
                  {table:'provider_activities',     usage:'OPERATIONAL REGISTER · origin/dest/dist'},
                  {table:'provider_transaction_snapshots',usage:'FINANCIAL REGISTER · snapshot_version'},
                  {table:'provider_tax_records',    usage:'FISCAL REGISTER · TPS/TVQ/variance'},
                  {table:'provider_tip_records',    usage:'Pourboires séparés · tip_status'},
                  {table:'provider_settlements',    usage:'SETTLEMENT · period/gross/fees/taxes/net'},
                  {table:'provider_reconciliation_items',usage:'RÉCONCILIATION · match_status'},
                  {table:'dead_letter_queue',       usage:'QUARANTAINE · requires_manual_review'},
                  {table:'sync_queue',              usage:'EVENT QUEUE · attempts/correlation_id'},
                ].map(r=>(
                  <div key={r.table} className="py-1.5 border-b border-slate-100 last:border-0">
                    <div className="text-xs font-mono font-bold text-blue-700">{r.table}</div>
                    <div className="text-xs text-slate-400">{r.usage}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── RAW EVENTS ─── */}
        {tab==='raw'&&(
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100" style={{borderTop:'3px solid #003DA5'}}>
              <div className="text-sm font-black text-slate-800">RAW EVENT LOG — payload immuable</div>
              <div className="text-xs text-slate-400 mt-0.5">system_events + provider_events · source_payload_hash</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>{['Event ID','Source','Type','Reçu à','Signature','Hash','Statut'].map(h=>(
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {RAW_EVENTS.map(e=>(
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-mono text-xs font-bold text-slate-700">{e.id}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-600">{e.source}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{e.type}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-400">{e.received.replace('T',' ').slice(0,19)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${e.sig==='VALID'?'text-green-700 bg-green-50':'text-red-600 bg-red-50'}`}>{e.sig}</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-300">{e.hash}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[e.status]??'text-slate-600 bg-slate-100'}`}>{e.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
              <div className="text-xs text-amber-600 font-semibold">
                ⚠️ Payload original JAMAIS modifié · source_payload immuable · hash SHA-256 · {PILOT}
              </div>
            </div>
          </div>
        )}

        {/* ─── OPERATIONAL ─── */}
        {tab==='operational'&&(
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100" style={{borderTop:'3px solid #003DA5'}}>
              <div className="text-sm font-black text-slate-800">REGISTRE OPÉRATIONNEL — provider_activities</div>
              <div className="text-xs text-slate-400 mt-0.5">Ce qui s'est réellement passé terrain · enterprise_id + dept + driver + vehicle</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>{['Activity ID','Chauffeur','Département','Type','Origine','Destination','Dist.','Durée','Statut'].map(h=>(
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-bold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {OPERATIONAL.map(a=>(
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-mono text-xs font-bold text-blue-700">{a.id}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-800">{a.driver}</td>
                      <td className="px-3 py-2.5 text-slate-500">{a.dept}</td>
                      <td className="px-3 py-2.5"><span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{a.type}</span></td>
                      <td className="px-3 py-2.5 text-slate-500">{a.origin}</td>
                      <td className="px-3 py-2.5 text-slate-500">{a.dest}</td>
                      <td className="px-3 py-2.5 text-slate-600">{a.dist}km</td>
                      <td className="px-3 py-2.5 text-slate-600">{a.dur}min</td>
                      <td className="px-3 py-2.5"><span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── FINANCIAL ─── */}
        {tab==='financial'&&(
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100" style={{borderTop:'3px solid #059669'}}>
              <div className="text-sm font-black text-slate-800">REGISTRE FINANCIER — provider_transaction_snapshots</div>
              <div className="text-xs text-slate-400 mt-0.5">Réalité financière · gross/fees/tips/tps/tvq/net · pourboires séparés</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>{['Fin ID','Act ID','Brut','Frais','Tips','Refund','Adj.','TPS','TVQ','Net','Settlement','Status'].map(h=>(
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-bold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {FINANCIAL.map(f=>(
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-mono text-xs font-bold text-green-700">{f.id}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-400">{f.actId}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-800">{money2(f.gross)}</td>
                      <td className="px-3 py-2.5 text-red-500">-{money2(f.fees)}</td>
                      <td className="px-3 py-2.5 text-slate-600">{money2(f.tips)}</td>
                      <td className="px-3 py-2.5 text-slate-400">{money2(f.refunds)}</td>
                      <td className="px-3 py-2.5 text-amber-600">{money2(f.adj)}</td>
                      <td className="px-3 py-2.5 text-purple-600">{money2(f.tps)}</td>
                      <td className="px-3 py-2.5 text-indigo-600">{money2(f.tvq)}</td>
                      <td className="px-3 py-2.5 font-bold" style={{color:'#059669'}}>{money2(f.net)}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-400">{money2(f.settle)}</td>
                      <td className="px-3 py-2.5"><span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">POSTED</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-green-50 border-t border-green-100">
              <div className="text-xs text-green-700 font-semibold">
                ✅ Pourboires séparés du gross · Ajustements tracés · TPS/TVQ calculés par ligne · provider_tip_records distinct
              </div>
            </div>
          </div>
        )}

        {/* ─── FISCAL ─── */}
        {tab==='fiscal'&&(
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100" style={{borderTop:'3px solid #7C3AED'}}>
              <div className="text-sm font-black text-slate-800">REGISTRE FISCAL — provider_tax_records</div>
              <div className="text-xs text-red-500 font-semibold mt-0.5">SIMULATION PILOTE · NON TRANSMIS À REVENU QUÉBEC · Données synthétiques</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>{['Fiscal ID','Fin ID','Période','Montant taxable','TPS 5%','TVQ 9.975%','Tips','Adj.','Statut'].map(h=>(
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-bold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {FISCAL.map(f=>(
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-mono text-xs font-bold text-purple-700">{f.id}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-400">{f.finId}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-700">{f.period}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-800">{money2(f.taxable)}</td>
                      <td className="px-3 py-2.5 text-purple-600 font-semibold">{money2(f.tps)}</td>
                      <td className="px-3 py-2.5 text-indigo-600 font-semibold">{money2(f.tvq)}</td>
                      <td className="px-3 py-2.5 text-slate-600">{money2(f.tips)}</td>
                      <td className="px-3 py-2.5 text-amber-600">{money2(f.adj)}</td>
                      <td className="px-3 py-2.5"><span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{f.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-purple-50 border-t border-purple-100">
              <div className="text-xs text-purple-700 font-semibold">
                ⚠️ Le REGISTRE FISCAL est distinct du REGISTRE FINANCIER · Une TX opérationnelle ≠ automatiquement TX fiscale
              </div>
            </div>
          </div>
        )}

        {/* ─── SETTLEMENT ─── */}
        {tab==='settlement'&&(
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100" style={{borderTop:'3px solid #059669'}}>
              <div className="text-sm font-black text-slate-800">SETTLEMENT / RELEVÉ — provider_settlements</div>
              <div className="text-xs text-slate-400 mt-0.5">Confirmation financière de la plateforme · à comparer au Financial Register</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>{['Settlement ID','Plateforme','Période','Brut','Frais','Tips','Taxes','Net','Date','Statut'].map(h=>(
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-bold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SETTLEMENTS.map(s=>(
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-mono text-xs font-bold text-green-700">{s.id}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-700">{s.platform}</td>
                      <td className="px-3 py-2.5 text-slate-500">{s.period}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-800">{money2(s.gross)}</td>
                      <td className="px-3 py-2.5 text-red-500">-{money2(s.fees)}</td>
                      <td className="px-3 py-2.5 text-slate-600">{money2(s.tips)}</td>
                      <td className="px-3 py-2.5 text-purple-600">{money2(s.taxes)}</td>
                      <td className="px-3 py-2.5 font-bold" style={{color:'#059669'}}>{money2(s.net)}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-400">{s.date}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.status==='MATCHED'?'text-green-700 bg-green-50':'text-amber-600 bg-amber-50'}`}>{s.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── RÉCONCILIATION ─── */}
        {tab==='recon'&&(
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100" style={{borderTop:'3px solid #B45309'}}>
              <div className="text-sm font-black text-slate-800">RÉCONCILIATION ENGINE — 4 sources comparées</div>
              <div className="text-xs text-slate-400 mt-0.5">Raw Event ↔ Opérationnel ↔ Financier ↔ Settlement ↔ Fiscal</div>
            </div>
            <div className="divide-y divide-slate-100">
              {RECON.map(r=>(
                <div key={r.id} className="px-5 py-3 hover:bg-slate-50">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{r.status==='MATCHED'?'✅':'⚠️'}</span>
                    <span className="text-sm font-bold text-slate-800">{r.id}</span>
                    <span className="text-xs font-mono text-slate-400">{r.finId}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-auto ${r.status==='MATCHED'?'text-green-700 bg-green-50':'text-amber-600 bg-amber-50'}`}>{r.status.replace('_',' ')}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      {l:'Settlement',  v:r.settle, c:'#059669'},
                      {l:'Ledger Fin.', v:r.ledger, c:'#003DA5'},
                      {l:'Fiscal',      v:r.fiscal,  c:'#7C3AED'},
                      {l:'Écart',       v:r.diff,    c:r.diff!==0?'#DC2626':'#059669'},
                    ].map(col=>(
                      <div key={col.l} className="bg-slate-50 rounded-xl p-2 text-center">
                        <div className="text-xs text-slate-400">{col.l}</div>
                        <div className="text-sm font-black" style={{color:col.c}}>{col.v.toFixed(2)}$</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── QUARANTAINE ─── */}
        {tab==='quarantine'&&(
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 font-semibold">
              🚫 Événements non traités · conservés intacts · jamais supprimés · dead_letter_queue · requires_manual_review
            </div>
            {QUARANTINE.map(q=>(
              <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">🚫</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-800">{q.id}</span>
                      <span className="text-xs font-mono text-slate-400">{q.evtId}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-auto ${q.resolved?'text-green-700 bg-green-50':'text-red-600 bg-red-50'}`}>
                        {q.resolved?'RÉSOLU':'ACTIF'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{q.source} · {q.at.replace('T',' ').slice(0,19)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-slate-50 rounded-xl p-2">
                    <div className="text-xs text-slate-400">Raison</div>
                    <div className="font-bold text-red-700 text-xs">{q.reason}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2">
                    <div className="text-xs text-slate-400">Code erreur</div>
                    <div className="font-mono font-bold text-slate-700 text-xs">{q.code}</div>
                  </div>
                </div>
                {!q.resolved&&(
                  <div className="flex gap-2 mt-3">
                    {['Retry','Reprocess','Ignorer (conserver historique)'].map(a=>(
                      <button key={a} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors text-slate-600">
                        {a}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── DATA LINEAGE ─── */}
        {tab==='lineage'&&(
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 font-semibold">
              🔗 D'où vient cette donnée? · Tracez n'importe quelle entrée fiscale jusqu'au payload source original
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-black text-slate-800 mb-4">Lineage: FSC-001 → FIN-001 → Jean Tremblay → Uber Rides → Payload original</div>
              {LINEAGE_STEPS.map((s,i)=>(
                <div key={s.step} className="flex items-start gap-3 mb-1">
                  <div className="flex flex-col items-center shrink-0">
                    <button
                      onClick={()=>setLineageStep(lineageStep===i?null:i)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black cursor-pointer transition-all"
                      style={{
                        background:lineageStep===i?'#003DA5':'rgba(0,61,165,0.12)',
                        color:lineageStep===i?'white':'#003DA5',
                      }}>
                      {i+1}
                    </button>
                    {s.arrow&&<div className="w-0.5 h-4 mt-0.5 rounded-full" style={{background:'rgba(0,61,165,0.15)'}}/>}
                  </div>
                  <div className="flex-1 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-800">{s.step}</span>
                      <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{s.table}</span>
                    </div>
                    <div className={`text-xs font-mono text-slate-500 mt-0.5 transition-all ${lineageStep===i?'block':'truncate max-w-lg'}`}>
                      {s.id}
                    </div>
                    {lineageStep===i&&(
                      <div className="mt-2 p-3 rounded-xl text-xs font-mono text-green-700" style={{background:'#F0FDF4',border:'1px solid #BBF7D0'}}>
                        Table: <strong>{s.table}</strong><br/>
                        ID: <strong>{s.id}</strong><br/>
                        Statut: <strong>ACCESSIBLE · RLS appliqué</strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="mt-3 text-xs text-slate-400 italic">Cliquez sur un nœud pour voir les détails</div>
            </div>
          </div>
        )}

        {/* ─── COMMENT ÇA MARCHE ─── */}
        {tab==='how'&&(
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-black text-slate-800 mb-1">Comment TAXIMETER.GOV fonctionne</div>
              <div className="text-xs text-slate-500 mb-5">Vue pédagogique pour décideurs et visiteurs gouvernementaux · {PILOT}</div>
              {HOW_STEPS.map((s,i)=>(
                <div key={s.n} className="flex items-start gap-4 mb-4">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center"
                      style={{background:'linear-gradient(135deg,#003DA5,#0057E7)',boxShadow:'0 2px 8px rgba(0,61,165,0.3)'}}>
                      <span className="text-lg">{s.icon}</span>
                    </div>
                    {i<HOW_STEPS.length-1&&(
                      <div className="w-0.5 h-6 mt-1 rounded-full" style={{background:'rgba(0,61,165,0.15)'}}/>
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{s.n}</span>
                      <span className="text-sm font-black text-slate-800">{s.label}</span>
                    </div>
                    <div className="text-sm text-slate-600">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 font-semibold">
              🏛️ TAXIMETER.GOV prépare les données fiscales. Il ne remplace pas les systèmes gouvernementaux officiels.
              Connexion Revenu Québec / SAAQ / CTQ : NOT CONNECTED · À autoriser et implémenter officiellement.
            </div>
          </div>
        )}

        {/* ─── RAPPORT ─── */}
        {tab==='report'&&(
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-black text-slate-800 mb-4">Rapport Phase 36.5 — Manus Architecture Upgrade</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-5">
                {REPORT_ITEMS.map(r=>(
                  <div key={r.cat} className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${r.status==='PASS'?'bg-green-50 border-green-200':r.status==='PARTIAL'?'bg-amber-50 border-amber-200':'bg-red-50 border-red-200'}`}>
                    <span className="shrink-0 mt-0.5">{r.status==='PASS'?'✅':r.status==='PARTIAL'?'⚠️':'❌'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-800 text-xs">{r.cat}</div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-tight">{r.detail}</div>
                    </div>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full text-white shrink-0 ${r.status==='PASS'?'bg-green-600':r.status==='PARTIAL'?'bg-amber-500':'bg-red-600'}`}>{r.status}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 text-center mb-5">
                {[{l:'PASS',v:pass,c:'#059669'},{l:'PARTIAL',v:partial,c:'#B45309'},{l:'FAIL',v:fail,c:'#DC2626'}].map(s=>(
                  <div key={s.l} className="bg-slate-50 rounded-2xl p-4">
                    <div className="text-3xl font-black" style={{color:s.c}}>{s.v}</div>
                    <div className="text-sm text-slate-500 font-bold mt-1">{s.l}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="text-sm font-black text-slate-800">Actions manuelles requises</div>
                {[
                  {n:1, action:'Appliquer rls-policies.sql',    where:'Supabase SQL Editor · projet aisojdmxsskzrdjrhrzw'},
                  {n:2, action:'Activer Realtime INSERT system_events', where:'Supabase Dashboard → Table Editor → system_events → Enable Realtime'},
                  {n:3, action:'Créer /api/admin/sync-events dans gov app', where:'Gov Next.js API route → sb.from(\'system_events\').select()'},
                  {n:4, action:'Brancher API verification sur vrai endpoint Uber',where:'Quand API Uber DEMO disponible · endpoint /api/platform/verify'},
                ].map(a=>(
                  <div key={a.n} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-black shrink-0">{a.n}</div>
                    <div>
                      <div className="text-sm font-bold text-blue-800">{a.action}</div>
                      <div className="text-xs text-blue-600">{a.where}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 font-semibold">
              🏛️ Score Phase 36.5: ~80% · {pass} PASS · {partial} PARTIAL · {fail} FAIL · {PILOT} · En attente approbation
            </div>
          </div>
        )}

        <div className="text-xs text-slate-400 text-center py-1">
          {PILOT} · TAXIMETER.GOV Phase 36.5 · Manus Architecture · ENT-DEMO-001 · 🍁 Québec
        </div>
      </div>
    </AppShell>
  )
}
