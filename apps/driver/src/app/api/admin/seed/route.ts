import { NextRequest } from 'next/server'
import { getDb, apiSuccess, apiError } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-seed-secret') !== 'TAXIMETREGOV_SEED_2026') return apiError('Non autorisé', 403)
  try {
    const db = getDb()
    await db.execute(sql`INSERT INTO jurisdictions (id,code,name,name_fr,name_en,country,currency,is_pilot,is_active,created_at,updated_at) VALUES (gen_random_uuid(),'QC','Québec','Québec','Quebec','CA','CAD',true,true,now(),now()) ON CONFLICT (code) DO NOTHING`)
    await db.execute(sql`INSERT INTO roles (id,code,name,is_system,created_at,updated_at) VALUES (gen_random_uuid(),'SUPER_ADMIN','Super Admin',true,now(),now()),(gen_random_uuid(),'GOV_ADMIN','Admin Gov',true,now(),now()),(gen_random_uuid(),'DRIVER','Chauffeur',true,now(),now()) ON CONFLICT (code) DO NOTHING`)
    await db.execute(sql`INSERT INTO providers (id,provider_code,display_name,provider_type,status,integration_status,created_at,updated_at) VALUES (gen_random_uuid(),'UBER','Uber','RIDESHARE','ACTIVE','NOT_CONFIGURED',now(),now()),(gen_random_uuid(),'LYFT','Lyft','RIDESHARE','ACTIVE','NOT_CONFIGURED',now(),now()),(gen_random_uuid(),'DOORDASH','DoorDash','DELIVERY','ACTIVE','NOT_CONFIGURED',now(),now()),(gen_random_uuid(),'UBER_EATS','Uber Eats','FOOD_DELIVERY','ACTIVE','NOT_CONFIGURED',now(),now()),(gen_random_uuid(),'INSTACART','Instacart','GROCERY_DELIVERY','ACTIVE','NOT_CONFIGURED',now(),now()),(gen_random_uuid(),'SKIP','SkipTheDishes','FOOD_DELIVERY','ACTIVE','NOT_CONFIGURED',now(),now()) ON CONFLICT (provider_code) DO NOTHING`)
    await db.execute(sql`INSERT INTO fare_configurations (id,version,jurisdiction,currency,label,base_fare,distance_rate_per_100m,time_rate_per_minute,waiting_rate_per_minute,minimum_fare,airport_surcharge,is_active,is_pilot,effective_from,created_at,updated_at) VALUES (gen_random_uuid(),'QC-TAXI-PILOT-2026','QC','CAD','Tarif taxi Québec 2026',4.10,0.185,0.55,0.55,4.10,1.50,true,true,'2026-01-01',now(),now()) ON CONFLICT (version) DO NOTHING`)
    await db.execute(sql`INSERT INTO activity_types (id,code,label,label_fr,label_en,taximeter_eligible,is_active,created_at) VALUES (gen_random_uuid(),'TAXI_TRIP','Course taxi','Course taxi','Taxi Trip',true,true,now()),(gen_random_uuid(),'RIDESHARE_TRIP','Rideshare','Rideshare','Rideshare',false,true,now()),(gen_random_uuid(),'FOOD_DELIVERY','Livraison','Livraison','Delivery',false,true,now()),(gen_random_uuid(),'GROCERY_DELIVERY','Épicerie','Épicerie','Grocery',false,true,now()) ON CONFLICT (code) DO NOTHING`)
    await db.execute(sql`INSERT INTO document_types (id,code,label,owner_type,has_expiry,requires_verification,requires_manual_review,renewal_notice_days,created_at) VALUES (gen_random_uuid(),'DRIVER_LICENSE','Permis de conduire','DRIVER',true,true,false,60,now()),(gen_random_uuid(),'TAXI_PERMIT','Permis taxi','DRIVER',true,true,true,30,now()),(gen_random_uuid(),'VEHICLE_INSURANCE','Assurance véhicule','VEHICLE',true,true,false,30,now()),(gen_random_uuid(),'BACKGROUND_CHECK','Vérification antécédents','DRIVER',true,true,true,30,now()) ON CONFLICT (code) DO NOTHING`)
    await db.execute(sql`INSERT INTO users (id,email,password_hash,status,email_verified,created_at,updated_at) VALUES (gen_random_uuid(),'hedibennis70@gmail.com','SUPABASE_AUTH','ACTIVE',true,now(),now()),(gen_random_uuid(),'ahmed.benali@demo.taximetregov.ca','SUPABASE_AUTH','ACTIVE',true,now(),now()),(gen_random_uuid(),'sophie.tremblay@demo.taximetregov.ca','SUPABASE_AUTH','ACTIVE',true,now(),now()),(gen_random_uuid(),'marco.lepine@demo.taximetregov.ca','SUPABASE_AUTH','ACTIVE',true,now(),now()) ON CONFLICT (email) DO UPDATE SET status='ACTIVE',updated_at=now()`)
    await db.execute(sql`INSERT INTO user_roles (id,user_id,role_id,created_at) SELECT gen_random_uuid(),u.id,r.id,now() FROM users u,roles r WHERE u.email IN ('hedibennis70@gmail.com','ahmed.benali@demo.taximetregov.ca','sophie.tremblay@demo.taximetregov.ca','marco.lepine@demo.taximetregov.ca') AND r.code='DRIVER' ON CONFLICT DO NOTHING`)
    await db.execute(sql`
      INSERT INTO driver_profiles (id,user_id,public_driver_id,government_driver_id,first_name,last_name,preferred_language,verification_status,onboarding_status,jurisdiction_id,created_at,updated_at)
      SELECT gen_random_uuid(),u.id,
        CASE u.email WHEN 'hedibennis70@gmail.com' THEN 'DRV-QC-00000010' WHEN 'ahmed.benali@demo.taximetregov.ca' THEN 'DRV-QC-00000001' WHEN 'sophie.tremblay@demo.taximetregov.ca' THEN 'DRV-QC-00000002' ELSE 'DRV-QC-00000003' END,
        CASE u.email WHEN 'hedibennis70@gmail.com' THEN 'DRV-QC-00000010' WHEN 'ahmed.benali@demo.taximetregov.ca' THEN 'DRV-QC-00000001' WHEN 'sophie.tremblay@demo.taximetregov.ca' THEN 'DRV-QC-00000002' ELSE 'DRV-QC-00000003' END,
        CASE u.email WHEN 'hedibennis70@gmail.com' THEN 'Hedi' WHEN 'ahmed.benali@demo.taximetregov.ca' THEN 'Ahmed' WHEN 'sophie.tremblay@demo.taximetregov.ca' THEN 'Sophie' ELSE 'Marco' END,
        CASE u.email WHEN 'hedibennis70@gmail.com' THEN 'Bennis' WHEN 'ahmed.benali@demo.taximetregov.ca' THEN 'Benali' WHEN 'sophie.tremblay@demo.taximetregov.ca' THEN 'Tremblay' ELSE 'Lépine' END,
        'fr',
        CASE u.email WHEN 'marco.lepine@demo.taximetregov.ca' THEN 'PENDING' ELSE 'VERIFIED' END,
        CASE u.email WHEN 'marco.lepine@demo.taximetregov.ca' THEN 'IN_PROGRESS' ELSE 'COMPLETED' END,
        j.id,now(),now()
      FROM users u,jurisdictions j WHERE u.email IN ('hedibennis70@gmail.com','ahmed.benali@demo.taximetregov.ca','sophie.tremblay@demo.taximetregov.ca','marco.lepine@demo.taximetregov.ca') AND j.code='QC'
      ON CONFLICT (user_id) DO UPDATE SET verification_status=EXCLUDED.verification_status,updated_at=now()
    `)
    await db.execute(sql`INSERT INTO wallet_accounts (id,driver_id,currency,status,created_at,updated_at) SELECT gen_random_uuid(),dp.id,'CAD','ACTIVE',now(),now() FROM driver_profiles dp ON CONFLICT (driver_id) DO NOTHING`)
    await db.execute(sql`INSERT INTO tax_accounts (id,driver_id,jurisdiction_id,status,tps_status,tvq_status,filing_frequency,created_at,updated_at) SELECT gen_random_uuid(),dp.id,j.id,CASE dp.public_driver_id WHEN 'DRV-QC-00000003' THEN 'PENDING' ELSE 'ACTIVE' END,CASE dp.public_driver_id WHEN 'DRV-QC-00000003' THEN 'NOT_REGISTERED' ELSE 'REGISTERED' END,CASE dp.public_driver_id WHEN 'DRV-QC-00000003' THEN 'NOT_REGISTERED' ELSE 'REGISTERED' END,'QUARTERLY',now(),now() FROM driver_profiles dp,jurisdictions j WHERE j.code='QC' ON CONFLICT (driver_id) DO NOTHING`)
    await db.execute(sql`
      INSERT INTO revenue_ledger (id,driver_id,source_type,activity_type,entry_type,gross_amount,fee_amount,tip_amount,adjustment_amount,net_amount,currency,jurisdiction,activity_date,source_reference,is_settled,created_at)
      SELECT gen_random_uuid(),dp.id,t.src,t.act,'CREDIT',t.gross,t.fee,t.tip,0,t.gross-t.fee,'CAD','QC',CURRENT_DATE-(t.d||' days')::interval,t.ref,true,now()
      FROM driver_profiles dp CROSS JOIN (VALUES
        ('DRV-QC-00000010','TAXI','TAXI_TRIP',52.50,0,4.00,1,'TXG-2026-HEDI-001'),
        ('DRV-QC-00000010','TAXI','TAXI_TRIP',38.75,0,3.00,3,'TXG-2026-HEDI-002'),
        ('DRV-QC-00000010','TAXI','TAXI_TRIP',67.00,0,8.00,5,'TXG-2026-HEDI-003'),
        ('DRV-QC-00000010','UBER','RIDESHARE_TRIP',45.00,9.00,5.00,2,'UBR-HEDI-001'),
        ('DRV-QC-00000010','LYFT','RIDESHARE_TRIP',33.50,6.70,3.00,4,'LYF-HEDI-001'),
        ('DRV-QC-00000010','DOORDASH','FOOD_DELIVERY',24.00,4.80,0,6,'DOOR-HEDI-001'),
        ('DRV-QC-00000001','TAXI','TAXI_TRIP',50.25,0,5.00,1,'TXG-2026-AHMED-001'),
        ('DRV-QC-00000001','TAXI','TAXI_TRIP',38.50,0,3.00,3,'TXG-2026-AHMED-002'),
        ('DRV-QC-00000001','UBER','RIDESHARE_TRIP',42.00,8.40,4.00,5,'UBR-AHMED-001'),
        ('DRV-QC-00000002','TAXI','TAXI_TRIP',67.00,0,8.00,2,'TXG-2026-SOPHIE-001'),
        ('DRV-QC-00000002','LYFT','RIDESHARE_TRIP',55.00,11.00,6.00,4,'LYF-SOPHIE-001'),
        ('DRV-QC-00000002','INSTACART','GROCERY_DELIVERY',31.50,6.30,3.00,6,'INST-SOPHIE-001')
      ) AS t(pid,src,act,gross,fee,tip,d,ref)
      WHERE dp.public_driver_id=t.pid
    `)
    await db.execute(sql`INSERT INTO driver_provider_accounts (id,driver_id,provider_id,connection_status,connection_type,provider_driver_id_masked,connected_at,created_at,updated_at) SELECT gen_random_uuid(),dp.id,p.id,'CONNECTED','OAUTH_MOCK','••••DEMO01',now()-'5 days'::interval,now(),now() FROM driver_profiles dp,providers p WHERE dp.public_driver_id IN ('DRV-QC-00000010','DRV-QC-00000001','DRV-QC-00000002') AND p.provider_code IN ('UBER','LYFT','DOORDASH') ON CONFLICT DO NOTHING`)
    await db.execute(sql`INSERT INTO vehicles (id,driver_id,make,model,year,color,license_plate_masked,vin_masked,vehicle_type,status,created_at,updated_at) SELECT gen_random_uuid(),dp.id,'Toyota','Camry Hybrid',2024,CASE dp.public_driver_id WHEN 'DRV-QC-00000010' THEN 'Noir' WHEN 'DRV-QC-00000001' THEN 'Blanc' ELSE 'Gris' END,'••••-DEMO','••••••VINDEMO','SEDAN','ACTIVE',now(),now() FROM driver_profiles dp WHERE dp.public_driver_id IN ('DRV-QC-00000010','DRV-QC-00000001','DRV-QC-00000002') ON CONFLICT DO NOTHING`)
    await db.execute(sql`INSERT INTO documents (id,driver_id,document_type_id,status,uploaded_at,verified_at,expires_at,created_at,updated_at) SELECT gen_random_uuid(),dp.id,dt.id,'VERIFIED',now()-'5 days'::interval,now()-'4 days'::interval,now()+'365 days'::interval,now(),now() FROM driver_profiles dp,document_types dt WHERE dp.public_driver_id IN ('DRV-QC-00000010','DRV-QC-00000001','DRV-QC-00000002') AND dt.code IN ('DRIVER_LICENSE','TAXI_PERMIT','VEHICLE_INSURANCE') ON CONFLICT DO NOTHING`)
    await db.execute(sql`INSERT INTO audit_logs (id,action,module,severity,result,resource_type,actor_type,actor_public_id,actor_role,occurred_at,created_at) VALUES (gen_random_uuid(),'SEED_EXECUTED','SYSTEM','INFO','SUCCESS','database','SYSTEM','SYS-SEED','SYSTEM',now(),now()) ON CONFLICT DO NOTHING`)
    await db.execute(sql`INSERT INTO notifications (id,driver_id,notification_type,channel,title,body,status,priority,created_at,updated_at) SELECT gen_random_uuid(),dp.id,n.ntype,'IN_APP',n.title,n.body,'UNREAD','NORMAL',now()-(n.h||' hours')::interval,now() FROM driver_profiles dp CROSS JOIN (VALUES ('WELCOME','Bienvenue TAXIMÈTRE.GOV','Dossier DRV-QC-00000010 activé. Bienvenue Hedi!',1),('TRIP_COMPLETED','Course enregistrée','Course TXG-2026-HEDI-001 — 52,50 $ ✅',2),('PAYMENT_RECEIVED','Revenus disponibles','280,25 $ dans votre wallet.',24)) AS n(ntype,title,body,h) WHERE dp.public_driver_id='DRV-QC-00000010'`)
    return apiSuccess({ ok: true, message: 'Toutes les données installées ✅', drivers: ['Hedi Bennis DRV-QC-00000010','Ahmed Benali DRV-QC-00000001','Sophie Tremblay DRV-QC-00000002','Marco Lépine DRV-QC-00000003'] })
  } catch (err) {
    return apiError('Erreur: ' + String(err), 500)
  }
}
