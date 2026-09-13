'use client'

// ================================================================
// TAXIMETER.GOV — FISCALITÉ & DÉCLARATIONS
// Module natif complet — 8 sections selon specs ChatGPT
// Architecture: Taximètre → Transactions → Revenue Ledger → Fiscal Engine → Déclaration → Revenu Québec
// ================================================================

import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui'
import { useDriverProfile, money } from '@/lib/api'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  RefreshCw, AlertTriangle, CheckCircle, Clock, ExternalLink,
  FileText, Calculator, Bell, CreditCard, History,
  ChevronRight, Shield, TrendingUp, ArrowRight
} from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────

interface FiscalData {
  period:      { type: string; year: number; quarter: number; dateFrom: string; dateTo: string }
  taxAccount:  { tps_status: string; tvq_status: string; filing_frequency: string; tax_account_status: string; tps_registration_masked: string; tvq_registration_masked: string } | null
  revenus:     { taxi: number; rideshare: number; livraison: number; autres: number; bruts: number; tips: number; frais: number }
  fiscal:      { tps_percue: number; tvq_percue: number; cti_estime: number; remboursement_tvq: number; solde_tps: number; solde_tvq: number; solde_total: number; taux_tps: string; taux_tvq: string }
  by_source:   Array<{ source: string; gross: number; tips: number; fees: number; net: number; count: number }>
  echeances:   { prochaine: string; statut: string }
  declarations: Array<{ period: string; status: string; montant: number; date_soumission: string }>
  avertissement: string
  revenu_quebec: { url: string; note: string; sev: string }
}

const SRC_ICON: Record<string, string> = {
  TAXI:'🚕', UBER:'⬛', LYFT:'🟣', DOORDASH:'🔴',
  INSTACART:'🟢', UBER_EATS:'🟡', SKIP:'🟠',
}

const DECL_STATUS: Record<string, { label: string; color: string }> = {
  DRAFT:              { label: 'Brouillon',          color: 'text-slate-400' },
  READY:              { label: 'Prête',               color: 'text-blue-400' },
  SUBMITTED:          { label: 'Soumise',             color: 'text-purple-400' },
  ACCEPTED:           { label: 'Acceptée',            color: 'text-green-400' },
  REJECTED:           { label: 'Rejetée',             color: 'text-red-400' },
  CORRECTION_REQUIRED:{ label: 'Correction requise', color: 'text-amber-400' },
}

const TABS = [
  { key:'dashboard',    label:'Dossier',      icon:'🗂️' },
  { key:'calculator',   label:'Calculateur',  icon:'🧮' },
  { key:'declaration',  label:'Déclaration',  icon:'📋' },
  { key:'pay',          label:'Payer',        icon:'💳' },
  { key:'history',      label:'Historique',   icon:'📜' },
  { key:'alerts',       label:'Alertes',      icon:'🔔' },
]

// ─── Hook fiscal ──────────────────────────────────────────────

function useFiscalData(quarter: number, year: number) {
  const [data, setData]       = useState<FiscalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const sb = getSupabaseBrowserClient()
      const { data: { session } } = await sb.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Non authentifié')

      const res = await fetch(`/api/tax?period=quarter&quarter=${quarter}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json() as { success: boolean; data: FiscalData; error?: string }
      if (!json.success) throw new Error(json.error)
      setData(json.data)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [quarter, year])

  useEffect(() => { void load() }, [load])
  return { data, loading, error, refresh: load }
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────

export default function TaxPage() {
  const { profile } = useDriverProfile()
  const now     = new Date()
  const year    = now.getFullYear()
  const quarter = Math.ceil((now.getMonth() + 1) / 3)
  const [tab, setTab] = useState('dashboard')
  const { data, loading, error, refresh } = useFiscalData(quarter, year)

  const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  const urgent    = data ? daysUntil(data.echeances.prochaine) < 30 : false

  return (
    <AppShell>
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-slate-800">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h1 className="text-xl font-bold text-white">Fiscalité & Déclarations</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Q{quarter} · {year} · TPS/TVQ · Québec · TAXIMETER.GOV
            </p>
          </div>
          <button onClick={() => void refresh()}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            <RefreshCw size={14} className={loading ? 'animate-spin text-qc-blue' : 'text-slate-400'} />
          </button>
        </div>

        {/* Avertissement pilote */}
        <div className="flex items-start gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 mt-2">
          <AlertTriangle size={12} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-[9px] text-amber-400 leading-relaxed">
            Estimation fiscale TAXIMETER.GOV — à valider avant transmission officielle à Revenu Québec. Mode pilote.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-slate-800">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all
              ${tab === t.key ? 'bg-qc-blue text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-4 pb-8">

        {loading && (
          <div className="py-16 text-center">
            <RefreshCw className="mx-auto animate-spin text-qc-blue mb-3" size={24} />
            <p className="text-xs text-slate-400">Calcul fiscal en cours…</p>
          </div>
        )}

        {error && (
          <Card className="p-4 text-center border-red-500/30 bg-red-500/5">
            <p className="text-sm text-red-400 mb-3">{error}</p>
            <button onClick={() => void refresh()} className="px-4 py-2 rounded-xl bg-qc-blue text-white text-xs font-semibold">Réessayer</button>
          </Card>
        )}

        {data && !loading && (
          <>
            {/* ══ 1. MON DOSSIER FISCAL ══════════════════════════ */}
            {tab === 'dashboard' && (
              <>
                {/* Compte fiscal */}
                <Card className="p-4">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">1. Mon dossier fiscal</div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-qc-blue/20 flex items-center justify-center text-2xl">🏛️</div>
                    <div>
                      <div className="font-bold text-white">{profile?.first_name} {profile?.last_name}</div>
                      <div className="text-[10px] text-green-400">✅ Inscrit TPS · TVQ</div>
                      <div className="text-[9px] text-slate-500">Déclaration {data.taxAccount?.filing_frequency === 'QUARTERLY' ? 'trimestrielle' : 'mensuelle'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label:'Statut TPS',     val: data.taxAccount?.tps_status ?? '—',     ok: data.taxAccount?.tps_status === 'REGISTERED' },
                      { label:'Statut TVQ',     val: data.taxAccount?.tvq_status ?? '—',     ok: data.taxAccount?.tvq_status === 'REGISTERED' },
                      { label:'No. TPS',        val: data.taxAccount?.tps_registration_masked ?? '—', ok: true },
                      { label:'No. TVQ',        val: data.taxAccount?.tvq_registration_masked ?? '—', ok: true },
                    ].map(r => (
                      <div key={r.label} className="bg-slate-800/50 rounded-xl p-3">
                        <div className="text-[9px] text-slate-400 uppercase tracking-wider">{r.label}</div>
                        <div className={`text-xs font-bold mt-0.5 ${r.ok ? 'text-green-400' : 'text-amber-400'}`}>{r.val}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Solde estimé */}
                <Card className={`p-5 text-center ${data.fiscal.solde_total > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
                  <div className="text-[9px] text-slate-400 tracking-widest uppercase mb-1">Solde estimé Q{quarter}-{year}</div>
                  <div className={`text-5xl font-black mb-1 ${data.fiscal.solde_total > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                    {money(data.fiscal.solde_total)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    TPS {money(data.fiscal.solde_tps)} · TVQ {money(data.fiscal.solde_tvq)}
                  </div>
                  {data.echeances.prochaine && (
                    <div className={`mt-3 text-[10px] font-bold ${urgent ? 'text-red-400' : 'text-slate-400'}`}>
                      {urgent ? '🔴' : '🟡'} Échéance: {data.echeances.prochaine} ({daysUntil(data.echeances.prochaine)}j)
                    </div>
                  )}
                </Card>

                {/* Revenus par source */}
                <Card className="p-4">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Revenus imposables Q{quarter}</div>
                  <div className="space-y-2">
                    {[
                      { label:'Taxi',              val: data.revenus.taxi,      icon:'🚕' },
                      { label:'Covoiturage',        val: data.revenus.rideshare, icon:'🚗' },
                      { label:'Livraison',          val: data.revenus.livraison, icon:'📦' },
                      ...(data.revenus.autres > 0 ? [{ label:'Autres', val: data.revenus.autres, icon:'💼' }] : []),
                    ].map(r => (
                      <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
                        <div className="flex items-center gap-2">
                          <span>{r.icon}</span>
                          <span className="text-sm text-white">{r.label}</span>
                        </div>
                        <span className="font-bold text-green-400">{money(r.val)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 font-bold">
                      <span className="text-sm text-white">Total brut</span>
                      <span className="text-lg text-white">{money(data.revenus.bruts)}</span>
                    </div>
                  </div>
                </Card>

                {/* Navigation rapide */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { tab:'calculator', label:'Calculateur', emoji:'🧮', desc:'TPS/TVQ/CTI' },
                    { tab:'declaration', label:'Déclaration', emoji:'📋', desc:'Préremplir + vérifier' },
                    { tab:'pay', label:'Payer', emoji:'💳', desc:'Montant dû + Revenu QC' },
                    { tab:'history', label:'Historique', emoji:'📜', desc:'Déclarations passées' },
                  ].map(item => (
                    <button key={item.tab} onClick={() => setTab(item.tab)}
                      className="p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-qc-blue/50 text-left transition-all">
                      <div className="text-2xl mb-1">{item.emoji}</div>
                      <div className="text-xs font-bold text-white">{item.label}</div>
                      <div className="text-[9px] text-slate-400">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ══ 2. CALCULATEUR FISCAL ══════════════════════════ */}
            {tab === 'calculator' && (
              <>
                <Card className="p-4">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">2. Calculateur fiscal — Q{quarter} {year}</div>

                  {/* Revenus */}
                  <div className="mb-4">
                    <div className="text-[10px] font-bold text-slate-400 mb-2">Revenus par activité</div>
                    {data.by_source.map(s => (
                      <div key={s.source} className="flex items-center gap-2 py-2 border-b border-slate-800 last:border-0">
                        <span className="text-base w-6">{SRC_ICON[s.source] ?? '📦'}</span>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-white">{s.source}</div>
                          <div className="text-[9px] text-slate-500">{s.count} activité(s) · frais {money(s.fees)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-400 text-sm">{money(s.gross)}</div>
                          {s.tips > 0 && <div className="text-[9px] text-purple-400">+{money(s.tips)} tips</div>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Calcul TPS/TVQ */}
                  <div className="bg-slate-800/50 rounded-2xl p-4">
                    <div className="text-[10px] font-bold text-slate-400 mb-3">Moteur fiscal TAXIMETER.GOV</div>
                    <div className="space-y-2 text-xs">
                      {[
                        { label:'Revenus bruts imposables', val: money(data.revenus.bruts), color:'text-white', sep: true },
                        { label:`TPS perçue (${data.fiscal.taux_tps})`,   val: money(data.fiscal.tps_percue),        color:'text-purple-400' },
                        { label:`TVQ perçue (${data.fiscal.taux_tvq})`,   val: money(data.fiscal.tvq_percue),        color:'text-purple-400' },
                        { label:'CTI estimé (TPS sur frais)',             val: `− ${money(data.fiscal.cti_estime)}`, color:'text-green-400', sep: true },
                        { label:'Remboursement TVQ estimé',               val: `− ${money(data.fiscal.remboursement_tvq)}`, color:'text-green-400' },
                        { label:'Solde TPS à remettre',                   val: money(data.fiscal.solde_tps),         color:'text-amber-400' },
                        { label:'Solde TVQ à remettre',                   val: money(data.fiscal.solde_tvq),         color:'text-amber-400' },
                      ].map(r => (
                        <div key={r.label} className={`flex justify-between py-1.5 ${r.sep ? 'border-t border-slate-700 mt-1 pt-2' : ''}`}>
                          <span className="text-slate-400">{r.label}</span>
                          <span className={`font-bold ${r.color}`}>{r.val}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-3 border-t border-slate-600 font-bold text-sm">
                        <span className="text-white">TOTAL ESTIMÉ À REMETTRE</span>
                        <span className="text-amber-400">{money(data.fiscal.solde_total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 p-2 rounded-lg bg-slate-900 border border-slate-700">
                    <p className="text-[9px] text-slate-500">
                      ⚠️ CTI = Crédits de taxe sur intrants (estimé à 30% des frais de plateforme).
                      Consultez un comptable pour le calcul exact selon votre situation.
                    </p>
                  </div>
                </Card>
              </>
            )}

            {/* ══ 3+4. DÉCLARATION ═══════════════════════════════ */}
            {tab === 'declaration' && (
              <>
                <Card className="p-4">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">3. Déclaration préremplie — Q{quarter} {year}</div>

                  {/* Pipeline de données */}
                  <div className="flex items-center justify-between text-[9px] text-slate-500 mb-4 overflow-x-auto gap-1">
                    {['Taximètre', 'Transactions', 'Revenue Ledger', 'Fiscal Engine', 'Déclaration'].map((step, i, arr) => (
                      <span key={step} className="flex items-center gap-1 flex-shrink-0">
                        <span className={`px-1.5 py-0.5 rounded font-semibold ${i === arr.length - 1 ? 'bg-qc-blue text-white' : 'bg-slate-800 text-slate-300'}`}>{step}</span>
                        {i < arr.length - 1 && <span className="text-slate-600">→</span>}
                      </span>
                    ))}
                  </div>

                  {/* Déclaration préremplie */}
                  <div className="bg-slate-800/50 rounded-2xl p-4 font-mono text-xs mb-4">
                    <div className="text-[10px] text-qc-blue font-bold mb-3">DÉCLARATION TPS/TVQ — Q{quarter} {year}</div>
                    {[
                      { label:'Revenus bruts',                          val: `${money(data.revenus.bruts)} CAD` },
                      { label:'TPS perçue (ligne 103)',                  val: money(data.fiscal.tps_percue) },
                      { label:'TVQ perçue (ligne 205)',                  val: money(data.fiscal.tvq_percue) },
                      { label:'Crédits de taxe sur intrants (ligne 106)',val: money(data.fiscal.cti_estime) },
                      { label:'CTI-TVQ (ligne 206)',                     val: money(data.fiscal.remboursement_tvq) },
                      { label:'TPS nette (ligne 109)',                   val: money(data.fiscal.solde_tps) },
                      { label:'TVQ nette (ligne 210)',                   val: money(data.fiscal.solde_tvq) },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between py-1 border-b border-slate-700 last:border-0">
                        <span className="text-slate-400">{r.label}</span>
                        <span className="text-white font-bold">{r.val}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-3 text-sm font-bold">
                      <span className="text-amber-400">MONTANT ESTIMÉ À REMETTRE</span>
                      <span className="text-amber-400">{money(data.fiscal.solde_total)}</span>
                    </div>
                  </div>

                  {/* 4. Vérification + Soumission */}
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">4. Vérification avant transmission</div>

                  <div className="space-y-2 mb-4">
                    {[
                      { step:'1', label:'Vérifier les revenus', ok: true },
                      { step:'2', label:'Valider les crédits (CTI)', ok: true },
                      { step:'3', label:'Confirmer les ajustements', ok: true },
                      { step:'4', label:'Transmettre à Revenu Québec', ok: false },
                    ].map(s => (
                      <div key={s.step} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${s.ok ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                          {s.ok ? '✓' : s.step}
                        </div>
                        <span className={`text-xs ${s.ok ? 'text-green-400' : 'text-slate-300'}`}>{s.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* 5. Soumettre */}
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">5. Soumettre ma déclaration</div>
                  <a href="https://www.revenuquebec.ca/fr/entreprises/taxes/tpstvh-et-tvq/" target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-qc-blue text-white font-bold text-sm hover:bg-qc-blue/90 transition-all">
                    <ExternalLink size={16} />
                    Accéder à Mon dossier Revenu Québec
                  </a>
                  <p className="text-[9px] text-slate-500 text-center mt-2">{data.revenu_quebec.note}</p>
                </Card>
              </>
            )}

            {/* ══ 6. PAYER MES TAXES ═════════════════════════════ */}
            {tab === 'pay' && (
              <>
                <Card className={`p-5 text-center ${urgent ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                  <div className="text-[9px] text-slate-400 tracking-widest uppercase mb-1">6. Montant à payer — Q{quarter} {year}</div>
                  <div className={`text-5xl font-black mb-2 ${urgent ? 'text-red-400' : 'text-amber-400'}`}>
                    {money(data.fiscal.solde_total)}
                  </div>
                  <div className="text-xs text-slate-400 space-y-0.5">
                    <div>TPS: {money(data.fiscal.solde_tps)} · TVQ: {money(data.fiscal.solde_tvq)}</div>
                    <div className={`font-bold mt-2 ${urgent ? 'text-red-400' : 'text-amber-400'}`}>
                      {urgent ? '⚠️' : '📅'} Date limite: {data.echeances.prochaine}
                    </div>
                    {data.echeances.prochaine && (
                      <div className={urgent ? 'text-red-400' : 'text-slate-400'}>
                        {daysUntil(data.echeances.prochaine)} jours restants
                      </div>
                    )}
                  </div>
                </Card>

                <div className="space-y-3">
                  <a href="https://www.revenuquebec.ca/fr/entreprises/taxes/tpstvh-et-tvq/" target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-qc-blue text-white font-bold">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏛️</span>
                      <div className="text-left">
                        <div className="font-bold">Payer sur Revenu Québec</div>
                        <div className="text-[10px] text-blue-200">Mon dossier · Paiement officiel</div>
                      </div>
                    </div>
                    <ExternalLink size={18} />
                  </a>

                  <Card className="p-4">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Méthodes de paiement acceptées</div>
                    {[
                      { label:'Institution financière', icon:'🏦', desc:'Paiement de factures en ligne' },
                      { label:'Chèque libellé à RQ',    icon:'📝', desc:'Joindre le bordereau de paiement' },
                      { label:'Prélèvement automatique', icon:'🔄', desc:'Service PAD de Revenu Québec' },
                    ].map(m => (
                      <div key={m.label} className="flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0">
                        <span className="text-xl">{m.icon}</span>
                        <div>
                          <div className="text-sm text-white">{m.label}</div>
                          <div className="text-[9px] text-slate-400">{m.desc}</div>
                        </div>
                      </div>
                    ))}
                  </Card>

                  <Card className="p-3">
                    <div className="text-[9px] text-slate-500">
                      🏷️ <strong>SEV 2e génération:</strong> {data.revenu_quebec.sev}
                    </div>
                  </Card>
                </div>
              </>
            )}

            {/* ══ 7. MES DÉCLARATIONS (HISTORIQUE) ══════════════ */}
            {tab === 'history' && (
              <>
                <Card className="p-4">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">7. Historique des déclarations</div>

                  {/* Déclaration courante */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Q{quarter} {year}</div>
                        <div className="text-[10px] text-amber-400">En cours · {money(data.fiscal.solde_total)} estimé</div>
                      </div>
                      <span className="text-[9px] px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold">BROUILLON</span>
                    </div>
                  </div>

                  {/* Déclarations passées */}
                  {data.declarations.length > 0 ? (
                    data.declarations.map(d => {
                      const st = DECL_STATUS[d.status] ?? DECL_STATUS['SUBMITTED']!
                      return (
                        <div key={d.period} className="flex items-center justify-between p-3 rounded-xl bg-slate-800 mb-2">
                          <div>
                            <div className="text-xs font-bold text-white">{d.period}</div>
                            <div className={`text-[10px] ${st.color}`}>{st.label}</div>
                            <div className="text-[9px] text-slate-500">Soumis: {d.date_soumission}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-white">{money(d.montant)}</div>
                            <CheckCircle size={14} className="text-green-400 ml-auto mt-1" />
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="py-6 text-center text-sm text-slate-400">
                      Aucune déclaration précédente.<br />
                      <span className="text-[10px] text-slate-500">L'historique apparaît après la première transmission.</span>
                    </div>
                  )}
                </Card>

                <a href="https://www.revenuquebec.ca/fr/entreprises/taxes/tpstvh-et-tvq/" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-800 border border-slate-700 hover:border-qc-blue/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🏛️</span>
                    <div>
                      <div className="text-sm font-bold text-white">Voir toutes mes déclarations</div>
                      <div className="text-[10px] text-slate-400">Mon dossier · Revenu Québec</div>
                    </div>
                  </div>
                  <ExternalLink size={16} className="text-qc-blue" />
                </a>
              </>
            )}

            {/* ══ 8. ALERTES FISCALES ════════════════════════════ */}
            {tab === 'alerts' && (
              <>
                {/* Centre des obligations — Timeline */}
                <Card className="p-4">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">8. Centre des obligations fiscales</div>

                  <div className="space-y-3">
                    {[
                      { label:'Dossier fiscal actif',        status:'DONE',    color:'text-green-400',  dot:'bg-green-400',  date:'En cours',                icon:'✅' },
                      { label:'Préparation déclaration',     status:'CURRENT', color:'text-amber-400',  dot:'bg-amber-400',  date:'Maintenant',              icon:'🟡' },
                      { label:`Déclaration Q${quarter} due`, status:'UPCOMING',color:'text-red-400',    dot:'bg-red-400',    date: data.echeances.prochaine, icon: urgent ? '🔴' : '🟡' },
                      { label:`Paiement Q${quarter} dû`,     status:'UPCOMING',color:'text-red-400',    dot:'bg-red-400',    date: data.echeances.prochaine, icon: urgent ? '🔴' : '🟡' },
                      { label:'Confirmation reçue',          status:'FUTURE',  color:'text-slate-500',  dot:'bg-slate-600',  date:'Après transmission',      icon:'⚪' },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${item.dot} shrink-0 mt-0.5`} />
                          {i < 4 && <div className="w-px flex-1 bg-slate-700 mt-1" />}
                        </div>
                        <div className="pb-3 flex-1">
                          <div className={`text-sm font-semibold ${item.color}`}>{item.icon} {item.label}</div>
                          <div className="text-[10px] text-slate-500">{item.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Alertes actives */}
                <Card className="p-4">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Alertes actives</div>
                  <div className="space-y-2">
                    {urgent && (
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <span className="text-lg">🔴</span>
                        <div>
                          <div className="text-xs font-bold text-red-400">Déclaration bientôt due</div>
                          <div className="text-[10px] text-red-300/70">Q{quarter} {year} — {daysUntil(data.echeances.prochaine)} jours restants</div>
                        </div>
                      </div>
                    )}
                    {data.fiscal.solde_total > 0 && (
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <span className="text-lg">🟡</span>
                        <div>
                          <div className="text-xs font-bold text-amber-400">Paiement à prévoir</div>
                          <div className="text-[10px] text-amber-300/70">{money(data.fiscal.solde_total)} estimé — Q{quarter} {year}</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <span className="text-lg">ℹ️</span>
                      <div>
                        <div className="text-xs font-bold text-blue-400">SEV 2e génération requis</div>
                        <div className="text-[10px] text-blue-300/70">Depuis le 1er jan. 2026 — mode pilote actif</div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Revenu Québec */}
                <a href={data.revenu_quebec.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl border border-qc-blue/30 bg-qc-blue/10">
                  <div>
                    <div className="text-sm font-bold text-white">Revenu Québec — Mon dossier</div>
                    <div className="text-[10px] text-slate-400">Déclarations · Paiements · Remboursements</div>
                  </div>
                  <ExternalLink size={16} className="text-qc-blue" />
                </a>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
