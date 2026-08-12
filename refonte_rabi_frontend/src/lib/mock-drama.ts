// Contenu factice en attendant le vrai système de publication vidéo (auteurs) —
// remplacer par un vrai fetch API une fois le module backend "drama" créé.
export interface MockDramaEpisode {
  id: string;
  title: string;
  author: string;
  genre: string;
  episodeCount: number;
  duration: string;
  gradient: string;
}

export const MOCK_DRAMA_EPISODES: MockDramaEpisode[] = [
  {
    id: 'coeur-brise',
    title: 'Cœur brisé à Yaoundé',
    author: 'Rabiatou Peka',
    genre: 'Romance',
    episodeCount: 12,
    duration: '3 min',
    gradient: 'from-brand-amber via-rose-400 to-brand-pink',
  },
  {
    id: 'heritage-secret',
    title: 'L’héritage secret',
    author: 'Rabiatou Peka',
    genre: 'Drame familial',
    episodeCount: 8,
    duration: '4 min',
    gradient: 'from-violet-500 via-indigo-400 to-sky-400',
  },
  {
    id: 'double-vie',
    title: 'Double vie',
    author: 'Auteur Rabipek',
    genre: 'Suspense',
    episodeCount: 15,
    duration: '3 min',
    gradient: 'from-slate-700 via-slate-500 to-amber-400',
  },
  {
    id: 'mariage-arrange',
    title: 'Le mariage arrangé',
    author: 'Auteur Rabipek',
    genre: 'Romance',
    episodeCount: 10,
    duration: '5 min',
    gradient: 'from-emerald-400 via-teal-400 to-cyan-400',
  },
  {
    id: 'vengeance-douce',
    title: 'Vengeance douce',
    author: 'Rabiatou Peka',
    genre: 'Thriller',
    episodeCount: 9,
    duration: '4 min',
    gradient: 'from-rose-500 via-fuchsia-500 to-purple-500',
  },
  {
    id: 'promesse-oubliee',
    title: 'La promesse oubliée',
    author: 'Auteur Rabipek',
    genre: 'Drame',
    episodeCount: 6,
    duration: '3 min',
    gradient: 'from-orange-400 via-amber-400 to-yellow-300',
  },
];
