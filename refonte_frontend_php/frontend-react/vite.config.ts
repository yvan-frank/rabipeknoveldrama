import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const HOT_FILE = resolve(__dirname, '../public/hot');

// Écrit public/hot pendant `npm run dev` (contenant l'URL du serveur Vite),
// supprimé à l'arrêt — même convention que le plugin officiel Laravel Vite.
// src/Support/Vite.php se fie à la PRÉSENCE de ce fichier pour choisir entre
// dev server et manifest de build, plutôt qu'à l'absence du manifest : sans
// ça, un `npm run build` local masquerait silencieusement le HMR du serveur
// de dev tant que public/build/ n'est pas supprimé à la main.
function hotFilePlugin(): Plugin {
  return {
    name: 'rabipek-hot-file',
    configureServer(server) {
      const writeHotFile = () => {
        const address = server.httpServer?.address();
        const url = typeof address === 'object' && address
          ? `http://localhost:${address.port}`
          : 'http://localhost:5173';
        writeFileSync(HOT_FILE, url);
      };
      server.httpServer?.once('listening', writeHotFile);
      process.on('exit', () => rmSync(HOT_FILE, { force: true }));
    },
  };
}

// Les pages PHP consomment ce build comme des <script>/<link> statiques
// (cf. src/Support/Vite.php) — pas de SSR, pas de routing ici : Vite ne
// fait que compiler les îlots React et écrire un manifest pour que PHP
// sache quels fichiers hashés inclure.
export default defineConfig({
  plugins: [react(), hotFilePlugin()],
  base: '/build/',
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    origin: 'http://localhost:5173',
  },
  build: {
    manifest: true,
    outDir: '../public/build',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/main.tsx',
    },
  },
});
