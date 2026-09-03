-- ============================================================================
-- TAXIMETER.GOV — DONNÉES PILOTES DE DÉMONSTRATION (NON PRODUCTION)
--
-- But : alimenter les modules sans toucher aux comptes Auth, SUPER_ADMIN,
-- paramètres de sécurité, ni données non-pilotes. Tous les identifiants et
-- références créés commencent par DEMO-. Cette migration est idempotente.
-- Aucun fournisseur ci-dessous n’est relié à une intégration réelle.
-- ============================================================================

-- 1. Utilisateurs internes démonstration (sans compte Supabase Auth ni mot de passe)
INSERT INTO users (id, public_id, user_type, status, email, email_verified_at, created_at, updated_at)
VALUES
  ('20000000-0000-4000-8000-000000000001', 'DEMO-USR-DRV-001', 'DRIVER', 'ACTIVE', 'demo.ahmed@pilot.taximetregov.invalid', now(), now(), now()),
  ('20000000-0000-4000-8000-000000000002', 'DEMO-USR-DRV-002', 'DRIVER', 'ACTIVE', 'demo.sophie@pilot.taximetregov.invalid', now(), now(), now()),
  ('20000000-0000-4000-8000-000000000003', 'DEMO-USR-DRV-003', 'DRIVER', 'PENDING', 'demo.marco@pilot.taximetregov.invalid', now(), now(), now()),
  ('20000000-0000-4000-8000-000000000004', 'DEMO-USR-GOV-001', 'GOVERNMENT', 'ACTIVE', 'demo.operations@pilot.taximetregov.invalid', now(), now(), now())
ON CONFLICT (email) DO NOTHING;

-- 2. Catalogue de fournisseurs : catalogue seulement, sans OAuth, webhooks ou API réelle
INSERT INTO providers (public_provider_id, code, name, provider_type, provider_status, country, supports_oauth, supports_webhook, supports_api_sync, taximeter_enabled, is_development_seed, created_at, updated_at)
SELECT src.public_provider_id, src.code, src.name, src.provider_type::provider_type, 'ACTIVE'::provider_status, 'CA', false, false, false, false, true, now(), now()
FROM (VALUES
  ('DEMO-PRV-UBER', 'UBER', 'Uber', 'RIDESHARE'),
  ('DEMO-PRV-LYFT', 'LYFT', 'Lyft', 'RIDESHARE'),
  ('DEMO-PRV-DOORDASH', 'DOORDASH', 'DoorDash', 'FOOD_DELIVERY'),
  ('DEMO-PRV-UBEREATS', 'UBER_EATS', 'Uber Eats', 'FOOD_DELIVERY'),
  ('DEMO-PRV-INSTACART', 'INSTACART', 'Instacart', 'GROCERY_DELIVERY'),
  ('DEMO-PRV-SKIP', 'SKIP', 'SkipTheDishes', 'FOOD_DELIVERY'),
  ('DEMO-PRV-INTELCOM', 'INTELCOM', 'Intelcom Express', 'DELIVERY')
) AS src(public_provider_id, code, name, provider_type)
WHERE NOT EXISTS (SELECT 1 FROM providers p WHERE p.code = src.code);

-- 3. Profils chauffeurs, états de présence et parcours d’inscription
INSERT INTO driver_profiles (user_id, driver_number, status, first_name, last_name, preferred_name, phone, province, country, language, business_status, identity_verification_status, onboarding_completed_at, created_at, updated_at)
SELECT u.id, src.driver_number, src.status::driver_status, src.first_name, src.last_name, src.preferred_name, src.phone, 'QC', 'CA', 'fr'::language, 'SOLE_PROPRIETOR'::business_status, src.verification::verification_status, src.completed_at, now(), now()
FROM (VALUES
  ('DEMO-USR-DRV-001', 'DEMO-DRV-0001', 'ACTIVE', 'Ahmed', 'Benali', 'Ahmed B.', '514-555-0101', 'VERIFIED', now() - interval '45 days'),
  ('DEMO-USR-DRV-002', 'DEMO-DRV-0002', 'ACTIVE', 'Sophie', 'Tremblay', 'Sophie T.', '438-555-0102', 'VERIFIED', now() - interval '31 days'),
  ('DEMO-USR-DRV-003', 'DEMO-DRV-0003', 'UNDER_REVIEW', 'Marco', 'Lépine', 'Marco L.', '450-555-0103', 'PENDING', null)
) AS src(user_public_id, driver_number, status, first_name, last_name, preferred_name, phone, verification, completed_at)
JOIN users u ON u.public_id = src.user_public_id
WHERE NOT EXISTS (SELECT 1 FROM driver_profiles dp WHERE dp.driver_number = src.driver_number);

INSERT INTO driver_presences (driver_id, status, location_label, last_online_at, last_offline_at, created_at, updated_at)
SELECT dp.id, src.status::driver_presence_status, src.location, CASE WHEN src.status = 'ONLINE' THEN now() - interval '8 minutes' ELSE null END, CASE WHEN src.status = 'OFFLINE' THEN now() - interval '42 minutes' ELSE null END, now(), now()
FROM (VALUES ('DEMO-DRV-0001', 'ONLINE', 'Montréal — Centre-ville'), ('DEMO-DRV-0002', 'ONLINE', 'Laval — Chomedey'), ('DEMO-DRV-0003', 'OFFLINE', 'Longueuil — Vieux-Longueuil')) AS src(driver_number, status, location)
JOIN driver_profiles dp ON dp.driver_number = src.driver_number
WHERE NOT EXISTS (SELECT 1 FROM driver_presences dpr WHERE dpr.driver_id = dp.id);

INSERT INTO driver_onboarding_steps (driver_id, step_key, status, completed_at, blocked_reason, metadata, created_at, updated_at)
SELECT dp.id, src.step_key, src.status, CASE WHEN src.status = 'COMPLETED' THEN now() - interval '2 days' ELSE null END, src.blocked_reason, jsonb_build_object('demo', true, 'scenario', 'pilot-2026'), now(), now()
FROM (VALUES
  ('DEMO-DRV-0001', 'identity', 'COMPLETED', null), ('DEMO-DRV-0001', 'vehicle', 'COMPLETED', null), ('DEMO-DRV-0001', 'tax', 'COMPLETED', null),
  ('DEMO-DRV-0002', 'identity', 'COMPLETED', null), ('DEMO-DRV-0002', 'vehicle', 'COMPLETED', null), ('DEMO-DRV-0002', 'tax', 'PENDING', 'DEMO-Validation fiscale à compléter'),
  ('DEMO-DRV-0003', 'identity', 'COMPLETED', null), ('DEMO-DRV-0003', 'vehicle', 'PENDING', 'DEMO-Document véhicule en révision')
) AS src(driver_number, step_key, status, blocked_reason)
JOIN driver_profiles dp ON dp.driver_number = src.driver_number
WHERE NOT EXISTS (SELECT 1 FROM driver_onboarding_steps dos WHERE dos.driver_id = dp.id AND dos.step_key = src.step_key);

-- 4. Véhicules, immatriculations, inspections et instruments taximètre
INSERT INTO vehicles (driver_id, vehicle_number, vin_last_four, license_plate_region, license_plate_masked, make, model, year, color, vehicle_type, fuel_type, seating_capacity, accessibility_features, vehicle_status, is_active, taximeter_status, taximeter_serial_masked, notes, created_at, updated_at)
SELECT dp.id, src.vehicle_number, src.vin_last_four, 'QC', src.plate, src.make, src.model, src.year::smallint, src.color, src.vehicle_type::vehicle_type, src.fuel_type::fuel_type, src.seats::smallint, src.features::text[], 'ACTIVE'::vehicle_status, true, src.taximeter_status::taximeter_status, src.serial, 'DEMO-Véhicule pilote — données fictives', now(), now()
FROM (VALUES
  ('DEMO-DRV-0001', 'DEMO-VEH-001', '4821', '••• 4821', 'Toyota', 'Camry Hybrid', 2023, 'Blanc', 'SEDAN', 'HYBRID', 4, ARRAY['Paiement sans contact'], 'CERTIFIED', '••••TM-2101'),
  ('DEMO-DRV-0002', 'DEMO-VEH-002', '7634', '••• 7634', 'Hyundai', 'Ioniq 5', 2024, 'Bleu', 'ELECTRIC', 'ELECTRIC', 4, ARRAY['Accès fauteuil roulant'], 'INSTALLED_NOT_CERTIFIED', '••••TM-2102'),
  ('DEMO-DRV-0003', 'DEMO-VEH-003', '1058', '••• 1058', 'Honda', 'Odyssey', 2022, 'Gris', 'MINIVAN', 'GASOLINE', 6, ARRAY['Siège enfant'], 'NOT_INSTALLED', null)
) AS src(driver_number, vehicle_number, vin_last_four, plate, make, model, year, color, vehicle_type, fuel_type, seats, features, taximeter_status, serial)
JOIN driver_profiles dp ON dp.driver_number = src.driver_number
WHERE NOT EXISTS (SELECT 1 FROM vehicles v WHERE v.vehicle_number = src.vehicle_number);

INSERT INTO driver_vehicle_assignments (driver_id, vehicle_id, assignment_type, assignment_status, valid_from, notes, created_at, updated_at)
SELECT dp.id, v.id, 'PRIMARY_DRIVER'::assignment_type, 'ACTIVE'::assignment_status, now() - interval '60 days', 'DEMO-Affectation pilote', now(), now()
FROM driver_profiles dp JOIN vehicles v ON v.driver_id = dp.id
WHERE dp.driver_number LIKE 'DEMO-DRV-%' AND NOT EXISTS (SELECT 1 FROM driver_vehicle_assignments dva WHERE dva.driver_id = dp.id AND dva.vehicle_id = v.id);

INSERT INTO vehicle_registrations (vehicle_id, jurisdiction, registration_last4, valid_from, valid_until, status, document_ref, created_at, updated_at)
SELECT v.id, 'QC', right(v.vehicle_number, 4), current_date - interval '120 days', current_date + interval '245 days', 'VALID'::registration_status, 'DEMO-IMM-' || right(v.vehicle_number, 3), now(), now()
FROM vehicles v WHERE v.vehicle_number LIKE 'DEMO-VEH-%' AND NOT EXISTS (SELECT 1 FROM vehicle_registrations vr WHERE vr.vehicle_id = v.id);

INSERT INTO vehicle_inspections (vehicle_id, driver_id, inspection_type, status, inspection_date, expiry_date, inspector_name, inspection_center_ref, passed, condition_notes, certificate_ref, created_at, updated_at)
SELECT v.id, v.driver_id, 'DEMO_MECHANICAL', CASE WHEN v.vehicle_number = 'DEMO-VEH-002' THEN 'EXPIRING_SOON'::inspection_status ELSE 'VALID'::inspection_status END, current_date - interval '20 days', current_date + CASE WHEN v.vehicle_number = 'DEMO-VEH-002' THEN interval '18 days' ELSE interval '180 days' END, 'Inspecteur démonstration', 'DEMO-CENTRE-QC-01', true, 'DEMO-Inspection sans valeur réglementaire', 'DEMO-INSP-' || right(v.vehicle_number, 3), now(), now()
FROM vehicles v WHERE v.vehicle_number LIKE 'DEMO-VEH-%' AND NOT EXISTS (SELECT 1 FROM vehicle_inspections vi WHERE vi.vehicle_id = v.id);

INSERT INTO taximeters (public_taximeter_id, driver_id, vehicle_id, status, current_mode, jurisdiction, device_id, app_version, activated_at, created_at, updated_at)
SELECT 'DEMO-TXM-' || right(v.vehicle_number, 3), v.driver_id, v.id, CASE WHEN v.vehicle_number = 'DEMO-VEH-002' THEN 'OFFLINE'::taximeter_instance_status ELSE 'READY'::taximeter_instance_status END, CASE WHEN v.vehicle_number = 'DEMO-VEH-002' THEN 'OFF'::taximeter_mode ELSE 'AVAILABLE'::taximeter_mode END, 'QC', 'DEMO-DEVICE-' || right(v.vehicle_number, 3), 'pilot-2026.1', now() - interval '44 days', now(), now()
FROM vehicles v WHERE v.vehicle_number IN ('DEMO-VEH-001', 'DEMO-VEH-002') AND NOT EXISTS (SELECT 1 FROM taximeters t WHERE t.public_taximeter_id = 'DEMO-TXM-' || right(v.vehicle_number, 3));

-- 5. Permis et documents fictifs, à usage visuel de démonstration seulement
INSERT INTO driver_licenses (driver_id, license_class, jurisdiction, license_number_masked, issue_date, expiry_date, status, verification_status, created_at, updated_at)
SELECT dp.id, 'CLASS_4A'::license_class, 'QC', 'DEMO-••••-' || right(dp.driver_number, 4), current_date - interval '350 days', current_date + interval '4 years', CASE WHEN dp.driver_number = 'DEMO-DRV-0003' THEN 'UNDER_REVIEW'::permit_status ELSE 'ACTIVE'::permit_status END, CASE WHEN dp.driver_number = 'DEMO-DRV-0003' THEN 'PENDING' ELSE 'VERIFIED' END, now(), now()
FROM driver_profiles dp WHERE dp.driver_number LIKE 'DEMO-DRV-%' AND NOT EXISTS (SELECT 1 FROM driver_licenses dl WHERE dl.driver_id = dp.id);

INSERT INTO taxi_permits (driver_id, jurisdiction, permit_type, permit_number_masked, status, issue_date, expiry_date, allowed_zones, verification_status, issuing_authority, created_at, updated_at)
SELECT dp.id, 'QC', 'TAXI', 'DEMO-••••-' || right(dp.driver_number, 4), CASE WHEN dp.driver_number = 'DEMO-DRV-0003' THEN 'PENDING'::permit_status ELSE 'ACTIVE'::permit_status END, current_date - interval '210 days', current_date + interval '155 days', ARRAY['Montréal','Laval'], CASE WHEN dp.driver_number = 'DEMO-DRV-0003' THEN 'PENDING' ELSE 'VERIFIED' END, 'DEMO-Autorité pilote', now(), now()
FROM driver_profiles dp WHERE dp.driver_number LIKE 'DEMO-DRV-%' AND NOT EXISTS (SELECT 1 FROM taxi_permits tp WHERE tp.driver_id = dp.id);

INSERT INTO documents (public_document_id, document_type_id, owner_type, driver_owner_id, jurisdiction, status, issued_at, expires_at, doc_number_last4, ocr_status, notes, created_at, updated_at)
SELECT 'DEMO-' || right(dp.driver_number, 4) || '-' || CASE WHEN dt.code = 'DRIVER_LICENSE' THEN 'LIC' ELSE 'TAXI' END, dt.id, 'DRIVER'::owner_type, dp.id, 'QC', CASE WHEN dp.driver_number = 'DEMO-DRV-0003' AND dt.code = 'TAXI_PERMIT' THEN 'PENDING_REVIEW'::document_status ELSE 'APPROVED'::document_status END, current_date - interval '120 days', current_date + interval '245 days', right(dp.driver_number, 4), 'OCR_COMPLETE'::ocr_status, 'DEMO-Document fictif pour présentation pilote', now(), now()
FROM driver_profiles dp JOIN document_types dt ON dt.code IN ('DRIVER_LICENSE', 'TAXI_PERMIT')
WHERE dp.driver_number LIKE 'DEMO-DRV-%' AND NOT EXISTS (SELECT 1 FROM documents d WHERE d.public_document_id = 'DEMO-' || right(dp.driver_number, 4) || '-' || CASE WHEN dt.code = 'DRIVER_LICENSE' THEN 'LIC' ELSE 'TAXI' END);

-- 6. Comptes de plateforme fictifs et états de synchronisation : pas de jeton, pas de connexion réelle
INSERT INTO driver_provider_accounts (public_provider_account_id, driver_id, provider_id, provider_account_status, external_account_id_last4, display_name, jurisdiction, verified_at, verification_method, connected_at, last_verified_at, last_sync_at, created_at, updated_at)
SELECT src.account_id, dp.id, p.id, 'ACTIVE'::provider_account_status, src.last4, src.display_name, 'QC', now() - interval '16 days', 'MANUAL'::provider_verification_method, now() - interval '15 days', now() - interval '1 day', now() - interval '22 minutes', now(), now()
FROM (VALUES
 ('DEMO-ACC-UBER-001','DEMO-DRV-0001','UBER','0101','Compte pilote Uber'),
 ('DEMO-ACC-DOORDASH-001','DEMO-DRV-0001','DOORDASH','0201','Compte pilote DoorDash'),
 ('DEMO-ACC-LYFT-002','DEMO-DRV-0002','LYFT','0302','Compte pilote Lyft'),
 ('DEMO-ACC-INSTACART-002','DEMO-DRV-0002','INSTACART','0402','Compte pilote Instacart'),
 ('DEMO-ACC-SKIP-003','DEMO-DRV-0003','SKIP','0503','Compte pilote Skip')
) AS src(account_id, driver_number, provider_code, last4, display_name)
JOIN driver_profiles dp ON dp.driver_number = src.driver_number JOIN providers p ON p.code = src.provider_code
WHERE NOT EXISTS (SELECT 1 FROM driver_provider_accounts dpa WHERE dpa.public_provider_account_id = src.account_id);

INSERT INTO provider_sync_state (provider_account_id, sync_type, sync_status, cursor_reference, last_successful_sync_at, last_attempt_at, activities_synced, created_at, updated_at)
SELECT dpa.id, 'DEMO_BATCH', CASE WHEN dpa.public_provider_account_id = 'DEMO-ACC-SKIP-003' THEN 'PARTIAL'::sync_status ELSE 'COMPLETED'::sync_status END, 'DEMO-CURSOR-' || right(dpa.public_provider_account_id, 3), now() - interval '22 minutes', now() - interval '22 minutes', CASE WHEN dpa.public_provider_account_id = 'DEMO-ACC-SKIP-003' THEN 2 ELSE 6 END, now(), now()
FROM driver_provider_accounts dpa WHERE dpa.public_provider_account_id LIKE 'DEMO-ACC-%' AND NOT EXISTS (SELECT 1 FROM provider_sync_state pss WHERE pss.provider_account_id = dpa.id);

-- 7. Courses taximètre et activités multi-services
INSERT INTO taxi_trips (public_trip_id, trip_reference, taximeter_id, driver_id, vehicle_id, trip_status, trip_integrity_status, jurisdiction, currency, started_at, completed_at, distance_meters, elapsed_seconds, waiting_seconds, estimated_amount, final_amount, receipt_reference, device_id, app_version, fare_snapshot, created_at, updated_at)
SELECT src.public_trip_id, src.trip_reference, t.id, dp.id, v.id, 'COMPLETED'::taxi_trip_status, 'NORMAL'::trip_integrity_status, 'QC', 'CAD', now() - src.hours_ago * interval '1 hour', now() - src.hours_ago * interval '1 hour' + interval '21 minutes', src.distance_meters, 1260, 75, src.final_amount, src.final_amount, 'DEMO-RCT-' || right(src.public_trip_id, 3), t.device_id, 'pilot-2026.1', jsonb_build_object('demo',true,'tariff','pilot-2026'), now(), now()
FROM (VALUES
 ('DEMO-TRIP-001','DEMO-TAXI-0001','DEMO-DRV-0001','DEMO-VEH-001',5,4800,28.75),
 ('DEMO-TRIP-002','DEMO-TAXI-0002','DEMO-DRV-0001','DEMO-VEH-001',28,7200,43.50),
 ('DEMO-TRIP-003','DEMO-TAXI-0003','DEMO-DRV-0002','DEMO-VEH-002',51,3600,24.25)
) AS src(public_trip_id, trip_reference, driver_number, vehicle_number, hours_ago, distance_meters, final_amount)
JOIN driver_profiles dp ON dp.driver_number = src.driver_number JOIN vehicles v ON v.vehicle_number = src.vehicle_number JOIN taximeters t ON t.driver_id = dp.id AND t.vehicle_id = v.id
WHERE NOT EXISTS (SELECT 1 FROM taxi_trips tt WHERE tt.public_trip_id = src.public_trip_id);

INSERT INTO taxi_meter_events (trip_id, taximeter_id, driver_id, event_type, event_sequence, previous_state, new_state, command_id, device_id, app_version, occurred_at, metadata, created_at)
SELECT tt.id, tt.taximeter_id, tt.driver_id, src.event_type::meter_event_type, src.sequence, src.previous_state, src.new_state, 'DEMO-CMD-' || right(tt.public_trip_id, 3) || '-' || src.sequence, tt.device_id, tt.app_version, tt.completed_at - src.offset_minutes * interval '1 minute', jsonb_build_object('demo',true,'trip',tt.public_trip_id), now()
FROM taxi_trips tt CROSS JOIN (VALUES ('TRIP_CREATED',1,'AVAILABLE','OCCUPIED',21), ('TRIP_STARTED',2,'OCCUPIED','OCCUPIED',20), ('TRIP_COMPLETED',3,'OCCUPIED','COMPLETED',0)) AS src(event_type,sequence,previous_state,new_state,offset_minutes)
WHERE tt.public_trip_id LIKE 'DEMO-TRIP-%' AND NOT EXISTS (SELECT 1 FROM taxi_meter_events tme WHERE tme.trip_id = tt.id AND tme.event_sequence = src.sequence);

INSERT INTO driver_activities (public_id, driver_id, provider_id, provider_account_id, activity_type_code, status, source_type, external_activity_id, external_transaction_id, source_taxi_trip_id, vehicle_id, started_at, completed_at, finalized_at, estimated_amount, gross_amount, final_amount, tip_amount, fee_amount, tax_amount, net_amount, currency, location_start_reference, location_end_reference, passenger_or_customer_reference, data_quality_status, reconciliation_status, taximeter_enabled, created_at, updated_at)
SELECT src.public_id, dp.id, p.id, dpa.id, src.activity_type::canonical_activity_type, 'FINALIZED'::canonical_activity_status, src.source_type::activity_source_type, src.external_activity_id, src.external_transaction_id, tt.id, v.id, now() - src.hours_ago * interval '1 hour', now() - src.hours_ago * interval '1 hour' + interval '18 minutes', now() - src.hours_ago * interval '1 hour' + interval '19 minutes', src.gross, src.gross, src.gross, src.tip, src.fee, src.tax, src.gross - src.fee + src.tip, 'CAD', src.origin, src.destination, 'DEMO-CUSTOMER-' || right(src.public_id,3), 'VALIDATED'::data_quality_status, src.recon_status::activity_reconciliation_status, src.taximeter_enabled, now(), now()
FROM (VALUES
 ('DEMO-ACT-001','DEMO-DRV-0001',null,null,'TAXI_TRIP','TAXIMETER','DEMO-TAXI-ACT-001','DEMO-TAXI-TXN-001','DEMO-TRIP-001','DEMO-VEH-001',5,28.75,4.00,0,4.30,'Vieux-Montréal','Plateau-Mont-Royal','MATCHED',true),
 ('DEMO-ACT-002','DEMO-DRV-0001','UBER','DEMO-ACC-UBER-001','RIDESHARE_TRIP','PROVIDER_API','DEMO-UBER-ACT-002','DEMO-UBER-TXN-002',null,'DEMO-VEH-001',10,42.00,5.00,8.40,6.29,'Centre-ville','Rosemont','MATCHED',false),
 ('DEMO-ACT-003','DEMO-DRV-0001','DOORDASH','DEMO-ACC-DOORDASH-001','FOOD_DELIVERY','PROVIDER_API','DEMO-DOOR-ACT-003','DEMO-DOOR-TXN-003',null,'DEMO-VEH-001',18,22.50,0,4.50,3.37,'Marché Atwater','Griffintown','PARTIAL_MATCH',false),
 ('DEMO-ACT-004','DEMO-DRV-0002',null,null,'TAXI_TRIP','TAXIMETER','DEMO-TAXI-ACT-004','DEMO-TAXI-TXN-004','DEMO-TRIP-003','DEMO-VEH-002',51,24.25,2.50,0,3.63,'Laval-des-Rapides','Chomedey','MATCHED',true),
 ('DEMO-ACT-005','DEMO-DRV-0002','LYFT','DEMO-ACC-LYFT-002','RIDESHARE_TRIP','PROVIDER_API','DEMO-LYFT-ACT-005','DEMO-LYFT-TXN-005',null,'DEMO-VEH-002',32,55.00,6.00,11.00,8.24,'Mile End','Aéroport Montréal-Trudeau','MISMATCH',false),
 ('DEMO-ACT-006','DEMO-DRV-0002','INSTACART','DEMO-ACC-INSTACART-002','GROCERY_DELIVERY','PROVIDER_API','DEMO-INST-ACT-006','DEMO-INST-TXN-006',null,'DEMO-VEH-002',39,31.50,3.00,6.30,4.72,'Marché Jean-Talon','Outremont','UNDER_REVIEW',false)
) AS src(public_id,driver_number,provider_code,account_id,activity_type,source_type,external_activity_id,external_transaction_id,trip_id,vehicle_number,hours_ago,gross,tip,fee,tax,origin,destination,recon_status,taximeter_enabled)
JOIN driver_profiles dp ON dp.driver_number=src.driver_number JOIN vehicles v ON v.vehicle_number=src.vehicle_number
LEFT JOIN providers p ON p.code=src.provider_code LEFT JOIN driver_provider_accounts dpa ON dpa.public_provider_account_id=src.account_id LEFT JOIN taxi_trips tt ON tt.public_trip_id=src.trip_id
WHERE NOT EXISTS (SELECT 1 FROM driver_activities da WHERE da.public_id=src.public_id);

-- 8. Le registre de revenus : source distincte, montants fictifs et données de démo identifiables
INSERT INTO revenue_ledger (driver_id, source_type, provider_id, activity_id, activity_type, entry_type, gross_amount, fee_amount, tip_amount, adjustment_amount, net_amount, currency, jurisdiction, activity_date, is_settled, settled_at, source_reference, notes, created_at)
SELECT da.driver_id, CASE WHEN da.provider_id IS NULL THEN 'TAXI'::revenue_source ELSE p.code::revenue_source END, da.provider_id, da.id, da.activity_type_code::text, 'CREDIT'::revenue_ledger_entry_type, da.gross_amount, da.fee_amount, da.tip_amount, da.adjustment_amount, da.net_amount, 'CAD', 'QC', da.completed_at::date, true, da.finalized_at, 'DEMO-LEDGER-' || right(da.public_id,3), 'DEMO-Revenu fictif de pilote, sans portée déclarative', now()
FROM driver_activities da LEFT JOIN providers p ON p.id=da.provider_id
WHERE da.public_id LIKE 'DEMO-ACT-%' AND NOT EXISTS (SELECT 1 FROM revenue_ledger rl WHERE rl.source_reference='DEMO-LEDGER-' || right(da.public_id,3));

-- 9. Transparence fournisseur / Module 31 : original, composants, taxes, pourboires, versements et écarts
INSERT INTO provider_activities (public_activity_id, source_type, provider_id, provider_account_id, driver_id, external_activity_id, external_activity_hash, activity_type, activity_status, match_status, started_at, ended_at, received_at, timezone, currency, jurisdiction, provider_event_version, taximeter_enabled, metadata, created_at, updated_at)
SELECT 'DEMO-PROV-' || right(da.public_id,3), 'PROVIDER'::activity_source, da.provider_id, da.provider_account_id, da.driver_id, da.external_activity_id, md5(da.external_activity_id), CASE WHEN da.activity_type_code='RIDESHARE_TRIP' THEN 'RIDESHARE_TRIP'::activity_type WHEN da.activity_type_code='FOOD_DELIVERY' THEN 'FOOD_DELIVERY'::activity_type ELSE 'GROCERY_DELIVERY'::activity_type END, 'COMPLETED'::activity_status, CASE WHEN da.reconciliation_status='MATCHED' THEN 'MATCHED'::match_status ELSE 'REVIEW_REQUIRED'::match_status END, da.started_at, da.completed_at, now() - interval '20 minutes', 'America/Toronto', 'CAD', 'QC', 1, false, jsonb_build_object('demo',true,'source','synthetic-pilot'), now(), now()
FROM driver_activities da WHERE da.provider_id IS NOT NULL AND da.public_id LIKE 'DEMO-ACT-%' AND NOT EXISTS (SELECT 1 FROM provider_activities pa WHERE pa.public_activity_id='DEMO-PROV-' || right(da.public_id,3));

INSERT INTO provider_transaction_snapshots (provider_id, provider_activity_id, driver_id, provider_transaction_id, snapshot_version, is_original, transaction_type, transaction_status, transaction_at, finalized_at, customer_total, currency, jurisdiction_code, source_payload_hash, source_received_at, source_payload, metadata, created_at)
SELECT pa.provider_id, pa.id, pa.driver_id, 'DEMO-SNAPSHOT-' || right(pa.public_activity_id,3), 1, true, pa.activity_type::text, 'COMPLETED', pa.ended_at, pa.ended_at, da.gross_amount + da.tip_amount, 'CAD', 'QC', md5(pa.public_activity_id), now() - interval '20 minutes', jsonb_build_object('demo',true,'provider_activity',pa.public_activity_id,'originality','simulated-source'), jsonb_build_object('demo',true,'classification','pilot'), now()
FROM provider_activities pa JOIN driver_activities da ON da.external_activity_id=pa.external_activity_id
WHERE pa.public_activity_id LIKE 'DEMO-PROV-%' AND NOT EXISTS (SELECT 1 FROM provider_transaction_snapshots pts WHERE pts.provider_transaction_id='DEMO-SNAPSHOT-' || right(pa.public_activity_id,3));

INSERT INTO provider_transaction_components (transaction_snapshot_id, component_type, component_code, description, amount, currency, payer_type, beneficiary_type, taxable, tax_type, tax_amount, source_component_id, metadata, created_at)
SELECT pts.id, src.component_type, src.component_code, src.description, src.amount, 'CAD', src.payer, src.beneficiary, src.taxable, src.tax_type, src.tax_amount, 'DEMO-COMP-' || right(pts.provider_transaction_id,3) || '-' || src.component_code, jsonb_build_object('demo',true), now()
FROM provider_transaction_snapshots pts CROSS JOIN (VALUES
 ('FARE','FARE','DEMO-Montant de service',24.00::numeric,'CUSTOMER','DRIVER',true,'TPS_TVQ',3.59::numeric),
 ('FEE','PLATFORM_FEE','DEMO-Frais de plateforme',-4.80::numeric,'DRIVER','PROVIDER',false,null,null),
 ('TIP','TIP','DEMO-Pourboire',3.00::numeric,'CUSTOMER','DRIVER',false,null,null)
) AS src(component_type,component_code,description,amount,payer,beneficiary,taxable,tax_type,tax_amount)
WHERE pts.provider_transaction_id LIKE 'DEMO-SNAPSHOT-%' AND NOT EXISTS (SELECT 1 FROM provider_transaction_components ptc WHERE ptc.source_component_id='DEMO-COMP-' || right(pts.provider_transaction_id,3) || '-' || src.component_code);

INSERT INTO provider_tax_records (transaction_snapshot_id, provider_id, driver_id, tax_type, jurisdiction_code, taxable_amount, reported_rate, reported_tax_amount, government_calculated_amount, variance_amount, reporting_period_start, reporting_period_end, tax_status, provider_reference, metadata, created_at, updated_at)
SELECT pts.id, pts.provider_id, pts.driver_id, 'TPS_TVQ', 'QC', 24.00, 0.14975, 3.59, CASE WHEN right(pts.provider_transaction_id,3)='005' THEN 3.57 ELSE 3.59 END, CASE WHEN right(pts.provider_transaction_id,3)='005' THEN -0.02 ELSE 0 END, date_trunc('month',now())::date, (date_trunc('month',now())+interval '1 month - 1 day')::date, CASE WHEN right(pts.provider_transaction_id,3)='005' THEN 'UNDER_REVIEW' ELSE 'REPORTED' END, 'DEMO-TAX-' || right(pts.provider_transaction_id,3), jsonb_build_object('demo',true), now(), now()
FROM provider_transaction_snapshots pts WHERE pts.provider_transaction_id LIKE 'DEMO-SNAPSHOT-%' AND NOT EXISTS (SELECT 1 FROM provider_tax_records ptr WHERE ptr.provider_reference='DEMO-TAX-' || right(pts.provider_transaction_id,3));

INSERT INTO provider_tip_records (transaction_snapshot_id, provider_id, driver_id, tip_amount, currency, tip_status, tip_received_at, provider_tip_reference, metadata, created_at, updated_at)
SELECT pts.id, pts.provider_id, pts.driver_id, 3.00, 'CAD', 'RECEIVED', pts.finalized_at, 'DEMO-TIP-' || right(pts.provider_transaction_id,3), jsonb_build_object('demo',true), now(), now()
FROM provider_transaction_snapshots pts WHERE pts.provider_transaction_id LIKE 'DEMO-SNAPSHOT-%' AND NOT EXISTS (SELECT 1 FROM provider_tip_records ptip WHERE ptip.provider_tip_reference='DEMO-TIP-' || right(pts.provider_transaction_id,3));

INSERT INTO provider_settlements (provider_id, driver_id, provider_settlement_id, period_start, period_end, gross_customer_amount, driver_transport_earnings, tip_amount, provider_fee_amount, tax_amount, total_payable, amount_paid, currency, settlement_date, status, source_reference, metadata, created_at, updated_at)
SELECT p.id, dp.id, src.settlement_id, now() - interval '7 days', now(), src.gross, src.earnings, src.tip, src.fee, src.tax, src.earnings + src.tip, src.earnings + src.tip, 'CAD', now() - interval '1 day', 'PAID', 'DEMO-SETTLEMENT', jsonb_build_object('demo',true), now(), now()
FROM (VALUES ('UBER','DEMO-DRV-0001','DEMO-SETTLEMENT-001',126.00::numeric,92.40::numeric,8.00::numeric,25.60::numeric,18.87::numeric), ('LYFT','DEMO-DRV-0002','DEMO-SETTLEMENT-002',96.50::numeric,70.20::numeric,6.00::numeric,20.30::numeric,14.45::numeric)) AS src(provider_code,driver_number,settlement_id,gross,earnings,tip,fee,tax)
JOIN providers p ON p.code=src.provider_code JOIN driver_profiles dp ON dp.driver_number=src.driver_number
WHERE NOT EXISTS (SELECT 1 FROM provider_settlements ps WHERE ps.provider_settlement_id=src.settlement_id);

INSERT INTO reconciliation_cases (driver_id, provider_id, case_type, expected_amount, actual_amount, difference_amount, recon_case_status, exception_note, period_reference, created_at, updated_at)
SELECT dp.id, p.id, 'DEMO_PROVIDER_TAX_VARIANCE', 3.59, 3.57, -0.02, 'UNDER_REVIEW'::recon_case_status, 'DEMO-Écart de deux cents créé uniquement pour illustrer la file de rapprochement.', 'DEMO-2026-01', now(), now()
FROM driver_profiles dp JOIN providers p ON p.code='LYFT'
WHERE dp.driver_number='DEMO-DRV-0002' AND NOT EXISTS (SELECT 1 FROM reconciliation_cases rc WHERE rc.period_reference='DEMO-2026-01' AND rc.case_type='DEMO_PROVIDER_TAX_VARIANCE');

INSERT INTO provider_reconciliation_items (reconciliation_case_id, transaction_snapshot_id, source_a_type, source_a_reference, source_a_amount, source_b_type, source_b_reference, source_b_amount, variance_amount, tolerance_amount, comparison_type, result_status, explanation, metadata, created_at, updated_at)
SELECT rc.id, pts.id, 'PROVIDER_SNAPSHOT', pts.provider_transaction_id, 3.57, 'TAXIMETER_GOV_CALCULATION', 'DEMO-TAX-CALC-005', 3.59, -0.02, 0.01, 'TAX_COMPARISON', 'UNDER_REVIEW', 'DEMO-Écart destiné à la démonstration du rapprochement humain.', jsonb_build_object('demo',true), now(), now()
FROM reconciliation_cases rc JOIN provider_transaction_snapshots pts ON right(pts.provider_transaction_id,3)='005'
WHERE rc.case_type='DEMO_PROVIDER_TAX_VARIANCE' AND NOT EXISTS (SELECT 1 FROM provider_reconciliation_items pri WHERE pri.source_a_reference=pts.provider_transaction_id);

-- 10. Comptes et périodes fiscales, synthèses et documents de résultats fictifs
INSERT INTO tax_accounts (driver_id, jurisdiction_id, tps_registration_masked, tvq_registration_masked, tps_status, tvq_status, filing_frequency, tax_account_status, effective_from, created_at, updated_at)
SELECT dp.id, j.id, 'DEMO-••••-TPS', 'DEMO-••••-TVQ', 'REGISTERED'::tax_registration_status, 'REGISTERED'::tax_registration_status, 'QUARTERLY', 'ACTIVE'::tax_account_status, current_date - interval '90 days', now(), now()
FROM driver_profiles dp JOIN jurisdictions j ON j.code='QC' WHERE dp.driver_number IN ('DEMO-DRV-0001','DEMO-DRV-0002') AND NOT EXISTS (SELECT 1 FROM tax_accounts ta WHERE ta.driver_id=dp.id);

INSERT INTO tax_periods (tax_account_id, period_start, period_end, filing_due_date, period_status, tps_status, tvq_status, gross_revenue_taxi, gross_revenue_rideshare, gross_revenue_delivery, gross_revenue_other, created_at, updated_at)
SELECT ta.id, date_trunc('month',now())::date, (date_trunc('month',now())+interval '1 month - 1 day')::date, (date_trunc('month',now())+interval '1 month + 30 days')::date, 'READY_TO_FILE'::tax_period_status, 'PENDING', 'PENDING', CASE WHEN dp.driver_number='DEMO-DRV-0001' THEN 72.25 ELSE 24.25 END, CASE WHEN dp.driver_number='DEMO-DRV-0001' THEN 42.00 ELSE 55.00 END, CASE WHEN dp.driver_number='DEMO-DRV-0001' THEN 22.50 ELSE 31.50 END, 0, now(), now()
FROM tax_accounts ta JOIN driver_profiles dp ON dp.id=ta.driver_id
WHERE dp.driver_number LIKE 'DEMO-DRV-%' AND NOT EXISTS (SELECT 1 FROM tax_periods tp WHERE tp.tax_account_id=ta.id AND tp.period_start=date_trunc('month',now())::date);

INSERT INTO driver_ledger_summaries (driver_id, jurisdiction_id, period_start, period_end, status, gross_revenue_taxi, gross_revenue_rideshare, gross_revenue_delivery, gross_revenue_other, gross_revenue_total, total_tips, total_platform_fees, total_deductions, net_revenue, total_tps_collected, total_tvq_collected, total_tax_collected, activity_count, taxi_trip_count, rideshare_trip_count, delivery_count, currency, computed_at, ledger_entry_count, created_at, updated_at)
SELECT dp.id, j.id, date_trunc('month',now())::date, (date_trunc('month',now())+interval '1 month - 1 day')::date, 'COMPUTED'::ledger_summary_status, COALESCE(sum(CASE WHEN rl.source_type='TAXI' THEN rl.gross_amount ELSE 0 END),0), COALESCE(sum(CASE WHEN rl.source_type IN ('UBER','LYFT') THEN rl.gross_amount ELSE 0 END),0), COALESCE(sum(CASE WHEN rl.source_type IN ('DOORDASH','INSTACART','UBER_EATS','SKIP') THEN rl.gross_amount ELSE 0 END),0), 0, COALESCE(sum(rl.gross_amount),0), COALESCE(sum(rl.tip_amount),0), COALESCE(sum(rl.fee_amount),0), COALESCE(sum(rl.fee_amount),0), COALESCE(sum(rl.net_amount),0), 8.41, 16.75, 25.16, count(rl.id), count(*) FILTER (WHERE rl.source_type='TAXI'), count(*) FILTER (WHERE rl.source_type IN ('UBER','LYFT')), count(*) FILTER (WHERE rl.source_type IN ('DOORDASH','INSTACART','UBER_EATS','SKIP')), 'CAD', now(), count(rl.id), now(), now()
FROM driver_profiles dp JOIN jurisdictions j ON j.code='QC' LEFT JOIN revenue_ledger rl ON rl.driver_id=dp.id AND rl.source_reference LIKE 'DEMO-LEDGER-%'
WHERE dp.driver_number IN ('DEMO-DRV-0001','DEMO-DRV-0002') GROUP BY dp.id,j.id
HAVING NOT EXISTS (SELECT 1 FROM driver_ledger_summaries dls WHERE dls.driver_id=dp.id AND dls.period_start=date_trunc('month',now())::date);

INSERT INTO driver_financial_statements (public_id, driver_id, jurisdiction_id, statement_type, status, period_start, period_end, ledger_summary_id, document_ref, masking_policy, generated_at, delivered_at, expires_at, created_at, updated_at)
SELECT 'DEMO-STATEMENT-' || right(dp.driver_number,4), dp.id, j.id, 'EARNINGS_SUMMARY'::statement_type, 'READY'::statement_status, date_trunc('month',now())::date, (date_trunc('month',now())+interval '1 month - 1 day')::date, dls.id, 'DEMO-STATEMENT-REF-' || right(dp.driver_number,4), 'STANDARD', now(), now(), now() + interval '90 days', now(), now()
FROM driver_profiles dp JOIN jurisdictions j ON j.code='QC' JOIN driver_ledger_summaries dls ON dls.driver_id=dp.id AND dls.period_start=date_trunc('month',now())::date
WHERE dp.driver_number IN ('DEMO-DRV-0001','DEMO-DRV-0002') AND NOT EXISTS (SELECT 1 FROM driver_financial_statements dfs WHERE dfs.public_id='DEMO-STATEMENT-' || right(dp.driver_number,4));

-- 11. Centre de contrôle : règles, alertes, rapport et journal d’audit fictifs
INSERT INTO alert_rules (name, code, service_name, alert_severity, threshold_value, threshold_unit, evaluation_window_seconds, is_active, notify_channels, description, created_at, updated_at)
SELECT src.name, src.code, src.service, src.severity::alert_severity, src.threshold, src.unit, 300, true, ARRAY['IN_APP'], src.description, now(), now()
FROM (VALUES
 ('DEMO-Écart fiscal', 'DEMO_TAX_VARIANCE', 'reconciliation', 'WARNING', 0.01::numeric, 'CAD', 'Alerte fictive de rapprochement fiscal'),
 ('DEMO-Document expirant', 'DEMO_DOCUMENT_EXPIRY', 'compliance', 'INFO', 30::numeric, 'days', 'Alerte fictive de renouvellement documentaire')
) AS src(name,code,service,severity,threshold,unit,description)
WHERE NOT EXISTS (SELECT 1 FROM alert_rules ar WHERE ar.code=src.code);

INSERT INTO alerts (alert_rule_id, service_name, alert_severity, alert_status, title, message, triggered_value, threshold_value, fired_at, created_at, updated_at)
SELECT ar.id, ar.service_name, ar.alert_severity, CASE WHEN ar.code='DEMO_TAX_VARIANCE' THEN 'FIRING'::alert_status ELSE 'ACKNOWLEDGED'::alert_status END, CASE WHEN ar.code='DEMO_TAX_VARIANCE' THEN 'DEMO-Écart à examiner' ELSE 'DEMO-Échéance documentaire' END, CASE WHEN ar.code='DEMO_TAX_VARIANCE' THEN 'Données fictives : écart de 0,02 $ créé pour la démonstration du Centre de contrôle.' ELSE 'Données fictives : document pilote à renouveler dans moins de 30 jours.' END, CASE WHEN ar.code='DEMO_TAX_VARIANCE' THEN 0.02 ELSE 24 END, ar.threshold_value, now() - interval '20 minutes', now(), now()
FROM alert_rules ar WHERE ar.code LIKE 'DEMO_%' AND NOT EXISTS (SELECT 1 FROM alerts a WHERE a.title=CASE WHEN ar.code='DEMO_TAX_VARIANCE' THEN 'DEMO-Écart à examiner' ELSE 'DEMO-Échéance documentaire' END);

INSERT INTO regulatory_reports (public_report_id, requested_by, jurisdiction_id, report_type, status, format, period_start, period_end, filters, report_ref_masked, report_size_bytes, record_count, contains_pii, generated_at, created_at, updated_at)
SELECT 'DEMO-REPORT-PILOT-001', u.id, j.id, 'PILOT_STATUS'::regulatory_report_type, 'READY'::regulatory_report_status, 'PDF'::report_format, date_trunc('month',now())::date, current_date, jsonb_build_object('demo',true,'scope','pilot'), 'DEMO-REPORT-•••001', 184320, 6, false, now() - interval '15 minutes', now(), now()
FROM users u JOIN jurisdictions j ON j.code='QC' WHERE u.public_id='DEMO-USR-GOV-001' AND NOT EXISTS (SELECT 1 FROM regulatory_reports rr WHERE rr.public_report_id='DEMO-REPORT-PILOT-001');

INSERT INTO audit_logs (actor_id, actor_role, actor_public_id, actor_type, action, module, severity, result, resource_type, resource_id, occurred_at, metadata)
SELECT u.id, 'GOV_ADMIN', u.public_id, 'SYSTEM', src.action, src.module, src.severity::audit_severity, src.result::audit_result, src.resource_type, src.resource_id, now() - src.minutes_ago * interval '1 minute', jsonb_build_object('demo',true,'scenario','pilot-2026')
FROM users u CROSS JOIN (VALUES
 ('DEMO_DATA_LOADED','DEMO','INFO','SUCCESS','demo_dataset','DEMO-PILOT-2026',30),
 ('DEMO_RECONCILIATION_OPENED','PROVIDER_TRANSPARENCY','WARNING','SUCCESS','reconciliation_case','DEMO-2026-01',25),
 ('DEMO_TAXIMETER_TRIP_COMPLETED','TAXIMETER','INFO','SUCCESS','taxi_trip','DEMO-TRIP-001',18),
 ('DEMO_REPORT_READY','REPORTS','INFO','SUCCESS','regulatory_report','DEMO-REPORT-PILOT-001',15)
) AS src(action,module,severity,result,resource_type,resource_id,minutes_ago)
WHERE u.public_id='DEMO-USR-GOV-001' AND NOT EXISTS (SELECT 1 FROM audit_logs al WHERE al.action=src.action AND al.resource_id=src.resource_id);
