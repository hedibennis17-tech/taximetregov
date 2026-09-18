'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money, DELIVERY_MONTHLY } from '@/lib/analytics-data'
const NAV=[{href:'/analytics/overview',l:'📊 Vue globale',active:false},{href:'/analytics/revenue',l:'💰 Revenus',active:false},{href:'/analytics/taxes',l:'📋 Taxes',active:false},{href:'/analytics/taxi',l:'🚕 Taxi',active:false},{href:'/analytics/delivery',l:'📦 Livraisons',active:true},{href:'/analytics/compliance',l:'⚖️ Conformité',active:false},{href:'/analytics/intelligence',l:'🧠 Intelligence',active:false},{href:'/analytics/drivers',l:'🚗 Chauffeurs',active:false}]
const totalOrders = DELIVERY_MONTHLY.reduce((s,m)=>s+m.orders,0)
const totalBrut = DELIVERY_MONTHLY.reduce((s,m)=>s+m.brut,0)
const maxOrders = Math.max(...DELIVERY_MONTHLY.map(m=>m.orders))
export default function DeliveryPage() {
  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Analytique Livraisons</h1>
        <p className="text-sm text-slate-500 mt-1 mb-4">DoorDash · Instacart · Uber Eats · Jan–Sep 2026</p>
        <div className="flex gap-1.5 overflow-x-auto pb-3 flex-nowrap">{NAV.map(n=><Link key={n.href} href={n.href} className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap" style={{background:n.active?'#003DA5':'transparent',color:n.active?'white':'#64748B',borderColor:n.active?'#003DA5':'rgba(148,163,184,0.30)'}}>{n.l}</Link>)}</div>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-5">
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {l:'Commandes (9M)',    v:totalOrders.toLocaleString('fr-CA'), icon:'📦', c:'#059669'},
            {l:'Revenus bruts (9M)',v:money(totalBrut),                    icon:'💰', c:'#059669'},
            {l:'Moy./commande',    v:`${(totalBrut/totalOrders).toFixed(2)}$`, icon:'📊', c:'#003DA5'},
            {l:'Fournisseurs',     v:'3 actifs',                           icon:'🔌', c:'#7C3AED'},
          ].map(s=>(
            <div key={s.l} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm" style={{borderTop:`3px solid ${s.c}`}}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-lg font-black text-slate-900 dark:text-white">{s.v}</div>
              <div className="text-[9px] text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Volume commandes par mois</div>
          {DELIVERY_MONTHLY.map(m=>(
            <div key={m.month} className="mb-3">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 text-[10px] font-bold text-slate-500 shrink-0">{m.month}</div>
                <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex">
                  <div className="h-full" style={{width:`${m.providers.doordash/100*(m.orders/maxOrders)*100}%`,background:'#FF3008'}}/>
                  <div className="h-full" style={{width:`${m.providers.instacart/100*(m.orders/maxOrders)*100}%`,background:'#43B02A'}}/>
                  <div className="h-full" style={{width:`${m.providers.ubereats/100*(m.orders/maxOrders)*100}%`,background:'#06C167'}}/>
                </div>
                <div className="w-28 text-[10px] font-bold text-slate-800 dark:text-white text-right shrink-0">{m.orders.toLocaleString('fr-CA')} cmd</div>
              </div>
              <div className="flex gap-3 pl-11 text-[8px] text-slate-400">
                <span className="text-red-500">🔴 DD: {m.providers.doordash}%</span>
                <span className="text-green-600">🟢 IC: {m.providers.instacart}%</span>
                <span className="text-green-400">🟡 UE: {m.providers.ubereats}%</span>
              </div>
            </div>
          ))}
          <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {[{c:'#FF3008',l:'🔴 DoorDash'},{c:'#43B02A',l:'🟢 Instacart'},{c:'#06C167',l:'🟡 Uber Eats'}].map(l=>(
              <div key={l.l} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{background:l.c}}/><span className="text-[10px] text-slate-400">{l.l}</span></div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
