'use client'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader, Card, KpiCard, StatusBadge } from '@/components/ui'
import { mockPlatformHealth, gatewayKpis, reconciliationData } from '@/data/gateway.mock'

import { Wifi, WifiOff, AlertCircle, CheckCircle, RefreshCw, Activity, Zap } from 'lucide-react'

const healthColors = {
  HEALTHY: 'text-green-600 bg-green-50 border-green-200',
  DEGRADED: 'text-amber-600 bg-amber-50 border-amber-200',
  DOWN: 'text-red-600 bg-red-50 border-red-200',
  NOT_CONFIGURED: 'text-slate-400 bg-slate-50 border-slate-200',
}
const healthDots = {
  HEALTHY: 'bg-green-500 animate-pulse',
  DEGRADED: 'bg-amber-500 animate-pulse',
  DOWN: 'bg-red-500',
  NOT_CONFIGURED: 'bg-slate-300',
}
const healthIcons = { HEALTHY: '🟢', DEGRADED: '🟡', DOWN: '🔴', NOT_CONFIGURED: '⚪' }

export default function PlatformOperationsPage() {
  const fmt = (n: number) => n.toLocaleString('fr-CA')

  return (
    <AppShell>
      <PageHeader
        title="Opérations plateformes"
        subtitle="Revenue Gateway · Webhook Engine · Anti-doublon · Réconciliation"
      />

      {/* Architecture banner */}
      <Card className="mb-5 p-4">
        <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-widest">Architecture Universal Revenue Gateway</div>
        <div className="flex items-center gap-1 flex-wrap text-[10px] font-mono">
          {['Uber/Lyft/DoorDash/etc.','→','Platform Adapter','→','Webhook Gateway','→','Normalization Engine','→','UNIQUE check','→','Universal Ledger','→','Tax Engine','→','Driver App + Gov Dashboard'].map((s, i) => (
            <span key={i} className={s === '→' ? 'text-slate-300' : 'px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}>{s}</span>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
          <AlertCircle size={13} className="text-amber-600 shrink-0" />
          <span className="text-[10px] text-amber-700">
            <strong>PILOTE — SIMULATION UNIQUEMENT.</strong> Aucune API commerciale réelle connectée. Les intégrations officielles nécessitent des accords avec chaque fournisseur.
          </span>
        </div>
      </Card>

      {/* Gateway KPIs */}
      <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Aujourd'hui — Revenue Gateway</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Comptes connectés" value={fmt(gatewayKpis.totalConnectedAccounts)} icon={<Wifi size={16} />} color="blue" />
        <KpiCard label="Événements webhook" value={fmt(gatewayKpis.webhookEventsToday)} icon={<Activity size={16} />} color="green" />
        <KpiCard label="Doublons bloqués" value={fmt(gatewayKpis.duplicatesBlocked)} icon={<CheckCircle size={16} />} color="purple" sub="UNIQUE constraint actif" />
        <KpiCard label="Comptes non-associés" value={fmt(gatewayKpis.unmatchedAccounts)} icon={<AlertCircle size={16} />} color="orange" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Tx reçues" value={fmt(gatewayKpis.transactionsReceived)} color="green" />
        <KpiCard label="Événements échoués" value={fmt(gatewayKpis.failedEventsToday)} color="red" />
        <KpiCard label="File de retry" value={fmt(gatewayKpis.retryQueue)} color="orange" />
        <KpiCard label="Dead Letter" value={fmt(gatewayKpis.deadLetterQueue)} color="red" sub="Échecs définitifs" />
      </div>

      {/* Platform health grid */}
      <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Santé des plateformes</div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {mockPlatformHealth.map(p => {
          const overallStatus = p.webhookStatus === 'DOWN' ? 'DOWN' : p.apiStatus === 'HEALTHY' ? 'HEALTHY' : p.webhookStatus === 'DEGRADED' ? 'DEGRADED' : 'NOT_CONFIGURED'
          return (
            <Card key={p.provider} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                    style={{ background: p.color === '#000' ? '#1a1a1a' : p.color }}>
                    {p.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{p.name}</div>
                    <div className="text-[9px] text-slate-400">MOCK — API non configurée</div>
                  </div>
                </div>
                <span className="text-base">{healthIcons[overallStatus]}</span>
              </div>

              {/* Status rows */}
              <div className="space-y-1.5 mb-3">
                {[['API', p.apiStatus], ['OAuth', p.oauthStatus], ['Webhook', p.webhookStatus]].map(([label, status]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{label}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${healthColors[status as keyof typeof healthColors]}`}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-center">
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{fmt(p.connectedAccounts)}</div>
                  <div className="text-[9px] text-slate-400">Comptes</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{fmt(p.todayEvents)}</div>
                  <div className="text-[9px] text-slate-400">Événements</div>
                </div>
                <div className="text-center">
                  <div className={`text-sm font-bold ${p.todayFailed > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(p.todayFailed)}</div>
                  <div className="text-[9px] text-slate-400">Échoués</div>
                </div>
                <div className="text-center">
                  <div className={`text-sm font-bold ${p.todayDuplicates > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{fmt(p.todayDuplicates)}</div>
                  <div className="text-[9px] text-slate-400">Doublons</div>
                </div>
              </div>

              {/* Error rate */}
              {p.errorRate > 0 && (
                <div className={`mt-2 text-center text-[9px] font-bold px-2 py-1 rounded ${p.errorRate > 5 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                  Taux d'erreur : {p.errorRate}%
                </div>
              )}

              <button className="w-full mt-3 py-1.5 text-[10px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5">
                <RefreshCw size={10} /> Sync manuelle
              </button>
            </Card>
          )
        })}
      </div>

      {/* Reconciliation */}
      <Card className="mb-6 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">Réconciliation</div>
            <div className="text-xs text-slate-400">Dernier passage : {new Date(reconciliationData.lastRun).toLocaleString('fr-CA')}</div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-qc-blue text-white hover:bg-blue-700 transition-colors">
            <RefreshCw size={12} /> Lancer réconciliation
          </button>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: 'Total', val: reconciliationData.total, color: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-50 dark:bg-slate-800' },
            { label: 'MATCH', val: reconciliationData.matched, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' },
            { label: 'MISSING', val: reconciliationData.missing, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950' },
            { label: 'MONTANT ≠', val: reconciliationData.amountMismatch, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950' },
            { label: 'STATUT ≠', val: reconciliationData.statusMismatch, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'NON RÉSOLU', val: reconciliationData.unresolved, color: 'text-red-700', bg: 'bg-red-50' },
          ].map(item => (
            <div key={item.label} className={`p-3 rounded-lg ${item.bg} text-center`}>
              <div className={`text-2xl font-bold ${item.color}`}>{item.val}</div>
              <div className="text-[9px] font-semibold text-slate-500 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  )
}
