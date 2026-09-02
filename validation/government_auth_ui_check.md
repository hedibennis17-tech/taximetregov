# Validation locale — administration connectée

La page `/auth/login` présente le portail administratif sécurisé, avec courriel, mot de passe et vérification MFA. L’accès direct non authentifié à `/` est redirigé vers `/auth/login?next=%2F`, ce qui confirme que le tableau de bord est protégé par une session Supabase et les contrôles administratifs.
