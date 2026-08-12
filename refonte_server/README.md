# rabipek-server (refonte)

Refonte du backend de la librairie numérique Rabipek. Remplace progressivement
`rabipek_server` (Express/JS/SQL brut) par une base Express/TypeScript/Prisma
plus sûre et plus facile à faire évoluer.

## Stack

- **Node.js 20+ / Express 4** — API REST
- **TypeScript strict**
- **Prisma + MySQL** — accès DB typé, migrations versionnées
- **Zod** — validation des entrées (body/query/params)
- **JWT (cookie httpOnly)** — auth stateless uniquement (pas de table `sessions`)
- **Pino** — logs structurés
- **Vitest + Supertest** — tests
- **ESLint + Prettier**

## Démarrage

```bash
cp .env.example .env
# renseigner DATABASE_URL, JWT_SECRET, etc.

npm install
npm run prisma:migrate   # crée les tables à partir de prisma/schema.prisma
npm run dev               # démarre en watch mode sur $PORT (4000 par défaut)
```

### Chiffrement du contenu des chapitres

Définissez `CONTENT_ENCRYPTION_KEY` avec une clé AES-256 encodée en base64
(`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`).
Les nouveaux chapitres sont chiffrés automatiquement. Après le déploiement de
la clé, chiffrez les contenus existants une seule fois avec :

```bash
npx tsx prisma/encrypt-chapter-content.ts
```

Conservez cette clé dans un gestionnaire de secrets : sa perte rend les
chapitres chiffrés irrécupérables.

Avec Docker :

```bash
docker compose -f docker/docker-compose.yml up --build
```

## Structure

```
prisma/schema.prisma        Schéma de données (source de vérité DB)
src/
  app.ts                    Config Express (middlewares globaux, montage des routes)
  server.ts                 Point d'entrée (listen + arrêt propre)
  config/                   env.ts (validation Zod des variables d'env), cors.ts
  lib/                      prisma.ts (client singleton), logger.ts
  middlewares/              auth, gestion d'erreurs, validation Zod
  modules/<ressource>/      <ressource>.routes.ts / .controller.ts / .service.ts / .schema.ts
  routes/index.ts           Agrège tous les routers de modules sous /api
tests/                      Tests Vitest + Supertest
docker/                     Dockerfile + docker-compose (app + MySQL + Redis)
```

### Pattern à suivre pour un module

Le module `auth` et `users` (`src/modules/auth`, `src/modules/users`) sert de
référence. Chaque ressource suit la même découpe en 4 fichiers :

1. `*.schema.ts` — schémas Zod (validation + typage des entrées)
2. `*.service.ts` — logique métier + accès Prisma (jamais de req/res ici)
3. `*.controller.ts` — traduit req/res <-> appels au service
4. `*.routes.ts` — déclare les endpoints, branche middlewares (`requireAuth`,
   `requireRole`, `validate`)

`books` et `chapters` sont maintenant implémentés en entier (voir détail
ci-dessous). Les modules restants (`authors`, `categories`, `cart`, `achats`,
`comments`, `stats`) sont encore des **stubs** (routes qui répondent 501) avec
des commentaires TODO listant les endpoints attendus, à implémenter en suivant
ce pattern.

### Module `books`

- `GET /api/books` — liste paginée, filtres `categoryId`/`authorId`/`search`/`isFree` (public)
- `GET /api/books/:id` — détail (catégorie, auteur, extension, sommaire des chapitres) (public)
- `POST /api/books`, `PATCH /api/books/:id`, `DELETE /api/books/:id` — `requireAuth` + rôle `author`/`admin`,
  ownership vérifiée via `assertAuthorOwnership` (un auteur ne peut agir que sur ses propres livres)
- Suppression bloquée (409) si le livre a déjà été acheté (FK `Restrict` sur `achat`, décision volontaire pour préserver l'historique)

### Module `chapters`

- `GET /api/chapters/book/:bookId` — sommaire (id, titre, numéro), sans le contenu
- `GET /api/chapters/:id` — détail complet (contenu, extension, livre parent)
- `POST /api/chapters`, `PATCH /api/chapters/:id`, `DELETE /api/chapters/:id` — mêmes règles d'ownership que `books`,
  via le `authorId` du livre parent
- Contrainte unique `(bookId, chapterNumber)` ajoutée au schéma (absente du legacy) — un numéro de chapitre en double renvoie 409

⚠️ Pour l'instant, `role: 'author'` n'a **aucun moyen de s'authentifier** sur ce serveur
(seul `auth.service.ts` gère les `User` lecteurs). Les écritures sur `books`/`chapters`
ne sont donc utilisables en pratique que par un `admin`, en attendant la décision sur
la vérification des JWT Clerk d'`authorabipek` côté API.

## Décisions d'architecture (issues de l'audit de `rabipek_server`)

- **Un seul mécanisme d'auth** : JWT stateless dans un cookie httpOnly/secure.
  Pas de table `sessions` en parallèle (l'ancien système cumulait les deux
  sans raison claire).
- **Login sécurisé** : comparaison systématique via `bcrypt.compare`, jamais
  de mot de passe en clair dans une requête SQL (bug trouvé dans le legacy).
- **Secrets hors du code** : tout passe par `.env` (validé au démarrage via
  `src/config/env.ts`), plus de credentials DB en dur dans un fichier versionné.
- **Intégrité référentielle** : toutes les relations `id_book`/`id_user`/`id_author`
  sont désormais de vraies FK Prisma (`onDelete` explicite), y compris celles
  absentes du schéma legacy (`cart`, `likes`, `commentaires`, `readbook`, `shares`).
  ⚠️ Avant la première migration sur la base de prod existante, auditer et
  nettoyer les lignes orphelines, sinon la création des contraintes échouera.
- **Tables `*_extension`** : relation 1-1 stricte (colonne `@unique` + FK),
  contrairement au legacy qui ne garantissait rien.
- **Tables abandonnées** : `olduser` (remplacée par `User.deletedAt`) et
  `sessions` (remplacée par le JWT stateless) ne sont pas reprises dans le
  nouveau schéma.
- **Stats de vues** : `views_book_per_day` est la table de faits ; `viewbooks`
  et `views_books_by_country/platform` sont des agrégats dérivés — à terme,
  envisager de les calculer à la volée plutôt que de les maintenir en écriture
  double.

## Ce qu'il reste à faire

- [ ] Implémenter les modules stub (`books`, `chapters`, `authors`, `categories`,
      `cart`, `achats`, `comments`, `stats`) en suivant le pattern `auth`/`users`
- [ ] Script de migration des données depuis la base `rabipek_server` existante
      (avec audit des orphelins avant activation des FK)
- [ ] Intégration PayPal (module `achats`)
- [ ] Upload de fichiers (couverture livres, documents auteur) — décider
      disque local (comme le legacy) vs stockage objet (S3-compatible)
- [ ] Décider si les JWT Clerk d'`authorabipek` doivent être vérifiés côté API,
      ou si on garde deux systèmes d'auth séparés (users vs auteurs)
- [ ] CI : ajouter un service MySQL pour faire tourner les tests d'intégration
      Prisma dans `.github/workflows/ci.yml`
