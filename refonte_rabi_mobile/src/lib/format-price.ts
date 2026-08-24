// Miroir de refonte_rabi_frontend/src/lib/format-price.ts : le FCFA (XAF) n'a
// pas de sous-unité usuelle, on formate donc en entier avec séparateur de
// milliers (convention fr-FR), jamais de décimales.
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount);
}
