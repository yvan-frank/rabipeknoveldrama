// Backfill ponctuel : attribue un slug aux livres existants créés avant
// l'introduction du champ. Usage : npx tsx prisma/backfill-slugs.ts
import { PrismaClient } from '@prisma/client';
import { slugify } from '../src/utils/slugify';

const prisma = new PrismaClient();

async function generateUniqueSlug(title: string, excludeId: number): Promise<string> {
  const base = slugify(title) || 'livre';
  let slug = base;
  let suffix = 2;

  while (
    await prisma.book.findFirst({ where: { slug, NOT: { id: excludeId } }, select: { id: true } })
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function main() {
  const books = await prisma.book.findMany({ where: { slug: null }, select: { id: true, title: true } });

  for (const book of books) {
    const slug = await generateUniqueSlug(book.title, book.id);
    await prisma.book.update({ where: { id: book.id }, data: { slug } });
    console.log(`Livre ${book.id} (${book.title}) -> slug "${slug}"`);
  }

  console.log(`${books.length} livre(s) mis à jour.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
