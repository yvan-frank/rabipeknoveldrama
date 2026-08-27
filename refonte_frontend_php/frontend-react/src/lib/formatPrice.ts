// FCFA n'a pas de sous-unité usuelle : entier avec séparateur de milliers
// (espace insécable, convention fr-FR), jamais de décimales — même règle
// que refonte_rabi_frontend/src/lib/format-price.ts.
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount);
}
