import { z } from 'zod';

const extensionSchema = z.object({
  introduction: z.string().optional(),
  topics: z.string().optional(),
  conclusion: z.string().optional(),
  language: z.string().max(50).optional(),
});

export const createBookSchema = z.object({
  title: z.string().min(1).max(255),
  datePub: z.coerce.date(),
  cover: z.string().min(1),
  filePath: z.string().max(255).optional(),
  price: z.number().int().min(0),
  pageNumber: z.number().int().min(1),
  // Facultatif : un livre peut être géré entièrement via la lecture intégrée
  // (chapitres), sans fichier téléchargeable externe.
  bookLink: z.string().min(1).optional(),
  resume: z.string().min(1),
  isFree: z.boolean().default(true),
  readBeforePay: z.boolean().default(false),
  freeChapterCount: z.number().int().min(0).default(3),
  isPromotion: z.boolean().default(false),
  promotionPrice: z.number().int().min(0).default(0),
  // Public visé : true = réservé aux 18 ans et plus.
  isAdultOnly: z.boolean().default(false),
  categoryId: z.number().int().positive(),
  authorId: z.number().int().positive(),
  extension: extensionSchema.optional(),
});
export type CreateBookInput = z.infer<typeof createBookSchema>;

export const updateBookSchema = createBookSchema.partial().omit({ authorId: true });
export type UpdateBookInput = z.infer<typeof updateBookSchema>;

export const listBooksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.coerce.number().int().positive().optional(),
  authorId: z.coerce.number().int().positive().optional(),
  search: z.string().min(1).max(255).optional(),
  isFree: z.coerce.boolean().optional(),
});
export type ListBooksQuery = z.infer<typeof listBooksQuerySchema>;

export const topRatedBooksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(6),
});
export type TopRatedBooksQuery = z.infer<typeof topRatedBooksQuerySchema>;

export const bookIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const grantBookToEmailSchema = z.object({
  email: z.string().trim().email(),
  note: z.string().trim().max(500).optional(),
});

export const moderateBookSchema = z.object({
  action: z.enum(['publish', 'unpublish', 'block', 'suspend', 'delete']),
  confirmationPhrase: z.string().trim().refine((value) => value === 'CONFIRMER', { message: 'Confirmation requise' }),
});

// Protège la suppression contre les clics accidentels, y compris si la route
// est appelée sans passer par l'interface. Ce n'est pas un secret : la phrase
// matérialise le consentement explicite de l'auteur connecté.
export const deleteBookSchema = z.object({
  confirmationPhrase: z.string().trim().refine((value) => value === 'SUPPRIMER', {
    message: 'Saisissez exactement « SUPPRIMER » pour confirmer la suppression',
  }),
});

export const bookSlugParamSchema = z.object({
  slug: z.string().min(1),
});
