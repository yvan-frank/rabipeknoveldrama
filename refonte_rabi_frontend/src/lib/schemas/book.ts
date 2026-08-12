import { z } from 'zod';

// Miroir de createBookSchema/updateBookSchema côté serveur (refonte_server/src/modules/books/books.schema.ts) —
// `authorId` est ajouté automatiquement à l'envoi (utilisateur connecté), jamais saisi dans le formulaire.
// introduction/topics/conclusion/language correspondent à BookExtension, tous facultatifs
// (un livre peut n'avoir ni introduction ni conclusion) — regroupés côté API sous `extension`.
export const bookFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(255),
  datePub: z.string().min(1, 'La date de publication est requise'),
  cover: z.string().min(1, 'Ajoutez une image de couverture'),
  bookLink: z.string().optional(),
  resume: z.string().min(1, 'Le résumé est requis'),
  price: z.number().int().min(0),
  pageNumber: z.number().int().min(1, 'Doit être au moins 1'),
  categoryId: z.number().int().positive('Choisissez une catégorie'),
  isFree: z.boolean(),
  readBeforePay: z.boolean(),
  freeChapterCount: z.number().int().min(0),
  isPromotion: z.boolean(),
  promotionPrice: z.number().int().min(0),
  // Public visé : true = réservé aux 18 ans et plus (déclenche la
  // confirmation d'âge sur la page détail publique).
  isAdultOnly: z.boolean(),
  language: z.string().optional(),
  introduction: z.string().optional(),
  topics: z.string().optional(),
  conclusion: z.string().optional(),
});
export type BookFormValues = z.infer<typeof bookFormSchema>;

// Regroupe les champs facultatifs de BookExtension en objet `extension`
// pour l'API — omis entièrement si aucun n'est renseigné.
export function toBookApiPayload(values: BookFormValues) {
  const { language, introduction, topics, conclusion, ...rest } = values;
  const hasExtension = Boolean(language || introduction || topics || conclusion);
  return {
    ...rest,
    bookLink: rest.bookLink || undefined,
    ...(hasExtension
      ? {
          extension: {
            ...(language ? { language } : {}),
            ...(introduction ? { introduction } : {}),
            ...(topics ? { topics } : {}),
            ...(conclusion ? { conclusion } : {}),
          },
        }
      : {}),
  };
}

export const chapterFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(255),
  chapterNumber: z.number().int().positive('Doit être au moins 1'),
  content: z.string().min(1, 'Le contenu est requis'),
  introduction: z.string().optional(),
});
export type ChapterFormValues = z.infer<typeof chapterFormSchema>;
