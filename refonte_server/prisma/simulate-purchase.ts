// Simule l'achat d'un livre en dev, en l'absence de parcours de paiement
// fonctionnel (module `achats` encore un stub côté API — cf. discussion).
// Insère directement une ligne dans `achat`, ce que ferait un vrai checkout.
//
// Usage : npx tsx prisma/simulate-purchase.ts <email_utilisateur> <slug_livre>
// Exemple : npx tsx prisma/simulate-purchase.ts test@example.com mira-partie-i
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [email, bookSlug] = process.argv.slice(2);

  if (!email || !bookSlug) {
    console.error('Usage: npx tsx prisma/simulate-purchase.ts <email_utilisateur> <slug_livre>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
  if (!user) {
    throw new Error(`Aucun utilisateur avec l'email "${email}"`);
  }

  const book = await prisma.book.findUnique({
    where: { slug: bookSlug },
    select: { id: true, slug: true, title: true, price: true },
  });
  if (!book) {
    throw new Error(`Aucun livre avec le slug "${bookSlug}"`);
  }

  const existing = await prisma.achat.findFirst({
    where: { userId: user.id, bookId: book.id },
    select: { id: true },
  });
  if (existing) {
    console.log(`${user.email} a déjà acheté "${book.title}" (achat #${existing.id}) — rien à faire.`);
    return;
  }

  const achat = await prisma.achat.create({
    data: {
      userId: user.id,
      bookId: book.id,
      price: book.price,
      isFree: false,
      paymentMethod: 'dev-simulation',
      metadata: { simulated: true, note: 'Créé par prisma/simulate-purchase.ts, pas un vrai paiement.' },
    },
  });

  console.log(`Achat simulé : ${user.email} -> "${book.title}" (achat #${achat.id}).`);
  console.log('Les chapitres verrouillés de ce livre sont maintenant accessibles à cet utilisateur.');
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
