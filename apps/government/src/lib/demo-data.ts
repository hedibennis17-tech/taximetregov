// TAXIMETER.GOV — Données synthétiques pilote partagées entre tous les modules
// PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE TRANSMISSION OFFICIELLE

export const DEMO_PROVIDERS = [
  { id:'DEMO-PROV-UBER',      code:'UBER',      name:'Uber',       type:'TRANSPORT',  icon:'⬛', color:'#000000', status:'CONNECTED_DEMO', api:'DEMO',  oauth:'DEMO', webhook:'DEMO', lastSync:'2026-09-17T08:42:00Z', txToday:24, errorCount:0,  quality:99.2 },
  { id:'DEMO-PROV-LYFT',      code:'LYFT',      name:'Lyft',       type:'TRANSPORT',  icon:'🟣', color:'#FF00BF', status:'CONNECTED_DEMO', api:'DEMO',  oauth:'DEMO', webhook:'DEMO', lastSync:'2026-09-17T08:38:00Z', txToday:18, errorCount:1,  quality:98.1 },
  { id:'DEMO-PROV-DOORDASH',  code:'DOORDASH',  name:'DoorDash',   type:'DELIVERY',   icon:'🔴', color:'#FF3008', status:'CONNECTED_DEMO', api:'DEMO',  oauth:'DEMO', webhook:'DEMO', lastSync:'2026-09-17T08:35:00Z', txToday:31, errorCount:0,  quality:99.7 },
  { id:'DEMO-PROV-INSTACART', code:'INSTACART', name:'Instacart',  type:'DELIVERY',   icon:'🟢', color:'#43B02A', status:'CONNECTED_DEMO', api:'DEMO',  oauth:'DEMO', webhook:'DEMO', lastSync:'2026-09-17T08:30:00Z', txToday:12, errorCount:0,  quality:100  },
  { id:'DEMO-PROV-UBEREATS',  code:'UBER_EATS', name:'Uber Eats',  type:'DELIVERY',   icon:'🟡', color:'#06C167', status:'CONNECTED_DEMO', api:'DEMO',  oauth:'DEMO', webhook:'DEMO', lastSync:'2026-09-17T08:25:00Z', txToday:22, errorCount:2,  quality:97.3 },
  { id:'DEMO-PROV-SKIP',      code:'SKIP',      name:'SkipTheDishes',type:'DELIVERY', icon:'🟠', color:'#FF6600', status:'SIMULATION',     api:'PILOT', oauth:'N/A',  webhook:'N/A',  lastSync:null,                   txToday:0,  errorCount:0,  quality:null },
]

export const DEMO_DRIVERS = [
  { id:'DEMO-DRV-001', number:'DRV-QC-0001', name:'Hedi Bennis',       status:'ACTIVE' },
  { id:'DEMO-DRV-002', number:'DRV-QC-0002', name:'Mohammed El-Amine', status:'ACTIVE' },
  { id:'DEMO-DRV-003', number:'DRV-QC-0003', name:'Sofia Lapointe',    status:'ACTIVE' },
]

const TPS = 0.05; const TVQ = 0.09975
const r2 = (n:number) => Math.round(n*100)/100
const d = (s:string) => s

// 30 transactions synthétiques cohérentes
export const DEMO_TRANSACTIONS = [
  // Uber
  { id:'TX-DEMO-1001', actId:'ACT-DEMO-001', whId:'WH-DEMO-0001', driver:'DEMO-DRV-001', provider:'UBER',      service:'UberX',      at:d('2026-09-17T08:41:00Z'), clientAmt:50.00, base:31.00, tip:5.00, fee:6.20, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-001' },
  { id:'TX-DEMO-1002', actId:'ACT-DEMO-002', whId:'WH-DEMO-0002', driver:'DEMO-DRV-001', provider:'UBER',      service:'UberX',      at:d('2026-09-17T07:22:00Z'), clientAmt:35.50, base:22.00, tip:3.00, fee:4.40, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-001' },
  { id:'TX-DEMO-1003', actId:'ACT-DEMO-003', whId:'WH-DEMO-0003', driver:'DEMO-DRV-002', provider:'UBER',      service:'UberX',      at:d('2026-09-17T06:15:00Z'), clientAmt:28.00, base:17.50, tip:2.50, fee:3.50, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-001' },
  { id:'TX-DEMO-1004', actId:'ACT-DEMO-004', whId:'WH-DEMO-0004', driver:'DEMO-DRV-001', provider:'UBER',      service:'UberXL',     at:d('2026-09-16T21:30:00Z'), clientAmt:72.00, base:45.00, tip:7.00, fee:9.00, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-001' },
  { id:'TX-DEMO-1005', actId:'ACT-DEMO-005', whId:'WH-DEMO-0005', driver:'DEMO-DRV-003', provider:'UBER',      service:'UberX',      at:d('2026-09-16T18:10:00Z'), clientAmt:22.00, base:14.00, tip:0,    fee:2.80, adj:-2.00, refund:0,    period:'2026-Q3', status:'REVIEW_REQUIRED',      rec:'REC-DEMO-002' },
  // Lyft
  { id:'TX-DEMO-1006', actId:'ACT-DEMO-006', whId:'WH-DEMO-0006', driver:'DEMO-DRV-001', provider:'LYFT',      service:'Standard',   at:d('2026-09-17T08:05:00Z'), clientAmt:31.00, base:19.50, tip:2.00, fee:3.90, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-002' },
  { id:'TX-DEMO-1007', actId:'ACT-DEMO-007', whId:'WH-DEMO-0007', driver:'DEMO-DRV-002', provider:'LYFT',      service:'Standard',   at:d('2026-09-17T07:45:00Z'), clientAmt:18.50, base:12.00, tip:1.50, fee:2.40, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-002' },
  { id:'TX-DEMO-1008', actId:'ACT-DEMO-008', whId:'WH-DEMO-0008', driver:'DEMO-DRV-001', provider:'LYFT',      service:'XL',         at:d('2026-09-16T20:00:00Z'), clientAmt:58.00, base:37.00, tip:4.00, fee:7.40, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-002' },
  { id:'TX-DEMO-1009', actId:'ACT-DEMO-009', whId:'WH-DEMO-0009', driver:'DEMO-DRV-003', provider:'LYFT',      service:'Standard',   at:d('2026-09-16T15:30:00Z'), clientAmt:25.00, base:16.00, tip:0,    fee:3.20, adj:0,    refund:-5.00,period:'2026-Q3', status:'REFUND_PROCESSED',     rec:'REC-DEMO-002' },
  { id:'TX-DEMO-1010', actId:'ACT-DEMO-010', whId:'WH-DEMO-0010', driver:'DEMO-DRV-002', provider:'LYFT',      service:'Standard',   at:d('2026-09-16T12:20:00Z'), clientAmt:19.00, base:12.50, tip:1.00, fee:2.50, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-002' },
  // TAXI
  { id:'TX-DEMO-1011', actId:'ACT-DEMO-011', whId:null,           driver:'DEMO-DRV-001', provider:'TAXI',      service:'Taxi',       at:d('2026-09-17T08:20:00Z'), clientAmt:38.50, base:38.50, tip:4.00, fee:0,    adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-003' },
  { id:'TX-DEMO-1012', actId:'ACT-DEMO-012', whId:null,           driver:'DEMO-DRV-002', provider:'TAXI',      service:'Taxi',       at:d('2026-09-17T07:00:00Z'), clientAmt:55.00, base:55.00, tip:6.00, fee:0,    adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-003' },
  { id:'TX-DEMO-1013', actId:'ACT-DEMO-013', whId:null,           driver:'DEMO-DRV-003', provider:'TAXI',      service:'Taxi',       at:d('2026-09-16T22:15:00Z'), clientAmt:42.00, base:42.00, tip:5.00, fee:0,    adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-003' },
  { id:'TX-DEMO-1014', actId:'ACT-DEMO-014', whId:null,           driver:'DEMO-DRV-001', provider:'TAXI',      service:'Taxi',       at:d('2026-09-16T19:45:00Z'), clientAmt:28.00, base:28.00, tip:3.00, fee:0,    adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-003' },
  { id:'TX-DEMO-1015', actId:'ACT-DEMO-015', whId:null,           driver:'DEMO-DRV-002', provider:'TAXI',      service:'Taxi',       at:d('2026-09-16T16:30:00Z'), clientAmt:33.00, base:33.00, tip:0,    fee:0,    adj:0,    refund:0,    period:'2026-Q3', status:'MISSING_TIP_DATA',     rec:'REC-DEMO-004' },
  // DoorDash
  { id:'TX-DEMO-1016', actId:'ACT-DEMO-016', whId:'WH-DEMO-0011', driver:'DEMO-DRV-001', provider:'DOORDASH',  service:'Delivery',   at:d('2026-09-17T12:30:00Z'), clientAmt:24.00, base:14.50, tip:3.00, fee:2.90, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-005' },
  { id:'TX-DEMO-1017', actId:'ACT-DEMO-017', whId:'WH-DEMO-0012', driver:'DEMO-DRV-002', provider:'DOORDASH',  service:'Delivery',   at:d('2026-09-17T11:15:00Z'), clientAmt:18.50, base:11.00, tip:2.00, fee:2.20, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-005' },
  { id:'TX-DEMO-1018', actId:'ACT-DEMO-018', whId:'WH-DEMO-0013', driver:'DEMO-DRV-001', provider:'DOORDASH',  service:'Delivery',   at:d('2026-09-17T10:00:00Z'), clientAmt:31.00, base:19.00, tip:4.00, fee:3.80, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-005' },
  { id:'TX-DEMO-1019', actId:'ACT-DEMO-019', whId:'WH-DEMO-0014', driver:'DEMO-DRV-003', provider:'DOORDASH',  service:'Delivery',   at:d('2026-09-16T19:00:00Z'), clientAmt:15.00, base:9.00,  tip:1.00, fee:1.80, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-005' },
  { id:'TX-DEMO-1020', actId:'ACT-DEMO-020', whId:'WH-DEMO-0015', driver:'DEMO-DRV-001', provider:'DOORDASH',  service:'Delivery',   at:d('2026-09-16T14:30:00Z'), clientAmt:22.00, base:13.00, tip:2.50, fee:2.60, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-005' },
  // Instacart
  { id:'TX-DEMO-1021', actId:'ACT-DEMO-021', whId:'WH-DEMO-0016', driver:'DEMO-DRV-002', provider:'INSTACART', service:'Grocery',    at:d('2026-09-17T13:00:00Z'), clientAmt:45.00, base:28.00, tip:5.00, fee:5.60, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-005' },
  { id:'TX-DEMO-1022', actId:'ACT-DEMO-022', whId:'WH-DEMO-0017', driver:'DEMO-DRV-003', provider:'INSTACART', service:'Grocery',    at:d('2026-09-16T11:00:00Z'), clientAmt:62.00, base:39.00, tip:6.00, fee:7.80, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-005' },
  { id:'TX-DEMO-1023', actId:'ACT-DEMO-023', whId:'WH-DEMO-0018', driver:'DEMO-DRV-001', provider:'INSTACART', service:'Grocery',    at:d('2026-09-15T14:30:00Z'), clientAmt:38.00, base:24.00, tip:3.00, fee:4.80, adj:0,    refund:0,    period:'2026-Q3', status:'AMOUNT_DIFFERENCE',    rec:'REC-DEMO-004' },
  // Uber Eats
  { id:'TX-DEMO-1024', actId:'ACT-DEMO-024', whId:'WH-DEMO-0019', driver:'DEMO-DRV-001', provider:'UBER_EATS', service:'Delivery',   at:d('2026-09-17T12:00:00Z'), clientAmt:29.00, base:18.00, tip:2.00, fee:3.60, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-005' },
  { id:'TX-DEMO-1025', actId:'ACT-DEMO-025', whId:'WH-DEMO-0020', driver:'DEMO-DRV-002', provider:'UBER_EATS', service:'Delivery',   at:d('2026-09-17T09:30:00Z'), clientAmt:21.50, base:13.00, tip:1.50, fee:2.60, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-005' },
  { id:'TX-DEMO-1026', actId:'ACT-DEMO-026', whId:'WH-DEMO-0021', driver:'DEMO-DRV-003', provider:'UBER_EATS', service:'Delivery',   at:d('2026-09-16T20:45:00Z'), clientAmt:35.00, base:22.00, tip:3.00, fee:4.40, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-005' },
  { id:'TX-DEMO-1027', actId:'ACT-DEMO-027', whId:'WH-DEMO-0022', driver:'DEMO-DRV-001', provider:'UBER_EATS', service:'Delivery',   at:d('2026-09-16T18:00:00Z'), clientAmt:19.00, base:12.00, tip:0,    fee:2.40, adj:0,    refund:0,    period:'2026-Q3', status:'MISSING_TIP_DATA',     rec:'REC-DEMO-004' },
  { id:'TX-DEMO-1028', actId:'ACT-DEMO-028', whId:'WH-DEMO-0023', driver:'DEMO-DRV-002', provider:'UBER_EATS', service:'Delivery',   at:d('2026-09-15T13:30:00Z'), clientAmt:27.00, base:17.00, tip:2.00, fee:3.40, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-005' },
  { id:'TX-DEMO-1029', actId:'ACT-DEMO-029', whId:'WH-DEMO-0024', driver:'DEMO-DRV-001', provider:'UBER',      service:'UberX',      at:d('2026-09-15T10:00:00Z'), clientAmt:44.00, base:28.00, tip:4.00, fee:5.60, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-001' },
  { id:'TX-DEMO-1030', actId:'ACT-DEMO-030', whId:'WH-DEMO-0025', driver:'DEMO-DRV-003', provider:'LYFT',      service:'Standard',   at:d('2026-09-15T08:30:00Z'), clientAmt:16.00, base:10.50, tip:1.00, fee:2.10, adj:0,    refund:0,    period:'2026-Q3', status:'RECONCILED',          rec:'REC-DEMO-002' },
].map(tx => {
  const tps = r2((tx.base + tx.tip) * TPS)
  const tvq = r2((tx.base + tx.tip) * TVQ)
  const driverNet = r2(tx.base + tx.tip - tx.fee + tx.adj + tx.refund)
  return { ...tx, tps, tvq, driverNet }
})

export const DEMO_WEBHOOKS = [
  { id:'WH-DEMO-0001', provider:'UBER',      eventType:'TRIP_COMPLETED',   txId:'TX-DEMO-1001', received:'2026-09-17T08:41:12Z', processed:'2026-09-17T08:41:13Z', sig:'VALID',   dup:false, status:'PROCESSED'          },
  { id:'WH-DEMO-0002', provider:'UBER',      eventType:'TIP_ADDED',        txId:'TX-DEMO-1001', received:'2026-09-17T08:41:20Z', processed:'2026-09-17T08:41:21Z', sig:'VALID',   dup:false, status:'PROCESSED'          },
  { id:'WH-DEMO-0003', provider:'UBER',      eventType:'PAYMENT_CAPTURED', txId:'TX-DEMO-1002', received:'2026-09-17T07:22:05Z', processed:'2026-09-17T07:22:06Z', sig:'VALID',   dup:false, status:'PROCESSED'          },
  { id:'WH-DEMO-0004', provider:'UBER',      eventType:'TRIP_COMPLETED',   txId:'TX-DEMO-1003', received:'2026-09-17T06:15:30Z', processed:'2026-09-17T06:15:31Z', sig:'VALID',   dup:false, status:'PROCESSED'          },
  { id:'WH-DEMO-0005', provider:'UBER',      eventType:'TRIP_COMPLETED',   txId:'TX-DEMO-1004', received:'2026-09-16T21:30:10Z', processed:'2026-09-16T21:30:11Z', sig:'VALID',   dup:false, status:'PROCESSED'          },
  { id:'WH-DEMO-0006', provider:'LYFT',      eventType:'TRIP_COMPLETED',   txId:'TX-DEMO-1006', received:'2026-09-17T08:05:15Z', processed:'2026-09-17T08:05:16Z', sig:'VALID',   dup:false, status:'PROCESSED'          },
  { id:'WH-DEMO-0007', provider:'LYFT',      eventType:'PAYMENT_CAPTURED', txId:'TX-DEMO-1007', received:'2026-09-17T07:45:20Z', processed:'2026-09-17T07:45:21Z', sig:'VALID',   dup:false, status:'PROCESSED'          },
  { id:'WH-DEMO-0008', provider:'LYFT',      eventType:'TIP_ADDED',        txId:'TX-DEMO-1008', received:'2026-09-16T20:00:30Z', processed:'2026-09-16T20:00:31Z', sig:'VALID',   dup:false, status:'PROCESSED'          },
  { id:'WH-DEMO-0009', provider:'LYFT',      eventType:'REFUND',           txId:'TX-DEMO-1009', received:'2026-09-16T15:31:00Z', processed:'2026-09-16T15:31:02Z', sig:'VALID',   dup:false, status:'PROCESSED'          },
  { id:'WH-DEMO-0010', provider:'LYFT',      eventType:'TRIP_COMPLETED',   txId:'TX-DEMO-1010', received:'2026-09-16T12:21:00Z', processed:'2026-09-16T12:21:01Z', sig:'VALID',   dup:true,  status:'DUPLICATE_DETECTED' },
  { id:'WH-DEMO-0011', provider:'DOORDASH',  eventType:'DELIVERY_COMPLETED',txId:'TX-DEMO-1016',received:'2026-09-17T12:30:05Z', processed:'2026-09-17T12:30:06Z', sig:'VALID',   dup:false, status:'PROCESSED'          },
  { id:'WH-DEMO-0012', provider:'DOORDASH',  eventType:'TIP_ADDED',        txId:'TX-DEMO-1017', received:'2026-09-17T11:15:10Z', processed:'2026-09-17T11:15:11Z', sig:'VALID',   dup:false, status:'PROCESSED'          },
  { id:'WH-DEMO-0013', provider:'DOORDASH',  eventType:'PAYMENT_CAPTURED', txId:'TX-DEMO-1018', received:'2026-09-17T10:00:15Z', processed:'2026-09-17T10:00:16Z', sig:'VALID',   dup:false, status:'PROCESSED'          },
  { id:'WH-DEMO-0014', provider:'DOORDASH',  eventType:'DELIVERY_COMPLETED',txId:'TX-DEMO-1019',received:'2026-09-16T19:00:05Z', processed:null,                   sig:'PENDING', dup:false, status:'VALIDATION_PENDING' },
  { id:'WH-DEMO-0015', provider:'DOORDASH',  eventType:'ADJUSTMENT',       txId:'TX-DEMO-1020', received:'2026-09-16T14:31:00Z', processed:null,                   sig:'INVALID', dup:false, status:'REJECTED_DEMO'      },
  { id:'WH-DEMO-0016', provider:'INSTACART', eventType:'DELIVERY_COMPLETED',txId:'TX-DEMO-1021',received:'2026-09-17T13:00:10Z', processed:'2026-09-17T13:00:11Z', sig:'VALID',   dup:false, status:'PROCESSED'          },
  { id:'WH-DEMO-0017', provider:'INSTACART', eventType:'TIP_ADDED',        txId:'TX-DEMO-1022', received:'2026-09-16T11:01:00Z', processed:'2026-09-16T11:01:01Z', sig:'VALID',   dup:false, status:'PROCESSED'          },
  { id:'WH-DEMO-0018', provider:'INSTACART', eventType:'PAYMENT_CAPTURED', txId:'TX-DEMO-1023', received:'2026-09-15T14:31:00Z', processed:'2026-09-15T14:31:05Z', sig:'VALID',   dup:false, status:'RETRYING'           },
  { id:'WH-DEMO-0019', provider:'UBER_EATS', eventType:'DELIVERY_COMPLETED',txId:'TX-DEMO-1024',received:'2026-09-17T12:00:05Z', processed:'2026-09-17T12:00:06Z', sig:'VALID',   dup:false, status:'PROCESSED'          },
  { id:'WH-DEMO-0020', provider:'UBER_EATS', eventType:'TIP_ADDED',        txId:'TX-DEMO-1025', received:'2026-09-17T09:30:10Z', processed:'2026-09-17T09:30:11Z', sig:'VALID',   dup:false, status:'PROCESSED'          },
]

export const DEMO_RECONCILIATION = [
  { id:'REC-DEMO-001', provider:'UBER',      type:'MATCH',                expected:50.00, actual:50.00, diff:0,    status:'RECONCILED',     note:'Toutes les composantes correspondent — Pilote',             period:'2026-Q3' },
  { id:'REC-DEMO-002', provider:'LYFT',      type:'TIP_DIFFERENCE',       expected:4.00,  actual:1.50,  diff:2.50, status:'REVIEW_REQUIRED',note:'Écart pourboire — données fournisseur vs driver — Pilote',  period:'2026-Q3' },
  { id:'REC-DEMO-003', provider:'DOORDASH',  type:'AMOUNT_DIFFERENCE',    expected:31.00, actual:29.50, diff:1.50, status:'EXPLAINED',      note:'Ajustement distance confirmé — Pilote',                    period:'2026-Q3' },
  { id:'REC-DEMO-004', provider:'INSTACART', type:'MISSING_TRANSACTION',  expected:38.00, actual:0,     diff:38.00,status:'OPEN',           note:'Transaction non reçue via webhook — Pilote',               period:'2026-Q3' },
  { id:'REC-DEMO-005', provider:'UBER_EATS', type:'REFUND_ADJUSTMENT',    expected:27.00, actual:22.00, diff:5.00, status:'RESOLVED',       note:'Remboursement client appliqué correctement — Pilote',      period:'2026-Q3' },
]

export const DEMO_REPORTS = [
  { id:'RPT-DEMO-001', type:'REVENUE_SUMMARY',   title:'Rapport revenus — Septembre 2026',        period:'2026-09', records:30, status:'GENERATED', generatedAt:'2026-09-17T09:00:00Z', format:'PDF',  isPilot:true },
  { id:'RPT-DEMO-002', type:'TAX_QUARTERLY',     title:'Rapport TPS/TVQ — Q3 2026',               period:'2026-Q3', records:4,  status:'VALIDATED', generatedAt:'2026-09-17T08:00:00Z', format:'PDF',  isPilot:true },
  { id:'RPT-DEMO-003', type:'PROVIDER_REPORT',   title:'Rapport fournisseurs — Juillet 2026',     period:'2026-07', records:6,  status:'GENERATED', generatedAt:'2026-09-16T14:00:00Z', format:'CSV',  isPilot:true },
  { id:'RPT-DEMO-004', type:'TRANSACTION_REPORT',title:'Rapport transactions Uber — Pilote',      period:'2026-Q3', records:12, status:'GENERATED', generatedAt:'2026-09-16T12:00:00Z', format:'PDF',  isPilot:true },
  { id:'RPT-DEMO-005', type:'RECONCILIATION',    title:'Rapport réconciliation — Pilote Q3',      period:'2026-Q3', records:5,  status:'DRAFT',     generatedAt:'2026-09-17T07:00:00Z', format:'PDF',  isPilot:true },
  { id:'RPT-DEMO-006', type:'DRIVER_ACTIVITY',   title:'Rapport activités chauffeurs — Sept 2026',period:'2026-09', records:3,  status:'GENERATED', generatedAt:'2026-09-15T16:00:00Z', format:'CSV',  isPilot:true },
  { id:'RPT-DEMO-007', type:'ANOMALY',           title:'Rapport anomalies — Pilote',              period:'2026-Q3', records:4,  status:'VALIDATED', generatedAt:'2026-09-15T10:00:00Z', format:'PDF',  isPilot:true },
  { id:'RPT-DEMO-008', type:'AUDIT',             title:'Rapport audit — Pilote TAXIMETER.GOV',    period:'2026-Q3', records:50, status:'VALIDATED', generatedAt:'2026-09-14T08:00:00Z', format:'PDF',  isPilot:true },
  { id:'RPT-DEMO-009', type:'COMPLIANCE',        title:'Rapport conformité — Chauffeurs',         period:'2026-09', records:5,  status:'DRAFT',     generatedAt:'2026-09-17T06:00:00Z', format:'PDF',  isPilot:true },
]

export const PILOT_BANNER = 'PILOTE · DONNÉES SYNTHÉTIQUES · AUCUNE TRANSMISSION OFFICIELLE'
export const PILOT_NOTE   = 'Ces données sont synthétiques et générées à des fins de démonstration gouvernementale uniquement. Aucune donnée réelle de chauffeur, fournisseur ou transaction n\'est impliquée.'

export const TPS_RATE = TPS
export const TVQ_RATE = TVQ
export { r2 }
