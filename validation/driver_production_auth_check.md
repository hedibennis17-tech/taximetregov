# Validation de production — chauffeur connecté

La page de connexion publiée affiche le formulaire Supabase réel avec les parcours **Connexion** et **Créer un compte**. L’accès non authentifié à l’URL de production `/home` est redirigé vers `/auth/login?next=%2Fhome`, ce qui confirme que le tableau de bord est protégé par une session Supabase.
