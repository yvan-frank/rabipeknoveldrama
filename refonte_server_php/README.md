# rabipek-server-php (scaffold)

Scaffold d'un serveur API Rabipek en **PHP natif** (aucun framework), qui
reproduit l'architecture et **toutes les routes** de [`refonte_server`](../refonte_server)
(Express + TypeScript + Prisma). Même base de données MySQL (le schéma reste
celui de `refonte_server/prisma/schema.prisma` — ce projet ne le duplique pas,
il s'y connecte via PDO).

## Pourquoi ce scaffold

- **Architecture identique** : modules `src/Modules/<nom>/` avec le même
  découpage `*Routes` / `*Controller` / `*Service` / `*Schema` que côté Node
  (`*.routes.ts` / `*.controller.ts` / `*.service.ts` / `*.schema.ts`).
- **Mêmes routes, mêmes chemins, mêmes middlewares** : chaque fichier
  `*Routes.php` reproduit exactement les chemins et la chaîne de middlewares
  (`requireAuth`, `requireRole(...)`, `requireAuthorKyc`, `optionalAuth`) du
  fichier `.routes.ts` correspondant — y compris l'ordre de déclaration là où
  il compte (ex. `/mine` avant `/:slug` dans `books.routes.ts`).
- **Tous les modules routés sont pleinement portés** (seuls `register-author`
  et le futur checkout PayPal — jamais implémentés côté Node non plus,
  cf. sections dédiées ci-dessous — restent en `501`) : `Auth` (register/login/
  logout/refresh/me, JWT + refresh tokens en base), `Categories` (lecture
  simple), `Books` (liste/recherche paginée, top-rated, détail public avec
  comptage de vues dédupliqué, espace auteur `/mine` + `/manage/:id`,
  création/édition/suppression avec ownership et confirmation, modération
  admin, don d'accès `/grants`), `Chapters` (paywall lecteur avec contenu
  chiffré AES-256-GCM, progression de lecture, CRUD auteur), `BookParts`
  (parties d'un livre découpé, CRUD avec ownership), `Comments` (avis livre
  avec upsert et réponse d'auteur, fil de discussion par chapitre avec
  réponses et suppression réservée à l'auteur du commentaire), `Likes`
  (toggle j'aime), `Cart` (panier de parties payantes, avec refus des parties
  déjà gratuites ou déjà achetées), `Achats` (historique d'achats de
  l'utilisateur connecté — le seul endpoint que la source Node spécifie ;
  checkout/capture PayPal restent un TODO non routé des deux côtés, cf.
  section Achats ci-dessous), `Authors` (KYC complet : soumission, file de
  vérification admin, réglage de bypass global — brancher sur
  `AuthorKycMiddleware`, qui bloquait tout jusqu'ici) et `Uploads` (upload
  natif via `$_FILES`, type réel détecté par `finfo` plutôt que le
  Content-Type déclaré par le client, nom de fichier aléatoire), `Epub`
  (génération complète d'archives EPUB 3 : sanitisation HTML → XHTML avec
  `DOMDocument`, téléchargement d'images avec protection SSRF, zip via
  `ZipArchive`, validation structurelle, contrôle d'accès au téléchargement —
  cf. section Epub ci-dessous pour les différences assumées) et `Points`
  (solde, historique, pubs récompensées avec cooldown/plafond, check-in
  quotidien à série de 7 jours, tâche "3 articles" à récompense unique,
  paliers de temps de lecture), `Support` (fil de messages unique par
  utilisateur, compteurs lu/non-lu séparés côté lecteur et admin, espace
  admin avec liste des conversations triée par dernier message) et
  `Notifications` (jetons push Expo, envoi fire-and-forget best-effort — cf.
  `bin/send-checkin-reminders.php` pour l'équivalent du cron `node-cron` de
  `server.ts`), `Stats` (résumé par livre, vues ventilées par jour/pays/
  plateforme — `Stats\ViewTrackingService::trackBookView` est la seule
  implémentation du comptage de vues, utilisée aussi par `Books`, exactement
  comme côté Node où `books.service.ts` l'importe depuis
  `stats/view-tracking.service.ts`) et `Users` (liste/détail/suppression
  douce admin, dons de livres manuels avec historique et révocation,
  tableau de bord lecteur avec "bibliothèque" dédupliquée achats+lectures,
  tableau de bord admin — `Users\UsersService::grantBookToUser` est la seule
  implémentation des dons de livre, utilisée aussi par `Books::grantBookToReader`,
  exactement comme côté Node où `books.service.ts` l'importe depuis
  `users/users.service.ts`).

## Correspondance avec `refonte_server` (Node)

| Node (`refonte_server/src/`)            | PHP (`refonte_server_php/src/`)         |
|------------------------------------------|------------------------------------------|
| `app.ts` (createApp)                     | `App.php`                                |
| `server.ts` (listen, cron, shutdown)      | `public/index.php` (+ cron via crontab système, cf. plus bas) |
| `routes/index.ts`                         | `Routes.php`                             |
| `config/env.ts`                           | `Config/Env.php`                         |
| `config/cors.ts`                          | `Config/Cors.php`                        |
| `lib/prisma.ts`                           | `Lib/Database.php` (PDO)                 |
| `lib/logger.ts`                           | `Lib/Logger.php`                         |
| `middlewares/auth.middleware.ts`          | `Middleware/AuthMiddleware.php`          |
| `middlewares/authorKyc.middleware.ts`     | `Middleware/AuthorKycMiddleware.php`     |
| `middlewares/error.middleware.ts`         | `Utils/ErrorHandler.php`                 |
| `middlewares/validate.middleware.ts`      | `Utils/Validator.php` (appelé explicitement en tête de controller — pas de middleware générique, cf. plus bas) |
| `utils/ApiError.ts`                       | `Utils/ApiError.php`                     |
| `utils/asyncHandler.ts`                   | *(inutile : PHP est synchrone, pas de rejection de promesse à intercepter)* |
| `utils/ownership.ts`                      | `Utils/Ownership.php`                    |
| `utils/slugify.ts`                        | `Utils/Slugify.php`                      |
| `modules/<nom>/*.routes.ts`               | `Modules/<Nom>/<Nom>Routes.php`          |
| `modules/<nom>/*.controller.ts`           | `Modules/<Nom>/<Nom>Controller.php`      |
| `modules/<nom>/*.service.ts`              | `Modules/<Nom>/<Nom>Service.php`         |
| `modules/<nom>/*.schema.ts` (Zod)         | `Modules/<Nom>/<Nom>Schema.php` (règles pour `Utils/Validator`) |

Différences volontaires liées au natif PHP (pas un framework, un process par
requête, pas d'event loop) :

- **Pas de `next()` chaîné à la Express.** Le routeur (`Http/Router.php`)
  compose lui-même la chaîne de middlewares autour du handler ; chaque
  middleware a la signature `function(Request $req, callable $next): void`.
- **Validation appelée dans le controller**, pas montée comme middleware
  générique (`validate(schema)` côté Node) — plus simple à lire en PHP
  synchrone, même résultat (400 + erreurs par champ si invalide).
- **JWT et parsing `.env` implémentés nativement** (`Utils/Jwt.php`,
  `Config/Env.php`), sans dépendance Composer, pour rester "PHP pur".
- **Cron** (`node-cron` dans `server.ts`, relance des check-in à 19h) :
  reproduit via un script CLI dédié (`bin/send-checkin-reminders.php`), à
  planifier avec une tâche cron système, plutôt qu'un scheduler en process —
  un serveur PHP-FPM/Apache classique ne tourne pas en process long comme Node.

## Prérequis

- PHP >= 8.1 avec `pdo_mysql`
- Composer (uniquement pour l'autoload PSR-4 — aucune dépendance runtime)
- La même base MySQL que `refonte_server` (migrations Prisma déjà appliquées)

## Installation

```bash
composer install
cp .env.example .env
# éditer .env : DATABASE_URL, JWT_SECRET, CORS_ORIGINS...
```

## Lancer en développement

```bash
php -S localhost:4000 -t public public/router.php
```

`public/router.php` sert les fichiers réels de `public/` (ex. `/uploads/...`)
tel quel et route tout le reste vers `public/index.php`, car le serveur de
dev intégré de PHP ne lit pas `.htaccess`.

## Déploiement (Apache / LWS)

Pointer le **DocumentRoot sur `public/`**. `.htaccess` s'y charge de :
- rediriger toute requête (hors fichier/dossier réel) vers `index.php` ;
- refuser l'accès direct à `.env` et aux fichiers de config.

Si l'hébergeur impose un DocumentRoot sur la racine du projet (mutualisé
cPanel classique), le `.htaccess` racine bloque `src/`, `vendor/`, `private/`
— mais **`public/` comme DocumentRoot reste la configuration recommandée**.

## Vérifier que ça tourne

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/categories
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'
```

## Epub — différences assumées par rapport à Node

- **Génération synchrone, pas de worker.** `epub.worker.ts` met la génération
  en file via `setImmediate`, hors du cycle requête/réponse d'un process Node
  persistant. Ce scaffold — un processus PHP par requête, sans event loop —
  la lance de façon synchrone depuis `EpubController::create`, juste après la
  création de l'édition. Le contrat HTTP ne change pas (202 Accepted,
  édition renvoyée à l'état `QUEUED`) ; seul le moment où le fichier devient
  réellement disponible change (immédiat ici, différé côté Node). `bin/resume-epub-generations.php`
  reproduit `resumeEpubGenerationQueue()` (appelé au démarrage de `server.ts`)
  — à lancer manuellement après un redémarrage/déploiement, ou via une tâche
  cron courte, pour reprendre les éditions restées bloquées.
- **Stockage local uniquement.** Le driver `EPUB_STORAGE_DRIVER=s3` n'est pas
  porté (cf. `EpubStorage.php`) : il dépendrait du SDK AWS, une dépendance
  Composer lourde contraire à l'esprit "PHP natif, zéro dépendance" de ce
  scaffold. Le driver `local` (par défaut des deux côtés) est pleinement
  fonctionnel.
- **ZipArchive et DOMDocument au lieu d'`archiver`/`cheerio`/`yauzl`** —
  extensions PHP standard, pas de dépendance Composer supplémentaire.
  `DOMDocument::saveXML()` auto-ferme les éléments vides (`<img/>`, `<br/>`)
  à la sérialisation, ce qui dispense des remplacements regex utilisés côté
  Node pour produire du XHTML valide.

## Achats — portée volontairement limitée

Contrairement aux autres modules, `achats.routes.ts` côté Node n'a **jamais**
eu de controller/service : seule une route `GET /` stub existe, avec un
commentaire TODO listant `POST /checkout` et `POST /capture/:orderId`
(intégration PayPal) comme travail futur, sans schéma ni logique écrite nulle
part. Ce scaffold porte donc uniquement ce que la source spécifie
réellement — l'historique d'achats (`AchatsService::listUserAchats`) — et
n'invente pas les routes checkout/capture, qui n'existent dans aucune des
deux implémentations. À écrire quand l'intégration PayPal sera spécifiée
côté Node.

## Prochaines étapes

Tous les modules routés ont désormais une implémentation complète. Il ne
reste en `501` que deux endpoints jamais écrits côté Node non plus :
`POST /auth/register-author` (inscription auteur — dépend d'un futur
onboarding KYC/genres) et `GET /authors` (liste publique des auteurs), plus
les points volontairement hors scope documentés ci-dessous (checkout PayPal,
driver S3 pour Epub). Un nouveau module suivrait le même patron que
`Auth`/`Books`/`Chapters` : `*Schema` (validation + coercition, à la Zod) →
`*Service` (requêtes PDO, mapping camelCase) → `*Controller` (appelle le
service, formate la réponse) → `*Routes`.

`BooksService::grantBookToReader` reste une implémentation autonome
(requêtes dupliquées de ce que fera `Users::grantBookToUser`) en attendant le
port du module `Users` — à réconcilier à ce moment-là, pour ne garder qu'une
seule implémentation. Le comptage de vues, qui avait la même limitation
temporaire, a été réconcilié en portant `Stats` : `BooksService` délègue
maintenant à `Stats\ViewTrackingService::trackBookView` (ventilation complète
par jour/pays/plateforme, HMAC signée avec `JWT_SECRET` comme côté Node —
l'ancienne version simplifiée utilisait un hash non signé), et la notation
moyenne à `Comments\CommentsService::getBookReviewStats`, exactement comme
`books.service.ts` importe ces deux fonctions depuis leurs modules respectifs
côté Node.
