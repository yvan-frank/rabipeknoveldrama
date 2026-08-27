import { apiClient } from './client';
import type { ApiEnvelope } from './types';
import type { CategorySummary, ChapterSummary } from './books';
import { useAuthStore } from '../auth/auth-store';

// Miroir de refonte_server/src/modules/books + chapters + authors — volet
// "espace auteur" (aucun équivalent mobile avant cet écran, cf. account.tsx
// qui renvoyait jusqu'ici vers le site web faute d'implémentation).

export interface AuthorBookSummary {
  id: number;
  slug: string;
  title: string;
  cover: string | null;
  price: number;
  isFree: boolean;
  isPromotion: boolean;
  promotionPrice: number;
  datePub: string;
  category: CategorySummary;
  viewStats: { viewCount: number } | null;
  _count: { chapters: number; likes: number; comments: number };
}

export async function fetchMyBooks(): Promise<AuthorBookSummary[]> {
  const response = await apiClient.get<ApiEnvelope<AuthorBookSummary[]>>('/books/mine');
  return response.data.data;
}

export async function fetchCategories(): Promise<CategorySummary[]> {
  const response = await apiClient.get<ApiEnvelope<CategorySummary[]>>('/categories');
  return response.data.data;
}

export interface ManagedBook {
  id: number;
  slug: string;
  title: string;
  cover: string | null;
  price: number;
  pageNumber: number;
  bookLink: string | null;
  resume: string;
  isFree: boolean;
  isPromotion: boolean;
  promotionPrice: number;
  isAdultOnly: boolean;
  categoryId: number;
  chapters: ChapterSummary[];
}

export async function fetchBookForManage(id: number): Promise<ManagedBook> {
  const response = await apiClient.get<ApiEnvelope<ManagedBook>>(`/books/manage/${id}`);
  return response.data.data;
}

// datePub omis à dessein : le serveur le tolère absent sur les livres
// existants (cf. web BookWizard), on envoie NOW() au moment de la création
// plutôt que de faire choisir une date de publication sur mobile.
// pageNumber/resume facultatifs (cf. BooksSchema::create côté serveur, qui
// les défaut désormais à 0/'' plutôt que de les exiger) : indicatifs, pas
// bloquants pour créer rapidement un livre depuis mobile.
export interface BookInput {
  title: string;
  cover: string;
  price: number;
  pageNumber?: number;
  resume?: string;
  isFree: boolean;
  categoryId: number;
}

// authorId doit être fourni dans le corps de la requête — contrairement à ce
// qu'on pourrait attendre, BooksController::create ne le déduit PAS de la
// session JWT (cf. BooksSchema::create : `authorId` est `requireInt`, pas
// injecté depuis $request->user), même piège déjà documenté côté web
// (SessionUser.authorId dans refonte_frontend_php/frontend-react/src/lib/apiClient.ts).
export async function createBook(input: BookInput): Promise<ManagedBook> {
  const authorId = useAuthStore.getState().user?.authorId;
  if (authorId === undefined) throw new Error('Session auteur invalide — authorId manquant');
  const response = await apiClient.post<ApiEnvelope<ManagedBook>>('/books', {
    ...input,
    authorId,
    datePub: new Date().toISOString(),
  });
  return response.data.data;
}

export async function updateBook(id: number, input: Partial<BookInput>): Promise<ManagedBook> {
  const response = await apiClient.patch<ApiEnvelope<ManagedBook>>(`/books/${id}`, input);
  return response.data.data;
}

export async function deleteBook(id: number): Promise<void> {
  await apiClient.delete(`/books/${id}`);
}

// Upload multipart : l'instance apiClient fixe Content-Type: application/json
// par défaut (cf. client.ts) — sans l'override ci-dessous, axios sérialise le
// FormData en JSON au lieu d'un vrai multipart (même piège que côté web,
// cf. refonte_frontend_php/README.md "Piège axios à connaître : upload de
// fichier"). uri vient d'expo-image-picker (file://...) : on lit le fichier
// en base64 puis le convertit en Blob, react-native-fetch/axios ne sachant
// pas envoyer un objet {uri} tel quel avec le client web fetch sous-jacent
// d'Expo (contrairement à un XHR RN "classique").
async function uploadFile(endpoint: string, fieldName: string, uri: string, mimeType: string): Promise<string> {
  const filename = uri.split('/').pop() ?? `${fieldName}.jpg`;
  const form = new FormData();
  // @ts-expect-error -- forme spécifique React Native (uri/name/type), pas le DOM File standard.
  form.append(fieldName, { uri, name: filename, type: mimeType });

  const response = await apiClient.post<ApiEnvelope<{ url: string }>>(endpoint, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data.url;
}

export async function uploadCoverImage(uri: string, mimeType = 'image/jpeg'): Promise<string> {
  return uploadFile('/uploads/cover', 'cover', uri, mimeType);
}

export async function uploadIdentityDocument(uri: string, mimeType = 'image/jpeg'): Promise<string> {
  return uploadFile('/uploads/document', 'document', uri, mimeType);
}

export interface ManagedChapter {
  id: number;
  title: string;
  content: string;
  chapterNumber: number;
  bookId: number;
  partId: number | null;
}

export async function fetchChapterForManage(id: number): Promise<ManagedChapter> {
  const response = await apiClient.get<ApiEnvelope<ManagedChapter>>(`/chapters/manage/${id}`);
  return response.data.data;
}

export interface ChapterInput {
  bookId: number;
  title: string;
  content: string;
  chapterNumber: number;
}

export async function createChapter(input: ChapterInput): Promise<ManagedChapter> {
  const response = await apiClient.post<ApiEnvelope<ManagedChapter>>('/chapters', input);
  return response.data.data;
}

export async function updateChapter(id: number, input: Partial<Omit<ChapterInput, 'bookId'>>): Promise<ManagedChapter> {
  const response = await apiClient.patch<ApiEnvelope<ManagedChapter>>(`/chapters/${id}`, input);
  return response.data.data;
}

export async function deleteChapter(id: number): Promise<void> {
  await apiClient.delete(`/chapters/${id}`);
}

export type DocumentType = 'cni' | 'passeport' | 'autre';

export interface KycExtension {
  country: string | null;
  address: string | null;
  documentType: DocumentType | null;
  documentId: string | null;
  documents: string | null;
  fullName: string | null;
  privacyAcceptedAt: string | null;
  kycVerifiedAt: string | null;
}

export interface KycStatus {
  extension: KycExtension | null;
  isComplete: boolean;
  isVerified: boolean;
}

export async function fetchMyKyc(): Promise<KycStatus> {
  const response = await apiClient.get<ApiEnvelope<KycStatus>>('/authors/moi/kyc');
  return response.data.data;
}

export interface KycInput {
  country: string;
  address: string;
  documentType: DocumentType;
  documentId: string;
  documents: string;
  fullName: string;
  privacyAccepted: true;
}

export async function submitKyc(input: KycInput): Promise<KycStatus['extension']> {
  const response = await apiClient.post<ApiEnvelope<KycStatus['extension']>>('/authors/moi/kyc', input);
  return response.data.data;
}
