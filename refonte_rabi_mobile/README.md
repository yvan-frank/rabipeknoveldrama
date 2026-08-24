# Rabipek Mobile

Application lectrice iOS/Android — React Native + Expo + TypeScript, connectée
au backend Express/Prisma de `refonte_server`. Portée et phases détaillées
dans le plan mobile (cahier des charges + roadmap d'implémentation) ; ce
dépôt correspond à la **Phase 2 — Fondations**.

## Démarrage

```bash
npm install
cp .env.example .env.local   # ajuster EXPO_PUBLIC_API_URL si besoin
npm start
```

`EXPO_PUBLIC_API_URL` doit pointer vers une instance de `refonte_server`
accessible depuis le téléphone/émulateur (pas `localhost` sur un appareil
physique — utiliser l'IP LAN de la machine de dev).

## Scripts

- `npm start` / `npm run android` / `npm run ios` / `npm run web`
- `npm run lint` — ESLint (`eslint-config-expo`)
- `npm run typecheck` — `tsc --noEmit`

## Architecture

- **Routing** : Expo Router (`app/`), avec deux groupes de routes :
  - `(auth)` — connexion/inscription, accessible seulement si déconnecté
  - `(app)` — onglets Accueil/Bibliothèque/Compte, accessible seulement si connecté
  - Chaque groupe redirige vers l'autre via son `_layout.tsx` selon
    `useAuthStore().status` (`bootstrapping` / `guest` / `authenticated`).
- **API** (`src/api/`) : `client.ts` est l'instance axios partagée. Contrairement
  au web (cookie httpOnly), le mobile attache un `Authorization: Bearer` sur
  chaque requête et rafraîchit automatiquement l'access token sur un 401 via
  `POST /auth/refresh` (une seule tentative de rafraîchissement en vol,
  partagée entre requêtes concurrentes).
- **Auth** (`src/auth/`) : `token-storage.ts` persiste access/refresh token
  dans `expo-secure-store` (jamais `AsyncStorage` en clair). `auth-store.ts`
  (Zustand) expose l'état de session et échange le refresh token contre une
  paire fraîche au démarrage de l'app (l'access token, valide 15 min, a
  presque toujours expiré entre deux ouvertures).
- **Données** : TanStack Query pour le cache réseau (voir `app/(app)/index.tsx`
  pour un exemple avec `GET /books`) ; Zustand pour l'état local (session,
  préférences de lecture à venir en Phase 4).
- **Thème** (`src/theme/`) : tokens de couleur/typo partagés, palette identique
  au plan mobile pour une continuité visuelle ; `useTheme()` bascule clair/sombre
  selon le thème système.

## Ce qui reste à faire (hors Phase 2)

Cf. plan mobile pour le détail — notamment : catalogue/recherche/fiche livre
(Phase 3), lecteur de chapitres + téléchargement EPUB hors-ligne (Phase 4),
panier/paiement in-app (Phase 5), qualité et publication stores (Phase 6).
