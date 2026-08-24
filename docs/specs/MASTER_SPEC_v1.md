# MASTER SPECIFICATION v1.0 — TAXIMÈTRE.GOV

**Date** : 2026-08-24  
**Statut** : Foundation (Étape 1)  
**Pilote** : Québec

---

## 1. Vision & Objectifs

TAXIMÈTRE.GOV est une plateforme gouvernementale de gestion des revenus des chauffeurs et travailleurs de plateformes numériques, conçue pour :

1. **Transparence fiscale** — capturer automatiquement tous les revenus générés via Uber, Lyft, DoorDash, Instacart, Uber Eats, Skip et Taxi
2. **Conformité TPS/TVQ** — calculer, déclarer et rembourser les taxes québécoises
3. **Audit gouvernemental** — permettre une surveillance en temps réel des transactions
4. **Autonomie des chauffeurs** — donner aux travailleurs un outil simple pour gérer leur fiscalité

---

## 2. Deux plateformes

### 2.1 GOVERNMENT PLATFORM (apps/government)

**Utilisateurs** : Fonctionnaires, agents de conformité, administrateurs

| Module | Description |
|--------|-------------|
| Dashboard national | KPIs en temps réel, carte géographique, alertes |
| Gestion chauffeurs | Profils, statuts, vérification, suspension |
| Gestion véhicules | Flotte, licences, inspections |
| Universal Ledger | Vue de toutes les transactions |
| Revenus & Taxes | Brut/net, TPS/TVQ, déclarations, remboursements |
| Anomalies | Détection IA, alertes, dossiers |
| Audit | Logs immuables, signatures, export |
| Rapports | Génération PDF/CSV, tableaux de bord |
| API Gateway | Gestion des connexions plateformes |
| Permissions | RBAC, rôles, journal d'activité |

### 2.2 DRIVER APP (apps/driver)

**Utilisateurs** : Chauffeurs, livreurs, travailleurs de plateformes

| Module | Description |
|--------|-------------|
| Profil | Identité, photo, vérification |
| Documents | Permis, assurance, certification |
| Mes Plateformes | Connexion OAuth Uber/Lyft/DoorDash/etc. |
| Taximètre | Compteur temps réel pour courses Taxi |
| Historique | Courses, livraisons, revenus |
| Wallet | Solde, paiements, virements |
| Taxes | TPS/TVQ, déclarations, remboursements |
| Rapports | Documents fiscaux annuels/trimestriels |
| Notifications | Conformité, paiements, documents expirés |

---

## 3. Architecture technique

### Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Monorepo | Turborepo + pnpm workspaces |
| API interne | tRPC |
| API externe | REST + Webhooks |
| Auth | Supabase Auth + RBAC custom |
| Maps | Mapbox GL |
| Charts | Recharts / Tremor |
| PDF | react-pdf |
| Tests | Vitest + Playwright |

### Packages partagés

```
packages/
├── api-gateway/        # OAuth, webhook reception, rate limiting
├── revenue-engine/     # Calcul revenus, idempotence, ledger write
├── tax-engine/         # TPS/TVQ, périodes fiscales, remboursements
├── identity/           # Auth, RBAC, vérification identité
├── universal-ledger/   # Lecture du ledger, requêtes, exports
└── design-system/      # Composants, tokens, thèmes
```

---

## 4. Modèle de données

### Table: drivers
```sql
CREATE TABLE drivers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gov_id          TEXT UNIQUE NOT NULL,  -- Numéro gouvernemental
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT,
  sin             TEXT,                  -- NAS (chiffré)
  status          TEXT DEFAULT 'active', -- active | suspended | pending
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: platform_accounts
```sql
CREATE TABLE platform_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id           UUID REFERENCES drivers(id) ON DELETE CASCADE,
  provider            TEXT NOT NULL,  -- uber | lyft | doordash | instacart | ubereats | skip | taxi
  provider_account_id TEXT NOT NULL,
  access_token        TEXT,           -- Chiffré AES-256
  refresh_token       TEXT,           -- Chiffré AES-256
  token_expires_at    TIMESTAMPTZ,
  status              TEXT DEFAULT 'connected',
  connected_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(driver_id, provider)
);
```

### Table: transactions
```sql
CREATE TABLE transactions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_id             TEXT UNIQUE NOT NULL,
  driver_id               UUID REFERENCES drivers(id),
  provider                TEXT NOT NULL,
  provider_account_id     TEXT NOT NULL,
  provider_transaction_id TEXT NOT NULL,
  activity_type           TEXT NOT NULL,  -- ride | delivery | grocery | taxi
  gross_amount            DECIMAL(10,2) NOT NULL,
  platform_fee            DECIMAL(10,2) DEFAULT 0,
  tip                     DECIMAL(10,2) DEFAULT 0,
  adjustment              DECIMAL(10,2) DEFAULT 0,
  net_amount              DECIMAL(10,2) NOT NULL,
  tps_amount              DECIMAL(10,2) DEFAULT 0,
  tvq_amount              DECIMAL(10,2) DEFAULT 0,
  currency                CHAR(3) DEFAULT 'CAD',
  status                  TEXT NOT NULL,
  started_at              TIMESTAMPTZ,
  completed_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_transaction_id)  -- Zéro double-comptabilisation
);
```

### Table: tax_periods
```sql
CREATE TABLE tax_periods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id       UUID REFERENCES drivers(id),
  period_type     TEXT NOT NULL,  -- quarterly | annual
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  gross_revenue   DECIMAL(12,2) DEFAULT 0,
  net_revenue     DECIMAL(12,2) DEFAULT 0,
  tps_collected   DECIMAL(10,2) DEFAULT 0,
  tvq_collected   DECIMAL(10,2) DEFAULT 0,
  tps_remittance  DECIMAL(10,2) DEFAULT 0,
  tvq_remittance  DECIMAL(10,2) DEFAULT 0,
  status          TEXT DEFAULT 'open',  -- open | filed | assessed
  filed_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Design System

### Identité : Government Premium / Québec Digital

```css
/* Couleurs principales */
--color-qc-blue:       #003DA5;  /* Bleu Québec */
--color-qc-blue-light: #E8F0FE;  /* Bleu pâle accent */
--color-white:         #FFFFFF;
--color-gray-50:       #F8FAFC;
--color-gray-900:      #0F172A;

/* Thème gouvernemental (light) */
--bg-primary:    var(--color-white);
--bg-secondary:  var(--color-gray-50);
--accent:        var(--color-qc-blue);

/* Thème chauffeur (dark) */
--bg-primary:    #0A0F1E;
--bg-secondary:  #111827;
--accent:        #3B82F6;

/* Typographie */
--font-heading:  'Inter', system-ui, sans-serif;
--font-mono:     'JetBrains Mono', monospace;

/* Taximètre */
--taxi-green:    #22C55E;  /* ACTIF */
--taxi-red:      #EF4444;  /* ARRÊTÉ */
--taxi-amount:   clamp(3rem, 8vw, 6rem);  /* Gros chiffres */
```

### Composants clés
- `<TaxiMeter />` — Compteur temps réel
- `<RevenueCard />` — Carte de revenus avec breakdown
- `<PlatformBadge />` — Badge statut plateforme (connecté/déconnecté)
- `<ComplianceBadge />` — Badge conformité
- `<GovernmentTable />` — Tableau de données gouvernemental
- `<AuditLog />` — Journal d'audit immuable

---

## 6. Sécurité

| Exigence | Implémentation |
|----------|----------------|
| Auth | Supabase Auth + MFA obligatoire gov |
| RBAC | Row Level Security + rôles custom |
| Tokens | Chiffrement AES-256 en base |
| NAS | Chiffrement + accès restreint |
| Logs | Immuables, signés, horodatés |
| API | Rate limiting + IP allowlist gov |
| Webhook | Signature HMAC-SHA256 vérifiée |
| Transport | TLS 1.3 minimum |

---

## 7. Taux fiscaux (Québec)

| Taxe | Taux | Seuil d'inscription |
|------|------|---------------------|
| TPS (fédérale) | 5% | 30 000 $ revenus/an |
| TVQ (provinciale) | 9.975% | 30 000 $ revenus/an |
| **Total** | **14.975%** | |

---

## 8. Roadmap détaillée

### Étape 1 — Foundation ✅ (en cours)
- [x] Repository GitHub
- [x] Structure monorepo Turborepo
- [x] Spécification maîtresse
- [ ] Setup Supabase
- [ ] Design system de base
- [ ] Auth (gouvernement + chauffeur)

### Étape 2 — Government Dashboard
- Dashboard national avec KPIs
- Gestion chauffeurs + véhicules
- Vue ledger transactions
- RBAC + permissions

### Étape 3 — Driver App
- Profil + vérification identité
- Upload documents
- Taximètre taxi temps réel
- Historique courses

### Étape 4 — Platform Connect
- OAuth Uber, Lyft, Instacart
- API DoorDash, Uber Eats
- Webhook Skip
- Section "Mes Plateformes"

### Étape 5 — Revenue Engine
- Ingestion transactions
- Idempotence (UNIQUE constraint)
- Calcul net_amount
- Ledger écritures

### Étape 6 — Webhooks
- Réception + validation HMAC
- Parsing par plateforme
- Transformation → transaction interne
- Retry + DLQ

### Étape 7 — Tax Engine
- Calcul TPS/TVQ par transaction
- Agrégation périodes fiscales
- Génération déclarations
- Workflow remboursements

### Étape 8 — Audit & Sécurité
- Logs immuables
- Signatures cryptographiques
- Chiffrement tokens/NAS
- Tests de pénétration

### Étape 9 — IA
- Détection anomalies (revenus anormaux)
- Clustering comportements
- Alertes intelligentes
- Dashboard analytics

### Étape 10 — Pilot Québec
- Simulation 10 000 chauffeurs
- 1 000 000 transactions test
- Load testing
- Validation conformité réglementaire

---

*Spécification v1.0 — TAXIMÈTRE.GOV Pilote Québec 2026*
