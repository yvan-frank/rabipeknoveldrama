// Migre TOUS les livres du dump legacy (chargé dans MySQL sous le nom
// `rabipek_legacy_import`) vers `rabi_refonte_bd` — contrairement à
// import-legacy-book.ts (un seul livre, id passé en argument), ce script
// parcourt toute la table `books` legacy. Idempotent : un livre déjà importé
// (même titre + même auteur) est retrouvé et sauté, jamais recréé/écrasé.
//
// Usage : npx tsx prisma/migrate-legacy-books.ts
import mysql from 'mysql2/promise';
import { PrismaClient } from '@prisma/client';
import { encryptChapterContent } from '../src/utils/chapter-content-encryption';
import { slugify } from '../src/utils/slugify';

const prisma = new PrismaClient();

interface LegacyBook {
  id_book: number;
  title: string;
  date_pub: string;
  cover: string;
  file_path: string | null;
  price: number;
  page_number: number;
  book_link: string;
  resume: string;
  is_free: number;
  read_before_pay: number;
  is_promotion: number;
  promotion_price: number | null;
  id_category: number;
  id_author: number;
}

interface LegacyAuthor {
  id_author: number;
  name: string | null;
  designation: string | null;
  email: string;
  password: string;
  is_email_verified: number;
  is_account_verified: number;
  about: string | null;
}

interface LegacyCategory {
  id_category: number;
  category_name: string;
  description: string;
}

interface LegacyChapter {
  id_chapter: number;
  chapter_title: string;
  content: string;
  chapter_number: number;
  id_book: number;
}

interface LegacyBookExtension {
  book_id: number;
  introduction: string | null;
  topics: string | null;
  conclusion: string | null;
  language: string | null;
}

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
  const legacyDb = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'rabipek_legacy_import',
    charset: 'utf8mb4',
  });

  const [bookRows] = await legacyDb.query<mysql.RowDataPacket[]>('SELECT * FROM books ORDER BY id_book');
  const [authorRows] = await legacyDb.query<mysql.RowDataPacket[]>('SELECT * FROM author');
  const [categoryRows] = await legacyDb.query<mysql.RowDataPacket[]>('SELECT * FROM category');
  // Trié par id_chapter (ordre d'insertion) — pas par chapter_number : certains
  // livres legacy ont ce champ bloqué à 1 pour la plupart des chapitres (bug
  // constaté sur "Porte monnaie Magique 2" et "Sabrina"), l'ordre d'insertion
  // reste lui fiable et cohérent avec les numéros dans chapter_title.
  const [chapterRows] = await legacyDb.query<mysql.RowDataPacket[]>('SELECT * FROM chapters ORDER BY id_chapter');
  const [extensionRows] = await legacyDb.query<mysql.RowDataPacket[]>('SELECT * FROM books_extension');

  await legacyDb.end();

  const legacyBooks = bookRows as unknown as LegacyBook[];
  const legacyAuthors = authorRows as unknown as LegacyAuthor[];
  const legacyCategories = categoryRows as unknown as LegacyCategory[];
  const legacyChapters = chapterRows as unknown as LegacyChapter[];
  const legacyExtensions = extensionRows as unknown as LegacyBookExtension[];

  const authorsById = new Map(legacyAuthors.map((a) => [a.id_author, a]));
  const categoriesById = new Map(legacyCategories.map((c) => [c.id_category, c]));
  const extensionByBookId = new Map(legacyExtensions.map((e) => [e.book_id, e]));

  const chaptersByBookId = new Map<number, LegacyChapter[]>();
  for (const chapter of legacyChapters) {
    const list = chaptersByBookId.get(chapter.id_book) ?? [];
    list.push(chapter);
    chaptersByBookId.set(chapter.id_book, list);
  }

  let imported = 0;
  let skipped = 0;

  for (const legacyBook of legacyBooks) {
    const legacyAuthor = authorsById.get(legacyBook.id_author);
    const legacyCategory = categoriesById.get(legacyBook.id_category);

    if (!legacyAuthor || !legacyCategory) {
      console.warn(`⚠ Livre "${legacyBook.title}" (id_book=${legacyBook.id_book}) : auteur ou catégorie introuvable, ignoré.`);
      skipped += 1;
      continue;
    }

    const category = await prisma.category.upsert({
      where: { name: legacyCategory.category_name },
      update: {},
      create: { name: legacyCategory.category_name, description: legacyCategory.description || '—' },
    });

    // Le hash bcrypt legacy ($2b$10$...) est réutilisable tel quel : même
    // algorithme, `bcrypt.compare` fonctionnera sans migration de mot de passe.
    const author = await prisma.author.upsert({
      where: { email: legacyAuthor.email },
      update: {},
      create: {
        name: legacyAuthor.name,
        email: legacyAuthor.email,
        passwordHash: legacyAuthor.password,
        designation: legacyAuthor.designation,
        about: legacyAuthor.about,
        isEmailVerified: Boolean(legacyAuthor.is_email_verified),
        isAccountVerified: Boolean(legacyAuthor.is_account_verified),
      },
    });

    const existing = await prisma.book.findFirst({
      where: { title: legacyBook.title, authorId: author.id },
      select: { id: true },
    });
    if (existing) {
      console.log(`↷ Déjà importé, ignoré : "${legacyBook.title}"`);
      skipped += 1;
      continue;
    }

    const slug = await generateUniqueBookSlug(legacyBook.title);
    const bookChapters = chaptersByBookId.get(legacyBook.id_book) ?? [];
    const extension = extensionByBookId.get(legacyBook.id_book);
    const hasExtensionContent = Boolean(
      extension && (extension.introduction || (extension.topics && extension.topics !== 'none') || extension.conclusion || extension.language),
    );

    const book = await prisma.book.create({
      data: {
        title: legacyBook.title,
        slug,
        datePub: new Date(legacyBook.date_pub),
        cover: legacyBook.cover,
        filePath: legacyBook.file_path || null,
        price: legacyBook.price,
        pageNumber: legacyBook.page_number,
        bookLink: legacyBook.book_link || undefined,
        resume: legacyBook.resume,
        isFree: Boolean(legacyBook.is_free),
        readBeforePay: Boolean(legacyBook.read_before_pay),
        isPromotion: Boolean(legacyBook.is_promotion),
        promotionPrice: legacyBook.promotion_price ?? 0,
        categoryId: category.id,
        authorId: author.id,
        ...(hasExtensionContent && extension
          ? {
              extension: {
                create: {
                  introduction: extension.introduction || null,
                  topics: extension.topics && extension.topics !== 'none' ? extension.topics : null,
                  conclusion: extension.conclusion || null,
                  language: extension.language || null,
                },
              },
            }
          : {}),
        chapters: {
          create: bookChapters.map((chapter, index) => ({
            title: chapter.chapter_title,
            content: encryptChapterContent(chapter.content),
            chapterNumber: index + 1,
          })),
        },
      },
      include: { chapters: { select: { id: true } } },
    });

    console.log(`✔ "${book.title}" (slug=${book.slug}) — ${book.chapters.length} chapitre(s)`);
    imported += 1;
  }

  console.log(`\nTerminé : ${imported} livre(s) importé(s), ${skipped} ignoré(s) (déjà présents ou données incomplètes).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
