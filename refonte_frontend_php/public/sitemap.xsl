<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
<xsl:output method="html" encoding="UTF-8" indent="yes"/>

<!-- Rend sitemap.xml lisible pour un humain qui l'ouvrirait directement dans
     un navigateur (les moteurs de recherche, eux, ignorent cette feuille de
     style et lisent le XML brut) — mêmes couleurs de marque que le site
     (brand-amber/brand-pink, cf. frontend-react/src/tailwind.css). -->
<xsl:template match="/">
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Sitemap — RabipekNovel</title>
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 2.5rem 1.5rem;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      background: #F3F4F6;
      color: #10161F;
    }
    @media (prefers-color-scheme: dark) {
      body { background: #09090B; color: #EDEEF0; }
      .card { background: #18181B !important; border-color: #27272A !important; }
      tr:hover { background: #1f1f23 !important; }
      .count { color: #aaabac !important; }
    }
    .wrap { max-width: 960px; margin: 0 auto; }
    .header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
    .logo-dot {
      width: 12px; height: 12px; border-radius: 999px;
      background: linear-gradient(135deg, #F59E0B, #EB1983);
    }
    h1 { font-size: 1.5rem; margin: 0; }
    .count { color: #5C6B7E; font-size: 0.9rem; margin: 0 0 1.75rem; }
    .card {
      background: #FFFFFF; border: 1px solid #DCE1E7; border-radius: 14px;
      overflow: hidden;
    }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    thead th {
      text-align: left; padding: 0.75rem 1rem; font-weight: 600;
      border-bottom: 1px solid #DCE1E7;
      background: linear-gradient(90deg, rgba(245,158,11,0.08), rgba(235,25,131,0.08));
    }
    tbody td { padding: 0.65rem 1rem; border-bottom: 1px solid #DCE1E7; vertical-align: top; }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover { background: rgba(245,158,11,0.06); }
    a { color: #F59E0B; text-decoration: none; word-break: break-all; }
    a:hover { text-decoration: underline; }
    .badge {
      display: inline-block; padding: 0.15rem 0.55rem; border-radius: 999px;
      font-size: 0.75rem; font-weight: 600; background: rgba(235,25,131,0.12); color: #EB1983;
    }
    .muted { color: #5C6B7E; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <span class="logo-dot"></span>
      <h1>Sitemap RabipekNovel</h1>
    </div>
    <p class="count"><xsl:value-of select="count(//sitemap:url)"/> URL(s) référencée(s)</p>
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>URL</th>
            <th>Priorité</th>
            <th>Fréquence</th>
            <th>Dernière modification</th>
          </tr>
        </thead>
        <tbody>
          <xsl:for-each select="//sitemap:url">
            <tr>
              <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
              <td><span class="badge"><xsl:value-of select="sitemap:priority"/></span></td>
              <td class="muted"><xsl:value-of select="sitemap:changefreq"/></td>
              <td class="muted"><xsl:value-of select="sitemap:lastmod"/></td>
            </tr>
          </xsl:for-each>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
