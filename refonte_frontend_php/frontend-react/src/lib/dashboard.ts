import type { SessionUser } from './apiClient';

const dashboardPaths: Record<SessionUser['role'], string> = {
  user: '/tableau-de-bord',
  author: '/espace-auteur',
  admin: '/administration',
};

const dashboardLabels: Record<SessionUser['role'], string> = {
  user: 'Mon espace',
  author: 'Espace auteur',
  admin: 'Administration',
};

export function getDashboardPath(role: SessionUser['role']): string {
  return dashboardPaths[role];
}

export function getDashboardLabel(role: SessionUser['role']): string {
  return dashboardLabels[role];
}

// Après connexion/inscription, LoginForm/RegisterForm/GoogleAuthButton
// reçoivent tous un `redirectTo` par défaut à '/tableau-de-bord' (cf.
// AuthController::login côté PHP) — générique, pas adapté à un auteur/admin.
// On ne l'honore tel quel que s'il a été explicitement demandé (ex. ?redirect=
// vers la page qu'on tentait d'ouvrir avant d'être renvoyé vers /connexion) ;
// sinon on route vers l'espace propre au rôle réel de l'utilisateur connecté.
export function resolveAuthRedirect(redirectTo: string, role: SessionUser['role']): string {
  return redirectTo === '/tableau-de-bord' ? getDashboardPath(role) : redirectTo;
}
