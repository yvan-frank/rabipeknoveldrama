// Script de seed pour peupler rabi_refonte_bd avec des données de test.
// Usage : npx tsx prisma/seed.ts
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { slugify } from '../src/utils/slugify';

const prisma = new PrismaClient();

async function generateUniqueBookSlug(title: string): Promise<string> {
  const base = slugify(title) || 'livre';
  let slug = base;
  let suffix = 2;

  while (await prisma.book.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function main() {
  const category = await prisma.category.upsert({
    where: { name: 'Roman' },
    update: {},
    create: { name: 'Roman', description: 'Œuvres de fiction narrative' },
  });

  const passwordHash = await bcrypt.hash('Password2026@', 12);
  await prisma.user.upsert({
    where: { email: 'admin@admin.local' },
    update: { passwordHash, isAdmin: true, isActive: true },
    create: {
      name: 'Administrateur',
      email: 'admin@admin.local',
      passwordHash,
      isAdmin: true,
      isActive: true,
    },
  });
  await prisma.user.upsert({
    where: { email: 'user@user.local' },
    update: { passwordHash, isAdmin: false, isActive: true },
    create: {
      name: 'Utilisateur',
      email: 'user@user.local',
      passwordHash,
      isActive: true,
    },
  });
  const author = await prisma.author.upsert({
    where: { email: 'author@author.local' },
    update: { passwordHash, isEmailVerified: true, isAccountVerified: true },
    create: {
      name: 'Yvan Zangue',
      email: 'author@author.local',
      passwordHash,
      isEmailVerified: true,
      isAccountVerified: true,
      designation: 'Auteur',
      about: 'Auteur de test créé par le script de seed.',
    },
  });

  // Idempotent pour le dev : supprime l'éventuel livre de test précédent
  // (aucun achat ne le référence encore, donc pas de conflit FK Restrict).
  await prisma.book.deleteMany({ where: { title: 'Les Chroniques de Rabipek', authorId: author.id } });

  const book = await prisma.book.create({
    data: {
      title: 'Les Chroniques de Rabipek',
      datePub: new Date(),
      cover: 'https://picsum.photos/seed/rabipek-book-1/400/600',
      price: 5000,
      pageNumber: 120,
      bookLink: '/uploads/chroniques-rabipek.pdf',
      resume:
        "Un premier livre de test pour valider le catalogue de la refonte : liste, détail, chapitres.",
      isFree: false,
      categoryId: category.id,
      authorId: author.id,
      extension: {
        create: {
          introduction: 'Une introduction de test.',
          language: 'fr',
        },
      },
      chapters: {
        create: [
          {
            title: 'Le commencement',
            chapterNumber: 1,
            content:
              '<p>Il était une fois, dans un village oublié des cartes, une jeune fille nommée Rabi qui rêvait de voir la mer.</p><p>Chaque matin, elle grimpait sur la colline la plus haute pour observer l\'horizon, espérant apercevoir un jour ce bleu infini dont parlaient les voyageurs.</p>',
          },
          {
            title: 'La rencontre',
            chapterNumber: 2,
            content:
              "<p>Le lendemain, tout changea lorsqu'un vieux marin s'arrêta au village, portant sur son dos un sac rempli de coquillages et d'histoires.</p><p>Il raconta à Rabi des récits de tempêtes, de ports lointains et de navires qui dansaient sur les vagues.</p>",
          },
        ],
      },
    },
    include: { chapters: true, extension: true },
  });

  console.log('Seed terminé :');
  console.log({ category, author: { id: author.id, email: author.email }, book });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
