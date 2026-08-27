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
