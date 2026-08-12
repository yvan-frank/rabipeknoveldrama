// FCFA n'a pas de sous-unité usuelle : on formate en entier avec séparateur
// de milliers (espace insécable, convention fr-FR), jamais de décimales.
export function formatPrice(amount: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount);
}
