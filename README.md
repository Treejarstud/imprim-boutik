# Imprim Boutik

Boutique en ligne d'impression numérique grand format.
Stack : **Next.js** (frontend) + **Supabase** (base de données, authentification, stockage d'images) + **Vercel** (hébergement).

Paiement à la livraison pour cette version : le client passe commande avec sa localisation,
le vendeur confirme le paiement une fois la livraison effectuée (depuis l'espace vendeur).

---

## 1. Créer le projet Supabase

1. Allez sur [supabase.com](https://supabase.com), créez un compte puis un nouveau projet.
2. Une fois le projet créé, ouvrez **SQL Editor** dans le menu de gauche.
3. Collez le contenu de `supabase/schema.sql`, exécutez.
4. Collez ensuite le contenu de `supabase/storage.sql`, exécutez.
5. Allez dans **Authentication > Providers > Email**, et **désactivez** l'option
   "Confirm email" (pratique pour démarrer — vous pourrez la réactiver plus tard
   pour la production, il faudra alors adapter le flux d'inscription).
6. Allez dans **Project Settings > API** : notez votre `Project URL` et votre clé `anon public`.

## 2. Configurer le projet en local

```bash
npm install
cp .env.local.example .env.local
```

Ouvrez `.env.local` et collez votre URL et votre clé Supabase :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon-publique
```

Lancez le site en local :

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## 3. Créer votre compte vendeur

1. Sur le site, cliquez sur **"Mon compte"** puis **Inscription**, créez un compte normalement.
2. Retournez dans **SQL Editor** sur Supabase et exécutez (en remplaçant l'e-mail) :

```sql
update public.profiles set role = 'vendor'
  where id = (select id from auth.users where email = 'vous@exemple.com');
```

3. Reconnectez-vous sur le site, puis allez sur `/vendeur` (lien "Espace professionnel"
   tout en bas de la page d'accueil). Vous avez maintenant accès au tableau de bord.

Tous les autres comptes créés depuis le site restent des comptes **client** par défaut —
ils n'ont pas accès à `/vendeur`.

## 4. Déployer en ligne (Vercel)

1. Créez un dépôt Git (GitHub, GitLab…) avec ce projet :

```bash
git init
git add .
git commit -m "Imprim Boutik"
git remote add origin <url-de-votre-dépôt>
git push -u origin main
```

2. Allez sur [vercel.com](https://vercel.com), connectez votre dépôt Git.
3. Dans les réglages du projet Vercel, ajoutez les mêmes variables d'environnement que dans `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Déployez. Votre boutique est en ligne.

## Structure du projet

```
app/
  page.js                 → page d'accueil / catalogue
  article/[id]/page.js    → fiche article, avis, commande
  vendeur/                → espace vendeur (protégé, non lié depuis le menu public)
    layout.js             → vérifie que l'utilisateur a le rôle "vendor"
    categories/page.js
    articles/page.js
    stats/page.js
    messages/page.js
components/                → composants réutilisables (header, footer, modales, chat)
contexts/AuthContext.js    → session utilisateur + profil, partagés dans toute l'app
lib/supabaseClient.js      → connexion à Supabase
supabase/schema.sql        → tables et règles de sécurité (à exécuter une fois)
supabase/storage.sql       → buckets d'images (à exécuter une fois)
```

## Notes importantes

- **Connexion par e-mail** : Supabase Auth fonctionne par e-mail + mot de passe (l'inscription
  par numéro de téléphone demande un fournisseur SMS payant). Le numéro de téléphone reste
  demandé et enregistré dans le profil, mais sert pour vous contacter, pas pour se connecter.
- **Sécurité réelle** : contrairement à la version de démonstration, l'accès à l'espace vendeur
  est vérifié par un vrai compte utilisateur + une règle de sécurité côté base de données
  (Row Level Security). Un client ne peut pas voir ni modifier les données réservées au vendeur,
  même en modifiant l'adresse du site.
- **Paiement en ligne** : non inclus dans cette version (paiement à la livraison uniquement).
  Si vous voulez ajouter un vrai paiement par carte plus tard, Stripe s'intègre bien à cette
  base — dites-le-moi le moment venu.
- **Images** : elles sont stockées dans Supabase Storage (buckets `article-images` et `avatars`),
  pas dans le code — vous pouvez donc en ajouter autant que vous voulez.
