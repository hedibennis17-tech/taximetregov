# Audit — données pilotes fournies

## Conclusion

Le fichier fourni ne peut pas être exécuté tel quel sur le schéma actuel : il utilise plusieurs colonnes héritées qui ne correspondent plus aux structures versionnées. Il reste utile comme modèle de contenu, mais doit être remplacé par une migration pilote idempotente et explicitement marquée `DEMO-`.

## Incompatibilités confirmées

| Domaine | Script fourni | Schéma actuel | Adaptation requise |
|---|---|---|---|
| Rôles | `roles.code` | `roles.name`, `label`, `requires_mfa` | Utiliser les rôles versionnés et ne pas dupliquer les rôles système. |
| Fournisseurs | `provider_code`, `display_name`, `status`, `integration_status` | `public_provider_id`, `code`, `name`, `provider_status`, capacités booléennes | Insérer seulement les fournisseurs absents avec `is_development_seed = true`. |
| Profils chauffeur | identifiants publics, statut et colonnes de profil antérieures | `driver_number`, `status`, `language`, `business_status`, `identity_verification_status` | Créer des profils pilotes avec colonnes actuelles et préfixe `DEMO-`. |
| Paramètres système | `value` unique | valeur typée : `value_string`, `value_bool`, `value_json`, etc. | Respecter le type de configuration et le module obligatoire. |
| Indicateurs | `value` et `is_enabled` | `label`, `module`, `feature_flag_state`, `rollout_percentage` | Utiliser le modèle de feature flags actuel. |
| Comptes fiscaux | `status` | `tax_account_status`, `effective_from` requis | Employer les noms actuels et des références de démonstration masquées. |
| Périodes fiscales | `status` | `period_status` | Employer les statuts et colonnes actuels. |
| Portefeuille | `status` | `jurisdiction`, `is_active` | Employer les colonnes actuelles. |
| Audit | valeurs textuelles libres | énumérations `audit_severity` et `audit_result`, métadonnées obligatoires | Insérer des événements clairement étiquetés comme pilotes. |

## Principes retenus

1. Aucun compte Supabase Auth existant, compte SUPER_ADMIN, réglage Auth ou donnée non-pilote ne sera modifié.
2. Chaque élément créé aura une référence, un courriel ou une note commençant par `DEMO-` pour un nettoyage déterministe.
3. Les fournisseurs resteront à l’état non configuré : aucune intégration Uber, Lyft, DoorDash, Uber Eats, Instacart ou Skip ne sera simulée comme réellement autorisée.
4. Les montants sont fictifs, explicitement pédagogiques et ne servent ni à déclarer, ni à évaluer, ni à accuser un travailleur ou un fournisseur.
