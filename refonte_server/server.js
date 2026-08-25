// Point d'entrée pour l'hébergement LWS (cPanel "Setup Node.js App", moteur
// Passenger) : ce fichier est celui à renseigner comme "Application startup
// file" dans l'interface cPanel, quel que soit l'endroit où vit le vrai code
// compilé (dist/server.js, généré par `npm run build`). Passenger fixe déjà
// process.env.PORT et process.env.NODE_ENV avant de lancer ce fichier — notre
// config (src/config/env.ts) les lit directement, rien à faire de plus ici.
require('./dist/server.js');
