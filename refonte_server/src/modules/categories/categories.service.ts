import { prisma } from '../../lib/prisma';

export async function listCategories() {
  return prisma.category.findMany({
    select: { id: true, name: true, description: true },
    orderBy: { name: 'asc' },
  });
}
