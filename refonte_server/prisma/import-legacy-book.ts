// Importe un vrai livre depuis le dump legacy (rabipek.sql), préalablement
// chargé dans la base MySQL locale `rabipek_legacy_import`, vers `rabi_refonte_bd`.
// Usage : npx tsx prisma/import-legacy-book.ts <id_book>
import mysql from 'mysql2/promise';
import { PrismaClient } from '@prisma/client';
import { encryptChapterContent } from '../src/utils/chapter-content-encryption';

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
  promotion_price: number;
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
}

async function main() {
  const bookId = Number(process.argv[2]);
  if (!bookId) {
    console.error('Usage: npx tsx prisma/import-legacy-book.ts <id_book>');
    process.exit(1);
  }

  const legacyDb = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'rabipek_legacy_import',
  });

  const [bookRows] = await legacyDb.query<mysql.RowDataPacket[]>(
    'SELECT * FROM books WHERE id_book = ?',
    [bookId],
  );
  const legacyBook = bookRows[0] as unknown as LegacyBook;
  if (!legacyBook) {
    throw new Error(`Livre id_book=${bookId} introuvable dans rabipek_legacy_import`);
  }

  const [authorRows] = await legacyDb.query<mysql.RowDataPacket[]>(
    'SELECT * FROM author WHERE id_author = ?',
    [legacyBook.id_author],
  );
  const legacyAuthor = authorRows[0] as unknown as LegacyAuthor;

  const [categoryRows] = await legacyDb.query<mysql.RowDataPacket[]>(
    'SELECT * FROM category WHERE id_category = ?',
    [legacyBook.id_category],
  );
  const legacyCategory = categoryRows[0] as unknown as LegacyCategory;

  const [chapterRows] = await legacyDb.query<mysql.RowDataPacket[]>(
    'SELECT * FROM chapters WHERE id_book = ? ORDER BY chapter_number ASC',
    [bookId],
  );
  const legacyChapters = chapterRows as unknown as LegacyChapter[];

  await legacyDb.end();

  console.log(
    `Import : "${legacyBook.title}" — ${legacyAuthor.name} — ${legacyCategory.category_name} — ${legacyChapters.length} chapitre(s)`,
  );

  const category = await prisma.category.upsert({
    where: { name: legacyCategory.category_name },
    update: {},
    create: {
      name: legacyCategory.category_name,
      description: legacyCategory.description || '—',
    },
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

  // Idempotent pour le dev : on repart d'un livre propre à chaque import.
  await prisma.book.deleteMany({ where: { title: legacyBook.title, authorId: author.id } });

  const book = await prisma.book.create({
    data: {
      title: legacyBook.title,
      datePub: new Date(legacyBook.date_pub),
      cover: legacyBook.cover,
      filePath: legacyBook.file_path,
      price: legacyBook.price,
      pageNumber: legacyBook.page_number,
      bookLink: legacyBook.book_link,
      resume: legacyBook.resume,
      isFree: Boolean(legacyBook.is_free),
      readBeforePay: Boolean(legacyBook.read_before_pay),
      isPromotion: Boolean(legacyBook.is_promotion),
      promotionPrice: legacyBook.promotion_price,
      categoryId: category.id,
      authorId: author.id,
      chapters: {
        create: legacyChapters.map((chapter) => ({
          title: chapter.chapter_title,
          content: encryptChapterContent(chapter.content),
          chapterNumber: chapter.chapter_number,
        })),
      },
    },
    include: { chapters: { select: { id: true, chapterNumber: true, title: true } } },
  });

  console.log(`Livre créé : id=${book.id}, ${book.chapters.length} chapitres importés.`);
  console.log(`Premier chapitre lisible sur : /livres/${book.id}/chapitres/${book.chapters[0]?.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
