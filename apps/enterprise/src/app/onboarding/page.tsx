'use client'
import React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { PILOT, money, DEPARTMENTS, CURRENT_ENT } from '@/lib/data'

const STEPS = [
  {id:1, label:'Identité légale',    icon:'🏢'},
  {id:2, label:'Fiscalité',          icon:'🧾'},
  {id:3, label:'Gouvernement',       icon:'🏛️'},
  {id:4, label:'Utilisateurs',       icon:'👥'},
  {id:5, label:'Départements',       icon:'🏬'},
  {id:6, label:'Chauffeurs',         icon:'👤'},
  {id:7, label:'Véhicules',          icon:'🚗'},
  {id:8, label:'Documents',          icon:'📄'},
  {id:9, label:'API',                icon:'⚙️'},
  {id:10,label:'Webhooks',           icon:'📡'},
  {id:11,label:'Configuration financière',icon:'💰'},
  {id:12,label:'Validation finale',  icon:'✅'},
]

const UBER_DEPTS = [
  {id:'D1',slug:'rides',   emoji:'🚗',name:'Uber Rides / Mobility',desc:'UberX, UberXL, Comfort — Transport de personnes',drivers:3840,veh:3680,status:'ACTIVE'},
  {id:'D2',slug:'taxi',    emoji:'🚕',name:'Uber Taxi',            desc:'Taxi réglementé avec taximètre numérique · QC',  drivers:142, veh:138, status:'ACTIVE'},
  {id:'D3',slug:'green',   emoji:'🟢',name:'Uber Green',           desc:'Véhicules électriques et hybrides certifiés',    drivers:420, veh:408, status:'ACTIVE'},
  {id:'D4',slug:'eats',    emoji:'🍔',name:'Uber Eats',            desc:'Livraison de repas · Restaurants partenaires',   drivers:5200,veh:4900,status:'ACTIVE'},
  {id:'D5',slug:'grocery', emoji:'🛒',name:'Uber Eats Grocery',    desc:'Épicerie et commerce de détail · Cornershop',    drivers:820, veh:780, status:'ACTIVE'},
  {id:'D6',slug:'courier', emoji:'📦',name:'Uber Courier / Colis', desc:'Livraison de colis · B2B et B2C',                drivers:380, veh:362, status:'ACTIVE'},
  {id:'D7',slug:'direct',  emoji:'🚚',name:'Uber Direct',          desc:'Livraison API entreprises · Flotte corporate',   drivers:0,   veh:0,   status:'PLANNED'},
]

const WEBHOOK_EVENTS = [
  'activity.created','activity.completed','activity.cancelled',
  'trip.completed','delivery.completed',
  'transaction.created','transaction.updated',
  'tip.created','refund.created','adjustment.created',
  'payment.completed','document.expired','compliance.alert',
]

const READINESS = [
  {id:'r1', label:'Identité légale',          ok:true},
  {id:'r2', label:'NEQ / TPS / TVQ (FICTIF)', ok:true},
  {id:'r3', label:'Représentants autorisés',  ok:true},
  {id:'r4', label:'Connexion TAXIMETER.GOV',  ok:'DEMO'},
  {id:'r5', label:'5 utilisateurs créés',     ok:true},
  {id:'r6', label:'7 départements Uber',       ok:true},
  {id:'r7', label:'Chauffeurs déclarés',       ok:'SYNTH'},
  {id:'r8', label:'Véhicules déclarés',        ok:'SYNTH'},
  {id:'r9', label:'Documents en attente',      ok:'WARN'},
  {id:'r10',label:'API configurée (DEMO)',     ok:true},
  {id:'r11',label:'Webhooks configurés',       ok:true},
  {id:'r12',label:'Configuration financière',  ok:true},
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [activated, setActivated] = useState(false)

  const markDone = (s:number) => {
    setCompleted((prev:Set<number>)=>new Set([...prev,s]))
    if (s<12) setStep(s+1)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top bar */}
      <div className="bg-black text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="font-black tracking-tighter" style={{fontSize:'1.6rem',fontFamily:'system-ui',letterSpacing:'-0.04em',lineHeight:1}}>uber</div>
          <div className="flex items-center gap-1">
            <span className="font-black" style={{color:'#06B029',fontFamily:'system-ui',fontSize:'0.9rem'}}>Uber</span>
            <span className="font-black" style={{color:'white',fontFamily:'system-ui',fontSize:'0.9rem'}}>Eats</span>
          </div>
          <div className="text-sm font-bold" style={{color:'rgba(255,255,255,0.45)'}}>Enterprise Gov · Configuration du compte</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-amber-400">{PILOT}</span>
          <Link href="/" className="px-3 py-1.5 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/20 transition-colors">← Dashboard</Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center gap-1 mb-3 flex-wrap">
            {STEPS.map((s,i)=>(
              <React.Fragment key={s.id}>
                <button onClick={()=>setStep(s.id)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm font-bold border cursor-pointer transition-all whitespace-nowrap ${step===s.id?'bg-black text-white border-black':completed.has(s.id)?'bg-green-50 dark:bg-green-500/10 border-green-400 text-green-600 dark:text-green-400':'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                  {completed.has(s.id)?'✅':s.icon} {s.label}
                </button>
                {i<STEPS.length-1&&<span className="text-slate-300 dark:text-slate-700 text-sm">›</span>}
              </React.Fragment>
            ))}
          </div>
          <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-black transition-all" style={{width:`${(completed.size/12)*100}%`}}/>
          </div>
          <div className="text-sm text-slate-400 mt-1">{completed.size}/12 étapes complétées</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-4">

            {/* STEP 1 — Identité */}
            {step===1&&(
              <StepCard title="Étape 1 — Identité légale" icon="🏢" step={1} onDone={markDone}>
                <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-xl mb-3">
                  ⚠️ Données pré-remplies en mode DÉMO · Aucune donnée officielle Uber
                </div>
                <FormGrid rows={[
                  {l:'Nom légal',          v:CURRENT_ENT.legalName,    placeholder:'Raison sociale'},
                  {l:'Nom commercial',     v:CURRENT_ENT.tradeName,    placeholder:'Nom d\'affaires'},
                  {l:'NEQ (FICTIF)',        v:CURRENT_ENT.neq,          placeholder:'Numéro entreprise Québec'},
                  {l:'Type d\'entreprise', v:'CORPORATION',             placeholder:'Type'},
                  {l:'Date de constitution',v:'2014-09-01',             placeholder:'YYYY-MM-DD'},
                  {l:'Adresse légale',     v:CURRENT_ENT.address,      placeholder:'Adresse'},
                  {l:'Ville',              v:CURRENT_ENT.city,          placeholder:'Ville'},
                  {l:'Province',           v:CURRENT_ENT.province,      placeholder:'Province'},
                  {l:'Code postal',        v:CURRENT_ENT.postal,        placeholder:'X0X 0X0'},
                  {l:'Téléphone (FICTIF)', v:CURRENT_ENT.phoneQC??'(514) 555-UBER',placeholder:'Téléphone'},
                  {l:'Courriel (DEMO)',    v:'admin@uber-demo.taximetergov.demo',placeholder:'Courriel'},
                  {l:'Site Web',           v:CURRENT_ENT.website,       placeholder:'Site Web'},
                  {l:'Secteur',           v:'Transport & Livraison',    placeholder:'Secteur'},
                  {l:'Juridiction',        v:CURRENT_ENT.jurisdiction,  placeholder:'JUR'},
                ]}/>
              </StepCard>
            )}

            {/* STEP 2 — Fiscalité */}
            {step===2&&(
              <StepCard title="Étape 2 — Fiscalité" icon="🧾" step={2} onDone={markDone}>
                <div className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 px-3 py-2 rounded-xl mb-3">
                  NUMÉROS FICTIFS — DEMO UNIQUEMENT — Aucune valeur fiscale officielle
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <SectionLabel label="TPS — Taxe sur les produits et services"/>
                  <FormGrid rows={[
                    {l:'Numéro TPS (FICTIF)',    v:CURRENT_ENT.taxId, placeholder:'RT0001'},
                    {l:'Date d\'inscription',    v:'2014-09-01',       placeholder:'YYYY-MM-DD'},
                    {l:'Fréquence',              v:'Trimestrielle',    placeholder:'Fréquence'},
                    {l:'Statut',                 v:'Inscrit',          placeholder:'Statut'},
                  ]}/>
                  <SectionLabel label="TVQ — Taxe de vente du Québec"/>
                  <FormGrid rows={[
                    {l:'Numéro TVQ (FICTIF)',    v:CURRENT_ENT.tvqId, placeholder:'TQ0001'},
                    {l:'Date d\'inscription',    v:'2014-09-01',       placeholder:'YYYY-MM-DD'},
                    {l:'Fréquence',              v:'Trimestrielle',    placeholder:'Fréquence'},
                    {l:'Statut',                 v:'Inscrit',          placeholder:'Statut'},
                  ]}/>
                  <SectionLabel label="Responsable fiscal"/>
                  <FormGrid rows={[
                    {l:'Responsable fiscal',     v:CURRENT_ENT.reprFiscal,placeholder:'Nom'},
                    {l:'Courriel fiscal (DEMO)', v:'jp.roy@uber-demo.taximetergov.demo',placeholder:'Courriel'},
                    {l:'Fin d\'exercice',        v:'31 décembre',      placeholder:'Date'},
                    {l:'Taux TPS',               v:'5.00%',            placeholder:'%'},
                    {l:'Taux TVQ',               v:'9.975%',           placeholder:'%'},
                  ]}/>
                </div>
              </StepCard>
            )}

            {/* STEP 3 — Gouvernement */}
            {step===3&&(
              <StepCard title="Étape 3 — Connexion gouvernementale" icon="🏛️" step={3} onDone={markDone}>
                <div className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 px-3 py-2 rounded-xl mb-3">
                  ⚠️ AUCUNE CONNEXION GOUVERNEMENTALE RÉELLE · MODE SIMULATION PILOTE
                </div>
                <div className="space-y-3">
                  {[
                    {org:'TAXIMETER.GOV',      status:'SIMULATION', color:'#B45309',dot:'bg-amber-400',desc:'Plateforme gouvernementale QC · Pilote actif'},
                    {org:'Revenu Québec',       status:'PLANIFIÉ',   color:'#7C3AED',dot:'bg-purple-400',desc:'API gouvernementale à définir — autorisation requise'},
                    {org:'ARC (Canada)',        status:'PLANIFIÉ',   color:'#7C3AED',dot:'bg-purple-400',desc:'Intégration future — accord légal requis'},
                    {org:'CTQ',                status:'PLANIFIÉ',   color:'#7C3AED',dot:'bg-purple-400',desc:'Commission des transports du Québec'},
                  ].map(c=>(
                    <div key={c.org} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.dot}`}/>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{c.org}</div>
                          <div className="text-sm text-slate-400 italic">{c.desc}</div>
                        </div>
                        <span className="text-sm font-bold px-1.5 py-0.5 rounded-full text-white" style={{background:c.color}}>{c.status}</span>
                      </div>
                    </div>
                  ))}
                  <div className="bg-blue-50 dark:bg-blue-500/8 border border-blue-200 dark:border-blue-500/20 rounded-xl p-3 text-sm text-slate-600 dark:text-slate-300">
                    TAXIMETER.GOV peut être conçu pour fonctionner avec les autorités gouvernementales lorsque les API, autorisations, contrats et normes de sécurité nécessaires seront disponibles.
                  </div>
                </div>
              </StepCard>
            )}

            {/* STEP 4 — Utilisateurs */}
            {step===4&&(
              <StepCard title="Étape 4 — Utilisateurs" icon="👥" step={4} onDone={markDone}>
                <div className="space-y-2">
                  {[
                    {name:'Sophie Marchand',    email:'s.marchand@uber-demo.taximetergov.demo',role:'PROPRIÉTAIRE',mfa:true, status:'ACTIF'},
                    {name:'Jean-Philippe Roy',  email:'jp.roy@uber-demo.taximetergov.demo',    role:'FINANCE',     mfa:true, status:'ACTIF'},
                    {name:'Karim Benali',       email:'k.benali@uber-demo.taximetergov.demo',  role:'OPÉRATIONS',  mfa:false,status:'ACTIF'},
                    {name:'Marie-Ève Lapointe', email:'me.lapointe@uber-demo.taximetergov.demo',role:'LECTURE',    mfa:false,status:'ACTIF'},
                    {name:'David Chen',         email:'d.chen@uber-demo.taximetergov.demo',    role:'CONFORMITÉ',  mfa:true, status:'EN ATTENTE'},
                  ].map(u=>(
                    <div key={u.name} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white text-base font-black shrink-0">
                          {u.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{u.name}</div>
                          <div className="text-sm text-slate-400 truncate">{u.email}</div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-sm font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{u.role}</span>
                          <span className={`text-[11px] font-bold px-1 py-0.5 rounded ${u.mfa?'text-green-600 bg-green-50':'text-red-500 bg-red-50'}`}>{u.mfa?'MFA ✅':'MFA ⚠️'}</span>
                          <span className={`text-[11px] font-bold ${u.status==='ACTIF'?'text-green-600':'text-amber-600'}`}>{u.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-sm text-slate-400 italic">⚠️ Utilisateurs fictifs — Données DEMO uniquement</div>
                </div>
              </StepCard>
            )}

            {/* STEP 5 — Départements */}
            {step===5&&(
              <StepCard title="Étape 5 — Départements Uber" icon="🏬" step={5} onDone={markDone}>
                <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-xl mb-3">
                  Départements = catégories fonctionnelles DEMO · Structure corporative réelle d'Uber non documentée ici
                </div>
                <div className="space-y-2">
                  {UBER_DEPTS.map(d=>(
                    <div key={d.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl shrink-0">{d.emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{d.name}</span>
                            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${d.status==='ACTIVE'?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':'text-purple-600 bg-purple-50'}`}>{d.status}</span>
                          </div>
                          <div className="text-sm text-slate-400">{d.desc}</div>
                          {d.drivers>0&&(
                            <div className="text-sm text-slate-400 mt-0.5">
                              ~{d.drivers.toLocaleString('fr-CA')} chauffeurs · {d.veh.toLocaleString('fr-CA')} véhicules
                              <span className="text-amber-500 ml-1">(SYNTH.)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </StepCard>
            )}

            {/* STEP 6 — Chauffeurs */}
            {step===6&&(
              <StepCard title="Étape 6 — Déclaration chauffeurs" icon="👤" step={6} onDone={markDone}>
                <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-xl mb-3">
                  ⚠️ Nb exact de chauffeurs Uber QC non publié officiellement · Chiffres ci-dessous = SYNTHÉTIQUES DEMO
                </div>
                <div className="space-y-1.5">
                  {UBER_DEPTS.filter(d=>d.status==='ACTIVE'&&d.drivers>0).map(d=>(
                    <div key={d.id} className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5">
                      <span className="text-lg shrink-0">{d.emoji}</span>
                      <span className="text-sm font-bold flex-1 text-slate-700 dark:text-slate-300">{d.name}</span>
                      <div className="text-right">
                        <div className="text-base font-black text-slate-800 dark:text-white">{d.drivers.toLocaleString('fr-CA')}</div>
                        <div className="text-[11px] text-amber-500">SYNTH.</div>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 bg-black rounded-xl p-2.5">
                    <span className="text-sm font-bold flex-1 text-white">TOTAL (estimation DEMO)</span>
                    <div className="text-right">
                      <div className="text-base font-black text-white">{UBER_DEPTS.reduce((s,d)=>s+d.drivers,0).toLocaleString('fr-CA')}</div>
                      <div className="text-[11px] text-amber-400">SYNTHÉTIQUE</div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-400 italic">12 351 véhicules Uber = référence publique (Travelnet 2024) — pas le nb de chauffeurs</div>
                </div>
              </StepCard>
            )}

            {/* STEP 7 — Véhicules */}
            {step===7&&(
              <StepCard title="Étape 7 — Flotte de véhicules" icon="🚗" step={7} onDone={markDone}>
                <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-xl mb-3">
                  DONNÉES SYNTHÉTIQUES · 12 351 = véhicules réf. publique QC (Travelnet 2024)
                </div>
                <div className="space-y-1.5">
                  {UBER_DEPTS.filter(d=>d.veh>0).map(d=>(
                    <div key={d.id} className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5">
                      <span className="text-lg shrink-0">{d.emoji}</span>
                      <span className="text-sm font-bold flex-1 text-slate-700 dark:text-slate-300">{d.name}</span>
                      <div className="text-right">
                        <div className="text-base font-black text-slate-800 dark:text-white">{d.veh.toLocaleString('fr-CA')}</div>
                        <div className="text-[11px] text-amber-500">SYNTH.</div>
                      </div>
                    </div>
                  ))}
                  <div className="text-sm text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                    Chaque véhicule enregistré doit avoir: plaque · marque · modèle · année · assurance · inspection · immatriculation · chauffeur associé
                  </div>
                </div>
              </StepCard>
            )}

            {/* STEP 8 — Documents */}
            {step===8&&(
              <StepCard title="Étape 8 — Gestion des documents" icon="📄" step={8} onDone={markDone}>
                <div className="space-y-3">
                  {[
                    {cat:'Documents entreprise',    items:['Licence d\'exploitation','NEQ (FICTIF)','Certificat incorporation','Attestation TPS/TVQ (FICTIF)']},
                    {cat:'Documents chauffeurs',     items:['Permis de conduire','Permis taxi CTQ','Assurance automobile','Vérification antécédents','Formation sécurité']},
                    {cat:'Documents véhicules',      items:['Immatriculation','Assurance véhicule','Rapport d\'inspection','Certificat taximètre (Uber Taxi)']},
                  ].map(sec=>(
                    <div key={sec.cat}>
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{sec.cat}</div>
                      {sec.items.map(item=>(
                        <div key={item} className="flex items-center gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"/>
                          <span className="text-sm text-slate-600 dark:text-slate-400">{item}</span>
                          <span className="text-[11px] font-bold text-green-600 bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded-full ml-auto">Configuré</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </StepCard>
            )}

            {/* STEP 9 — API */}
            {step===9&&(
              <StepCard title="Étape 9 — Configuration API" icon="⚙️" step={9} onDone={markDone}>
                <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-xl mb-3">
                  Secrets masqués par sécurité · Aucune clé API réelle n'est affichée
                </div>
                <div className="space-y-3">
                  {[
                    {name:'TAXIMETER.GOV API', env:'PILOTE', endpoint:'api.taximetergov.demo/v1', auth:'OAuth 2.0', status:'CONNECTÉ', lastSync:'2026-09-18T10:38:00Z'},
                    {name:'Uber Platform API (DEMO)', env:'DEMO', endpoint:'api.uber-demo.internal/v2', auth:'API Key', status:'CONNECTÉ', lastSync:'2026-09-18T10:32:00Z'},
                    {name:'Revenu Québec API', env:'FUTUR', endpoint:'(Non disponible — autorisation requise)', auth:'OAuth 2.0', status:'PLANIFIÉ', lastSync:null},
                  ].map(api=>(
                    <div key={api.name} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${api.status==='CONNECTÉ'?'bg-green-500':'bg-purple-400'}`}/>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{api.name}</span>
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full text-white ml-auto ${api.status==='CONNECTÉ'?'bg-green-600':'bg-purple-500'}`}>{api.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-400">
                        <div>Env: <span className="font-bold text-slate-600 dark:text-slate-300">{api.env}</span></div>
                        <div>Auth: <span className="font-bold text-slate-600 dark:text-slate-300">{api.auth}</span></div>
                        <div>Client ID: <span className="font-mono">••••••••</span></div>
                        <div>Secret: <span className="font-mono">•••••••••••••••••</span></div>
                        <div className="col-span-2">Endpoint: <span className="font-mono text-slate-500 text-[11px]">{api.endpoint}</span></div>
                        {api.lastSync&&<div className="col-span-2">Dernière sync: <span className="font-bold text-slate-600 dark:text-slate-300">{api.lastSync}</span></div>}
                      </div>
                    </div>
                  ))}
                </div>
              </StepCard>
            )}

            {/* STEP 10 — Webhooks */}
            {step===10&&(
              <StepCard title="Étape 10 — Webhooks" icon="📡" step={10} onDone={markDone}>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {WEBHOOK_EVENTS.map(e=>(
                    <div key={e} className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"/>
                      <span className="text-sm font-mono text-slate-600 dark:text-slate-400">{e}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm space-y-1">
                  <div className="font-bold text-slate-700 dark:text-slate-300 mb-1.5">Configuration Webhook</div>
                  <div className="flex justify-between"><span className="text-slate-400">URL DEMO:</span><span className="font-mono text-slate-600 dark:text-slate-400 text-sm">webhook.taximetergov.demo/uber</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Signature:</span><span className="font-mono">•••••••••••••••••</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Retry:</span><span className="font-bold text-slate-700 dark:text-slate-300">3 tentatives</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Timeout:</span><span className="font-bold text-slate-700 dark:text-slate-300">30 secondes</span></div>
                </div>
              </StepCard>
            )}

            {/* STEP 11 — Finance */}
            {step===11&&(
              <StepCard title="Étape 11 — Configuration financière" icon="💰" step={11} onDone={markDone}>
                <div className="space-y-3">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Flux financier configuré</div>
                    <div className="flex flex-wrap gap-1 items-center text-sm font-bold">
                      {['ACTIVITÉ','→','TRANSACTION','→','REVENU BRUT','→','TIP','→','TPS(5%)','→','TVQ(9.975%)','→','FRAIS','→','NET CHAUFFEUR','→','NET UBER'].map((s,i)=>(
                        <span key={i} className={s==='→'?'text-slate-300':'px-1.5 py-1 rounded-lg bg-black text-white'}>{s}</span>
                      ))}
                    </div>
                  </div>
                  <FormGrid rows={[
                    {l:'Devise',              v:'CAD — Dollar canadien',     placeholder:''},
                    {l:'TPS',                 v:'5.00%',                     placeholder:''},
                    {l:'TVQ',                 v:'9.975%',                    placeholder:''},
                    {l:'Commission Rides (~)',v:'25% (DEMO)',                 placeholder:''},
                    {l:'Commission Eats (~)', v:'30% (DEMO)',                 placeholder:''},
                    {l:'Période fiscale',     v:'Trimestrielle',             placeholder:''},
                    {l:'Fin exercice',        v:'31 décembre',               placeholder:''},
                    {l:'Pourboires',          v:'Séparés — calcul fiscal distinct',placeholder:''},
                  ]}/>
                  <div className="text-sm text-amber-600 dark:text-amber-400 italic">⚠️ Les règles fiscales Uber (rides vs Eats) sont distinctes selon Revenu Québec · Validation obligatoire avec un comptable</div>
                </div>
              </StepCard>
            )}

            {/* STEP 12 — Validation finale */}
            {step===12&&(
              <StepCard title="Étape 12 — Validation finale" icon="✅" step={12} onDone={()=>{setCompleted((prev:Set<number>)=>new Set([...prev,12]));setActivated(true)}} doneLabel="ACTIVER LE COMPTE · DEMO">
                <div className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-xl mb-3">
                  {PILOT} · COMPTE DEMO UBER QUÉBEC · DONNÉES SYNTHÉTIQUES · AUCUNE VALEUR OFFICIELLE
                </div>
                {activated&&(
                  <div className="bg-green-50 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30 rounded-xl p-4 mb-3">
                    <div className="text-base font-black text-green-700 dark:text-green-400 mb-1">✅ Compte DEMO activé</div>
                    <div className="text-sm text-green-600 dark:text-green-500">Enterprise ID: {CURRENT_ENT.id} · Mode: PILOTE DEMO</div>
                    <Link href="/" className="mt-2 block text-center py-2 rounded-xl text-sm font-bold bg-black text-white hover:bg-slate-800">→ Accéder au Dashboard</Link>
                  </div>
                )}
                <div className="space-y-1.5">
                  {READINESS.map(r=>(
                    <div key={r.id} className="flex items-center gap-3 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <span className="text-lg shrink-0">{r.ok===true?'✅':r.ok==='WARN'?'⚠️':r.ok==='DEMO'?'🔵':r.ok==='SYNTH'?'🟡':'❌'}</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex-1">{r.label}</span>
                      <span className={`text-sm font-bold px-1.5 py-0.5 rounded-full shrink-0 ${r.ok===true?'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10':r.ok==='WARN'?'text-amber-600 bg-amber-50':'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10'}`}>
                        {r.ok===true?'Prêt':r.ok==='WARN'?'Attention':'DEMO'}
                      </span>
                    </div>
                  ))}
                </div>
              </StepCard>
            )}
          </div>

          {/* Sidebar — résumé compte */}
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 flex items-center gap-3" style={{background:'#000'}}>
                <div className="font-black tracking-tighter text-white" style={{fontSize:'1.4rem',fontFamily:'system-ui',letterSpacing:'-0.04em',lineHeight:1}}>uber</div>
                <div>
                  <div className="text-sm font-bold text-white">Enterprise Gov</div>
                  <div className="text-[11px]" style={{color:'rgba(255,255,255,0.5)'}}>DEMO · PILOTE</div>
                </div>
              </div>
              <div className="p-4 space-y-1.5">
                {[
                  {l:'Enterprise ID', v:CURRENT_ENT.id},
                  {l:'Nom légal',     v:CURRENT_ENT.legalName},
                  {l:'NEQ (FICTIF)', v:CURRENT_ENT.neq},
                  {l:'Mode',         v:'PILOTE · DEMO'},
                  {l:'Progression',  v:`${completed.size}/12 étapes`},
                ].map(r=>(
                  <div key={r.l} className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-800 last:border-0 py-1">
                    <span className="text-slate-400 text-xs">{r.l}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-right max-w-[55%] truncate text-xs">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Appartient à ce compte uniquement</div>
              {['🚗 Rides · UberX · XL','🚕 Uber Taxi','🟢 Uber Green','🍔 Uber Eats','🛒 Uber Grocery','📦 Uber Courier','🚚 Uber Direct'].map(s=>(
                <div key={s} className="text-sm text-slate-500 py-0.5">{s}</div>
              ))}
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-green-600 dark:text-green-400 font-bold">
                ✅ Aucune donnée concurrente dans ce compte
              </div>
            </div>

            <Link href="/" className="block w-full py-2.5 rounded-xl text-sm font-bold text-center bg-black text-white hover:bg-slate-800 transition-colors">
              ← Retour au Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Composants helper
function StepCard({title,icon,step,onDone,doneLabel='Confirmer et continuer',children}:{title:string;icon:string;step:number;onDone:(s:number)=>void;doneLabel?:string;children:React.ReactNode}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3" style={{borderTop:'3px solid #000'}}>
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="text-base font-black text-slate-900 dark:text-white">{title}</div>
          <div className="text-sm text-slate-400">Étape {step}/12</div>
        </div>
      </div>
      <div className="p-5">{children}</div>
      <div className="px-5 pb-4">
        <button onClick={()=>onDone(step)} className="w-full py-2.5 rounded-xl text-sm font-bold bg-black text-white cursor-pointer hover:bg-slate-800 transition-colors">
          {doneLabel}
        </button>
      </div>
    </div>
  )
}

function FormGrid({rows}:{rows:{l:string;v:string;placeholder:string}[]}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {rows.map(r=>(
        <div key={r.l}>
          <div className="text-sm font-bold text-slate-500 mb-0.5">{r.l}</div>
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-mono text-slate-700 dark:text-slate-300">{r.v}</div>
        </div>
      ))}
    </div>
  )
}

function SectionLabel({label}:{label:string}) {
  return <div className="text-base font-black text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-1">{label}</div>
}
