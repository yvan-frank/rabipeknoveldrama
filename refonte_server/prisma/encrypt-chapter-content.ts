// Chiffre les chapitres historiques encore stockés en clair.
// Usage : CONTENT_ENCRYPTION_KEY="..." npx tsx prisma/encrypt-chapter-content.ts
import { PrismaClient } from '@prisma/client';
import { encryptChapterContent, isEncryptedChapterContent } from '../src/utils/chapter-content-encryption';

const prisma = new PrismaClient();

async function main() {
  const chapters = await prisma.chapter.findMany({ select: { id: true, content: true } });
  const plainTextChapters = chapters.filter((chapter) => !isEncryptedChapterContent(chapter.content));

  for (const chapter of plainTextChapters) {
    await prisma.chapter.update({ where: { id: chapter.id }, data: { content: encryptChapterContent(chapter.content) } });
  }

  console.log(`${plainTextChapters.length} chapitre(s) chiffré(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
