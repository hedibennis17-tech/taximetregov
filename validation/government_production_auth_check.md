# Validation de production — administration connectée

La page de connexion publiée présente le portail administratif sécurisé. L’accès non authentifié à la racine de production est redirigé vers `/auth/login?next=%2F`. Cette protection s’ajoute au contrôle serveur des rôles gouvernementaux et au niveau MFA requis par les routes d’administration.

Le premier compte SUPER_ADMIN a été invité séparément et demeure en statut `PENDING` tant que l’invitation, le mot de passe et le MFA ne sont pas finalisés par son titulaire.
