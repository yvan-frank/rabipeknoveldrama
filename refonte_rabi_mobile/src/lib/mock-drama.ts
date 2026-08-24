// Miroir de refonte_rabi_frontend/src/lib/mock-drama.ts — contenu factice en
// attendant le vrai système de publication vidéo (auteurs). Remplacer par un
// vrai fetch API une fois le module backend "drama" créé (aucune route ne
// l'expose aujourd'hui, ni sur le web ni sur le serveur).
export interface MockDramaEpisode {
  id: string;
  title: string;
  author: string;
  genre: string;
  episodeCount: number;
  duration: string;
  gradient: [string, string, string];
}

export const MOCK_DRAMA_EPISODES: MockDramaEpisode[] = [
  {
    id: 'coeur-brise',
    title: 'Cœur brisé à Yaoundé',
    author: 'Rabiatou Peka',
    genre: 'Romance',
    episodeCount: 12,
    duration: '3 min',
    gradient: ['#F59E0B', '#FB7185', '#EC4899'],
  },
  {
    id: 'heritage-secret',
    title: "L'héritage secret",
    author: 'Rabiatou Peka',
    genre: 'Drame familial',
    episodeCount: 8,
    duration: '4 min',
    gradient: ['#8B5CF6', '#818CF8', '#38BDF8'],
  },
  {
    id: 'double-vie',
    title: 'Double vie',
    author: 'Auteur Rabipek',
    genre: 'Suspense',
    episodeCount: 15,
    duration: '3 min',
    gradient: ['#334155', '#64748B', '#FBBF24'],
  },
  {
    id: 'mariage-arrange',
    title: 'Le mariage arrangé',
    author: 'Auteur Rabipek',
    genre: 'Romance',
    episodeCount: 10,
    duration: '5 min',
    gradient: ['#34D399', '#2DD4BF', '#22D3EE'],
  },
  {
    id: 'vengeance-douce',
    title: 'Vengeance douce',
    author: 'Rabiatou Peka',
    genre: 'Thriller',
    episodeCount: 9,
    duration: '4 min',
    gradient: ['#F43F5E', '#D946EF', '#A855F7'],
  },
  {
    id: 'promesse-oubliee',
    title: 'La promesse oubliée',
    author: 'Auteur Rabipek',
    genre: 'Drame',
    episodeCount: 6,
    duration: '3 min',
    gradient: ['#FB923C', '#FBBF24', '#FDE047'],
  },
];
