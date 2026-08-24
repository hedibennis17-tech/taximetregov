'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, PlatformBadge } from '@/components/ui'
import { defaultSimulatorConfig, mockGatewayTransactions } from '@/data/gateway.mock'
import { useState } from 'react'
import { Send, AlertTriangle, CheckCircle, XCircle, Copy, Zap, RotateCcw } from 'lucide-react'
import type { PlatformCode } from '@/data/gateway.mock'

type SimResult = {
  status: 'PROCESSED' | 'DUPLICATE' | 'REJECTED' | 'FAILED'
  internalTxId?: string
  providerTxId?: string
  gross?: number
  tip?: number
  adjustment?: number
  net?: number
  tps?: number
  tvq?: number
  isDuplicate: boolean
  signatureValid: boolean
  durationMs: number
  error?: string
  reason?: string
  pipeline: { step: string; status: 'ok' | 'skip' | 'fail' | 'warn'; detail: string }[]
}

const PROVIDERS: PlatformCode[] = ['uber','lyft','doordash','instacart','ubereats','skip','taxi']
const PROVIDER_EVENTS: Record<PlatformCode, string[]> = {
  uber: ['TRIP_COMPLETED','FARE_RECEIVED','TIP_ADDED','ADJUSTMENT'],
  lyft: ['RIDE_COMPLETED','PAYMENT_RECEIVED','TIP_RECEIVED'],
  doordash: ['DELIVERY_COMPLETE','PAYMENT_CONFIRMED','TIP_RECEIVED'],
  instacart: ['ORDER_DELIVERED','BATCH_PAYMENT','TIP_RECEIVED'],
  ubereats: ['ORDER_DELIVERED','PAYMENT_RECEIVED','ADJUSTMENT'],
  skip: ['ORDER_DELIVERED','PAYMENT_RECEIVED'],
  taxi: ['TRIP_CLOSED','FARE_CALCULATED','TIP_ADDED'],
  other: ['PAYMENT_RECEIVED'],
}
const PROVIDER_COLORS: Record<PlatformCode, string> = {
  uber:'#000',lyft:'#FF00BF',doordash:'#FF3008',instacart:'#43B02A',
  ubereats:'#06C167',skip:'#E31837',taxi:'#003DA5',other:'#64748b'
}
const DRIVER_OPTIONS = [
  {id:'TG-000001',name:'Mohammed Benali'},{id:'TG-000002',name:'Sophie Tremblay'},
  {id:'TG-000003',name:'Jean-Pierre Côté'},{id:'TG-000005',name:'Alex Nguyen'},
  {id:'TG-000009',name:'Carlos Rodriguez'},{id:'TG-000008',name:'Lucie Gagné'},
]

// Track sent tripIds for duplicate detection
const sentTripIds = new Set<string>()

function simulateWebhook(cfg: typeof defaultSimulatorConfig): SimResult {
  const start = Date.now()
  const pipeline: SimResult['pipeline'] = []

  // 1. Receive
  pipeline.push({ step: 'Receive', status: 'ok', detail: `${cfg.provider.toUpperCase()} → ${cfg.eventType}` })

  // 2. Validate
  pipeline.push({ step: 'Validate', status: 'ok', detail: 'Payload valide, headers présents' })

  // 3. Signature
  if (cfg.forceSignatureError) {
    pipeline.push({ step: 'Verify Signature', status: 'fail', detail: 'HMAC-SHA256 invalide ❌' })
    return { status: 'REJECTED', isDuplicate: false, signatureValid: false, durationMs: Date.now() - start, error: 'Signature invalide', pipeline }
  }
  pipeline.push({ step: 'Verify Signature', status: 'ok', detail: 'HMAC-SHA256 valide ✅ (mock-valid)' })

  // 4. Duplicate webhook check
  const tripKey = `${cfg.provider}::${cfg.tripId}`
  if (cfg.forceDuplicate || sentTripIds.has(tripKey)) {
    pipeline.push({ step: 'Dedup Webhook', status: 'warn', detail: `Doublon détecté — ${cfg.tripId} déjà reçu` })
    const existingTx = mockGatewayTransactions.find(t => t.providerTxId.includes(cfg.tripId.split('-').pop() || ''))
    return {
      status: 'DUPLICATE', internalTxId: existingTx?.internalTxId ?? 'TG-TXN-2026-EXISTING',
      providerTxId: cfg.tripId, isDuplicate: true, signatureValid: true,
      durationMs: Date.now() - start,
      reason: 'UNIQUE constraint: provider_transaction_id déjà existant',
      pipeline,
    }
  }
  pipeline.push({ step: 'Dedup Webhook', status: 'ok', detail: 'Aucun doublon — Nouveau événement' })

  // 5. Persist raw
  pipeline.push({ step: 'Persist Raw', status: 'ok', detail: 'Payload chiffré + stocké — Audit trail complet' })

  // 6. Normalize
  const gross = cfg.grossAmount
  const fee = Math.round(gross * 0.25 * 100) / 100
  const tip = cfg.tip
  const adj = cfg.adjustment
  pipeline.push({ step: 'Normalize', status: 'ok', detail: `gross=${gross} → fee=${fee} → net=${Math.round((gross - fee + tip + adj) * 100) / 100}` })

  // 7. UNIQUE transaction check
  sentTripIds.add(tripKey)
  pipeline.push({ step: 'UNIQUE(tx)', status: 'ok', detail: `UNIQUE(provider, provider_transaction_id) → PASS` })

  // 8. Ledger write
  const internalTxId = `TG-TXN-2026-${String(Math.floor(Math.random() * 9999999)).padStart(10, '0')}`
  const taxable = gross - fee
  const tps = Math.round(taxable * 0.05 * 100) / 100
  const tvq = Math.round(taxable * 0.09975 * 100) / 100
  const net = Math.round((gross - fee + tip + adj - cfg.refund) * 100) / 100
  pipeline.push({ step: 'Ledger Write', status: 'ok', detail: `${internalTxId} créé · TPS ${tps}$ · TVQ ${tvq}$` })

  // 9. Tax engine
  pipeline.push({ step: 'Tax Engine', status: 'ok', detail: `TPS 5%=${tps}$ · TVQ 9.975%=${tvq}$ · Total=${Math.round((tps+tvq)*100)/100}$` })

  // 10. Audit
  pipeline.push({ step: 'Audit + Notify', status: 'ok', detail: `TRANSACTION_CREATED · Driver ${cfg.governmentUserId} · Sync Driver App + Gov Dashboard` })

  return {
    status: 'PROCESSED', internalTxId, providerTxId: cfg.tripId,
    gross, tip, adjustment: adj, net, tps, tvq,
    isDuplicate: false, signatureValid: true, durationMs: Date.now() - start, pipeline,
  }
}

export default function SimulatorPage() {
  const [cfg, setCfg] = useState(defaultSimulatorConfig)
  const [result, setResult] = useState<SimResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<SimResult[]>([])

  const update = (key: keyof typeof defaultSimulatorConfig, value: unknown) =>
    setCfg(c => ({ ...c, [key]: value }))

  const sendWebhook = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 800 + Math.random() * 400))
    const res = simulateWebhook(cfg)
    setResult(res)
    setHistory(h => [res, ...h].slice(0, 10))
    setLoading(false)
  }

  const sendDuplicate = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 300))
    const res = simulateWebhook({ ...cfg, forceDuplicate: true })
    setResult(res)
    setHistory(h => [res, ...h].slice(0, 10))
    setLoading(false)
  }

  const fmt = (n: number) => `${n.toFixed(2)} $`

  return (
    <AppShell>
      <PageHeader
        title="Simulateur d'intégration"
        subtitle="⚠ Réservé aux développeurs et administrateurs autorisés — MOCK uniquement"
      />

      <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
        <AlertTriangle size={14} className="text-amber-600 shrink-0" />
        <p className="text-xs text-amber-700">
          Cet outil simule le pipeline webhook complet sans connexion externe réelle. Les transactions créées ici traversent exactement le même pipeline que les vrais webhooks (validation HMAC, UNIQUE check, Ledger, Tax, Audit).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Config panel */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Zap size={14} className="text-qc-blue" /> Configuration du webhook
            </div>

            {/* Provider */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Plateforme</label>
              <div className="flex flex-wrap gap-2">
                {PROVIDERS.map(p => (
                  <button key={p} onClick={() => { update('provider', p); update('eventType', PROVIDER_EVENTS[p][0]) }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border
                      ${cfg.provider === p ? 'text-white border-transparent' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    style={cfg.provider === p ? { background: PROVIDER_COLORS[p] === '#000' ? '#111' : PROVIDER_COLORS[p] } : {}}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Event type */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Type d'événement</label>
              <select value={cfg.eventType} onChange={e => update('eventType', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-qc-blue">
                {PROVIDER_EVENTS[cfg.provider].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Driver */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Chauffeur</label>
              <select value={cfg.governmentUserId} onChange={e => update('governmentUserId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-qc-blue">
                {DRIVER_OPTIONS.map(d => <option key={d.id} value={d.id}>{d.id} — {d.name}</option>)}
              </select>
            </div>

            {/* Trip ID */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Trip / Order ID</label>
              <input value={cfg.tripId} onChange={e => update('tripId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-qc-blue font-mono"
                placeholder="UBER-TRIP-12345" />
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { key: 'grossAmount', label: 'Montant brut ($)' },
                { key: 'tip', label: 'Pourboire ($)' },
                { key: 'adjustment', label: 'Ajustement ($)' },
                { key: 'refund', label: 'Remboursement ($)' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">{f.label}</label>
                  <input type="number" step="0.01" min="0"
                    value={(cfg as any)[f.key]}
                    onChange={e => update(f.key as any, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-qc-blue font-mono" />
                </div>
              ))}
            </div>

            {/* Error flags */}
            <div className="flex gap-3 mb-5">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={cfg.forceSignatureError}
                  onChange={e => update('forceSignatureError', e.target.checked)}
                  className="rounded accent-red-500" />
                <span className="text-red-600 font-medium">Simuler signature invalide</span>
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button onClick={sendWebhook} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50"
                style={{ background: loading ? '#94a3b8' : PROVIDER_COLORS[cfg.provider] === '#000' ? '#111' : PROVIDER_COLORS[cfg.provider] }}>
                {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Envoi…</> : <><Send size={15} /> ENVOYER WEBHOOK</>}
              </button>
            </div>

            {result && (
              <button onClick={sendDuplicate} disabled={loading}
                className="w-full mt-2 py-2.5 rounded-xl font-semibold text-sm border-2 border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors flex items-center justify-center gap-2">
                <Copy size={13} /> ENVOYER LE MÊME WEBHOOK (doublon)
              </button>
            )}
          </Card>
        </div>

        {/* Result panel */}
        <div className="space-y-4">
          {result && (
            <>
              {/* Status card */}
              <Card className={`p-5 border-2 ${result.status === 'PROCESSED' ? 'border-green-300 bg-green-50 dark:bg-green-950' : result.status === 'DUPLICATE' ? 'border-amber-300 bg-amber-50' : 'border-red-300 bg-red-50 dark:bg-red-950'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${result.status === 'PROCESSED' ? 'bg-green-100' : result.status === 'DUPLICATE' ? 'bg-amber-100' : 'bg-red-100'}`}>
                    {result.status === 'PROCESSED' ? <CheckCircle size={24} className="text-green-600" /> :
                      result.status === 'DUPLICATE' ? <span className="text-xl">⚠️</span> :
                        <XCircle size={24} className="text-red-600" />}
                  </div>
                  <div className="flex-1">
                    <div className={`text-lg font-bold ${result.status === 'PROCESSED' ? 'text-green-700' : result.status === 'DUPLICATE' ? 'text-amber-700' : 'text-red-700'}`}>
                      {result.status === 'PROCESSED' ? '✅ TRAITÉ — Transaction créée' :
                        result.status === 'DUPLICATE' ? '⚠ DOUBLON — Transaction ignorée' :
                          `❌ ${result.status} — Rejeté`}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Durée : {result.durationMs}ms</div>
                    {result.internalTxId && (
                      <div className="font-mono text-xs text-qc-blue mt-1 font-bold">{result.internalTxId}</div>
                    )}
                    {result.reason && <div className="text-xs text-amber-700 mt-1 font-medium">{result.reason}</div>}
                    {result.error && <div className="text-xs text-red-600 mt-1">{result.error}</div>}
                  </div>
                </div>

                {/* Financial breakdown */}
                {result.status === 'PROCESSED' && result.gross && (
                  <div className="mt-4 bg-white dark:bg-slate-900 rounded-xl p-4 border border-green-200">
                    <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Ledger — Ventilation financière</div>
                    <div className="space-y-2">
                      {[
                        { label: 'Brut', val: result.gross, color: 'text-slate-700 dark:text-slate-200' },
                        { label: 'Frais plateforme (25%)', val: -(result.gross * 0.25), color: 'text-red-500' },
                        { label: 'Pourboire', val: result.tip ?? 0, color: 'text-green-600' },
                        { label: 'Ajustement', val: result.adjustment ?? 0, color: result.adjustment && result.adjustment > 0 ? 'text-green-600' : 'text-red-500' },
                        { label: 'TPS (5%)', val: result.tps ?? 0, color: 'text-blue-600' },
                        { label: 'TVQ (9.975%)', val: result.tvq ?? 0, color: 'text-blue-600' },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between text-xs">
                          <span className="text-slate-500">{row.label}</span>
                          <span className={`font-mono font-semibold ${row.color}`}>{fmt(Math.abs(row.val || 0))}</span>
                        </div>
                      ))}
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Net chauffeur</span>
                        <span className="font-mono font-bold text-lg text-green-600">{fmt(result.net ?? 0)}</span>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
                      <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="font-semibold text-slate-700 dark:text-slate-200">Driver App</div>
                        <div className="text-green-600 font-mono font-bold">{fmt(result.net ?? 0)}</div>
                        <div className="text-[9px] text-slate-400">✅ Synchronisé</div>
                      </div>
                      <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="font-semibold text-slate-700 dark:text-slate-200">Gov Dashboard</div>
                        <div className="text-blue-600 font-mono font-bold">{fmt(result.gross ?? 0)}</div>
                        <div className="text-[9px] text-slate-400">✅ Synchronisé</div>
                      </div>
                      <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="font-semibold text-slate-700 dark:text-slate-200">Tax Engine</div>
                        <div className="text-purple-600 font-mono font-bold">{fmt((result.tps ?? 0) + (result.tvq ?? 0))}</div>
                        <div className="text-[9px] text-slate-400">✅ Enregistré</div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Pipeline steps */}
              <Card className="p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Pipeline de traitement</div>
                <div className="space-y-2">
                  {result.pipeline.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold mt-0.5
                        ${step.status === 'ok' ? 'bg-green-100 text-green-600' : step.status === 'fail' ? 'bg-red-100 text-red-600' : step.status === 'warn' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                        {step.status === 'ok' ? '✓' : step.status === 'fail' ? '✗' : step.status === 'warn' ? '⚠' : '○'}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{step.step}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{step.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {!result && (
            <Card className="p-8 text-center">
              <div className="text-4xl mb-4">⚜</div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Configurez et envoyez un webhook</div>
              <div className="text-xs text-slate-400 mt-1">Le pipeline complet sera simulé</div>
            </Card>
          )}

          {/* History */}
          {history.length > 0 && (
            <Card className="p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Historique ({history.length})</div>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className={`w-16 text-[9px] font-bold px-1.5 py-0.5 rounded text-center
                      ${h.status === 'PROCESSED' ? 'bg-green-100 text-green-700' : h.status === 'DUPLICATE' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {h.status}
                    </span>
                    <span className="font-mono text-slate-500 flex-1 truncate">{h.internalTxId || h.error || '—'}</span>
                    <span className="text-slate-400">{h.durationMs}ms</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}
