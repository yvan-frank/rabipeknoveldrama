import { PrismaClient } from '@prisma/client';
import { isProduction } from '../config/env';

// Singleton pour éviter d'épuiser le pool de connexions MySQL en dev
// (tsx watch recharge le module à chaque changement de fichier).
declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: isProduction ? ['error', 'warn'] : ['error', 'warn', 'query'],
  });

if (!isProduction) {
  global.__prisma = prisma;
}
