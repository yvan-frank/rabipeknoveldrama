import { z } from 'zod';

export const documentTypeOptions = [
  { value: 'cni', label: "Carte nationale d'identité (CNI)" },
  { value: 'passeport', label: 'Passeport' },
  { value: 'autre', label: "Autre pièce d'identité" },
];

const urlOrEmpty = z.string().url('URL invalide').optional().or(z.literal(''));

// Miroir de kycSchema côté serveur (refonte_server/src/modules/authors/authors.schema.ts) —
// les réseaux sociaux sont saisis séparément ici puis regroupés en `socialLinks` à l'envoi.
export const kycFormSchema = z.object({
  fullName: z.string().min(1, 'Le nom complet est requis').max(50),
  country: z.string().min(1, 'Le pays est requis').max(50),
  address: z.string().min(1, "L'adresse est requise").max(50),
  documentType: z.enum(['cni', 'passeport', 'autre'], { message: 'Choisissez un type de document' }),
  documentId: z.string().min(1, 'Le numéro du document est requis').max(50),
  documents: z.string().min(1, "Le document scanné est requis"),
  facebook: urlOrEmpty,
  instagram: urlOrEmpty,
  twitter: urlOrEmpty,
  website: urlOrEmpty,
  privacyAccepted: z.boolean().refine((v) => v === true, {
    message: 'Vous devez accepter la politique de confidentialité',
  }),
});
export type KycFormValues = z.infer<typeof kycFormSchema>;

export function toKycApiPayload(values: KycFormValues) {
  const { facebook, instagram, twitter, website, ...rest } = values;
  const socialLinks: Record<string, string> = {};
  if (facebook) socialLinks.facebook = facebook;
  if (instagram) socialLinks.instagram = instagram;
  if (twitter) socialLinks.twitter = twitter;
  if (website) socialLinks.website = website;
  return { ...rest, ...(Object.keys(socialLinks).length > 0 ? { socialLinks } : {}) };
}

// Liste volontairement non exhaustive (priorité aux pays francophones et aux
// principaux marchés), plutôt qu'une liste ISO complète de 190+ entrées.
export const COUNTRY_OPTIONS = [
  'Cameroun',
  'Sénégal',
  "Côte d'Ivoire",
  'Bénin',
  'Togo',
  'Mali',
  'Burkina Faso',
  'Niger',
  'Guinée',
  'Gabon',
  'Congo',
  'République démocratique du Congo',
  'Tchad',
  'République centrafricaine',
  'Rwanda',
  'Burundi',
  'Madagascar',
  'Maroc',
  'Algérie',
  'Tunisie',
  'France',
  'Belgique',
  'Suisse',
  'Canada',
  'Haïti',
  'États-Unis',
  'Royaume-Uni',
  'Allemagne',
  'Espagne',
  'Portugal',
  'Nigeria',
  'Ghana',
  'Afrique du Sud',
  'Autre',
].map((name) => ({ value: name, label: name }));
