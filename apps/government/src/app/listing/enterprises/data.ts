// TAXIMETER.GOV — LISTING ENTREPRISES
// Source: données DEMO/PILOT — ne pas confondre avec données gouvernementales réelles

export type WorkerModel = 'EMPLOYEES' | 'INDEPENDENT_CONTRACTORS' | 'SUBCONTRACTORS' | 'MIXED' | 'UNKNOWN' | 'TO_BE_VERIFIED'
export type EnterpriseStatus = 'ACTIVE' | 'DEMO' | 'PILOT' | 'INACTIVE' | 'TO_BE_VERIFIED'
export type BusinessCategory = 'PLATFORM' | 'TAXI_TRANSPORT' | 'DELIVERY_COURIER' | 'AUTO_PARTS' | 'MEDICAL_PHARMA' | 'TRUCKING' | 'LOGISTICS_3PL' | 'DISTRIBUTION_B2B' | 'TO_QUALIFY'

export interface Enterprise {
  id: string
  name: string
  legal_name?: string
  category: BusinessCategory
  services: string[]
  worker_model: WorkerModel
  status: EnterpriseStatus
  is_demo: boolean
  province: string
  api_connected: boolean
  webhook_active: boolean
  drivers_count: number | null
  revenue_demo: number | null
  departments?: string[]
  neq?: string
}

export const ENTERPRISES: Enterprise[] = [
  // ── A. PLATEFORMES ──────────────────────────────────────────
  { id:'ENT-UBER-DEMO',      name:'Uber',         category:'PLATFORM',          services:['Rides','UberX','UberBlack','Uber Eats','Uber Delivery','Uber Grocery'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:12400, revenue_demo:4200000, departments:['Uber Rides/Taxi','Uber Eats','Uber Delivery','Uber Grocery'] },
  { id:'ENT-UBEREATS-DEMO',  name:'Uber Eats',    category:'PLATFORM',          services:['Food Delivery','Restaurant Delivery'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null, departments:[] },
  { id:'ENT-DOORDASH-DEMO',  name:'DoorDash',     category:'PLATFORM',          services:['Food Delivery','Grocery Delivery','Convenience'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:3800, revenue_demo:890000 },
  { id:'ENT-SKIP-DEMO',      name:'SkipTheDishes',category:'PLATFORM',          services:['Food Delivery','Restaurant Delivery'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:2100, revenue_demo:520000 },
  { id:'ENT-INSTACART-DEMO', name:'Instacart',    category:'PLATFORM',          services:['Grocery Delivery','Shopping','Delivery'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:1800, revenue_demo:340000 },
  { id:'ENT-FANTUAN-DEMO',   name:'Fantuan',      category:'PLATFORM',          services:['Food Delivery','Asian Cuisine'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:420, revenue_demo:95000 },
  { id:'ENT-RESTOLOCO-DEMO', name:'RestoLoco',    category:'PLATFORM',          services:['Food Delivery','Local Restaurants'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:180, revenue_demo:42000 },

  // ── B. TAXI / TRANSPORT ──────────────────────────────────────
  { id:'ENT-LYFT-DEMO',      name:'Lyft',                category:'TAXI_TRANSPORT', services:['Rideshare','Rides'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:1200, revenue_demo:310000 },
  { id:'ENT-TEOTAXI-DEMO',   name:'Téo Taxi',            category:'TAXI_TRANSPORT', services:['Taxi','Electric'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:110, revenue_demo:85000 },
  { id:'ENT-COOP-MTL-DEMO',  name:'Taxi Coop Montréal',  category:'TAXI_TRANSPORT', services:['Taxi'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:890, revenue_demo:420000 },
  { id:'ENT-COOP-OUEST-DEMO',name:'Taxi Coop de l\'Ouest',category:'TAXI_TRANSPORT', services:['Taxi'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:320, revenue_demo:160000 },
  { id:'ENT-DIAMOND-DEMO',   name:'Taxi Diamond',         category:'TAXI_TRANSPORT', services:['Taxi','Limousine'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:450, revenue_demo:210000 },
  { id:'ENT-CHAMPLAIN-DEMO', name:'Taxi Champlain',        category:'TAXI_TRANSPORT', services:['Taxi'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:180, revenue_demo:88000 },
  { id:'ENT-HOCHELAGA-DEMO', name:'Taxi Hochelaga',        category:'TAXI_TRANSPORT', services:['Taxi'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:95, revenue_demo:46000 },
  { id:'ENT-MONTAGNE-DEMO',  name:'Taxi de la Montagne',  category:'TAXI_TRANSPORT', services:['Taxi'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:120, revenue_demo:58000 },
  { id:'ENT-LAVAL-DEMO',     name:'Taxi Coop de Laval',   category:'TAXI_TRANSPORT', services:['Taxi'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:280, revenue_demo:135000 },
  { id:'ENT-LONGUEUIL-DEMO', name:'Taxi Coop de Longueuil',category:'TAXI_TRANSPORT',services:['Taxi'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:195, revenue_demo:94000 },
  { id:'ENT-BOUCHERVILLE-DM',name:'Taxi Coop de Boucherville',category:'TAXI_TRANSPORT',services:['Taxi'],worker_model:'INDEPENDENT_CONTRACTORS',status:'DEMO',is_demo:true,province:'QC',api_connected:false,webhook_active:false,drivers_count:85,revenue_demo:41000 },
  { id:'ENT-COOP-QC-DEMO',   name:'Taxi Coop de Québec',  category:'TAXI_TRANSPORT', services:['Taxi'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:520, revenue_demo:250000 },
  { id:'ENT-SAINTE-FOY-DEMO',name:'Taxi Coop Sainte-Foy–Sillery',category:'TAXI_TRANSPORT',services:['Taxi'],worker_model:'INDEPENDENT_CONTRACTORS',status:'DEMO',is_demo:true,province:'QC',api_connected:false,webhook_active:false,drivers_count:160,revenue_demo:77000 },
  { id:'ENT-LEVIS-DEMO',     name:'Taxi Coop de Lévis',   category:'TAXI_TRANSPORT', services:['Taxi'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:120, revenue_demo:58000 },
  { id:'ENT-SHERBROOKE-DEMO',name:'Taxi Coop de Sherbrooke',category:'TAXI_TRANSPORT',services:['Taxi'],worker_model:'INDEPENDENT_CONTRACTORS',status:'DEMO',is_demo:true,province:'QC',api_connected:false,webhook_active:false,drivers_count:210,revenue_demo:101000 },
  { id:'ENT-TROISRIV-DEMO',  name:'Taxi Coop de Trois-Rivières',category:'TAXI_TRANSPORT',services:['Taxi'],worker_model:'INDEPENDENT_CONTRACTORS',status:'DEMO',is_demo:true,province:'QC',api_connected:false,webhook_active:false,drivers_count:140,revenue_demo:67000 },
  { id:'ENT-GATINEAU-DEMO',  name:'Taxi Coop de Gatineau',category:'TAXI_TRANSPORT', services:['Taxi'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:180, revenue_demo:87000 },
  { id:'ENT-RIMOUSKI-DEMO',  name:'Taxi Coop de Rimouski',category:'TAXI_TRANSPORT', services:['Taxi'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:75, revenue_demo:36000 },
  { id:'ENT-ATLAS-DEMO',     name:'Taxi Atlas',           category:'TAXI_TRANSPORT', services:['Taxi'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:95, revenue_demo:46000 },

  // ── C. LIVRAISON / MESSAGERIE ────────────────────────────────
  { id:'ENT-POSTESCAN-DEMO', name:'Postes Canada',     category:'DELIVERY_COURIER', services:['Parcel','Mail','eCommerce'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-PUROLATOR-DEMO', name:'Purolator',         category:'DELIVERY_COURIER', services:['Courier','Parcel','Express'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-UPS-DEMO',       name:'UPS Canada',        category:'DELIVERY_COURIER', services:['Courier','Parcel','Freight'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-FEDEX-DEMO',     name:'FedEx Canada',      category:'DELIVERY_COURIER', services:['Express','Courier','Ground'], worker_model:'MIXED', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-DHL-DEMO',       name:'DHL Express Canada', category:'DELIVERY_COURIER', services:['Express','International'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-DHLECOM-DEMO',   name:'DHL eCommerce',     category:'DELIVERY_COURIER', services:['eCommerce','Last Mile'], worker_model:'MIXED', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-INTELCOM-DEMO',  name:'Intelcom / Dragonfly',category:'DELIVERY_COURIER',services:['Last Mile','eCommerce'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-GLS-DEMO',       name:'GLS Canada',        category:'DELIVERY_COURIER', services:['Parcel','Courier'], worker_model:'MIXED', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-CANPAR-DEMO',    name:'Canpar Express',    category:'DELIVERY_COURIER', services:['Courier','Parcel'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-LOOMIS-DEMO',    name:'Loomis Express',    category:'DELIVERY_COURIER', services:['Courier','Express'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-NATIONEX-DEMO',  name:'Nationex',          category:'DELIVERY_COURIER', services:['Courier','Last Mile'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-UNIUNI-DEMO',    name:'UniUni',            category:'DELIVERY_COURIER', services:['Last Mile','eCommerce'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-STALLION-DEMO',  name:'Stallion Express',  category:'DELIVERY_COURIER', services:['Courier','eCommerce'], worker_model:'MIXED', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-GOBOLT-DEMO',    name:'GoBolt',            category:'DELIVERY_COURIER', services:['Last Mile','Electric'], worker_model:'MIXED', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-AMAZON-DEMO',    name:'Amazon Logistics',  category:'DELIVERY_COURIER', services:['Last Mile','eCommerce'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-GOFOR-DEMO',     name:'GoFor',             category:'DELIVERY_COURIER', services:['Same Day','B2B Delivery'], worker_model:'INDEPENDENT_CONTRACTORS', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },

  // ── D. PIÈCES AUTOMOBILES ────────────────────────────────────
  { id:'ENT-NAPA-DEMO',      name:'UAP / NAPA Pièces d\'auto', category:'AUTO_PARTS', services:['Parts Delivery','Automotive Logistics'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-UNISEL-DEMO',    name:'Uni-Select',       category:'AUTO_PARTS', services:['Parts Distribution','Automotive'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-MONACO-DEMO',    name:'Groupe Monaco',    category:'AUTO_PARTS', services:['Parts Delivery'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-BUMPER-DEMO',    name:'Bumper to Bumper', category:'AUTO_PARTS', services:['Auto Parts','Delivery'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-CARQUEST-DEMO',  name:'Carquest Canada',  category:'AUTO_PARTS', services:['Auto Parts'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-LKQ-DEMO',       name:'LKQ Canada',       category:'AUTO_PARTS', services:['Recycled Parts','Wholesale'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-PARTSAVATAR-DM', name:'Parts Avatar',     category:'AUTO_PARTS', services:['eCommerce Parts','Delivery'], worker_model:'TO_BE_VERIFIED', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-CANTIRE-DEMO',   name:'Canadian Tire',    category:'AUTO_PARTS', services:['Auto Parts','Retail'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-PARTSOURCE-DM',  name:'PartSource',       category:'AUTO_PARTS', services:['Auto Parts'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-TOUCHETTE-DEMO', name:'Groupe Touchette', category:'AUTO_PARTS', services:['Parts Distribution','Tires'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-BELISLE-DEMO',   name:'Pneus Bélisle',   category:'AUTO_PARTS', services:['Tires','Delivery'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },

  // ── E. MÉDICAL / PHARMACEUTIQUE ─────────────────────────────
  { id:'ENT-MCKESSON-DEMO',  name:'McKesson Canada',   category:'MEDICAL_PHARMA', services:['Pharma Distribution','Medical Supply'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-CENCORA-DEMO',   name:'Cencora Canada',    category:'MEDICAL_PHARMA', services:['Pharma Distribution'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-MEDISCA-DEMO',   name:'Medisca',           category:'MEDICAL_PHARMA', services:['Compounding','Pharma'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-INNOMAR-DEMO',   name:'Innomar Strategies',category:'MEDICAL_PHARMA', services:['Specialty Pharma','Delivery'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-BAYSHORE-DEMO',  name:'Bayshore HealthCare',category:'MEDICAL_PHARMA',services:['Home Care','Medical'], worker_model:'MIXED', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-CAREVIO-DEMO',   name:'Carevio',           category:'MEDICAL_PHARMA', services:['Medical Delivery'], worker_model:'TO_BE_VERIFIED', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-GUARDIAN-DEMO',  name:'Guardian Pharmacy', category:'MEDICAL_PHARMA', services:['Pharmacy','Delivery'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-PHARMACH-DEMO',  name:'PharmaChoice',      category:'MEDICAL_PHARMA', services:['Pharmacy'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },

  // ── F. CAMIONNAGE ────────────────────────────────────────────
  { id:'ENT-TFI-DEMO',       name:'TFI International', category:'TRUCKING', services:['Long Haul','LTL','FTL','Logistics'], worker_model:'MIXED', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-CAT-DEMO',       name:'C.A.T.',            category:'TRUCKING', services:['Long Haul','FTL'], worker_model:'MIXED', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-ROBERT-DEMO',    name:'Groupe Robert',     category:'TRUCKING', services:['Freight','Distribution','Logistics'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-MORNEAU-DEMO',   name:'Groupe Morneau',    category:'TRUCKING', services:['Transport','Logistics'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-SIMARD-DEMO',    name:'Simard Transport',  category:'TRUCKING', services:['Truck','Freight'], worker_model:'MIXED', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-GUILBAULT-DEMO', name:'Guilbault',         category:'TRUCKING', services:['Transport','Distribution'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-DAYROSS-DEMO',   name:'Day & Ross',        category:'TRUCKING', services:['LTL','FTL','Freight'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-XPO-DEMO',       name:'XPO Logistics Canada',category:'TRUCKING',services:['LTL','Freight','Logistics'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },

  // ── G. LOGISTIQUE / 3PL ─────────────────────────────────────
  { id:'ENT-DHLSC-DEMO',     name:'DHL Supply Chain',  category:'LOGISTICS_3PL', services:['3PL','Warehousing','Distribution'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-KUEHNE-DEMO',    name:'Kuehne+Nagel Canada',category:'LOGISTICS_3PL',services:['3PL','Freight','Supply Chain'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-DSV-DEMO',       name:'DSV Canada',        category:'LOGISTICS_3PL', services:['Air','Sea','Road','Logistics'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-CEVA-DEMO',      name:'CEVA Logistics Canada',category:'LOGISTICS_3PL',services:['3PL','Contract Logistics'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-GXO-DEMO',       name:'GXO Logistics Canada',category:'LOGISTICS_3PL',services:['Contract Logistics','Fulfilment'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-METRO-SC-DEMO',  name:'Metro Supply Chain',category:'LOGISTICS_3PL', services:['3PL','Warehousing'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-AMAZON-FUL-DM',  name:'Amazon Fulfillment',category:'LOGISTICS_3PL', services:['Fulfilment','eCommerce'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },

  // ── H. DISTRIBUTION B2B ──────────────────────────────────────
  { id:'ENT-PEPSICO-DEMO',   name:'PepsiCo Canada',   category:'DISTRIBUTION_B2B', services:['B2B Distribution','Beverage'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-COCACOLA-DEMO',  name:'Coca-Cola Canada Bottling',category:'DISTRIBUTION_B2B',services:['B2B Distribution','Beverage'],worker_model:'EMPLOYEES',status:'DEMO',is_demo:true,province:'QC',api_connected:false,webhook_active:false,drivers_count:null,revenue_demo:null },
  { id:'ENT-SAPUTO-DEMO',    name:'Saputo',            category:'DISTRIBUTION_B2B', services:['Dairy Distribution','B2B'], worker_model:'EMPLOYEES', status:'DEMO', is_demo:true, province:'QC', api_connected:false, webhook_active:false, drivers_count:null, revenue_demo:null },
  { id:'ENT-MOLSON-DEMO',    name:'Molson Coors Canada',category:'DISTRIBUTION_B2B',services:['Beverage Distribution'],worker_model:'EMPLOYEES',status:'DEMO',is_demo:true,province:'QC',api_connected:false,webhook_active:false,drivers_count:null,revenue_demo:null },
  { id:'ENT-TOUCHDIST-DEMO', name:'Groupe Touchette Distribution',category:'DISTRIBUTION_B2B',services:['Parts Distribution','B2B'],worker_model:'EMPLOYEES',status:'DEMO',is_demo:true,province:'QC',api_connected:false,webhook_active:false,drivers_count:null,revenue_demo:null },

  // ── I. À QUALIFIER ───────────────────────────────────────────
  { id:'ENT-COOPTRAV-DEMO',  name:'Coopérative de travailleurs de taxi',category:'TO_QUALIFY',services:['Taxi','Cooperative'],worker_model:'TO_BE_VERIFIED',status:'TO_BE_VERIFIED',is_demo:true,province:'QC',api_connected:false,webhook_active:false,drivers_count:null,revenue_demo:null },
  { id:'ENT-RESQC-DEMO',     name:'Réseau québécois de livraison indépendante',category:'TO_QUALIFY',services:['Delivery','Independent'],worker_model:'TO_BE_VERIFIED',status:'TO_BE_VERIFIED',is_demo:true,province:'QC',api_connected:false,webhook_active:false,drivers_count:null,revenue_demo:null },
]

export const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  PLATFORM:         '📱 Plateformes',
  TAXI_TRANSPORT:   '🚕 Taxi / Transport',
  DELIVERY_COURIER: '📦 Livraison / Messagerie',
  AUTO_PARTS:       '🔧 Pièces automobiles',
  MEDICAL_PHARMA:   '💊 Médical / Pharmaceutique',
  TRUCKING:         '🚛 Camionnage',
  LOGISTICS_3PL:    '🏭 Logistique / 3PL',
  DISTRIBUTION_B2B: '🏢 Distribution B2B',
  TO_QUALIFY:       '❓ À qualifier',
}

export const WORKER_MODEL_LABELS: Record<WorkerModel, string> = {
  EMPLOYEES:               'Employés',
  INDEPENDENT_CONTRACTORS: 'Travailleurs autonomes',
  SUBCONTRACTORS:          'Sous-traitants',
  MIXED:                   'Mixte',
  UNKNOWN:                 'Inconnu',
  TO_BE_VERIFIED:          'À vérifier',
}
