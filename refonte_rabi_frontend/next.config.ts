import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sans ça, Next.js (dev) rejette silencieusement les requêtes cross-origin
  // vers les assets/HMR quand le site est ouvert depuis un autre appareil sur
  // le réseau local (ex: téléphone via l'IP du PC) — le HTML s'affiche mais
  // React n'hydrate jamais correctement, donc aucun onClick ne répond (seuls
  // les <a href> natifs, comme les liens de la bottom nav, continuent de
  // "marcher" puisqu'ils ne dépendent pas du JS).
  allowedDevOrigins: ["192.168.1.178"],
};

export default nextConfig;
