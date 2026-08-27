// Partagé entre BookWizard.tsx et BookManageDashboard.tsx (panneau
// d'édition) — miroir de refonte_rabi_frontend/src/lib/schemas/book.ts
// (bookFormSchema / toBookApiPayload), sans zod.

export interface BookFormState {
  title: string;
  datePub: string;
  cover: string;
  bookLink: string;
  resume: string;
  price: number;
  pageNumber: number;
  categoryId: number;
  isFree: boolean;
  readBeforePay: boolean;
  freeChapterCount: number;
  isPromotion: boolean;
  promotionPrice: number;
  isAdultOnly: boolean;
  language: string;
  introduction: string;
  topics: string;
  conclusion: string;
}

export const LANGUAGE_OPTIONS = [
  { value: '', label: 'Non précisée' },
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
  { value: 'es', label: 'Espagnol' },
  { value: 'pt', label: 'Portugais' },
  { value: 'de', label: 'Allemand' },
];

export const EMPTY_BOOK_FORM: BookFormState = {
  title: '',
  datePub: new Date().toISOString().slice(0, 10),
  cover: '',
  bookLink: '',
  resume: '',
  price: 0,
  pageNumber: 1,
  categoryId: 0,
  isFree: true,
  readBeforePay: false,
  freeChapterCount: 3,
  isPromotion: false,
  promotionPrice: 0,
  isAdultOnly: false,
  language: '',
  introduction: '',
  topics: '',
  conclusion: '',
};

// Regroupe language/introduction/topics/conclusion sous `extension` pour
// l'API, omis entièrement si tous vides — même règle que toBookApiPayload.
export function toBookApiPayload(form: BookFormState) {
  const { language, introduction, topics, conclusion, bookLink, ...rest } = form;
  const hasExtension = Boolean(language || introduction || topics || conclusion);
  return {
    ...rest,
    bookLink: bookLink || undefined,
    ...(hasExtension
      ? { extension: { ...(language && { language }), ...(introduction && { introduction }), ...(topics && { topics }), ...(conclusion && { conclusion }) } }
      : {}),
  };
}

// Depuis la réponse de GET /books/manage/:id (BooksService::mapFullBook côté PHP).
export function bookToFormState(book: any): BookFormState {
  return {
    title: book.title ?? '',
    datePub: (book.datePub ?? '').slice(0, 10) || new Date().toISOString().slice(0, 10),
    cover: book.cover ?? '',
    bookLink: book.bookLink ?? '',
    resume: book.resume ?? '',
    price: book.price ?? 0,
    pageNumber: book.pageNumber ?? 1,
    categoryId: book.categoryId ?? 0,
    isFree: book.isFree ?? true,
    readBeforePay: book.readBeforePay ?? false,
    freeChapterCount: book.freeChapterCount ?? 3,
    isPromotion: book.isPromotion ?? false,
    promotionPrice: book.promotionPrice ?? 0,
    isAdultOnly: book.isAdultOnly ?? false,
    language: book.extension?.language ?? '',
    introduction: book.extension?.introduction ?? '',
    topics: book.extension?.topics ?? '',
    conclusion: book.extension?.conclusion ?? '',
  };
}
