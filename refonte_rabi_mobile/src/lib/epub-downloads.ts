import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { env } from '../config/env';
import { getAccessToken } from '../auth/token-storage';

// Les éditions EPUB téléchargées vivent dans le répertoire "document" (survit
// aux redémarrages, contrairement à "cache" qui peut être purgé par l'OS).
const EPUB_DIRECTORY = new Directory(Paths.document, 'epub');

function ensureDirectory(): void {
  if (!EPUB_DIRECTORY.exists) EPUB_DIRECTORY.create({ intermediates: true, idempotent: true });
}

function localFile(editionId: number): File {
  return new File(EPUB_DIRECTORY, `edition-${editionId}.epub`);
}

export function isEpubDownloaded(editionId: number): boolean {
  return localFile(editionId).exists;
}

// Le endpoint /epub-editions/:id/download exige un Bearer (cf. Phase 1) —
// File.downloadFileAsync ne passe pas par l'intercepteur axios de client.ts,
// on attache donc le token manuellement ici.
export async function downloadEpub(editionId: number): Promise<File> {
  ensureDirectory();
  const destination = localFile(editionId);
  if (destination.exists) return destination;

  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error('Session expirée, reconnectez-vous avant de télécharger');

  return File.downloadFileAsync(`${env.API_URL}/epub-editions/${editionId}/download`, destination, {
    headers: { Authorization: `Bearer ${accessToken}` },
    idempotent: true,
  });
}

export function deleteLocalEpub(editionId: number): void {
  const file = localFile(editionId);
  if (file.exists) file.delete();
}

// Aucun lecteur EPUB natif dans l'app (cf. plan mobile, décision "lecteur
// EPUB" non tranchée) : on délègue l'ouverture à l'application du système
// capable de lire un .epub, via la feuille de partage/ouverture native.
export async function openEpub(editionId: number): Promise<void> {
  const file = localFile(editionId);
  if (!file.exists) throw new Error('Fichier EPUB introuvable localement');
  if (!(await Sharing.isAvailableAsync())) throw new Error("Aucune application disponible pour ouvrir l'EPUB");
  await Sharing.shareAsync(file.uri, { mimeType: 'application/epub+zip', UTI: 'org.idpf.epub-container' });
}
