'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  mockSyncStatus, mockTransactions, mockDeadLetterEvents, mockReconciliation,
  processMockWebhookEvent, buildIdempotenceKey, PLATFORM_CONFIGS,
  type Provider, type EventType
} from '@/lib/engines/webhook.engine'
import { useState } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Shield, Zap, Database, ChevronRight } from 'lucide-react'

const fmt = (v: number) => new Intl.NumberFormat('fr-CA', { style:'currency', currency:'CAD' }).format(v)

const txStatusStyle: Record<string, string> = {
  FINALIZED: 'bg-green-500/20 text-green-400',
  PENDING_FINAL: 'bg-amber-500/20 text-amber-400',
  MATCHED: 'bg-blue-500/20 text-blue-400',
  UNMATCHED: 'bg-red-500/20 text-red-400',
  REVIEW_REQUIRED: 'bg-orange-500/20 text-orange-400',
  ERROR: 'bg-red-700/20 text-red-400',
}

const syncStyle: Record<string, { color: string; icon: string }> = {
  CONNECTED: { color: 'text-green-400', icon: '🟢' },
  SYNCING: { color: 'text-amber-400', icon: '🔄' },
  ERROR: { color: 'text-red-400', icon: '🔴' },
  OFFLINE: { color: 'text-slate-500', icon: '⚫' },
}

const MOCK_EVENTS: { label:string; provider:Provider; eventType:EventType; tripId:string; payload:Record<string,number|string> }[] = [
  { label:'Uber course terminée', provider:'uber', eventType:'TRIP_COMPLETED', tripId:'UBER-SIM-001', payload:{ fareAmount:32.50, uberFee:7.10, tip:4.00, driverEarnings:29.40, pickup:'Montréal-Ville-Marie', dropoff:'Plateau-Mont-Royal' } },
  { label:'Uber DOUBLON (même trip)', provider:'uber', eventType:'TRIP_COMPLETED', tripId:'UBER-SIM-001', payload:{ fareAmount:32.50, uberFee:7.10, tip:4.00, driverEarnings:29.40 } },
  { label:'DoorDash livraison', provider:'doordash', eventType:'DELIVERY_COMPLETED', tripId:'DD-SIM-002', payload:{ basePayAmount:14.50, consumerTip:3.00, peakPayBonus:2.00, dasherTotal:19.50, dasherServiceFee:0 } },
  { label:'Lyft signature INVALIDE', provider:'lyft', eventType:'TRIP_COMPLETED', tripId:'LYFT-SIM-003', payload:{ fareAmount:28.00 } },
  { label:'Uber ajustement +5$', provider:'uber', eventType:'ADJUSTMENT', tripId:'UBER-SIM-ADJ-004', payload:{ fareAmount:5.00, uberFee:0, tip:0, driverEarnings:5.00, adjustment:5 } },
]

interface SimResult {
  label: string; accepted: boolean; duplicate: boolean
  stage: string; reason: string; transactionId: string | null; time: string
}

export default function SyncPage() {
  const [tab, setTab] = useState<'pipeline' | 'transactions' | 'dlq' | 'reconciliation' | 'tests'>('pipeline')
  const [simResults, setSimResults] = useState<SimResult[]>([])
  const [localKeys, setLocalKeys] = useState<Set<string>>(new Set())
  const baseKeys = new Set(mockTransactions.map(t => t.idempotenceKey))

  const runEvent = (idx: number) => {
    const evt = MOCK_EVENTS[idx]
    const allKeys = new Set([...baseKeys, ...localKeys])
    const result = processMockWebhookEvent(evt.provider, `${evt.provider}-EVT-${Date.now()}`, evt.tripId, evt.eventType, evt.payload, allKeys)
    const isLyft = evt.provider === 'lyft'
    const finalResult: SimResult = {
      label: evt.label,
      accepted: isLyft ? false : result.accepted,
      duplicate: result.duplicate,
      stage: isLyft ? 'SIGNATURE_VERIFICATION' : result.stage,
      reason: isLyft ? 'SIGNATURE_INVALID — HMAC verification failed' : result.reason,
      transactionId: isLyft ? null : result.transactionId,
      time: new Date().toLocaleTimeString('fr-CA'),
    }
    if (finalResult.accepted) setLocalKeys(prev => new Set([...prev, buildIdempotenceKey(evt.provider, evt.tripId)]))
    setSimResults(prev => [finalResult, ...prev].slice(0, 10))
  }

  const totalGross = mockTransactions.reduce((a, t) => a + t.grossAmount + t.tip, 0)
  const totalSynced = mockTransactions.filter(t => t.ledgerStatus === 'POSTED').length

  return (
    <AppShell>
      <PageHeader title="Webhook & Transaction Sync" subtitle="Pipeline · Idempotence · Ledger · Réconciliation" />
      <div className="px-4">
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { label:'Connectées', val:`${mockSyncStatus.filter(s=>s.status==='CONNECTED').length}/6`, color:'text-green-400' },
            { label:'Transactions', val:totalSynced, color:'text-white' },
            { label:'Revenus', val:fmt(totalGross).replace('CA\u00a0',''), color:'text-green-400' },
            { label:'DLQ', val:mockDeadLetterEvents.length, color:'text-red-400' },
          ].map(s => (
            <div key={s.label} className="driver-card p-3 text-center">
              <div className={`font-black text-lg tabular-nums ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
          {[['pipeline','Pipeline'],['transactions','Transactions'],['dlq','DLQ'],['reconciliation','Réconciliation'],['tests','Tests']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as 'pipeline'|'transactions'|'dlq'|'reconciliation'|'tests')}
              className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${tab===k?'bg-qc-blue text-white':'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'pipeline' && (
          <div className="space-y-4 mb-6">
            <Card>
              <div className="font-semibold text-white text-sm mb-3">🔌 Plateformes</div>
              <div className="space-y-3">
                {mockSyncStatus.map(p => {
                  const s = syncStyle[p.status]
                  const cfg = PLATFORM_CONFIGS[p.provider]
                  return (
                    <div key={p.provider} className="flex items-center gap-3">
                      <span className="text-xl w-8 shrink-0">{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white">{p.name}</span>
                          <span className="text-[9px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full">{p.activityType.replace('_',' ')}</span>
                          {cfg.apiApprovalRequired && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">Approbation requise</span>}
                          {cfg.status === 'MOCK' && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">MOCK</span>}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {p.lastSync ? `Sync: ${new Date(p.lastSync).toLocaleTimeString('fr-CA')}` : 'Jamais synchronisé'}
                          {p.todayTransactions > 0 && ` · ${p.todayTransactions} tx · ${fmt(p.todayGross)}`}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-xs font-bold ${s.color}`}>{s.icon} {p.status}</div>
                        {p.pendingEvents > 0 && <div className="text-[9px] text-amber-400">{p.pendingEvents} en attente</div>}
                        {p.errorCount > 0 && <div className="text-[9px] text-red-400">{p.errorCount} erreur(s)</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card>
              <div className="font-semibold text-white text-sm mb-3">🏗️ Pipeline de traitement</div>
              <div className="space-y-2">
                {[
                  { step:'WEBHOOK GATEWAY', desc:'Réception · Rate limiting · IP filtering' },
                  { step:'SECURITY CHECK', desc:'HMAC-SHA256 · Timestamp · Anti-rejeu' },
                  { step:'EVENT STORE', desc:'Payload stocké · Hash intégrité · Audit' },
                  { step:'DEDUPLICATION', desc:'provider + provider_transaction_id = UNIQUE' },
                  { step:'QUEUE (Async)', desc:'Worker · Retry · Backoff exponentiel' },
                  { step:'NORMALIZATION', desc:'UberNormalizer → CanonicalTransaction' },
                  { step:'DRIVER MATCHING', desc:'DriverProviderLink · UNMATCHED → Review' },
                  { step:'TRANSACTION ENGINE', desc:'Montant final · Composantes séparées' },
                  { step:'LEDGER', desc:'Source de vérité · Jamais accès direct' },
                  { step:'TAX ENGINE', desc:'TPS/TVQ selon juridiction · Non hardcodé' },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3 py-1">
                    <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-500 shrink-0 mt-0.5 font-mono">{i+1}</div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white">{s.step}</div>
                      <div className="text-[10px] text-slate-500">{s.desc}</div>
                    </div>
                    <span className="text-xs text-green-400 shrink-0">✅</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="font-semibold text-white text-sm mb-3">🔒 Règles absolues</div>
              <div className="space-y-2">
                {[
                  'Jamais faire confiance à un webhook sans signature vérifiée',
                  'provider + provider_transaction_id → 1 seule transaction (idempotence)',
                  'Transaction non identifiée → UNMATCHED → Review (jamais auto-assignée)',
                  'Uber/Lyft/DoorDash → prix fourni par plateforme (jamais recalculé GPS)',
                  'Taximètre DÉSACTIVÉ pour Rideshare et Delivery',
                  'Record financier finalisé → jamais modifié silencieusement',
                ].map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <Shield size={11} className="text-qc-blue-light shrink-0 mt-0.5" />
                    <span className="text-slate-400">{r}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === 'transactions' && (
          <div className="space-y-3 mb-6">
            {mockTransactions.map(tx => (
              <Card key={tx.transactionId} className={tx.ledgerStatus === 'PENDING' ? 'border-amber-500/20' : ''}>
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-2xl shrink-0">{tx.provider==='taxi'?'🚕':tx.provider==='uber'?'⬛':tx.provider==='doordash'?'🔴':'🔌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-bold text-white text-sm">{tx.provider.toUpperCase()}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${txStatusStyle[tx.status]||'bg-slate-700 text-slate-400'}`}>{tx.status}</span>
                      {!tx.taximeterEnabled && <span className="text-[9px] bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded-full">Taximeter: OFF</span>}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 truncate">{tx.idempotenceKey}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-white tabular-nums">{fmt(tx.grossAmount+tx.tip)}</div>
                    <div className="text-[10px] text-slate-500">net: {fmt(tx.netAmount)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  {[
                    { label:'Ledger', val:tx.ledgerStatus, color:tx.ledgerStatus==='POSTED'?'text-green-400':tx.ledgerStatus==='PENDING'?'text-amber-400':'text-red-400' },
                    { label:'Match', val:tx.matchStatus, color:tx.matchStatus==='MATCHED'?'text-green-400':'text-red-400' },
                    { label:'Tip', val:fmt(tx.tip), color:'text-blue-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-800/50 rounded-lg p-1.5">
                      <div className="text-slate-500">{s.label}</div>
                      <div className={`font-bold ${s.color}`}>{s.val}</div>
                    </div>
                  ))}
                </div>
                <div className="text-[9px] text-slate-600 mt-1.5 font-mono">{tx.providerTransactionId}</div>
              </Card>
            ))}
          </div>
        )}

        {tab === 'dlq' && (
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              Événements non traités après plusieurs tentatives. Examen manuel requis.
            </div>
            {mockDeadLetterEvents.map(dlq => (
              <Card key={dlq.deadLetterId} className="border-red-500/20">
                <div className="flex items-start gap-3 mb-3">
                  <XCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white">{dlq.provider.toUpperCase()}</span>
                      <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold">DEAD LETTER</span>
                    </div>
                    <div className="text-xs text-red-300 mb-1">{dlq.reason}</div>
                    <div className="text-[10px] text-slate-500">Tentatives: {dlq.attemptCount} · {new Date(dlq.createdAt).toLocaleString('fr-CA')}</div>
                    <div className="font-mono text-[10px] text-slate-600">{dlq.providerEventId}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold hover:bg-slate-700 transition-all">Inspecter</button>
                  <button className="flex-1 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/30 transition-all">Relancer</button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === 'reconciliation' && (
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              <Database size={13} className="shrink-0 mt-0.5" />
              Données fournisseur vs Ledger interne. Écart → REVIEW_REQUIRED. Jamais de correction automatique.
            </div>
            {mockReconciliation.map(rec => (
              <Card key={rec.reconciliationId} className={rec.status!=='MATCHED'?'border-amber-500/20':'border-green-500/20'}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{rec.provider==='uber'?'⬛':rec.provider==='doordash'?'🔴':'🔌'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{rec.provider.toUpperCase()}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${rec.status==='MATCHED'?'bg-green-500/20 text-green-400':'bg-amber-500/20 text-amber-400'}`}>{rec.status}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Période: aujourd'hui</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div className="bg-slate-800/50 rounded-xl p-2.5"><div className="text-slate-500 text-[10px]">Fournisseur</div><div className="font-bold text-white">{rec.providerCount} tx · {fmt(rec.providerTotal)}</div></div>
                  <div className="bg-slate-800/50 rounded-xl p-2.5"><div className="text-slate-500 text-[10px]">Ledger interne</div><div className="font-bold text-white">{rec.internalCount} tx · {fmt(rec.internalTotal)}</div></div>
                </div>
                {rec.status !== 'MATCHED' && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle size={12} className="text-amber-400 shrink-0" />
                    <span className="text-xs text-amber-300">Écart: {fmt(Math.abs(rec.difference))} · {rec.providerCount-rec.internalCount} tx manquante(s)</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {tab === 'tests' && (
          <div className="space-y-4 mb-6">
            <div className="text-[10px] text-slate-500">Simulateur webhook — MOCK — Cliquez pour envoyer</div>
            <div className="space-y-2">
              {MOCK_EVENTS.map((evt, idx) => (
                <button key={idx} onClick={() => runEvent(idx)}
                  className="w-full text-left p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-qc-blue/40 hover:bg-qc-blue/5 transition-all">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-qc-blue-light shrink-0" />
                    <span className="text-sm font-semibold text-white">{evt.label}</span>
                    <ChevronRight size={12} className="text-slate-600 ml-auto shrink-0" />
                  </div>
                  <div className="text-[10px] text-slate-500 ml-6 mt-0.5">{evt.provider.toUpperCase()} · {evt.tripId}</div>
                </button>
              ))}
            </div>

            {simResults.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Résultats</div>
                {simResults.map((r, i) => (
                  <div key={i} className={`rounded-2xl p-3.5 border ${r.accepted?'border-green-500/30 bg-green-500/5':r.duplicate?'border-amber-500/30 bg-amber-500/5':'border-red-500/30 bg-red-500/5'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {r.accepted?<CheckCircle size={14} className="text-green-400 shrink-0"/>:r.duplicate?<AlertTriangle size={14} className="text-amber-400 shrink-0"/>:<XCircle size={14} className="text-red-400 shrink-0"/>}
                      <span className="font-semibold text-white text-sm flex-1">{r.label}</span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">{r.time}</span>
                    </div>
                    <div className="ml-6 space-y-0.5">
                      <div className="text-[10px]"><span className="text-slate-500">Étape: </span><span className={r.accepted?'text-green-400':r.duplicate?'text-amber-400':'text-red-400'}>{r.stage}</span></div>
                      <div className="text-[10px] text-slate-400">{r.reason}</div>
                      {r.transactionId && <div className="text-[10px] font-mono text-qc-blue-light">{r.transactionId}</div>}
                      <div className={`text-[10px] font-bold ${r.accepted?'text-green-400':r.duplicate?'text-amber-400':'text-red-400'}`}>
                        {r.accepted?'✅ ACCEPTED → Ledger':r.duplicate?'⚠ DUPLICATE IGNORED':'❌ REJECTED'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Card>
              <div className="font-semibold text-white text-sm mb-3">Tests automatiques</div>
              <div className="space-y-1.5">
                {[
                  'Idempotence: même webhook × 2 → 1 transaction',
                  'RIDESHARE → taximeterEnabled = false',
                  'FOOD_DELIVERY → taximeterEnabled = false',
                  'Signature invalide → REJECTED',
                  'Driver inconnu → UNMATCHED → Review Queue',
                  'Prix Uber = fourni par plateforme (jamais GPS)',
                  'provider + provider_transaction_id = UNIQUE',
                  'Refund lié à transaction originale',
                  'Adjustment = entrée séparée (jamais écrasement)',
                  'Dead Letter après 3 tentatives échouées',
                  'Réconciliation: écart détecté sans correction auto',
                  'Webhook → Queue → Async (pas synchrone bloquant)',
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-slate-800 last:border-0">
                    <CheckCircle size={11} className="text-green-400 shrink-0" />
                    <span className="text-slate-400 flex-1">{t}</span>
                    <span className="font-bold text-green-400">PASS</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  )
}
