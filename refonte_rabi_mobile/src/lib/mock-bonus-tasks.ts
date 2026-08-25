// Tâches de la section "Tâches générales/nouveaux utilisateurs/lecture" :
// aucune logique de progression/déblocage réelle derrière pour l'instant,
// CTA statiques repris de la capture de référence (cf. bonus.tsx). Le solde
// et le check-in quotidien, eux, sont réels — cf. src/api/points.ts.
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
  // Statut réel (video/articles uniquement, cf. withLiveTaskData dans
  // bonus.tsx) : remplace le CTA par un badge "Complétée" quand vrai. Absent
  // ou faux pour les tâches encore factices ci-dessous.
  completed?: boolean;
}

export interface BonusTaskSection {
  id: string;
  title: string;
  tasks: BonusTask[];
  // "Obtenez plus de Bonus ▶" en pied de la 1ère section uniquement sur la
  // capture de référence — pas systématique.
  footerLink?: string;
}


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
