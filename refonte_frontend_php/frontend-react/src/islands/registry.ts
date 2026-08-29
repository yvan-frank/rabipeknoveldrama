import type { ComponentType } from 'react';

type IslandLoader = () => Promise<{ default: ComponentType<any> }>;

// Un nom d'ilot (data-island="LoginForm" cote PHP, cf.
// App\Support\View::island) -> son import dynamique. Ajouter une ligne ici
// suffit a brancher un nouveau composant sur une page PHP existante.
const registry: Record<string, IslandLoader> = {
  ThemeToggle: () => import('./ThemeToggle'),
  AccountNav: () => import('./AccountNav'),
  LoginForm: () => import('./LoginForm'),
  RegisterForm: () => import('./RegisterForm'),
  GoogleAuthButton: () => import('./GoogleAuthButton'),
  OpenInApp: () => import('./OpenInApp'),
  AppDownloadBanner: () => import('./AppDownloadBanner'),
  BookActions: () => import('./BookActions'),
  AuthorOverview: () => import('./AuthorOverview'),
  BookFilters: () => import('./BookFilters'),
  ReviewForm: () => import('./ReviewForm'),
  Dashboard: () => import('./Dashboard'),
  AdminPanel: () => import('./AdminPanel'),
  AuthorBooksList: () => import('./AuthorBooksList'),
  BookWizard: () => import('./BookWizard'),
  BookManageDashboard: () => import('./BookManageDashboard'),
  AuthorReviews: () => import('./AuthorReviews'),
  KycForm: () => import('./KycForm'),
  AuthorSettingsForm: () => import('./AuthorSettingsForm'),
  AuthorStats: () => import('./AuthorStats'),
};

export function resolveIsland(name: string): IslandLoader | undefined {
  return registry[name];
}
