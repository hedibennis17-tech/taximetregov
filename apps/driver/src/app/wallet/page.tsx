'use client'
import { AppShell } from '@/components/layout/AppShell'
import { TaximetreGovLoader } from '@/components/brand/Logo'
import { useTheme } from '@/lib/theme'
import { getThemeTokens, cardStyle, SectionTitle } from '@/lib/theme-helpers'
import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, X, AlertTriangle, CheckCircle, Clock, Building, Mail, CreditCard, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────
interface WalletData {
  hasWallet:boolean; walletId:string; balance:number; pendingAmount:number
  currency:string; jurisdiction:string
  entries:Array<{id:string;entry_type:string;direction:string;amount:string;description:string;created_at:string;is_settled:boolean}>
  payouts:Array<{id:string;public_payout_id:string;payout_method:string;status:string;requested_amount:string;processed_amount:string|null;requested_at:string;completed_at:string|null;failure_code:string|null}>
  bankInfo:{method:string;interac_email_masked?:string;institution_name?:string;transit_masked?:string;account_masked?:string;is_verified:boolean}|null
  recentActivity:Array<{source_type:string;gross_amount:string;activity_date:string}>
}

const PAYOUT_STATUS: Record<string,{label:string;color:string;bg:string;icon:string}> = {
  PENDING:    {label:'En traitement',  color:'#B45309', bg:'rgba(180,83,9,0.10)',  icon:'⏳'},
  PROCESSING: {label:'En cours',       color:'#003DA5', bg:'rgba(0,61,165,0.10)',  icon:'🔄'},
  COMPLETED:  {label:'Complété',       color:'#059669', bg:'rgba(5,150,105,0.10)', icon:'✅'},
  FAILED:     {label:'Échoué',         color:'#DC2626', bg:'rgba(220,38,38,0.10)', icon:'❌'},
  RETURNED:   {label:'Retourné',       color:'#7C3AED', bg:'rgba(124,58,237,0.10)',icon:'↩️'},
}

const CANADIAN_BANKS = [
  {name:'TD Banque Toronto-Dominion',       inst:'004'},
  {name:'Banque Royale du Canada (RBC)',    inst:'003'},
  {name:'Banque Scotia',                    inst:'002'},
  {name:'Banque de Montréal (BMO)',         inst:'001'},
  {name:'CIBC',                             inst:'010'},
  {name:'Mouvement Desjardins',             inst:'815'},
  {name:'Banque Nationale du Canada',       inst:'006'},
  {name:'Banque HSBC Canada',              inst:'016'},
  {name:'Tangerine',                        inst:'614'},
  {name:'Autre établissement',              inst:''},
]

const money = (n:number|string) => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(typeof n==='string'?parseFloat(n)||0:n)
const fmtDate = (d:string) => new Intl.DateTimeFormat('fr-CA',{month:'short',day:'numeric',year:'numeric'}).format(new Date(d))
const SRC_ICON: Record<string,string> = {TAXI:'🚕',UBER:'⬛',LYFT:'🟣',DOORDASH:'📦',UBEREATS:'🛵',DEFAULT:'🚗'}

// ─── Modal: Choisir méthode de retrait ─────────────────────────
function PayoutModal({t,dark,balance,token,onClose,onDone}:{t:ReturnType<typeof getThemeTokens>;dark:boolean;balance:number;token:string;onClose:()=>void;onDone:(msg:string)=>void}) {
  const [step,setStep]       = useState<'amount'|'method'|'confirm'>('amount')
  const [amount,setAmount]   = useState('')
  const [method,setMethod]   = useState<'INTERAC_ETRANSFER'|'DIRECT_DEPOSIT'|''>('')
  const [loading,setLoading] = useState(false)
  const [error,setError]     = useState<string|null>(null)

  const amt = parseFloat(amount)||0
  const isValidAmt = amt >= 10 && amt <= Math.max(balance, 0.01)

  async function submit() {
    setLoading(true); setError(null)
    try {
      const res  = await fetch('/api/driver/wallet/payout',{method:'POST',headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({amount:amt,method})})
      const json = await res.json() as {ok:boolean;publicId?:string;error?:string}
      if (!json.ok) throw new Error(json.error)
      onDone(`✅ Retrait ${money(amt)} soumis (${json.publicId}) — traitement 1-3 jours ouvrables`)
    } catch(e){ setError((e as Error).message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'flex-end',background:'rgba(0,0,0,0.72)'}} onClick={onClose}>
      <div style={{width:'100%',maxHeight:'90vh',overflowY:'auto',background:dark?'#0F1F38':'#FFFFFF',borderRadius:'20px 20px 0 0',padding:'20px 16px 48px'}} onClick={e=>e.stopPropagation()}>
        <div style={{width:40,height:4,borderRadius:2,background:t.border,margin:'0 auto 16px'}}/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <div style={{fontSize:17,fontWeight:800,color:t.text}}>💸 Demande de retrait</div>
          <button onClick={onClose} style={{padding:8,borderRadius:10,background:t.card2,border:`1px solid ${t.border}`,cursor:'pointer'}}><X size={16} color={t.text3}/></button>
        </div>

        {/* Barre progression */}
        <div style={{display:'flex',gap:4,marginBottom:20}}>
          {['amount','method','confirm'].map((s,i)=>(
            <div key={s} style={{flex:1,height:3,borderRadius:2,background:['amount','method','confirm'].indexOf(step)>=i?'#003DA5':t.border,transition:'background 0.3s'}}/>
          ))}
        </div>

        {/* Étape 1 — Montant */}
        {step==='amount'&&(
          <div style={{display:'flex',flexDirection:'column' as const,gap:16}}>
            <div style={{padding:'14px 16px',borderRadius:16,background:'rgba(0,61,165,0.08)',border:`1.5px solid rgba(0,61,165,0.20)`,textAlign:'center' as const}}>
              <div style={{fontSize:10,color:t.text3,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'0.08em',marginBottom:6}}>Solde disponible</div>
              <div style={{fontSize:34,fontWeight:900,color:t.green,letterSpacing:'-0.02em'}}>{money(balance)}</div>
            </div>
            <div>
              <div style={{fontSize:11,color:t.text3,fontWeight:600,marginBottom:6}}>Montant à retirer (min. 10,00 $)</div>
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',fontSize:16,fontWeight:700,color:t.text3}}>$</span>
                <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" min="10" max={balance} step="0.01"
                  style={{width:'100%',padding:'14px 13px 14px 28px',borderRadius:12,border:`2px solid ${isValidAmt?'#003DA5':t.border}`,fontSize:22,fontWeight:800,color:t.text,background:dark?'rgba(5,14,28,0.8)':'#FFFFFF',outline:'none',boxSizing:'border-box' as const}}/>
              </div>
              {/* Raccourcis */}
              <div style={{display:'flex',gap:8,marginTop:10}}>
                {[25,50,100,200].filter(v=>v<=balance+0.01).map(v=>(
                  <button key={v} onClick={()=>setAmount(String(v))} style={{flex:1,padding:'8px',borderRadius:10,fontSize:11,fontWeight:700,cursor:'pointer',background:amount===String(v)?'#003DA5':'transparent',color:amount===String(v)?'white':t.text3,border:`1.5px solid ${amount===String(v)?'#003DA5':t.border}`}}>
                    {money(v)}
                  </button>
                ))}
                <button onClick={()=>setAmount(balance.toFixed(2))} style={{flex:1,padding:'8px',borderRadius:10,fontSize:11,fontWeight:700,cursor:'pointer',background:amount===balance.toFixed(2)?'#003DA5':'transparent',color:amount===balance.toFixed(2)?'white':t.text3,border:`1.5px solid ${amount===balance.toFixed(2)?'#003DA5':t.border}`}}>
                  Tout
                </button>
              </div>
            </div>
            <button onClick={()=>isValidAmt?setStep('method'):setError(amt<10?'Minimum 10 $':`Maximum ${money(balance)}`)}
              style={{padding:'14px',borderRadius:14,background:isValidAmt?'#003DA5':t.border,color:isValidAmt?'white':t.text3,fontWeight:800,fontSize:14,border:'none',cursor:isValidAmt?'pointer':'not-allowed',boxShadow:isValidAmt?'0 4px 16px rgba(0,61,165,0.35)':'none'}}>
              Continuer →
            </button>
            {error&&<div style={{fontSize:11,color:t.red,padding:'8px 12px',borderRadius:8,background:'rgba(220,38,38,0.08)'}}>{error}</div>}
          </div>
        )}

        {/* Étape 2 — Méthode */}
        {step==='method'&&(
          <div style={{display:'flex',flexDirection:'column' as const,gap:14}}>
            <div style={{fontSize:13,fontWeight:700,color:t.text}}>Comment voulez-vous recevoir {money(amt)} ?</div>

            {/* Interac */}
            <button onClick={()=>setMethod('INTERAC_ETRANSFER')} style={{display:'flex',alignItems:'center',gap:14,padding:'16px',borderRadius:16,cursor:'pointer',textAlign:'left' as const,background:method==='INTERAC_ETRANSFER'?'rgba(0,61,165,0.12)':'transparent',border:`2px solid ${method==='INTERAC_ETRANSFER'?'#003DA5':t.border}`,boxShadow:method==='INTERAC_ETRANSFER'?'0 0 0 1px rgba(0,61,165,0.20)':'none'}}>
              <div style={{width:48,height:48,borderRadius:14,background:'rgba(0,61,165,0.12)',border:`1px solid rgba(0,61,165,0.25)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>📧</div>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:t.text}}>Interac e-Transfert</div>
                <div style={{fontSize:11,color:t.text3,marginTop:2}}>Reçu en quelques minutes</div>
                <div style={{fontSize:10,color:t.text3,marginTop:1}}>Votre courriel Interac · Gratuit · 24/7</div>
              </div>
              {method==='INTERAC_ETRANSFER'&&<CheckCircle size={18} color="#003DA5" style={{marginLeft:'auto',flexShrink:0}}/>}
            </button>

            {/* Virement bancaire */}
            <button onClick={()=>setMethod('DIRECT_DEPOSIT')} style={{display:'flex',alignItems:'center',gap:14,padding:'16px',borderRadius:16,cursor:'pointer',textAlign:'left' as const,background:method==='DIRECT_DEPOSIT'?'rgba(0,61,165,0.12)':'transparent',border:`2px solid ${method==='DIRECT_DEPOSIT'?'#003DA5':t.border}`,boxShadow:method==='DIRECT_DEPOSIT'?'0 0 0 1px rgba(0,61,165,0.20)':'none'}}>
              <div style={{width:48,height:48,borderRadius:14,background:'rgba(0,61,165,0.12)',border:`1px solid rgba(0,61,165,0.25)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>🏦</div>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:t.text}}>Virement bancaire direct</div>
                <div style={{fontSize:11,color:t.text3,marginTop:2}}>1-3 jours ouvrables</div>
                <div style={{fontSize:10,color:t.text3,marginTop:1}}>Dépôt direct · Toutes banques canadiennes</div>
              </div>
              {method==='DIRECT_DEPOSIT'&&<CheckCircle size={18} color="#003DA5" style={{marginLeft:'auto',flexShrink:0}}/>}
            </button>

            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setStep('amount')} style={{flex:1,padding:'12px',borderRadius:12,background:t.card2,border:`1px solid ${t.border}`,color:t.text3,fontWeight:700,cursor:'pointer',fontSize:13}}>← Retour</button>
              <button onClick={()=>method?setStep('confirm'):setError('Choisissez une méthode')} style={{flex:2,padding:'12px',borderRadius:12,background:method?'#003DA5':t.border,color:method?'white':t.text3,fontWeight:800,fontSize:13,border:'none',cursor:method?'pointer':'not-allowed',boxShadow:method?'0 4px 12px rgba(0,61,165,0.30)':'none'}}>
                Confirmer →
              </button>
            </div>
          </div>
        )}

        {/* Étape 3 — Confirmation */}
        {step==='confirm'&&(
          <div style={{display:'flex',flexDirection:'column' as const,gap:14}}>
            <div style={{padding:'20px',borderRadius:16,background:'rgba(5,150,105,0.08)',border:'1.5px solid rgba(5,150,105,0.25)',textAlign:'center' as const}}>
              <div style={{fontSize:12,color:t.text3,marginBottom:6}}>Vous allez retirer</div>
              <div style={{fontSize:36,fontWeight:900,color:t.green,letterSpacing:'-0.02em'}}>{money(amt)}</div>
              <div style={{fontSize:11,color:t.text3,marginTop:6}}>par {method==='INTERAC_ETRANSFER'?'Interac e-Transfert':'Virement bancaire direct'}</div>
            </div>
            <div style={{padding:'10px 14px',borderRadius:12,background:'rgba(180,83,9,0.08)',border:'1px solid rgba(180,83,9,0.25)'}}>
              <div style={{fontSize:10,color:t.amber,lineHeight:1.5}}>⚠ Mode pilote — Aucun virement réel ne sera effectué. Cette transaction est enregistrée à titre de démonstration gouvernementale TAXIMETER.GOV.</div>
            </div>
            {error&&<div style={{fontSize:11,color:t.red,padding:'8px 12px',borderRadius:8,background:'rgba(220,38,38,0.08)'}}>{error}</div>}
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setStep('method')} style={{flex:1,padding:'12px',borderRadius:12,background:t.card2,border:`1px solid ${t.border}`,color:t.text3,fontWeight:700,cursor:'pointer',fontSize:13}}>← Retour</button>
              <button onClick={()=>void submit()} disabled={loading} style={{flex:2,padding:'12px',borderRadius:12,background:loading?t.border:'#059669',color:loading?t.text3:'white',fontWeight:800,fontSize:13,border:'none',cursor:loading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:loading?'none':'0 4px 12px rgba(5,150,105,0.30)'}}>
                {loading?<><RefreshCw size={14} style={{animation:'spin 0.8s linear infinite'}}/> Traitement…</>:<>✅ Confirmer le retrait</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Modal: Coordonnées bancaires ──────────────────────────────
function BankModal({t,dark,token,current,onClose,onSaved}:{t:ReturnType<typeof getThemeTokens>;dark:boolean;token:string;current:WalletData['bankInfo'];onClose:()=>void;onSaved:()=>void}) {
  const [method,setMethod]   = useState<'INTERAC_ETRANSFER'|'DIRECT_DEPOSIT'>(current?.method as 'INTERAC_ETRANSFER'|'DIRECT_DEPOSIT'??'INTERAC_ETRANSFER')
  const [email,setEmail]     = useState('')
  const [bank,setBank]       = useState(CANADIAN_BANKS[0]!.name)
  const [instNum,setInstNum] = useState('')
  const [transit,setTransit] = useState('')
  const [account,setAccount] = useState('')
  const [loading,setLoading] = useState(false)
  const [error,setError]     = useState<string|null>(null)

  async function save() {
    setLoading(true); setError(null)
    try {
      const body: Record<string,string> = { method }
      if (method==='INTERAC_ETRANSFER') {
        if (!email.includes('@')) throw new Error('Courriel invalide')
        body['interacEmail'] = email
      } else {
        if (transit.length!==5) throw new Error('Numéro de transit: 5 chiffres')
        if (account.length<7)   throw new Error('Numéro de compte: 7-12 chiffres')
        body['institutionName']   = bank
        body['institutionNumber'] = instNum
        body['transitNumber']     = transit
        body['accountNumber']     = account
      }
      const res  = await fetch('/api/driver/wallet/bank',{method:'POST',headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)})
      const json = await res.json() as {ok:boolean;error?:string}
      if (!json.ok) throw new Error(json.error)
      onSaved()
    } catch(e){ setError((e as Error).message) }
    finally { setLoading(false) }
  }

  const inp = (label:string,val:string,onChange:(v:string)=>void,placeholder='',type='text',maxLen?:number) => (
    <div>
      <div style={{fontSize:11,color:t.text3,fontWeight:600,marginBottom:5}}>{label}</div>
      <input type={type} value={val} onChange={e=>onChange(e.target.value)} placeholder={placeholder} maxLength={maxLen}
        style={{width:'100%',padding:'11px 13px',borderRadius:10,border:`1.5px solid ${t.border}`,fontSize:13,color:t.text,background:dark?'rgba(5,14,28,0.8)':'#FFFFFF',outline:'none',boxSizing:'border-box' as const}}/>
    </div>
  )

  return (
    <div style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'flex-end',background:'rgba(0,0,0,0.72)'}} onClick={onClose}>
      <div style={{width:'100%',maxHeight:'92vh',overflowY:'auto',background:dark?'#0F1F38':'#FFFFFF',borderRadius:'20px 20px 0 0',padding:'20px 16px 48px'}} onClick={e=>e.stopPropagation()}>
        <div style={{width:40,height:4,borderRadius:2,background:t.border,margin:'0 auto 16px'}}/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <div style={{fontSize:17,fontWeight:800,color:t.text}}>🏦 Coordonnées bancaires</div>
          <button onClick={onClose} style={{padding:8,borderRadius:10,background:t.card2,border:`1px solid ${t.border}`,cursor:'pointer'}}><X size={16} color={t.text3}/></button>
        </div>

        {/* Avertissement sécurité */}
        <div style={{padding:'10px 14px',borderRadius:12,background:'rgba(5,150,105,0.08)',border:'1px solid rgba(5,150,105,0.25)',marginBottom:16}}>
          <div style={{fontSize:10,color:t.green,lineHeight:1.5}}>🔒 Vos coordonnées sont masquées avant stockage. Seuls les 4 derniers chiffres du compte et le transit sont conservés.</div>
        </div>

        {/* Sélection méthode */}
        <div style={{display:'flex',gap:8,marginBottom:18}}>
          {[{v:'INTERAC_ETRANSFER' as const,l:'📧 Interac'},{v:'DIRECT_DEPOSIT' as const,l:'🏦 Virement'}].map(m=>(
            <button key={m.v} onClick={()=>setMethod(m.v)} style={{flex:1,padding:'10px',borderRadius:12,fontSize:12,fontWeight:700,cursor:'pointer',background:method===m.v?'#003DA5':'transparent',color:method===m.v?'white':t.text3,border:`2px solid ${method===m.v?'#003DA5':t.border}`}}>{m.l}</button>
          ))}
        </div>

        {/* Formulaire Interac */}
        {method==='INTERAC_ETRANSFER'&&(
          <div style={{display:'flex',flexDirection:'column' as const,gap:14}}>
            <div style={{padding:'10px 14px',borderRadius:12,background:dark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)',border:`1px solid ${t.border}`}}>
              <div style={{fontSize:11,fontWeight:700,color:t.text2,marginBottom:4}}>📧 Interac e-Transfert</div>
              <div style={{fontSize:10,color:t.text3,lineHeight:1.5}}>Le montant sera envoyé à votre adresse courriel inscrite à Interac. Assurez-vous que votre banque est inscrite au dépôt automatique.</div>
            </div>
            {inp('Courriel Interac *',email,setEmail,'chauffeur@exemple.com','email')}
          </div>
        )}

        {/* Formulaire virement direct */}
        {method==='DIRECT_DEPOSIT'&&(
          <div style={{display:'flex',flexDirection:'column' as const,gap:12}}>
            <div style={{padding:'10px 14px',borderRadius:12,background:dark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)',border:`1px solid ${t.border}`}}>
              <div style={{fontSize:11,fontWeight:700,color:t.text2,marginBottom:4}}>🏦 Dépôt direct bancaire</div>
              <div style={{fontSize:10,color:t.text3,lineHeight:1.5}}>Retrouvez ces informations sur un chèque annulé ou dans votre application bancaire.</div>
            </div>
            <div>
              <div style={{fontSize:11,color:t.text3,fontWeight:600,marginBottom:6}}>Institution bancaire *</div>
              <select value={bank} onChange={e=>{ const b=CANADIAN_BANKS.find(b=>b.name===e.target.value); setBank(e.target.value); if(b)setInstNum(b.inst) }}
                style={{width:'100%',padding:'11px 13px',borderRadius:10,border:`1.5px solid ${t.border}`,fontSize:13,color:t.text,background:dark?'rgba(5,14,28,0.8)':'#FFFFFF',outline:'none'}}>
                {CANADIAN_BANKS.map(b=><option key={b.inst} value={b.name}>{b.name}</option>)}
              </select>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {inp('No. institution (3 ch.)',instNum,setInstNum,'ex: 004','text',3)}
              {inp('No. transit (5 ch.) *',transit,setTransit,'ex: 12345','text',5)}
            </div>
            {inp('No. de compte (7-12 ch.) *',account,setAccount,'ex: 1234567','text',12)}
            <div style={{fontSize:10,color:t.text3,padding:'8px 12px',borderRadius:8,background:dark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.03)'}}>
              💡 Trouvez ces numéros sur un chèque: ⑆ transit ⑆ institution ⑆ compte ⑆
            </div>
          </div>
        )}

        <div style={{marginTop:18,display:'flex',flexDirection:'column' as const,gap:10}}>
          <div style={{padding:'10px 13px',borderRadius:10,background:'rgba(180,83,9,0.08)',border:'1px solid rgba(180,83,9,0.25)'}}>
            <div style={{fontSize:9,color:t.amber,lineHeight:1.5}}>⚠ Mode pilote — Aucun virement réel. Vos coordonnées sont masquées avant stockage.</div>
          </div>
          {error&&<div style={{fontSize:11,color:t.red,padding:'8px 12px',borderRadius:8,background:'rgba(220,38,38,0.08)'}}>{error}</div>}
          <button onClick={()=>void save()} disabled={loading} style={{padding:'14px',borderRadius:14,background:loading?t.border:'#003DA5',color:loading?t.text3:'white',fontWeight:800,fontSize:14,border:'none',cursor:loading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,boxShadow:loading?'none':'0 4px 16px rgba(0,61,165,0.35)'}}>
            {loading?<><RefreshCw size={14} style={{animation:'spin 0.8s linear infinite'}}/> Sauvegarde…</>:<>🔒 Sauvegarder les coordonnées</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page Wallet principale ───────────────────────────────────
export default function WalletPage() {
  const [data,setData]           = useState<WalletData|null>(null)
  const [loading,setLoading]     = useState(true)
  const [token,setToken]         = useState('')
  const [showPayout,setShowPayout] = useState(false)
  const [showBank,setShowBank]   = useState(false)
  const [tab,setTab]             = useState<'wallet'|'history'|'payouts'>('wallet')
  const [toast,setToast]         = useState<string|null>(null)
  const { theme } = useTheme()
  const dark = theme==='dark'
  const t = getThemeTokens(dark)

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(null),5000) }

  const load = useCallback(async () => {
    setLoading(true)
    const sb = getSupabaseBrowserClient()
    const { data:{session} } = await sb.auth.getSession()
    if (!session?.access_token) { setLoading(false); return }
    setToken(session.access_token)
    const res  = await fetch('/api/driver/wallet/balance',{ headers:{ Authorization:`Bearer ${session.access_token}` } })
    const json = await res.json() as WalletData & {ok:boolean}
    if (json.ok) setData(json)
    setLoading(false)
  },[])

  useEffect(()=>{ void load() },[load])

  if (loading) return (
    <AppShell>
      <div style={{minHeight:'70vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <TaximetreGovLoader message="Chargement du wallet…"/>
      </div>
    </AppShell>
  )

  const balance = data?.balance ?? 0
  const pending = data?.pendingAmount ?? 0

  return (
    <AppShell>
      {/* Toast */}
      {toast&&<div style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',zIndex:400,background:'#059669',color:'white',padding:'10px 20px',borderRadius:14,fontSize:11,fontWeight:700,boxShadow:'0 4px 20px rgba(5,150,105,0.45)',maxWidth:'90%',textAlign:'center' as const,lineHeight:1.5}}>{toast}</div>}

      {showPayout&&<PayoutModal t={t} dark={dark} balance={balance} token={token} onClose={()=>setShowPayout(false)} onDone={msg=>{ showToast(msg); setShowPayout(false); void load() }}/>}
      {showBank&&<BankModal t={t} dark={dark} token={token} current={data?.bankInfo??null} onClose={()=>setShowBank(false)} onSaved={()=>{ showToast('✅ Coordonnées bancaires sauvegardées'); setShowBank(false); void load() }}/>}

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 16px 12px'}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:800,color:t.text,margin:0,letterSpacing:'-0.01em'}}>Wallet & Paiements</h1>
          <p style={{fontSize:11,color:t.text3,margin:'3px 0 0'}}>CAD · Québec · TAXIMÈTRE.GOV</p>
        </div>
        <button onClick={()=>void load()} style={{width:38,height:38,borderRadius:12,background:t.card,border:`1.5px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          <RefreshCw size={16} color={t.accent}/>
        </button>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,padding:'0 16px 14px'}}>
        {[{k:'wallet' as const,l:'💳 Wallet'},{k:'history' as const,l:'📋 Activité'},{k:'payouts' as const,l:'📤 Retraits'}].map(tb=>(
          <button key={tb.k} onClick={()=>setTab(tb.k)} style={{flex:1,padding:'9px 6px',borderRadius:12,fontSize:11,fontWeight:700,border:'none',cursor:'pointer',transition:'all 0.15s',background:tab===tb.k?'#003DA5':(dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.04)'),color:tab===tb.k?'#FFFFFF':t.text3,boxShadow:tab===tb.k?'0 4px 12px rgba(0,61,165,0.30)':'none'}}>{tb.l}</button>
        ))}
      </div>

      <div style={{padding:'0 16px',display:'flex',flexDirection:'column' as const,gap:14,paddingBottom:40}}>

        {/* ── TAB WALLET ── */}
        {tab==='wallet'&&(
          <>
            {/* Solde hero */}
            <div style={{borderRadius:20,background:'linear-gradient(135deg,#003DA5 0%,#0B4F71 100%)',boxShadow:'0 8px 32px rgba(0,61,165,0.35)',padding:'22px 20px',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:-10,right:8,fontSize:100,color:'rgba(255,255,255,0.05)',pointerEvents:'none'}}>⚜</div>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.12em',color:'rgba(255,255,255,0.60)',textTransform:'uppercase' as const,marginBottom:4}}>💳 SOLDE DISPONIBLE</div>
              <div style={{fontSize:46,fontWeight:900,color:'#FFFFFF',letterSpacing:'-0.03em',lineHeight:1.1,marginBottom:8}}>{money(balance)}</div>
              {pending>0&&<div style={{fontSize:11,color:'rgba(255,255,255,0.65)',marginBottom:16}}>+ {money(pending)} en attente de traitement</div>}
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>balance>=10?setShowPayout(true):showToast('Solde minimum 10 $ requis pour un retrait')} style={{flex:2,padding:'12px',borderRadius:13,background:balance>=10?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.25)',color:'white',fontWeight:700,fontSize:13,cursor:balance>=10?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                  <ArrowUpRight size={16}/> Retirer
                </button>
                <button onClick={()=>setShowBank(true)} style={{flex:1,padding:'12px',borderRadius:13,background:'rgba(255,255,255,0.10)',border:'1px solid rgba(255,255,255,0.25)',color:'white',fontWeight:700,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  <Building size={14}/> Banque
                </button>
              </div>
            </div>

            {/* Coordonnées bancaires */}
            <div>
              <SectionTitle title="Méthodes de paiement" t={t}/>
              {data?.bankInfo ? (
                <div style={{...cardStyle(t),padding:'14px 16px',borderLeft:`3px solid ${t.accent}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:38,height:38,borderRadius:11,background:'rgba(0,61,165,0.10)',border:`1px solid ${t.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
                      {data.bankInfo.method==='INTERAC_ETRANSFER'?'📧':'🏦'}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:t.text}}>
                        {data.bankInfo.method==='INTERAC_ETRANSFER'?'Interac e-Transfert':'Virement bancaire direct'}
                      </div>
                      <div style={{fontSize:11,color:t.text3,marginTop:2}}>
                        {data.bankInfo.method==='INTERAC_ETRANSFER'
                          ? data.bankInfo.interac_email_masked
                          : `${data.bankInfo.institution_name} · Transit: ${data.bankInfo.transit_masked} · Compte: ${data.bankInfo.account_masked}`
                        }
                      </div>
                    </div>
                    <button onClick={()=>setShowBank(true)} style={{fontSize:11,fontWeight:700,color:t.accent,background:'none',border:'none',cursor:'pointer'}}>Modifier</button>
                  </div>
                </div>
              ) : (
                <button onClick={()=>setShowBank(true)} style={{...cardStyle(t),padding:'16px',width:'100%',cursor:'pointer',display:'flex',alignItems:'center',gap:14,border:`2px dashed ${t.border}`,background:'transparent'}}>
                  <div style={{width:40,height:40,borderRadius:12,background:'rgba(0,61,165,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🏦</div>
                  <div style={{textAlign:'left' as const}}>
                    <div style={{fontSize:13,fontWeight:700,color:t.text}}>Ajouter vos coordonnées bancaires</div>
                    <div style={{fontSize:11,color:t.text3,marginTop:2}}>Interac e-Transfert ou virement bancaire direct</div>
                  </div>
                  <CreditCard size={16} color={t.accent} style={{marginLeft:'auto'}}/>
                </button>
              )}
            </div>

            {/* Activité récente */}
            {(data?.recentActivity??[]).length>0&&(
              <div>
                <SectionTitle title="Revenus récents (30 jours)" t={t}/>
                <div style={{...cardStyle(t),overflow:'hidden'}}>
                  {(data?.recentActivity??[]).map((act,idx)=>(
                    <div key={idx} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 14px',borderTop:idx>0?`1px solid ${t.border}`:'none'}}>
                      <span style={{fontSize:20}}>{SRC_ICON[act.source_type]??SRC_ICON.DEFAULT}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:600,color:t.text}}>{act.source_type}</div>
                        <div style={{fontSize:10,color:t.text3}}>{fmtDate(act.activity_date)}</div>
                      </div>
                      <div style={{fontSize:13,fontWeight:800,color:t.green}}>+{money(act.gross_amount)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note pilote */}
            <div style={{padding:'12px 14px',borderRadius:12,background:'rgba(180,83,9,0.07)',border:'1px solid rgba(180,83,9,0.20)'}}>
              <div style={{fontSize:10,color:t.amber,lineHeight:1.5}}>🏛️ Mode pilote TAXIMETER.GOV — Le solde est calculé à partir du revenue ledger. Les retraits sont simulés. Aucun virement bancaire réel n'est effectué durant cette phase de démonstration gouvernementale.</div>
            </div>
          </>
        )}

        {/* ── TAB ACTIVITÉ (entrées wallet) ── */}
        {tab==='history'&&(
          <>
            <SectionTitle title="Entrées du wallet" t={t}/>
            {(data?.entries??[]).length===0 ? (
              <div style={{...cardStyle(t),padding:'40px 0',textAlign:'center'}}>
                <ArrowDownLeft size={36} color={t.text3} style={{margin:'0 auto 12px',display:'block'}}/>
                <div style={{fontSize:13,color:t.text3}}>Aucune entrée wallet pour l'instant</div>
              </div>
            ) : (
              <div style={{...cardStyle(t),overflow:'hidden'}}>
                {(data?.entries??[]).map((e,idx)=>(
                  <div key={e.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderTop:idx>0?`1px solid ${t.border}`:'none'}}>
                    <div style={{width:36,height:36,borderRadius:10,background:e.direction==='CREDIT'?'rgba(5,150,105,0.12)':'rgba(220,38,38,0.10)',border:`1px solid ${e.direction==='CREDIT'?'rgba(5,150,105,0.25)':'rgba(220,38,38,0.25)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      {e.direction==='CREDIT'?<ArrowDownLeft size={16} color="#059669"/>:<ArrowUpRight size={16} color="#DC2626"/>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:600,color:t.text,lineHeight:1.3}}>{e.description}</div>
                      <div style={{fontSize:9,color:t.text3,marginTop:2}}>{fmtDate(e.created_at)} · {e.entry_type}</div>
                    </div>
                    <div style={{fontSize:14,fontWeight:800,color:e.direction==='CREDIT'?t.green:t.red,flexShrink:0}}>
                      {e.direction==='CREDIT'?'+':'-'}{money(e.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TAB RETRAITS ── */}
        {tab==='payouts'&&(
          <>
            <button onClick={()=>balance>=10?setShowPayout(true):showToast('Solde minimum 10 $ requis')} style={{padding:'14px',borderRadius:14,background:'#003DA5',color:'white',fontWeight:800,fontSize:14,border:'none',cursor:'pointer',boxShadow:'0 4px 16px rgba(0,61,165,0.35)',display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
              <ArrowUpRight size={18}/> Demander un retrait
            </button>
            <SectionTitle title="Historique des retraits" t={t}/>
            {(data?.payouts??[]).length===0 ? (
              <div style={{...cardStyle(t),padding:'40px 0',textAlign:'center'}}>
                <ArrowUpRight size={36} color={t.text3} style={{margin:'0 auto 12px',display:'block'}}/>
                <div style={{fontSize:13,color:t.text3}}>Aucun retrait effectué</div>
              </div>
            ) : (
              <div style={{...cardStyle(t),overflow:'hidden'}}>
                {(data?.payouts??[]).map((p,idx)=>{
                  const sc = PAYOUT_STATUS[p.status]??PAYOUT_STATUS['PENDING']!
                  return (
                    <div key={p.id} style={{padding:'13px 15px',borderTop:idx>0?`1px solid ${t.border}`:'none',borderLeft:`3px solid ${sc.color}`}}>
                      <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                            <span style={{fontSize:12,fontWeight:700,color:t.text,fontFamily:'monospace'}}>{p.public_payout_id}</span>
                            <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:20,background:sc.bg,color:sc.color}}>{sc.icon} {sc.label}</span>
                          </div>
                          <div style={{fontSize:10,color:t.text3}}>{p.payout_method==='INTERAC_ETRANSFER'?'📧 Interac e-Transfert':'🏦 Virement bancaire'}</div>
                          <div style={{fontSize:10,color:t.text3,marginTop:2}}>{fmtDate(p.requested_at)}</div>
                          {p.failure_code&&<div style={{fontSize:10,color:t.red,marginTop:2}}>Erreur: {p.failure_code}</div>}
                        </div>
                        <div style={{fontSize:16,fontWeight:900,color:t.text,flexShrink:0}}>{money(p.requested_amount)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
