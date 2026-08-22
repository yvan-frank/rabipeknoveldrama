import { execFile } from 'node:child_process';
import { once } from 'node:events';
import { promisify } from 'node:util';
import yauzl from 'yauzl';
import { env } from '../../config/env';

async function listEntries(filePath: string) {
  const archive = await new Promise<yauzl.ZipFile>((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true }, (error, zip) => error || !zip ? reject(error ?? new Error('Archive EPUB illisible')) : resolve(zip));
  });
  const entries: yauzl.Entry[] = [];

  await new Promise<void>((resolve, reject) => {
    archive.on('error', reject);
    archive.on('entry', (entry: yauzl.Entry) => {
      entries.push(entry);
      archive.readEntry();
    });
    archive.on('end', resolve);
    archive.readEntry();
  });
  archive.close();
  return entries;
}

async function readArchiveEntry(filePath: string, name: string) {
  const archive = await new Promise<yauzl.ZipFile>((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true }, (error, zip) => error || !zip ? reject(error ?? new Error('Archive EPUB illisible')) : resolve(zip));
  });
  const entry = await new Promise<yauzl.Entry>((resolve, reject) => {
    archive.on('error', reject);
    archive.on('entry', (candidate: yauzl.Entry) => {
      if (candidate.fileName === name) resolve(candidate);
      else archive.readEntry();
    });
    archive.on('end', () => reject(new Error(`Entrée EPUB absente : ${name}`)));
    archive.readEntry();
  });
  const stream = await new Promise<NodeJS.ReadableStream>((resolve, reject) => archive.openReadStream(entry, (error, value) => error || !value ? reject(error ?? new Error(`Entrée EPUB illisible : ${name}`)) : resolve(value)));
  const chunks: Buffer[] = [];
  stream.on('data', (chunk: Buffer) => chunks.push(chunk));
  await once(stream, 'end');
  archive.close();
  return Buffer.concat(chunks);
}

async function runEpubCheck(filePath: string) {
  const jarPath = env.EPUBCHECK_JAR_PATH;
  if (!jarPath) {
    if (env.EPUBCHECK_REQUIRED) throw new Error('EPUBCHECK_JAR_PATH est requis pour valider les EPUB en production');
    return;
  }

  try {
    await promisify(execFile)('java', ['-jar', jarPath, filePath], { windowsHide: true, maxBuffer: 3 * 1024 * 1024 });
  } catch (error) {
    const details = error && typeof error === 'object' && 'stderr' in error ? String(error.stderr) : String(error);
    throw new Error(`EPUBCheck a rejeté l'archive : ${details.slice(0, 3_000)}`);
  }
}

// Contrôles structurels rapides, exécutés dans tous les environnements. EPUBCheck
// complète cette validation lorsqu'il est configuré au déploiement.
export async function validateEpub(filePath: string) {
  const entries = await listEntries(filePath);
  const names = new Set(entries.map((entry) => entry.fileName));
  const first = entries[0];
  if (!first || first.fileName !== 'mimetype' || first.compressionMethod !== 0) {
    throw new Error("EPUB invalide : l'entrée mimetype doit être la première et non compressée");
  }
  const mimetype = (await readArchiveEntry(filePath, 'mimetype')).toString('utf8');
  if (mimetype !== 'application/epub+zip') throw new Error('EPUB invalide : mimetype incorrect');
  if (!names.has('META-INF/container.xml') || !names.has('OEBPS/content.opf') || !names.has('OEBPS/nav.xhtml')) {
    throw new Error('EPUB invalide : package, container ou navigation manquant');
  }
  if (!entries.some((entry) => entry.fileName.startsWith('OEBPS/text/') && entry.fileName.endsWith('.xhtml'))) {
    throw new Error('EPUB invalide : aucun chapitre XHTML');
  }
  if (entries.some((entry) => entry.fileName.includes('..') || entry.fileName.startsWith('/'))) throw new Error('EPUB invalide : chemin d’archive dangereux');
  await runEpubCheck(filePath);
}
