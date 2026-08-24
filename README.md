# 🇨🇦 TAXIMÈTRE.GOV

> Plateforme gouvernementale de gestion des revenus des chauffeurs et travailleurs de plateformes — Pilote Québec

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: Pilot](https://img.shields.io/badge/Status-Pilot%20Québec-blueviolet)]()
[![Stack: Next.js + Supabase](https://img.shields.io/badge/Stack-Next.js%20%2B%20Supabase-black)]()

---

## Vision

TAXIMÈTRE.GOV est une plateforme à deux interfaces qui permet :

- **Au gouvernement** — de surveiller, auditer et analyser les revenus de l'ensemble des chauffeurs et travailleurs de plateformes
- **Aux chauffeurs** — de gérer leur profil, connecter leurs comptes (Uber, Lyft, DoorDash, Instacart, Uber Eats, Skip, Taxi), suivre leurs revenus et générer leurs documents fiscaux (TPS/TVQ)

---

## Architecture

```
TAXIMÈTRE.GOV
     │
     ├── apps/
     │   ├── government/          # Dashboard gouvernemental (Next.js)
     │   └── driver/              # App chauffeur (Next.js PWA)
     │
     ├── packages/
     │   ├── api-gateway/         # API Gateway + OAuth + Webhooks
     │   ├── revenue-engine/      # Moteur de revenus + ledger idempotent
     │   ├── tax-engine/          # Calcul TPS/TVQ + déclarations
     │   ├── identity/            # Auth + RBAC + vérification identité
     │   ├── universal-ledger/    # Ledger central des transactions
     │   └── design-system/       # Composants UI Quebec Digital
     │
     └── docs/
         └── specs/               # Spécifications techniques
```

### Plateformes intégrées

| Plateforme | Connexion | Webhooks | Status |
|------------|-----------|----------|--------|
| 🚗 Uber | OAuth 2.0 | ✅ | Planifié |
| 🚙 Lyft | OAuth 2.0 | ✅ | Planifié |
| 🍔 DoorDash | API + Webhook | ✅ | Planifié |
| 🛒 Instacart | OAuth 2.0 | ✅ | Planifié |
| 🍕 Uber Eats | OAuth 2.0 | ✅ | Planifié |
| ⚡ Skip | Webhook | ✅ | Planifié |
| 🚕 Taxi | Taximètre intégré | — | Planifié |

---

## Roadmap (10 étapes)

| Étape | Module | Status |
|-------|--------|--------|
| 1 | Foundation — Architecture + DB + Auth + Design System | 🔵 En cours |
| 2 | Government Dashboard | ⬜ À venir |
| 3 | Driver App — Profil + Documents + Taximètre | ⬜ À venir |
| 4 | Platform Connect — OAuth + Comptes | ⬜ À venir |
| 5 | Revenue Engine — Transactions + Ledger | ⬜ À venir |
| 6 | Webhooks — Toutes plateformes | ⬜ À venir |
| 7 | Tax Engine — TPS/TVQ + Rapports | ⬜ À venir |
| 8 | Audit & Sécurité — RBAC + Logs + Chiffrement | ⬜ À venir |
| 9 | IA — Détection d'anomalies + Analytics | ⬜ À venir |
| 10 | Pilot Québec — Tests à grande échelle | ⬜ À venir |

---

## Stack technique

- **Frontend** : Next.js 15, TypeScript, Tailwind CSS
- **Backend** : Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Monorepo** : Turborepo + pnpm workspaces
- **API** : tRPC + REST + Webhooks
- **Auth** : Supabase Auth + RBAC custom
- **Design** : Quebec Digital — Bleu Québec, typographie moderne, dark mode chauffeur

---

## Design System

Identité visuelle **Government Premium / Québec Digital** :

- 🔵 Bleu Québec dominant (`#003DA5`)
- ⚪ Blanc institutionnel
- 🔷 Bleu pâle accent (`#E8F0FE`)
- Fleur-de-lis comme watermark discret
- Typographie moderne, gros chiffres revenus
- Light mode gouvernemental / Dark mode chauffeur

---

## Modèle de données — Transaction

```sql
CREATE TABLE transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_id           TEXT UNIQUE NOT NULL,
  
  -- Chauffeur
  driver_id             UUID REFERENCES drivers(id),
  
  -- Plateforme
  provider              TEXT NOT NULL, -- uber | lyft | doordash | instacart | ubereats | skip | taxi
  provider_account_id   TEXT NOT NULL,
  provider_transaction_id TEXT NOT NULL,
  
  -- Activité
  activity_type         TEXT NOT NULL, -- ride | delivery | grocery
  
  -- Montants
  gross_amount          DECIMAL(10,2) NOT NULL,
  platform_fee          DECIMAL(10,2) DEFAULT 0,
  tip                   DECIMAL(10,2) DEFAULT 0,
  adjustment            DECIMAL(10,2) DEFAULT 0,
  net_amount            DECIMAL(10,2) NOT NULL,
  
  -- Taxes
  tps_amount            DECIMAL(10,2) DEFAULT 0,
  tvq_amount            DECIMAL(10,2) DEFAULT 0,
  
  currency              CHAR(3) DEFAULT 'CAD',
  status                TEXT NOT NULL,
  
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte d'unicité — zéro double-comptabilisation
  UNIQUE(provider, provider_transaction_id)
);
```

---

## Taximètre

Interface visuelle immédiatement identifiable :

```
🚕 TAXIMÈTRE ACTIF
─────────────────
      $ 37.25
   8.4 km  •  19 min
─────────────────
TPS      1.86 $
TVQ      3.71 $
TOTAL   42.82 $
─────────────────
  [ TERMINER LA COURSE ]
```

---

## Contribution

Projet pilote — accès sur invitation.

---

*TAXIMÈTRE.GOV — Pilote Québec 2026*
