'use client'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import {
  mockTaxProfile, mockTaxRegistrations, mockTaxPeriods, mockTaxReports,
  mockAnomalies, mockAnnualSummary, mockSubmissions, mockTaxDeadlines,
  mockProviderTaxSummaries, mockMileageRecord,
  JURISDICTION_CONFIG, ACTIVE_TAX_RULE_VERSIONS,
  PERIOD_STATUS_CONF, REPORT_STATUS_CONF, SUBMISSION_STATUS_CONF,
  calculateTaxFromRules, fmt,
} from '@/lib/engines/tax.engine'
import { useState } from 'react'
import { AlertCircle, CheckCircle, Lock, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function TaxPage() {
  const [tab, setTab] = useState<'overview' | 'periods' | 'providers' | 'mileage' | 'deadlines'>('overview')
  const summary = mockAnnualSummary
  const jConf = JURISDICTION_CONFIG[mockTaxProfile.jurisdiction]
  const pendingAnomaly = mockAnomalies.filter(a => a.status === 'OPEN').length

  return (
    <AppShell>
      <PageHeader title="Centre fiscal" subtitle="Revenus · TPS/TVQ · Rapports · Soumissions" />
      <div className="px-4">
        {/* Critical disclaimer */}
        <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-5">
          <AlertCircle size={13} className="text-amber-400 mt-0.5 shrink-0"/>
          <p className="text-xs text-amber-200">
            <strong>Taximètre.GOV prépare les données fiscales.</strong> Taux non hardcodés — chargés depuis configuration. Soumission via <strong>MANUAL_EXPORT</strong> (aucune API gouvernementale officielle disponible).
          </p>
        </div>

        {/* Annual summary hero */}
        <div className="bg-gradient-to-br from-qc-blue/20 to-slate-900 rounded-3xl border border-qc-blue/30 p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] text-slate-400">{jConf?.label ?? mockTaxProfile.jurisdiction} · {summary.year}</div>
              <div className="text-xs text-slate-400 mt-0.5">Règles: {ACTIVE_TAX_RULE_VERSIONS[0]?.version ?? '—'}</div>
            </div>
            <div className={`text-[9px] font-bold px-2 py-1 rounded-full ${mockTaxProfile.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {mockTaxProfile.status}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-[10px] text-slate-400">Revenus bruts</div>
              <div className="text-3xl font-black text-white tabular-nums">{fmt(summary.totalGrossRevenue)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Revenus taxables</div>
              <div className="text-3xl font-black text-qc-blue-light tabular-nums">{fmt(summary.totalTaxableRevenue)}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            {[
              { label:'TPS est.', val:summary.tpsCollected, color:'text-orange-400' },
              { label:'TVQ est.', val:summary.tvqCollected, color:'text-orange-400' },
              { label:'Remboursements', val:-summary.totalRefunds, color:'text-red-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-900/60 rounded-2xl p-2 text-center">
                <div className={`font-black tabular-nums ${s.color}`}>{fmt(Math.abs(s.val))}</div>
                <div className="text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="text-[8px] text-amber-400 mt-2 text-center">⚠ ESTIMATION — pas une déclaration officielle · taux configurés, jamais hardcodés</div>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {[
            { href:'/tax/estimate', icon:'🧮', label:'Calculer', desc:'Estimation live' },
            { href:'/tax/reports', icon:'📊', label:'Rapports', desc:`${mockTaxReports.length} rapports` },
            { href:'/tax/periods', icon:'📅', label:'Périodes', desc:`${mockTaxPeriods.filter(p=>p.status==='OPEN').length} ouvertes` },
            { href:'/documents', icon:'📄', label:'Documents', desc:'Reçus & exports' },
          ].map(item => (
            <Link key={item.href} href={item.href}>
              <div className="driver-card p-3.5 flex items-center gap-3 hover:border-qc-blue/40 transition-all">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <div className="font-bold text-white text-sm">{item.label}</div>
                  <div className="text-[10px] text-slate-500">{item.desc}</div>
                </div>
                <ChevronRight size={12} className="text-slate-600 ml-auto"/>
              </div>
            </Link>
          ))}
        </div>

        {/* Anomalies alert */}
        {pendingAnomaly > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 mb-5">
            <AlertCircle size={18} className="text-red-400 shrink-0"/>
            <div className="flex-1">
              <div className="font-bold text-white text-sm">{pendingAnomaly} anomalie(s) en attente</div>
              <div className="text-[10px] text-slate-400">Anomalie ≠ fraude — révision manuelle requise</div>
            </div>
            <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">REVIEW</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {[['overview','Résumé'],['periods','Périodes'],['providers','Fournisseurs'],['mileage','Km'],['deadlines','Échéances']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${tab===k?'bg-qc-blue text-white':'bg-slate-800 text-slate-400'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW ────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-4 mb-6">
            {/* Tax registrations */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">Inscriptions fiscales</div>
              {mockTaxRegistrations.map(reg => (
                <div key={reg.id} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                  <div className="flex-1">
                    <div className="font-semibold text-white text-xs">{reg.taxType}</div>
                    <div className="font-mono text-[10px] text-qc-blue-light">{reg.maskedReference}</div>
                    <div className="text-[9px] text-slate-500">{reg.jurisdiction}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[9px] font-bold ${reg.status === 'REGISTERED' ? 'text-green-400' : 'text-amber-400'}`}>{reg.status}</div>
                    <div className={`text-[9px] ${reg.verificationStatus === 'VERIFIED' ? 'text-green-400' : 'text-amber-400'}`}>{reg.verificationStatus}</div>
                  </div>
                </div>
              ))}
            </Card>

            {/* Tax rules in use */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">Règles fiscales actives</div>
              <div className="text-[9px] text-amber-400 mb-2">Taux chargés depuis configuration — jamais hardcodés</div>
              {ACTIVE_TAX_RULE_VERSIONS.map(rv => (
                <div key={rv.versionId} className="flex items-start gap-2 py-2 border-b border-slate-800 last:border-0">
                  <div className="flex-1">
                    <div className="font-semibold text-white text-xs">{rv.taxType} — {rv.jurisdiction}</div>
                    <div className="text-[10px] text-slate-500">v{rv.version} · En vigueur depuis {rv.effectiveFrom}</div>
                    <div className="text-[9px] text-slate-600">{rv.sourceRef}</div>
                  </div>
                  <div className="font-mono font-black text-qc-blue-light text-sm">{((rv.rules[0]?.rate ?? 0) * 100).toFixed(3)}%</div>
                </div>
              ))}
              <div className="text-[9px] text-slate-600 mt-2">Transaction historique = règle applicable au moment → jamais recalculée avec nouvelle version</div>
            </Card>

            {/* Submissions */}
            <Card>
              <div className="font-semibold text-white text-sm mb-3">Soumissions</div>
              {mockSubmissions.map(sub => {
                const conf = SUBMISSION_STATUS_CONF[sub.status]
                return (
                  <div key={sub.submissionId} className="flex items-center gap-2 py-2 border-b border-slate-800 last:border-0">
                    <div className="flex-1">
                      <div className="text-xs text-slate-300">{sub.method} · {sub.reportId}</div>
                      <div className="text-[9px] text-slate-500">{sub.jurisdiction}</div>
                    </div>
                    <span className={`text-[9px] font-bold ${conf.color}`}>{conf.label}</span>
                  </div>
                )
              })}
              <div className="text-[9px] text-amber-400 mt-2">🔒 MANUAL_EXPORT — aucune API gouvernementale officielle connectée</div>
            </Card>
          </div>
        )}

        {/* ─── PERIODS ─────────────────────────────── */}
        {tab === 'periods' && (
          <div className="space-y-3 mb-6">
            {mockTaxPeriods.map(period => {
              const conf = PERIOD_STATUS_CONF[period.status]
              return (
                <div key={period.periodId} className={`driver-card p-4 border ${period.status === 'OPEN' ? 'border-qc-blue/30' : period.status === 'FINALIZED' ? 'border-green-500/20' : ''}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{conf.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold text-white">{period.periodId}</div>
                      <div className="text-[10px] text-slate-500">{period.taxTypes.join("·")} · {period.jurisdiction}</div>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 ${conf.color}`}>{conf.label}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-[9px]">
                    {[
                      { label:'Bruts', val:fmt(0) },
                      { label:'Taxables', val:fmt(0) },
                      { label:'Taxe est.', val:fmt(0), color:'text-orange-400' },
                      { label:'Net dû est.', val:fmt(0), color:'text-blue-400' },
                    ].map(s => (
                      <div key={s.label} className="bg-slate-800/50 rounded-lg p-1.5 text-center">
                        <div className={`font-bold tabular-nums ${s.color ?? 'text-white'}`}>{s.val}</div>
                        <div className="text-slate-600">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ─── PROVIDERS ───────────────────────────── */}
        {tab === 'providers' && (
          <div className="space-y-4 mb-6">
            <div className="text-[10px] text-slate-500 mb-2">Montants bruts conservés · Taxabilité déterminée par Tax Engine · Estimation uniquement</div>
            {mockProviderTaxSummaries.map(ps => (
              <Card key={ps.provider}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{ps.provider === 'Uber' ? '⬛' : ps.provider === 'DoorDash' ? '🔴' : '🚕'}</span>
                  <span className="font-bold text-white">{ps.provider}</span>
                  <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full ml-auto font-bold">ESTIMATION</span>
                </div>
                <div className="space-y-1">
                  {[
                    { label:'Revenus bruts', val:ps.grossAmount, color:'text-white' },
                    { label:'Frais fournisseur', val:-ps.fees, color:'text-red-400' },
                    { label:'Ajustements', val:ps.adjustments, color:'text-green-400' },
                    { label:'Montant imposable est.', val:ps.taxableAmount, color:'text-blue-400' },
                    { label:'Taxe estimée', val:ps.estimatedTax, color:'text-orange-400' },
                  ].map(s => (
                    <div key={s.label} className="flex justify-between py-1 border-b border-slate-800 last:border-0 text-xs">
                      <span className="text-slate-400">{s.label}</span>
                      <span className={`font-bold tabular-nums ${s.color}`}>{fmt(Math.abs(s.val))}{s.val < 0 ? ' (-)' : ''}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[9px] text-slate-600 mt-2 italic">{ps.note}</div>
              </Card>
            ))}
          </div>
        )}

        {/* ─── MILEAGE ─────────────────────────────── */}
        {tab === 'mileage' && (
          <div className="space-y-4 mb-6">
            <Card>
              <div className="font-semibold text-white text-sm mb-3">🚘 Kilométrage — {mockMileageRecord.date}</div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-800/50 rounded-2xl p-3 text-center">
                  <div className="text-3xl font-black text-white tabular-nums">{mockMileageRecord.businessKm.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500">km affaires</div>
                </div>
                <div className="bg-slate-800/50 rounded-2xl p-3 text-center">
                  <div className="text-3xl font-black text-slate-500 tabular-nums">{mockMileageRecord.personalKm.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500">km personnel</div>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label:'Total véhicule', val:mockMileageRecord.totalKm, color:'text-white' },
                  { label:'🚕 Taxi', val:mockMileageRecord.taxiKm, color:'text-qc-blue-light' },
                  { label:'🚗 Rideshare', val:mockMileageRecord.rideshareKm, color:'text-slate-300' },
                  { label:'📦 Livraison', val:mockMileageRecord.deliveryKm, color:'text-slate-300' },
                  { label:'Usage affaires', val:null, pct:mockMileageRecord.businessPct, color:'text-blue-400' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between py-1 border-b border-slate-800 last:border-0 text-xs">
                    <span className="text-slate-400">{s.label}</span>
                    <span className={`font-bold tabular-nums ${s.color}`}>
                      {s.val !== null ? `${s.val.toLocaleString()} km` : `${s.pct}%`}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-[9px] text-slate-500 mt-2">Source: {mockMileageRecord.source} · Répartition affaires ≠ déductibilité (Tax Engine décide)</div>
              {mockMileageRecord.note && <div className="text-[9px] text-blue-300 mt-1">{mockMileageRecord.note}</div>}
            </Card>
          </div>
        )}

        {/* ─── DEADLINES ───────────────────────────── */}
        {tab === 'deadlines' && (
          <div className="space-y-3 mb-6">
            <div className="text-[10px] text-slate-500 mb-2">Échéances selon règles officielles · Jamais inventées</div>
            {mockTaxDeadlines.map(dl => (
              <div key={dl.id} className={`driver-card p-4 border ${dl.status === 'OVERDUE' ? 'border-red-500/30' : dl.status === 'DUE_SOON' ? 'border-amber-500/30' : dl.status === 'FILED' ? 'border-green-500/20' : 'border-slate-800'}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{dl.status === 'FILED' ? '✅' : dl.status === 'OVERDUE' ? '❌' : dl.status === 'DUE_SOON' ? '⚠️' : '📅'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-bold text-white">{dl.taxType} — {dl.period}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${dl.status === 'FILED' ? 'bg-green-500/20 text-green-400' : dl.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{dl.status}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{new Date(dl.dueDate).toLocaleDateString('fr-CA')} · {dl.jurisdiction}</div>
                    <div className="text-[9px] text-slate-600 mt-0.5">{dl.sourceNote}</div>
                    {dl.daysRemaining > 0 && <div className={`text-[9px] mt-0.5 ${dl.daysRemaining < 30 ? 'text-amber-400' : 'text-slate-500'}`}>{dl.daysRemaining} jours restants</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
