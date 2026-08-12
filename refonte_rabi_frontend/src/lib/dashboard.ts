import type { UserRole } from '@/types/api';

const dashboardPaths: Record<UserRole, string> = {
  user: '/tableau-de-bord',
  author: '/espace-auteur',
  admin: '/administration',
};

const dashboardLabels: Record<UserRole, string> = {
  user: 'Mon espace',
  author: 'Espace auteur',
  admin: 'Administration',
};

export function getDashboardPath(role: UserRole) {
  return dashboardPaths[role];
}

export function getDashboardLabel(role: UserRole) {
  return dashboardLabels[role];
}
