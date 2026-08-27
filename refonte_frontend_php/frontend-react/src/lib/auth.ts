// Miroir de refonte_rabi_frontend/src/lib/schemas/auth.ts (sans zod, mêmes
// règles) — une seule source de vérité pour PasswordStrengthPanel et pour
// la validation avant soumission.
export const PASSWORD_RULES = [
  { id: 'length', label: 'Au moins 8 caractères', test: (v: string) => v.length >= 8 },
  { id: 'uppercase', label: 'Une majuscule', test: (v: string) => /[A-Z]/.test(v) },
  { id: 'lowercase', label: 'Une minuscule', test: (v: string) => /[a-z]/.test(v) },
  { id: 'number', label: 'Un chiffre', test: (v: string) => /\d/.test(v) },
  { id: 'special', label: 'Un caractère spécial', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

export function isStrongPassword(value: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}

export const MAX_ABOUT_WORDS = 100;

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}
