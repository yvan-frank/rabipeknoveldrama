# refonte_frontend_php

Scaffold PHP natif du frontend Rabipek — mêmes routes que
[`refonte_rabi_frontend`](../refonte_rabi_frontend) (Next.js App Router),
mais rendu côté serveur en PHP pur (pas de framework). Les pages appellent
l'API [`refonte_server_php`](../refonte_server_php) pour leurs données
(SSR), et les composants interactifs (formulaires, widgets) sont des **îlots
React** compilés par Vite et montés côté client.

## Architecture

```
public/            front controller (index.php), assets statiques, build/ (Vite)
src/
  Http/            Request/Response/Router (mêmes conventions que refonte_server_php)
  Support/         View (rendu de templates + layout), Vite (tags <script>/<link>)
  Api/             ApiClient — appelle refonte_server_php en SSR
  Modules/         un contrôleur par section de route (Home, Books, Auth, Author, ...)
  Middleware/       AuthMiddleware (garde de page, équivalent des layouts protégés)
resources/views/    un template par route (miroir de src/app/**/page.tsx)
frontend-react/     projet Vite + React : les îlots interactifs uniquement
```

Chaque route de `refonte_rabi_frontend/src/app/**/page.tsx` a un
équivalent exact ici — voir [`src/Routes.php`](src/Routes.php).

## Le pattern "îlots"

Une vue PHP rend le HTML statique/SEO, et délègue les parties interactives à
un composant React monté au runtime :

```php
<?= \App\Support\View::island('LoginForm', ['redirectTo' => '/tableau-de-bord']) ?>
```

Ça émet `<div data-island="LoginForm" data-props="...">`. Côté React,
[`frontend-react/src/main.tsx`](frontend-react/src/main.tsx) scanne le DOM
au chargement et hydrate chaque îlot déclaré dans
[`frontend-react/src/islands/registry.ts`](frontend-react/src/islands/registry.ts).
Ajouter un nouvel îlot = un fichier `.tsx` + une ligne dans le registre.

Un îlot référencé par une vue mais absent du registre est rendu par un
composant `Placeholder` plutôt que de casser la page — filet de sécurité
pour d'éventuels ajouts futurs, plus utilisé activement à ce stade (tous les
îlots des routes existantes sont implémentés).

## Démarrer en dev

Deux process en parallèle :

```bash
# 1. Serveur Vite (HMR des îlots), depuis frontend-react/
cd frontend-react
npm install
cp .env.example .env
npm run dev            # http://localhost:5173

# 2. Serveur PHP, depuis la racine du projet
composer install
cp .env.example .env    # renseigner API_URL vers refonte_server_php
php -S localhost:8000 -t public public/router.php
```

**Important** : les îlots React appellent l'API en cross-origin depuis le
navigateur (`frontend-react/src/lib/apiClient.ts`, cookie de session inclus
via `withCredentials`). Le serveur `refonte_server_php` doit donc lister
`http://localhost:8000` dans son `CORS_ORIGINS` (`.env`), sans quoi le
navigateur bloque tout — login, likes, panier, avis, tableau de bord — dès
le préflight `OPTIONS` (ça fonctionne en curl, qui ne fait pas de préflight,
donc le problème ne se voit qu'en navigateur réel).

En dev, les pages PHP chargent directement `http://localhost:5173/src/main.tsx`
(cf. `src/Support/Vite.php`) — pas de build nécessaire pour itérer sur un îlot.

## Build de production

```bash
cd frontend-react && npm run build   # écrit public/build/ + manifest.json
```

`src/Support/Vite.php` bascule entre serveur de dev et build de prod via un
fichier `public/hot` (même convention que le plugin officiel Laravel Vite) :
écrit par `npm run dev` (cf. le plugin `hotFilePlugin` dans `vite.config.ts`),
supprimé à l'arrêt normal du serveur. Sa présence prime toujours sur un build
déjà généré, pour que `npm run build` ne masque jamais le HMR d'une session
de dev en cours. Si le process Vite est tué brutalement (kill -9, crash) le
fichier peut rester en place — le supprimer à la main (`rm public/hot`)
suffit à revenir sur le build.

## Lecture d'un chapitre : web → app uniquement

Contrairement à `refonte_rabi_frontend` (qui rend le contenu du chapitre en
ligne), cette refonte ne permet plus de lire un livre dans le navigateur.
`/livres/:slug/chapitres/:numero` ([`BooksController::chapter()`](src/Modules/Books/BooksController.php))
rend une page sans header/footer qui tente d'ouvrir l'app mobile via son
deep link (`rabipek://book/:slug/chapter/:chapterId`, résolu depuis le
`chapters[].chapterNumber` déjà renvoyé par `GET /books/:slug` — cf.
`BooksController::resolveChapterId()`, avec repli sur `rabipek://book/:slug`
si le chapitre est introuvable ; cf. l'îlot
[`OpenInApp`](frontend-react/src/islands/OpenInApp.tsx)) et affiche les liens
stores (Google Play / App Store) en repli. Les identifiants de l'app sont
configurables via `MOBILE_APP_SCHEME`, `PLAY_STORE_URL`, `APP_STORE_URL`
dans `.env`.

## Ce qui reste à porter

Tous les îlots référencés par les routes existantes sont implémentés. Limites connues :

Dans [`AdminPanel`](frontend-react/src/islands/AdminPanel.tsx), **Attribuer un
livre**, **Support** et **Vérification KYC** sont toutes les trois pleinement
implémentées (aucune section n'est plus un placeholder) :
  - *Attribuer un livre* (`BookGrantsSection`) utilise de vrais `<select>`
    peuplés depuis `GET /users` et `GET /books` (nom/email, titre/prix) au
    lieu de saisir des ID numériques bruts, avec historique paginé des
    attributions et retrait en deux étapes (confirmation avant révocation).
  - *Support* (`SupportSection`) liste les conversations lecteur→admin
    (`GET /support/administration/conversations`), affiche le fil de
    messages d'une conversation (`GET .../conversations/:id`) avec bulles
    différenciées lecteur/admin, et permet de répondre
    (`POST .../conversations/:id/messages`) — testé de bout en bout en
    navigateur réel (conversation de test créée via l'API, réponse envoyée
    et affichée dans le fil, données de test nettoyées ensuite).
  - *Vérification KYC* (`KycSection`) porte fidèlement
    [`AdminKycSection.tsx`](../refonte_rabi_frontend/src/components/dashboard/admin/AdminKycSection.tsx) :
    politique de bypass (`GET`/`PATCH /authors/kyc-bypass`), liste des
    dossiers auteur (`GET /authors/kyc`, triés soumissions en attente
    d'abord), détail dépliable (pays, adresse, type/numéro de document, lien
    vers la pièce d'identité, réseaux sociaux) et bascule
    vérifier/révoquer (`PATCH /authors/:id/kyc-verification`). Testé en
    navigateur réel avec un auteur jetable (créé puis supprimé en base) sans
    toucher aux deux dossiers auteur déjà vérifiés en production locale.

La section **Utilisateurs** liste aussi désormais les auteurs (`author`),
pas seulement les comptes lecteurs (`users`) — écart volontaire par rapport
à la source Next.js, qui n'affiche que `recentUsers` : `GET
/users/administration/tableau-de-bord`
([`UsersService::getAdminDashboard()`](../refonte_server_php/src/Modules/Users/UsersService.php))
renvoie maintenant `recentAuthors` (6 plus récents, avec statut
compte/KYC vérifié) en plus de `recentUsers`.

Chaque ligne (utilisateur ou auteur) est cliquable et ouvre
[`EditAccountModal`](frontend-react/src/components/EditAccountModal.tsx),
une modale d'édition rapide (nom, email, nouveau mot de passe optionnel, et
statuts actif/administrateur pour un lecteur ou compte vérifié pour un
auteur, avec interrupteurs dégradé ambre/rose) — autre ajout sans
équivalent côté source. Le champ mot de passe réutilise
[`PasswordInput`](frontend-react/src/components/PasswordInput.tsx) et
[`PasswordStrengthPanel`](frontend-react/src/components/PasswordStrengthPanel.tsx)
(mêmes règles que l'inscription) mais reste facultatif — laissé vide, le mot
de passe existant n'est pas touché ; rempli, il est haché côté serveur avec
le même coût bcrypt que `AuthService::register` (`password_hash(...,
PASSWORD_BCRYPT, ['cost' => 12])`) avant d'être écrit en base. Testé de
bout en bout : mot de passe changé depuis la modale, connexion réussie avec
le nouveau mot de passe via `POST /auth/login`. Elle appelle
`PATCH /users/:id` ou `PATCH /authors/:id`
([`UsersController::update`](../refonte_server_php/src/Modules/Users/UsersController.php) /
[`AuthorsController::update`](../refonte_server_php/src/Modules/Authors/AuthorsController.php)),
deux routes ajoutées côté API (absentes de la source Node comme du port
PHP avant ce tour) ; l'email étant `UNIQUE` en base, un doublon remonte en
409 affiché proprement dans la modale plutôt qu'en erreur brute. **Piège de
routage évité** : `PATCH /authors/:authorId` est un segment dynamique
enregistré volontairement *après* les routes littérales `/kyc-bypass` et
`/:authorId/kyc-verification` dans
[`AuthorsRoutes.php`](../refonte_server_php/src/Modules/Authors/AuthorsRoutes.php) — le
routeur matche par ordre d'enregistrement (premier match gagne), donc un
segment dynamique enregistré avant une route littérale l'aurait
silencieusement masquée.
- Achat direct d'un livre entier (sans parties) : `POST /achats` (checkout/
  capture PayPal) n'existe pas encore côté API (cf. le TODO dans
  `refonte_server_php/src/Modules/Achats/AchatsRoutes.php`) — `BookActions`
  ne gère donc que le like et l'ajout au panier par partie (`POST /cart`).
- [`BookWizard`](frontend-react/src/islands/BookWizard.tsx) (création, 5 étapes
  + brouillon localStorage) et [`BookManageDashboard`](frontend-react/src/islands/BookManageDashboard.tsx)
  (détails/édition, parties, chapitres, offrir le livre) sont implémentés,
  avec les mêmes composants d'UI que la source pour le flow de création :
  [`CoverUploadField`](frontend-react/src/components/CoverUploadField.tsx)
  (glisser-déposer, aperçu, retrait) et
  [`ChipsInput`](frontend-react/src/components/ChipsInput.tsx) (tags pour les
  sujets abordés), tous deux réutilisés par `BookFormFields.tsx` (donc aussi
  par l'édition dans `BookManageDashboard`). Seul l'EPUB
  (`EpubEditionsPanel.tsx` côté source — génération/téléchargement de fichier
  asynchrone) n'est pas porté, hors scope de ce scaffold.
- L'édition de chapitre utilise [`RichTextEditor`](frontend-react/src/components/RichTextEditor.tsx),
  port fidèle de l'éditeur Tiptap de la source (gras, italique, titre H2,
  listes, surlignage, alignement — contenu stocké en HTML), y compris les
  mêmes icônes `lucide-react` que `RichTextEditor.tsx` côté Next.js
  (`Bold`, `Italic`, `Heading2`, `List`, `ListOrdered`, `Highlighter`,
  `AlignLeft/Center/Right`) plutôt que des glyphes texte bruts — barre
  d'outils regroupée par section (mise en forme / listes+surlignage /
  alignement) avec séparateurs, boutons plus grands, tooltips (`title`), et
  état actif en dégradé ambre/rose. Le panel d'édition de chapitre est plein
  écran comme `ChapterPanel.tsx`, avec brouillon `localStorage`
  auto-sauvegardé pour la création (pas l'édition), bannière de
  restauration, fermeture par Échap, et verrouillage du scroll du body
  pendant l'ouverture — même comportement que la source.

## Correctif : connexion des comptes auteur impossible

`AuthService::login()` (`refonte_server_php/src/Modules/Auth/AuthService.php`)
ne cherchait l'email que dans la table `users` — un compte auteur (table
`author`) ne pouvait donc jamais se connecter (401 systématique, quel que
soit le mot de passe), alors que la source Node
(`refonte_server/src/modules/auth/auth.service.ts`) cherche dans `users`
PUIS, si rien trouvé, dans `author`. C'était un TODO documenté dès le
scaffold initial (module Authors pas encore écrit à l'époque) — resté non
résolu après l'écriture du module Authors (KYC etc.). Corrigé pour matcher
exactement Node : `login()` et `loadAuthUser()` (flux refresh token mobile)
gèrent maintenant les deux tables, avec `role: 'author'` et `authorId` dans
le payload JWT pour un compte auteur. Testé en navigateur réel (connexion
`/connexion` → redirection `/espace-auteur` → `GET /books/mine` en 200) et
via curl direct sur `POST /auth/login`.

## CONTENT_ENCRYPTION_KEY

`refonte_server_php/.env` a maintenant une clé AES-256 de dev
(`base64_encode(random_bytes(32))`), générée après avoir vérifié qu'aucun
chapitre n'était déjà chiffré en base (`0` ligne `content LIKE
'rabipek:chapter:v1:%'` au moment de la génération) — donc sans risque pour
du contenu réel existant. Création/édition de chapitre testées en conditions
réelles via l'UI : le contenu est bien chiffré en base
(`rabipek:chapter:v1:...`) et se déchiffre correctement à la relecture.

**Avant tout déploiement partageant la base avec le serveur Node
(refonte_server) en production**, remplacer cette clé de dev par la vraie
clé `CONTENT_ENCRYPTION_KEY` de production — sinon le contenu chiffré par
l'un ne sera pas lisible par l'autre.

## Piège axios à connaître : upload de fichier

`apiClient` fixe `Content-Type: application/json` par défaut sur l'instance
(cf. `frontend-react/src/lib/apiClient.ts`). Pour un upload multipart
(`BookFormFields.tsx`, `BookWizard.tsx`, couverture), utiliser `apiClient.postForm(...)` et non
`apiClient.post(...)` — sinon axios sérialise le `FormData` en JSON (aucune
erreur visible côté client, mais PHP ne reçoit aucun fichier : `$_FILES` vide,
`400 Aucune image reçue`). Même piège déjà documenté dans
`refonte_rabi_frontend/src/components/dashboard/author/CoverUploadField.tsx`
(et `DocumentUploadField.tsx`, même règle pour `KycForm.tsx`).

## CSS : Tailwind, pas de fichier à éditer à la main

`public/css/site.css` est un fichier **généré** — ne jamais l'éditer
directement, il est écrasé au prochain build. La source réelle est
[`frontend-react/src/tailwind.css`](frontend-react/src/tailwind.css)
(Tailwind CSS v4, config CSS-first via `@theme`/`@custom-variant`/`@source`,
pas de `tailwind.config.js`). Le dark mode répond à la classe `.dark` sur
`<html>` (script anti-flash dans `layout.php`), pas à `prefers-color-scheme`
— d'où le `@custom-variant dark` explicite plutôt que la stratégie par
défaut de Tailwind v4.

Les vues PHP ne passent jamais par Vite (rendues côté serveur) : le CLI
Tailwind autonome (`@tailwindcss/cli`, pas `@tailwindcss/vite`) compile
directement vers `public/css/site.css`, avec des directives `@source`
explicites pointant vers `resources/views` en plus de `frontend-react/src`
— sans elles, le scanner de classes ne verrait jamais les classes utilisées
dans les templates PHP. Depuis `frontend-react/` :

```
npm run css:build   # build one-shot (minifié)
npm run css:watch   # recompile à chaque changement, pendant le dev
```

Chaque vue PHP et chaque composant/îlot React utilise des classes utilitaires
Tailwind directement dans son JSX/HTML — aucune classe custom du style
`.dashboard-panel` ou `.btn--primary` ne subsiste. Un plugin
`@tailwindcss/typography` (`prose prose-sm ... dark:prose-invert`) est
utilisé uniquement pour les pages légales (mentions, CGV, confidentialité) —
long texte sémantique où étiqueter chaque élément serait absurde.

## Formulaires de connexion/inscription

[LoginForm](frontend-react/src/islands/LoginForm.tsx) et
[RegisterForm](frontend-react/src/islands/RegisterForm.tsx) sont de vrais
composants stylés (classes utilitaires Tailwind), pas des `<label>` bruts en
`style` inline. `RegisterForm` porte le flow complet de la
source : compte simple (nom/email/mot de passe + confirmation +
[PasswordStrengthPanel](frontend-react/src/components/PasswordStrengthPanel.tsx)
en direct) ou, si "Je suis auteur" est coché, un onboarding en 4 étapes
(profil, présentation, genres, récapitulatif) avant soumission.

`POST /auth/register-author` n'existe pas côté API (`register-author` non
porté, cf. `refonte_server_php/src/Modules/Auth/AuthRoutes.php`) — le
wizard va jusqu'au bout, mais la soumission finale d'un compte auteur
échoue avec un message explicite plutôt qu'une 404 brute. L'inscription
lecteur (chemin non-auteur) fonctionne de bout en bout.

## Comment tester une session auteur en local

Pour tester `/espace-auteur/**`, signer un JWT à la main avec le
`JWT_SECRET` du serveur API et le poser comme cookie `rabipek_token` :

```php
// Depuis refonte_server_php/ : php -r "..."
require 'vendor/autoload.php';
echo \App\Utils\Jwt::sign(['id' => 2, 'email' => '...', 'role' => 'author', 'authorId' => 2], 'JWT_SECRET_ICI', 3600);
```

```js
// Dans la console du navigateur, sur http://localhost:8000
document.cookie = "rabipek_token=<token>; path=/";
```
