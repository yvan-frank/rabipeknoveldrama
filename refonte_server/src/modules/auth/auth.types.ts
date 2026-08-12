export type UserRole = 'user' | 'author' | 'admin';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  // Renseigné uniquement pour role === 'author', une fois la décision prise
  // sur la vérification des JWT Clerk d'authorabipek côté API (cf. README).
  // En attendant, les endpoints d'écriture books/chapters se limitent au rôle admin.
  authorId?: number;
}
