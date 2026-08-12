import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '../config/env';
import { ApiError } from './ApiError';

const PREFIX = 'rabipek:chapter:v1:';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey() {
  const configuredKey = env.CONTENT_ENCRYPTION_KEY;
  if (!configuredKey) {
    throw ApiError.internal('CONTENT_ENCRYPTION_KEY est requis pour manipuler le contenu des chapitres');
  }

  const key = Buffer.from(configuredKey, 'base64');
  if (key.length !== 32) {
    throw ApiError.internal('CONTENT_ENCRYPTION_KEY doit être une clé AES-256 encodée en base64');
  }
  return key;
}

export function isEncryptedChapterContent(value: string) {
  return value.startsWith(PREFIX);
}

// AES-256-GCM fournit à la fois la confidentialité et l'intégrité du contenu.
// Le format autoportant stocke l'IV et le tag avec le chiffré, jamais la clé.
export function encryptChapterContent(plainText: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64url')}:${authTag.toString('base64url')}:${encrypted.toString('base64url')}`;
}

export function decryptChapterContent(storedValue: string) {
  // Compatibilité contrôlée le temps d'exécuter la migration : les anciens
  // chapitres restent lisibles, mais toute nouvelle écriture est chiffrée.
  if (!isEncryptedChapterContent(storedValue)) return storedValue;

  const parts = storedValue.slice(PREFIX.length).split(':');
  const [encodedIv, encodedAuthTag, encodedContent] = parts;
  if (parts.length !== 3 || !encodedIv || !encodedAuthTag || !encodedContent) {
    throw ApiError.internal('Le contenu chiffré du chapitre est invalide');
  }

  try {
    const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(encodedIv, 'base64url'), {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(Buffer.from(encodedAuthTag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(encodedContent, 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    throw ApiError.internal('Impossible de déchiffrer le contenu du chapitre');
  }
}
