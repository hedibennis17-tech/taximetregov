// ================================================================
// POST /api/provider-transparency/reconcile
// Moteur de réconciliation mathématique — ONE TRANSACTION ONE TRUTH
// ================================================================
// Vérifie: client_total = driver + provider_fees + taxes + tips + tolls + adjustments
// Ne présume JAMAIS une fraude — signale les écarts pour révision humaine
// ================================================================

import { NextRequest } from 'next/server'
import { getDb, apiSuccess, apiError } from '@/lib/db'
import { requireAuth, requireGovRole } from '@/lib/auth'
import { sql } from 'drizzle-orm'

function round2(v: number): number { return Math.round(v * 100) / 100 }

interface TransactionComponents {
  governmentTransactionId: string
  providerTransactionId:   string
  provider:                string
  driverEarnings:          number
  providerFees:            number
  tips:                    number
  taxes:                   number
  tolls:                   number
  surcharges:              number
  discounts:               number
  refunds:                 number
  adjustments:             number
  customerTotal:           number
}

function reconcile(tx: TransactionComponents) {
  // Somme des composantes connues
  const sumComponents = round2(
    tx.driverEarnings + tx.providerFees + tx.tips +
    tx.taxes + tx.tolls + tx.surcharges -
    tx.discounts - tx.refunds + tx.adjustments
  )

  const delta = round2(tx.customerTotal - sumComponents)
  const tolerance = 0.02  // 2 cents — arrondi acceptable

  let status: string
  if (Math.abs(delta) <= tolerance) {
    status = 'MATCHED'
  } else if (Math.abs(delta) < 1.0) {
    status = 'PARTIAL_MATCH'  // Petit écart < 1$ → probablement arrondi
  } else {
    status = 'VARIANCE'       // Écart significatif → révision requise
  }

  return {
    governmentTransactionId: tx.governmentTransactionId,
    provider:                tx.provider,
    customerTotal:           tx.customerTotal,
    sumComponents,
    delta,
    status,
    breakdown: {
      driverEarnings: tx.driverEarnings,
      providerFees:   tx.providerFees,
      tips:           tx.tips,
      taxes:          tx.taxes,
      tolls:          tx.tolls,
      surcharges:     tx.surcharges,
      discounts:      tx.discounts,
      refunds:        tx.refunds,
      adjustments:    tx.adjustments,
    },
    // Pourcentages de répartition
    allocation: tx.customerTotal > 0 ? {
      driverPct:   round2((tx.driverEarnings / tx.customerTotal) * 100),
      providerPct: round2((tx.providerFees   / tx.customerTotal) * 100),
      taxPct:      round2((tx.taxes          / tx.customerTotal) * 100),
      tipPct:      round2((tx.tips           / tx.customerTotal) * 100),
    } : null,
    principle: 'Un écart ne présume pas une fraude — il nécessite une explication ou une vérification.',
    reconciledAt: new Date().toISOString(),
  }
}

export async function POST(req: NextRequest) {
  const ctx = await requireAuth(req)
  if (ctx instanceof Response) return ctx
  const denied = requireGovRole(ctx)
  if (denied) return denied

  try {
    const db = getDb()
    const body = await req.json() as { transactions?: TransactionComponents[]; mode?: string }

    if (body.mode === 'DEMO') {
      // Démo avec 3 transactions exemple (sans données fournisseur réelles)
      const demoTxs: TransactionComponents[] = [
        {
          governmentTransactionId: 'TAX-2026-DEMO-001',
          providerTransactionId:   'DEMO-UBR-100001',
          provider:                'UBER',
          customerTotal:   50.00,
          driverEarnings:  31.00,
          providerFees:    10.00,
          tips:             5.00,
          taxes:            4.00,
          tolls:            0,
          surcharges:       0,
          discounts:        0,
          refunds:          0,
          adjustments:      0,
        },
        {
          governmentTransactionId: 'TAX-2026-DEMO-002',
          providerTransactionId:   'DEMO-LYF-200002',
          provider:                'LYFT',
          customerTotal:   35.00,
          driverEarnings:  22.00,
          providerFees:     7.00,
          tips:             3.00,
          taxes:            3.00,
          tolls:            0,
          surcharges:       0,
          discounts:        0,
          refunds:          0,
          adjustments:      0,
        },
        {
          governmentTransactionId: 'TAX-2026-DEMO-003',
          providerTransactionId:   'DEMO-DOOR-300003',
          provider:                'DOORDASH',
          customerTotal:   25.00,
          driverEarnings:  12.00,
          providerFees:     5.00,
          tips:             4.00,
          taxes:            2.20,
          tolls:            0,
          surcharges:       0,
          discounts:        0,
          refunds:          0,
          adjustments:      0,
          // Total = 12+5+4+2.20 = 23.20 ≠ 25.00 → VARIANCE de 1.80$
        },
      ]

      const results = demoTxs.map(reconcile)
      const matched  = results.filter(r => r.status === 'MATCHED').length
      const variance = results.filter(r => r.status === 'VARIANCE').length
      const partial  = results.filter(r => r.status === 'PARTIAL_MATCH').length

      return apiSuccess({
        mode:    'DEMO',
        summary: { total: results.length, matched, variance, partial },
        results,
      })
    }

    // Mode réel: transactions passées en body
    if (body.transactions?.length) {
      const results = body.transactions.map(reconcile)
      const matched  = results.filter(r => r.status === 'MATCHED').length
      const variance = results.filter(r => r.status === 'VARIANCE').length
      const partial  = results.filter(r => r.status === 'PARTIAL_MATCH').length

      // Audit log
      await db.execute(sql`
        INSERT INTO audit_logs (
          id, actor_id, action, module, resource_type,
          severity, result, actor_type, occurred_at, created_at
        ) VALUES (
          gen_random_uuid(), ${ctx.userId},
          'RECONCILIATION_RUN', 'PROVIDER_TRANSPARENCY', 'transactions',
          'INFO', 'SUCCESS', 'USER', now(), now()
        )
      `)

      return apiSuccess({
        mode:    'LIVE',
        summary: { total: results.length, matched, variance, partial },
        results,
      })
    }

    // Mode stats — depuis revenue_ledger existant
    const stats = await db.execute(sql`
      SELECT
        source_type                       as provider,
        COUNT(*)                          as transactions,
        SUM(gross_amount)                 as total_gross,
        SUM(tip_amount)                   as total_tips,
        SUM(fee_amount)                   as total_fees,
        SUM(net_amount)                   as total_net,
        -- Écart potentiel: gross - (net + tips + fees)
        SUM(gross_amount - net_amount - tip_amount - fee_amount) as unexplained_delta,
        COUNT(CASE WHEN gross_amount > net_amount + tip_amount + fee_amount + 0.02 THEN 1 END) as transactions_with_delta
      FROM revenue_ledger
      WHERE activity_date >= date_trunc('month', now())
      GROUP BY source_type
      ORDER BY total_gross DESC NULLS LAST
    `)

    return apiSuccess({ mode: 'STATS', stats })
  } catch (err) {
    console.error('[reconcile]', err)
    return apiError('Erreur serveur', 500)
  }
}
