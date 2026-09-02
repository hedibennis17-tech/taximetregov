-- TAXIMÈTRE.GOV — Static bootstrap data
-- Safe for pilot use: no personal data, passwords, API keys, OAuth secrets,
-- or production partner approvals are included.

BEGIN;

INSERT INTO jurisdictions (code, name, name_fr, name_en, country, currency, is_pilot, is_active)
VALUES
  ('QC', 'Québec', 'Québec', 'Quebec', 'CA', 'CAD', true, true),
  ('CA', 'Canada (Fédéral)', 'Canada (Fédéral)', 'Canada (Federal)', 'CA', 'CAD', false, true),
  ('ON', 'Ontario', 'Ontario', 'Ontario', 'CA', 'CAD', false, false)
ON CONFLICT (code) DO NOTHING;

INSERT INTO roles (name, label, description, requires_mfa, is_system)
VALUES
  ('SUPER_ADMIN', 'Super Administrateur', 'Accès global de gouvernance du système.', true, true),
  ('GOV_ADMIN', 'Administrateur Gouvernemental', 'Administration opérationnelle autorisée.', true, true),
  ('GOV_INSPECTOR', 'Inspecteur Gouvernemental', 'Fonctions d’inspection autorisées.', true, true),
  ('GOV_AUDITOR', 'Auditeur Gouvernemental', 'Accès d’audit et de consultation selon autorisation.', true, true),
  ('GOV_TAX_OFFICER', 'Agent Fiscal', 'Accès aux fonctions fiscales autorisées.', true, true),
  ('DRIVER', 'Chauffeur', 'Accès aux fonctions chauffeur.', false, true),
  ('DRIVER_PENDING', 'Chauffeur en attente', 'Compte chauffeur en attente de validation.', false, true),
  ('SYSTEM', 'Système', 'Identité réservée aux opérations système.', true, true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO document_types (code, label, label_fr, label_en, owner_type, has_expiry_date, requires_verification, requires_manual_review)
VALUES
  ('DRIVER_LICENSE', 'Permis de conduire', 'Permis de conduire', 'Driver licence', 'DRIVER', true, true, false),
  ('TAXI_PERMIT', 'Permis taxi', 'Permis taxi', 'Taxi permit', 'DRIVER', true, true, true),
  ('VEHICLE_REGISTRATION', 'Enregistrement du véhicule', 'Enregistrement du véhicule', 'Vehicle registration', 'VEHICLE', true, true, false),
  ('VEHICLE_INSURANCE', 'Assurance véhicule', 'Assurance véhicule', 'Vehicle insurance', 'VEHICLE', true, true, false),
  ('SAFETY_INSPECTION', 'Inspection de sécurité', 'Inspection de sécurité', 'Safety inspection', 'VEHICLE', true, true, false),
  ('MECHANICAL_INSPECTION', 'Inspection mécanique', 'Inspection mécanique', 'Mechanical inspection', 'VEHICLE', true, true, false),
  ('IDENTITY_DOCUMENT', 'Document d’identité', 'Document d’identité', 'Identity document', 'DRIVER', true, true, false),
  ('TAXIMETER_CERTIFICATE', 'Certificat taximètre', 'Certificat taximètre', 'Taximeter certificate', 'VEHICLE', true, true, true),
  ('BACKGROUND_CHECK', 'Vérification des antécédents', 'Vérification des antécédents', 'Background check', 'DRIVER', true, true, true),
  ('PROOF_OF_INSURANCE', 'Preuve d’assurance', 'Preuve d’assurance', 'Proof of insurance', 'VEHICLE', true, true, false)
ON CONFLICT (code) DO NOTHING;

INSERT INTO activity_types (code, label, label_fr, label_en, description, taximeter_eligible, is_active)
VALUES
  ('TAXI_TRIP', 'Course taxi', 'Course taxi', 'Taxi trip', 'Course effectuée avec le taximètre numérique.', true, true),
  ('RIDESHARE_TRIP', 'Course covoiturage', 'Course covoiturage', 'Rideshare trip', 'Course provenant d’une plateforme de transport autorisée.', false, true),
  ('FOOD_DELIVERY', 'Livraison repas', 'Livraison repas', 'Food delivery', 'Livraison de repas.', false, true),
  ('GROCERY_DELIVERY', 'Livraison épicerie', 'Livraison épicerie', 'Grocery delivery', 'Livraison d’épicerie.', false, true),
  ('PARCEL_DELIVERY', 'Livraison colis', 'Livraison colis', 'Parcel delivery', 'Livraison de colis.', false, true),
  ('COURIER', 'Service coursier', 'Service coursier', 'Courier service', 'Service de coursier.', false, true),
  ('OTHER', 'Autre activité', 'Autre activité', 'Other activity', 'Autre activité admissible.', false, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO providers (public_provider_id, code, name, provider_type, provider_status, country, supports_oauth, supports_webhook, supports_api_sync, taximeter_enabled, is_development_seed)
VALUES
  ('PROV-UBER', 'UBER', 'Uber', 'MULTI_SERVICE', 'ACTIVE', 'CA', true, true, true, false, true),
  ('PROV-LYFT', 'LYFT', 'Lyft', 'RIDESHARE', 'ACTIVE', 'CA', true, true, true, false, true),
  ('PROV-DOORDASH', 'DOORDASH', 'DoorDash', 'DELIVERY', 'ACTIVE', 'CA', false, true, true, false, true),
  ('PROV-UBER-EATS', 'UBER_EATS', 'Uber Eats', 'FOOD_DELIVERY', 'ACTIVE', 'CA', false, true, true, false, true),
  ('PROV-INSTACART', 'INSTACART', 'Instacart', 'GROCERY_DELIVERY', 'ACTIVE', 'CA', false, true, true, false, true),
  ('PROV-SKIP', 'SKIP', 'SkipTheDishes', 'FOOD_DELIVERY', 'ACTIVE', 'CA', false, true, true, false, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO platform_connectors (public_id, provider_id, connector_type, name, connector_status, auth_type, supports_webhook, supports_api_pull, supports_oauth, taximeter_enabled, is_active)
SELECT 'CON-UBER-PILOT', id, 'UBER', 'UberConnector', 'MOCK_ONLY', 'OAUTH2_AUTHORIZATION_CODE', true, true, true, false, true
FROM providers WHERE code = 'UBER'
ON CONFLICT (public_id) DO NOTHING;
INSERT INTO platform_connectors (public_id, provider_id, connector_type, name, connector_status, auth_type, supports_webhook, supports_api_pull, supports_oauth, taximeter_enabled, is_active)
SELECT 'CON-LYFT-PILOT', id, 'LYFT', 'LyftConnector', 'MOCK_ONLY', 'OAUTH2_AUTHORIZATION_CODE', true, true, true, false, true
FROM providers WHERE code = 'LYFT'
ON CONFLICT (public_id) DO NOTHING;
INSERT INTO platform_connectors (public_id, provider_id, connector_type, name, connector_status, auth_type, supports_webhook, supports_api_pull, supports_oauth, taximeter_enabled, is_active)
SELECT 'CON-DOORDASH-PILOT', id, 'DOORDASH', 'DoorDashConnector', 'MOCK_ONLY', 'OAUTH2_CLIENT_CREDENTIALS', true, true, false, false, true
FROM providers WHERE code = 'DOORDASH'
ON CONFLICT (public_id) DO NOTHING;
INSERT INTO platform_connectors (public_id, provider_id, connector_type, name, connector_status, auth_type, supports_webhook, supports_api_pull, supports_oauth, taximeter_enabled, is_active)
SELECT 'CON-INSTACART-PILOT', id, 'INSTACART', 'InstacartConnector', 'MOCK_ONLY', 'API_KEY', true, true, false, false, true
FROM providers WHERE code = 'INSTACART'
ON CONFLICT (public_id) DO NOTHING;
INSERT INTO platform_connectors (public_id, provider_id, connector_type, name, connector_status, auth_type, supports_webhook, supports_api_pull, supports_oauth, taximeter_enabled, is_active)
SELECT 'CON-UBER-EATS-PILOT', id, 'UBER_EATS', 'UberEatsConnector', 'MOCK_ONLY', 'OAUTH2_AUTHORIZATION_CODE', true, true, false, false, true
FROM providers WHERE code = 'UBER_EATS'
ON CONFLICT (public_id) DO NOTHING;
INSERT INTO platform_connectors (public_id, provider_id, connector_type, name, connector_status, auth_type, supports_webhook, supports_api_pull, supports_oauth, taximeter_enabled, is_active)
SELECT 'CON-SKIP-PILOT', id, 'SKIP', 'SkipConnector', 'MOCK_ONLY', 'API_KEY', true, true, false, false, true
FROM providers WHERE code = 'SKIP'
ON CONFLICT (public_id) DO NOTHING;

INSERT INTO retention_policies (category, legal_basis, retention_days, can_delete, archival_action, is_active)
VALUES
  ('FINANCIAL_TRANSACTIONS', 'Conservation des registres financiers du pilote.', NULL, false, 'ARCHIVE', true),
  ('TAX_RECORDS', 'Conservation des dossiers fiscaux du pilote.', NULL, false, 'ARCHIVE', true),
  ('AUDIT_LOGS', 'Traçabilité des opérations d’audit.', NULL, false, 'ARCHIVE', true),
  ('GPS_DATA', 'Minimisation des données de localisation du pilote.', 30, true, 'ANONYMIZE', true),
  ('SESSION_LOGS', 'Sécurité opérationnelle des sessions.', 90, true, 'DELETE', true),
  ('NOTIFICATIONS', 'Données opérationnelles de notification.', 90, true, 'DELETE', true),
  ('PERSONAL_DATA', 'Protection des données personnelles, sous réserve d’obligations légales.', NULL, false, 'ANONYMIZE', true),
  ('DOCUMENTS', 'Conservation des documents réglementaires.', NULL, false, 'ARCHIVE', true),
  ('COMPLIANCE_RECORDS', 'Conservation des dossiers de conformité.', NULL, false, 'ARCHIVE', true),
  ('WEBHOOK_EVENTS', 'Journalisation technique des événements partenaires.', 365, true, 'DELETE', true)
ON CONFLICT DO NOTHING;

INSERT INTO tax_rounding_policies (code, name, currency, decimal_places, rounding_mode, minimum_unit, source_reference, is_active)
VALUES ('CAD_RQ_STANDARD', 'Arrondi CAD — pilote Québec', 'CAD', 2, 'HALF_UP', 0.01, 'Configuration pilote; révision réglementaire requise avant production.', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO tax_rule_sets (jurisdiction_id, code, version, label, tps_rate, tvq_rate, effective_from, status, source_reference)
SELECT id, 'QC_TPS_TVQ', 'QC-2026-V1', 'Règle TPS/TVQ Québec 2026', 0.05000, 0.09975, '2026-01-01', 'DRAFT', 'Configuration pilote; validation réglementaire requise avant activation.'
FROM jurisdictions WHERE code = 'QC'
ON CONFLICT DO NOTHING;

INSERT INTO tax_components (tax_rule_set_id, code, name, name_fr, component_type, rate, calculation_order)
SELECT trs.id, component.code, component.name, component.name_fr, component.component_type::tax_component_type, component.rate, component.calculation_order
FROM tax_rule_sets trs
CROSS JOIN (VALUES
  ('GST', 'Goods and Services Tax', 'Taxe sur les produits et services', 'GST', 0.05000::numeric, 1::smallint, 'Configuration pilote; validation réglementaire requise.'),
  ('QST', 'Québec Sales Tax', 'Taxe de vente du Québec', 'QST', 0.09975::numeric, 2::smallint, 'Configuration pilote; validation réglementaire requise.')
) AS component(code, name, name_fr, component_type, rate, calculation_order, source_reference)
WHERE trs.code = 'QC_TPS_TVQ'
ON CONFLICT DO NOTHING;

INSERT INTO fare_configurations (version, jurisdiction, currency, label, base_fare, distance_rate_per_100m, time_rate_per_minute, waiting_rate_per_minute, minimum_fare, effective_from, is_active, is_pilot, source_reference)
VALUES ('QC-TAXI-PILOT-2026', 'QC', 'CAD', 'Tarif taxi Québec — mode pilote 2026', 4.10, 0.185, 0.55, 0.55, 4.10, '2026-01-01', true, true, 'Configuration pilote; homologation officielle requise avant production.')
ON CONFLICT DO NOTHING;

INSERT INTO feature_flags (key, label, description, module, feature_flag_state, rollout_percentage, conditions, is_system)
VALUES
  ('gateway.mode', 'Mode de passerelle', 'Le mode fiscal demeure SIMULATION pendant le pilote.', 'integrations', 'PILOT_ONLY', 0, '{"mode":"SIMULATION"}'::jsonb, true),
  ('taximeter.enabled', 'Taximètre numérique', 'Actif uniquement pour les activités admissibles.', 'taximeter', 'ENABLED', 100, '{}'::jsonb, true),
  ('uber.oauth.enabled', 'OAuth Uber', 'Désactivé jusqu’à approbation partenaire.', 'integrations', 'DISABLED', 0, '{}'::jsonb, true),
  ('lyft.oauth.enabled', 'OAuth Lyft', 'Désactivé jusqu’à approbation partenaire.', 'integrations', 'DISABLED', 0, '{}'::jsonb, true),
  ('doordash.oauth.enabled', 'OAuth DoorDash', 'Désactivé jusqu’à approbation partenaire.', 'integrations', 'DISABLED', 0, '{}'::jsonb, true),
  ('tax.auto.submit', 'Soumission fiscale automatique', 'Désactivée pendant le pilote.', 'tax', 'DISABLED', 0, '{}'::jsonb, true)
ON CONFLICT DO NOTHING;

INSERT INTO system_configs (key, jurisdiction, label, description, module, value_type, value_string, value_int, value_decimal, value_bool, value_json, is_editable, is_secret, version)
VALUES
  ('gateway.mode', 'GLOBAL', 'Mode de passerelle', 'Mode initial de la passerelle fiscale.', 'integrations', 'STRING', 'SIMULATION', NULL, NULL, NULL, NULL, true, false, 1),
  ('mfa.required.gov', 'GLOBAL', 'MFA gouvernemental requis', 'MFA requis pour les rôles gouvernementaux.', 'security', 'BOOLEAN', NULL, NULL, NULL, true, NULL, true, false, 1),
  ('session.timeout.minutes', 'GLOBAL', 'Expiration de session', 'Durée maximale d’inactivité de session.', 'security', 'INTEGER', NULL, 60, NULL, NULL, NULL, true, false, 1),
  ('payout.min.amount.cad', 'CA', 'Montant minimum de virement CAD', 'Seuil opérationnel initial.', 'payments', 'DECIMAL', NULL, NULL, 10.00, NULL, NULL, true, false, 1)
ON CONFLICT DO NOTHING;

INSERT INTO pilot_configurations (pilot_id, name, jurisdiction, active_cities, max_drivers, is_pilot, start_date, status)
VALUES ('PILOT-QC-2026', 'Pilote Taximètre.gov Québec 2026', 'QC', ARRAY['Montréal', 'Québec', 'Laval'], 50, true, '2026-01-01', 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO countries (iso_code, iso3_code, name, name_fr, name_en, currency_code, is_active, is_pilot)
VALUES
  ('CA', 'CAN', 'Canada', 'Canada', 'Canada', 'CAD', true, true),
  ('US', 'USA', 'United States', 'États-Unis', 'United States', 'USD', true, false),
  ('FR', 'FRA', 'France', 'France', 'France', 'EUR', true, false),
  ('TN', 'TUN', 'Tunisie', 'Tunisie', 'Tunisia', 'TND', true, false)
ON CONFLICT (iso_code) DO NOTHING;

INSERT INTO provinces_states_regions (country_id, code, name, name_fr, name_en, type, tax_system)
SELECT c.id, region.code, region.name, region.name_fr, region.name_en, region.type::jurisdiction_level, region.tax_system::tax_system_type
FROM countries c
CROSS JOIN (VALUES
  ('QC', 'Québec', 'Québec', 'Quebec', 'PROVINCE', 'GST_QST'),
  ('ON', 'Ontario', 'Ontario', 'Ontario', 'PROVINCE', 'HST'),
  ('BC', 'Colombie-Britannique', 'Colombie-Britannique', 'British Columbia', 'PROVINCE', 'GST_PST'),
  ('AB', 'Alberta', 'Alberta', 'Alberta', 'PROVINCE', 'GST_ONLY'),
  ('MB', 'Manitoba', 'Manitoba', 'Manitoba', 'PROVINCE', 'GST_PST'),
  ('SK', 'Saskatchewan', 'Saskatchewan', 'Saskatchewan', 'PROVINCE', 'GST_PST'),
  ('NS', 'Nouvelle-Écosse', 'Nouvelle-Écosse', 'Nova Scotia', 'PROVINCE', 'HST'),
  ('NB', 'Nouveau-Brunswick', 'Nouveau-Brunswick', 'New Brunswick', 'PROVINCE', 'HST'),
  ('NL', 'Terre-Neuve-et-Labrador', 'Terre-Neuve-et-Labrador', 'Newfoundland and Labrador', 'PROVINCE', 'HST'),
  ('PEI', 'Île-du-Prince-Édouard', 'Île-du-Prince-Édouard', 'Prince Edward Island', 'PROVINCE', 'HST'),
  ('YT', 'Yukon', 'Yukon', 'Yukon', 'TERRITORY', 'GST_ONLY'),
  ('NT', 'Territoires du Nord-Ouest', 'Territoires du Nord-Ouest', 'Northwest Territories', 'TERRITORY', 'GST_ONLY'),
  ('NU', 'Nunavut', 'Nunavut', 'Nunavut', 'TERRITORY', 'GST_ONLY')
) AS region(code, name, name_fr, name_en, type, tax_system)
WHERE c.iso_code = 'CA'
ON CONFLICT DO NOTHING;

INSERT INTO service_types (code, label, label_fr, label_en, taximeter_applicable, gps_required, revenue_tracking_required, tax_treatment_note, display_order, is_active)
VALUES
  ('TAXI', 'Taxi', 'Taxi', 'Taxi', true, true, true, 'Fourniture taxable — règles de la juridiction applicable.', 1, true),
  ('RIDESHARE', 'Covoiturage', 'Covoiturage', 'Rideshare', true, true, true, 'Fourniture taxable — règles de la juridiction applicable.', 2, true),
  ('DELIVERY', 'Livraison', 'Livraison', 'Delivery', false, true, true, 'Aucun calcul de taximètre.', 3, true),
  ('PERSONAL', 'Personnel', 'Usage personnel', 'Personal use', false, false, false, 'Usage personnel — aucun calcul de taximètre.', 4, true),
  ('COURIER', 'Courrier', 'Service courrier', 'Courier service', false, true, true, 'Aucun calcul de taximètre.', 5, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO tax_authorities (jurisdiction_id, name, name_fr, name_en, abbreviation, authority_type, official_url, official_reference, registration_required)
SELECT id, 'Revenu Québec', 'Revenu Québec', 'Revenu Québec', 'RQ', 'PROVINCIAL', 'https://www.revenuquebec.ca', 'Référence réglementaire à confirmer avant production.', true
FROM jurisdictions WHERE code = 'QC'
ON CONFLICT DO NOTHING;
INSERT INTO tax_authorities (jurisdiction_id, name, name_fr, name_en, abbreviation, authority_type, official_url, official_reference, registration_required)
SELECT id, 'Agence du revenu du Canada', 'Agence du revenu du Canada (ARC)', 'Canada Revenue Agency (CRA)', 'ARC', 'FEDERAL', 'https://www.canada.ca/cra', 'Référence réglementaire à confirmer avant production.', true
FROM jurisdictions WHERE code = 'CA'
ON CONFLICT DO NOTHING;

COMMIT;
