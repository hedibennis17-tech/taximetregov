'use client'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { PILOT, money } from '@/lib/enterprise-phase2-data'
import { ENTERPRISES, SECTOR_CONF } from '@/lib/enterprise-data'
import { P2Nav } from '@/components/enterprise/P2Nav'

const ENTERPRISE_DRIVERS = [
  {id:'DRV-QC-0001',entId:'ENT-DEMO-001',name:'Jean Tremblay',    type:'TAXI',     vehicle:'TXM-DEMO-001',revenueQ3:42_800,status:'ACTIVE'},
  {id:'DRV-QC-0002',entId:'ENT-DEMO-001',name:'Marie Gagnon',     type:'RIDESHARE',vehicle:'VEH-002',       revenueQ3:38_600,status:'ACTIVE'},
  {id:'DRV-QC-0003',entId:'ENT-DEMO-002',name:'Karim Hassan',     type:'TAXI',     vehicle:'TXM-DEMO-003',revenueQ3:29_400,status:'ACTIVE'},
  {id:'DRV-QC-0004',entId:'ENT-DEMO-002',name:'Ali Bouchard',     type:'TAXI',     vehicle:'TXM-DEMO-004',revenueQ3:18_200,status:'ACTIVE'},
  {id:'DRV-QC-0005',entId:'ENT-DEMO-003',name:'Nadia Patel',      type:'DELIVERY', vehicle:'VEH-010',       revenueQ3:31_800,status:'ACTIVE'},
  {id:'DRV-QC-0006',entId:'ENT-DEMO-005',name:'Marc Leblanc',     type:'LOGISTICS',vehicle:'VEH-020',       revenueQ3:28_400,status:'SUSPENDED'},
]

export default function Page() {
  return (
    <AppShell>
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-2 mb-1"><span className="text-2xl">🔗</span><h1 className="text-2xl font-black text-slate-900 dark:text-white">Enterprise ↔ Driver</h1></div>
        <p className="text-sm text-slate-500 mb-4">Relations bidirectionnelles · Entreprise → Chauffeur → Véhicule → Activité → Transaction</p>
      </div>
      <div className="px-4 md:px-6 pb-8 space-y-4">
        <P2Nav active="/admin/enterprises/drivers"/>
        <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-xl">{PILOT}</div>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Chaîne de relation</div>
          <div className="flex items-center gap-1 flex-wrap text-[8px] font-bold">
            {['ENTREPRISE','→','CHAUFFEUR','→','VÉHICULE','→','ACTIVITÉ','→','TRANSACTION','→','REVENUS','→','TPS/TVQ'].map((s,i)=>(
              <span key={i} className={s==='→'?'text-slate-300 dark:text-slate-700':'px-2 py-1 rounded-lg'} style={s!=='→'?{background:'#EEF3FB',color:'#003DA5'}:{}}>{s}</span>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {ENTERPRISES.filter((e: typeof ENTERPRISES[0])=>e.drivers>0).map(ent=>{
            const sc=SECTOR_CONF[ent.sector]??{icon:'🏢',color:'#64748B',label:ent.sector}
            return (
              <div key={ent.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{sc.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-800 dark:text-white">{ent.tradeName}</div>
                    <div className="text-[9px] text-slate-400">{ent.id} · {ent.drivers} chauffeurs · {ent.vehicles} véhicules</div>
                  </div>
                  <Link href={`/admin/enterprises/${ent.id}?tab=drivers`} className="text-[9px] font-bold text-qc-blue hover:underline">→ Chauffeurs</Link>
                </div>
                <div className="grid grid-cols-3 gap-2 pl-9">
                  {[
                    {l:'Chauffeurs',v:ent.drivers,c:'#003DA5',icon:'👥'},
                    {l:'Activités Q3',v:ent.activities.toLocaleString('fr-CA'),c:'#059669',icon:'📍'},
                    {l:'Rev. Q3',v:money(ent.grossQ3),c:'#7C3AED',icon:'💰'},
                  ].map(s=>(
                    <div key={s.l} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 text-center">
                      <div className="text-base">{s.icon}</div>
                      <div className="text-sm font-black mt-0.5" style={{color:s.c}}>{s.v}</div>
                      <div className="text-[8px] text-slate-400">{s.l}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[9px] font-bold text-slate-400 mb-1.5">Chauffeurs pilotes</div>
                  {ENTERPRISE_DRIVERS.filter((d: typeof ENTERPRISE_DRIVERS[0])=>d.entId===ent.id).map(d=>(
                    <div key={d.id} className="flex items-center gap-2 py-1 border-b border-slate-50 dark:border-slate-800 last:border-0">
                      <span className="text-sm">👤</span>
                      <div className="flex-1">
                        <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{d.name}</div>
                        <div className="text-[8px] text-slate-400">{d.id} · {d.type} · {d.vehicle}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-bold text-green-600 dark:text-green-400">{money(d.revenueQ3)}</div>
                        <div className="text-[8px] text-slate-400">Rev. Q3</div>
                      </div>
                      <Link href={`/drivers/${d.id.toLowerCase().replace('drv-qc','drv-demo')}`} className="text-[8px] font-bold text-qc-blue hover:underline shrink-0">→</Link>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div className="text-[9px] text-slate-400 text-center">Relations pilotes · Ne pas créer d'identité chauffeur parallèle · Utiliser Driver Gov existant</div>

      </div>
    </AppShell>
  )
}
