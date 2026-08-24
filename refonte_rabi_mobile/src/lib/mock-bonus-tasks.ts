// Aucun système de bonus/récompenses n'existe encore côté backend (ni table,
// ni endpoint — cf. exploration faite pour l'écran Compte). Repris tel quel
// de la capture de référence à la demande explicite de l'utilisateur : UI
// d'abord, la vraie logique (progression, déblocage, éventuelle intégration
// SDK publicitaire) viendra après étude — donc CTA statiques pour l'instant,
// cf. bonus.tsx.
export interface BonusTask {
  id: string;
  title: string;
  badge?: { label: string; color: string };
  // Petit badge additionnel accolé au titre (ex. "💎 +1" sur la tâche 30 min)
  // — juste un texte, pas une vraie valeur de gemmes (aucun système de
  // gemmes câblé non plus, cf. compte/paramètres).
  extraBadge?: string;
  description: string;
  cta: 'complete' | 'ad';
}

export interface BonusTaskSection {
  id: string;
  title: string;
  tasks: BonusTask[];
  // "Obtenez plus de Bonus ▶" en pied de la 1ère section uniquement sur la
  // capture de référence — pas systématique.
  footerLink?: string;
}

// Solde et série de connexion quotidienne : idem, aucune donnée réelle
// derrière pour l'instant.
export const MOCK_BONUS_TOTAL = 15;

export interface CheckInDay {
  label: string;
  points: number;
  done: boolean;
}

export const MOCK_CHECKIN_STREAK_DAYS = 1;
export const MOCK_CHECKIN_DAYS: CheckInDay[] = [
  { label: 'Auj.', points: 15, done: true },
  { label: 'jour 2', points: 20, done: false },
  { label: 'jour 3', points: 20, done: false },
  { label: 'jour 4', points: 20, done: false },
  { label: 'jour 5', points: 20, done: false },
  { label: 'jour 6', points: 20, done: false },
  { label: 'jour 7', points: 20, done: false },
];

export const MOCK_BONUS_SECTIONS: BonusTaskSection[] = [
  {
    id: 'general',
    title: 'Tâches générales',
    footerLink: 'Obtenez plus de Bonus',
    tasks: [
      {
        id: 'adjoe',
        title: '1000+ Bonus',
        badge: { label: 'adjoe', color: '#F4511E' },
        description: 'Débloquez 1000+ de bonus ! Jouez pour des récompenses énormes.',
        cta: 'complete',
      },
      {
        id: 'tapjoy',
        title: '1000+ Bonus',
        badge: { label: 'tapjoy', color: '#E53935' },
        description: 'Débloquez 1000+ de bonus ! Jouez pour des récompenses énormes.',
        cta: 'complete',
      },
      {
        id: 'video',
        title: '1 Bonus (0/20)',
        description: 'Vous serez récompensé(e) pour chaque tâche de visionnage de vidéo accomplie.',
        cta: 'ad',
      },
      {
        id: 'invite',
        title: '210 Bonus',
        description: 'Invitez nouveaux amis pour obtenir Bonus',
        cta: 'complete',
      },
      {
        id: 'articles',
        title: '1 Bonus (0/3)',
        description: 'Lisez 3 articles pour obtenir',
        cta: 'complete',
      },
      {
        id: 'facebook',
        title: '5 Bonus',
        description: 'Suivez-nous sur notre compte Facebook et obtenez une récompense en complétant la tâche.',
        cta: 'complete',
      },
      {
        id: 'tiktok',
        title: '5 Bonus',
        description: 'Suivez-nous sur notre compte TikTok et obtenez une récompense en complétant la tâche.',
        cta: 'complete',
      },
    ],
  },
  {
    id: 'new-users',
    title: 'Tâches pour les nouveaux utilisateurs',
    tasks: [
      { id: 'email', title: '15 Bonus', description: 'Laissez votre adresse email', cta: 'complete' },
      { id: 'social-login', title: '10 Bonus', description: 'Se connecter avec Email/FB/Google', cta: 'complete' },
    ],
  },
  {
    id: 'reading',
    title: 'Tâches de lecture',
    tasks: [
      { id: 'read-15', title: '5 Bonus', description: 'Lire pendant 15 minute 0 / 15', cta: 'complete' },
      { id: 'read-30', title: '10 Bonus', extraBadge: '💎 +1', description: 'Lire pendant 30 minute 0 / 30', cta: 'complete' },
    ],
  },
];
