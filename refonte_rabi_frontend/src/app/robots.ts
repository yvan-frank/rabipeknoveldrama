import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots { return { rules: [{ userAgent: '*', allow: '/', disallow: ['/administration', '/espace-auteur', '/tableau-de-bord', '/connexion', '/inscription'] }], sitemap: 'https://rabipeknovel.com/sitemap.xml' }; }
