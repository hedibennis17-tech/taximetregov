'use client'
import { AppShell } from "@/components/layout/AppShell"
import { PageHeader, Card } from "@/components/ui"
import Link from "next/link"
export default function Page() {
  return (
    <AppShell>
      <PageHeader title="Module" subtitle="Accessible via le générateur de rapports" />
      <Card className="p-8 text-center">
        <div className="text-4xl mb-3">🔜</div>
        <div className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Module disponible via le Générateur</div>
        <p className="text-sm text-slate-500 mb-4">Données agrégées depuis le Universal Ledger. Accessible depuis le centre de rapports.</p>
        <Link href="/reports/builder" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-qc-blue text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
          Ouvrir le générateur →
        </Link>
      </Card>
    </AppShell>
  )
}
