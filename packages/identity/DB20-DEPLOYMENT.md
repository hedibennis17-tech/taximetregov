# TAXIMÈTRE.GOV — DB Phase 20/20 · Connexion Neon/Supabase

## Prérequis

Toutes les 19 migrations SQL sont prêtes dans `packages/identity/migrations/`.
Ce guide explique comment les appliquer sur Neon ou Supabase.

---

## Option A — Neon (recommandé)

### 1. Créer le projet

```
1. Aller sur https://neon.tech
2. Créer un nouveau projet: "taximetregov"
3. Région: US East (ou Canada si disponible)
4. Copier la connection string:
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb
```

### 2. Appliquer les migrations

```bash
cd packages/identity

# Définir la connexion
export DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb"

# Appliquer les 19 migrations dans l'ordre
tsx src/db/migrate.ts
```

### 3. Seeder la base

```bash
export DATABASE_URL="postgresql://..."
export SUPER_ADMIN_EMAIL="ton-email@example.com"
export SUPER_ADMIN_INITIAL_SECRET="mot-de-passe-initial-minimum-20-chars"

tsx src/db/seed.ts
```

### 4. Vérifier l'intégrité

```bash
export DATABASE_URL="postgresql://..."
tsx src/db/verify.ts
```

---

## Option B — Supabase

### 1. Créer le projet

```
1. Aller sur https://supabase.com
2. Créer un nouveau projet: "taximetregov"
3. Région: Canada (si disponible) ou US East
4. Copier la connection string (mode: Transaction):
   postgresql://postgres.xxx:password@aws-0-us-east.pooler.supabase.com:5432/postgres
```

### 2. Appliquer les migrations

```bash
cd packages/identity
export DATABASE_URL="postgresql://postgres.xxx:password@aws-0-us-east.pooler.supabase.com:6543/postgres"
tsx src/db/migrate.ts
```

> Note: Supabase — utiliser le port 6543 (transaction mode) pour les migrations.

---

## Variables d'environnement Vercel

Après connexion, ajouter dans Vercel pour chaque app:

### Driver App (apps/driver)

```
DATABASE_URL = postgresql://...
NEXT_PUBLIC_APP_ENV = pilot
```

### Government App (apps/government)

```
DATABASE_URL = postgresql://...
NEXT_PUBLIC_APP_ENV = pilot
```

---

## Ordre d'exécution complet

```
1. migrate.ts     — applique les 19 migrations SQL
2. seed.ts        — seeds RBAC + Super Admin (via env vars)
3. verify.ts      — vérifie 140 tables + règles absolues
4. Vercel env vars — connecter les apps
```

---

## Règles absolues post-déploiement

| Règle | Action requise |
|-------|----------------|
| `gateway.mode = SIMULATION` | Rester en SIMULATION jusqu'à autorisation Revenu Québec |
| `tax_rule_sets: DRAFT` | Faire approuver par autorité fiscale avant `ACTIVE` |
| `platform_connectors: MOCK_ONLY` | Rester MOCK_ONLY jusqu'à approbation partenaire |
| `isPilot = true` | Homologation officielle requise avant production commerciale |
| Super Admin MFA | Activer MFA immédiatement après premier login |
| Secret rotation | Changer `SUPER_ADMIN_INITIAL_SECRET` après premier login |

---

## Checklist finale

- [ ] Neon/Supabase projet créé
- [ ] `DATABASE_URL` défini
- [ ] `tsx src/db/migrate.ts` → ✅ 19 migrations appliquées
- [ ] `tsx src/db/seed.ts` → ✅ seeds appliqués
- [ ] `tsx src/db/verify.ts` → ✅ 0 erreurs
- [ ] `DATABASE_URL` ajouté dans Vercel (Driver + Government)
- [ ] Super Admin MFA activé
- [ ] Secret initial changé
- [ ] `isPilot=true` confirmé dans `pilot_configurations`
