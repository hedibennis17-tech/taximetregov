# Validation locale — application chauffeur connectée

- La page `/auth/login` affiche un formulaire de connexion Supabase réel, avec onglets **Connexion** et **Créer un compte**.
- Le formulaire requiert un courriel et un mot de passe de 12 caractères minimum.
- L’accès direct non authentifié à `/home` redirige automatiquement vers `/auth/login?next=%2Fhome`.
- Aucun bandeau indiquant l’utilisation de données de démonstration n’apparaît dans le flux contrôlé.
