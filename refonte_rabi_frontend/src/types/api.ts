// Types miroir des réponses de rabipek_server (refonte). Tenus à jour
// manuellement pour l'instant — à terme, envisager de les générer depuis
// prisma/schema.prisma ou des schémas Zod partagés entre les deux repos.

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; message: string; errors?: unknown };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type UserRole = 'user' | 'author' | 'admin';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  authorId?: number;
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface AuthorPublic {
  id: number;
  name: string | null;
  designation: string | null;
  image: string | null;
  cover: string | null;
  about: string | null;
}

export interface BookSummary {
  id: number;
  slug: string;
  title: string;
  cover: string;
  price: number;
  isFree: boolean;
  isPromotion: boolean;
  promotionPrice: number;
  isAdultOnly: boolean;
  datePub: string;
  category: Category;
  author: AuthorPublic;
}

export interface TopRatedBook extends BookSummary {
  averageRating: number;
  reviewCount: number;
}

export interface BookExtension {
  introduction: string | null;
  topics: string | null;
  conclusion: string | null;
  language: string | null;
}

export interface ChapterSummary {
  id: number;
  title: string;
  chapterNumber: number;
  partId: number | null;
}

export interface BookPart {
  id: number;
  title: string;
  partNumber: number;
  description: string | null;
  price: number;
  isFree: boolean;
  freeChapterCount: number;
  chapters: ChapterSummary[];
  isPurchased?: boolean;
}

export interface BookDetail extends BookSummary {
  filePath: string | null;
  pageNumber: number;
  bookLink: string | null;
  resume: string;
  readBeforePay: boolean;
  freeChapterCount: number;
  extension: BookExtension | null;
  chapters: ChapterSummary[];
  parts: BookPart[];
  viewCount: number;
  likeCount: number;
  isLikedByUser: boolean;
  reviewCount: number;
  averageRating: number;
}

export interface Review {
  id: number;
  message: string;
  rating: number;
  createdAt: string;
  user: { id: number; name: string | null };
  replies: Array<{ id: number; content: string; createdAt: string }>;
}

export interface ChapterComment {
  id: number;
  content: string;
  parentId: number | null;
  createdAt: string;
  user: { id: number; name: string | null };
}

export interface ChapterDetail {
  id: number;
  title: string;
  content: string;
  chapterNumber: number;
  extension: { introduction: string | null } | null;
  part: Pick<BookPart, 'id' | 'title' | 'partNumber' | 'price' | 'isFree' | 'freeChapterCount'> | null;
  book: { id: number; title: string; authorId: number };
}

// --- Espace auteur : gestion livres/chapitres ------------------------------

export interface AuthorBookListItem {
  id: number;
  slug: string;
  title: string;
  cover: string;
  price: number;
  isFree: boolean;
  isPromotion: boolean;
  promotionPrice: number;
  isAdultOnly: boolean;
  datePub: string;
  category: Category;
  viewStats: { viewCount: number } | null;
  _count: { chapters: number; likes: number; comments: number };
}

export interface BookManageDetail {
  id: number;
  slug: string;
  title: string;
  datePub: string;
  cover: string;
  filePath: string | null;
  price: number;
  pageNumber: number;
  bookLink: string | null;
  resume: string;
  isFree: boolean;
  readBeforePay: boolean;
  freeChapterCount: number;
  isPromotion: boolean;
  promotionPrice: number;
  isAdultOnly: boolean;
  categoryId: number;
  authorId: number;
  category: Category;
  author: AuthorPublic;
  extension: BookExtension | null;
  chapters: ChapterSummary[];
  parts: BookPart[];
}

export type AuthorDocumentType = 'cni' | 'passeport' | 'autre';

export interface AuthorKycExtension {
  country: string | null;
  address: string | null;
  documentType: AuthorDocumentType | null;
  documentId: string | null;
  fullName: string | null;
  documents: string | null;
  socialLinks: Record<string, string> | null;
  privacyAcceptedAt: string | null;
  kycVerifiedAt: string | null;
}

export interface AuthorKycStatus {
  extension: AuthorKycExtension | null;
  isComplete: boolean;
  isVerified: boolean;
}

export interface AuthorKycBypassPolicy {
  enabled: boolean;
}

export interface AuthorKycReviewItem {
  id: number;
  name: string | null;
  email: string;
  extension: AuthorKycExtension | null;
  isComplete: boolean;
  isVerified: boolean;
}

export interface ChapterManageDetail {
  id: number;
  title: string;
  content: string;
  chapterNumber: number;
  extension: { introduction: string | null } | null;
  book: { id: number; title: string; authorId: number };
}

export type EpubEditionStatus = 'QUEUED' | 'PROCESSING' | 'READY' | 'FAILED';

export interface EpubEdition {
  id: number;
  version: number;
  status: EpubEditionStatus;
  isCurrent: boolean;
  fileSizeBytes: number | null;
  errorMessage: string | null;
  generatedAt: string | null;
  createdAt: string;
}
