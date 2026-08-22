import { createHash } from 'node:crypto';
import { createWriteStream, existsSync } from 'node:fs';
import { readFile, stat, unlink } from 'node:fs/promises';
import archiver from 'archiver';
import { load } from 'cheerio';
import { EpubStatus } from '@prisma/client';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/ApiError';
import { assertAuthorOwnership } from '../../utils/ownership';
import { decryptChapterContent } from '../../utils/chapter-content-encryption';
import type { AuthUser } from '../auth/auth.types';
import { validateEpub } from './epub-validator.service';
import { openEpubFile, persistEpubFile, removeAllEpubFiles, reserveEpubBuildPath } from './epub-storage';

const MAX_COVER_BYTES = 10 * 1024 * 1024;

function xml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character] ?? character);
}

function asXhtml(html: string) {
  const safe = html
    .replace(/<\/?(?:script|iframe|object|embed)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/<br(\s[^>]*)?>/gi, '<br$1 />')
    .replace(/<hr(\s[^>]*)?>/gi, '<hr$1 />')
    .replace(/<img(\s[^>]*?)(?<!\/)\s*>/gi, '<img$1 />');

  return `<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="fr" lang="fr"><head><meta charset="utf-8"/><title>Chapitre</title></head><body>${safe}</body></html>`;
}

function filenameForBook(title: string) {
  const base = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  return `${base || 'livre'}.epub`;
}

interface DownloadedImage {
  sourceUrl: string;
  content: Buffer;
  mediaType: string;
  extension: string;
}

function resolveLocalImageUrl(value: string) {
  let sourceUrl: URL;
  try {
    sourceUrl = new URL(value, `${env.APP_URL}/`);
  } catch {
    throw new Error(`URL d'image invalide : ${value}`);
  }
  const isSameApplication = sourceUrl.origin === new URL(env.APP_URL).origin;
  const isAllowedExternalHost = env.EPUB_EXTERNAL_IMAGE_HOSTS.includes(sourceUrl.hostname.toLowerCase()) || env.EPUB_EXTERNAL_IMAGE_HOSTS.includes(sourceUrl.host.toLowerCase());
  if (!['http:', 'https:'].includes(sourceUrl.protocol) || (!isSameApplication && !isAllowedExternalHost)) {
    throw new Error(`Domaine image non autorisé : ${sourceUrl.hostname}. Ajoutez-le à EPUB_EXTERNAL_IMAGE_HOSTS si nécessaire.`);
  }
  return sourceUrl.toString();
}

async function downloadImage(value: string): Promise<DownloadedImage> {
  const sourceUrl = resolveLocalImageUrl(value);
  const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Image inaccessible (${response.status}) : ${value}`);
  const mediaType = response.headers.get('content-type')?.split(';')[0]?.toLowerCase() ?? '';
  const extensionByType: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
  const extension = extensionByType[mediaType];
  if (!extension) throw new Error(`Format d'image non supporté (${mediaType || 'inconnu'}) : ${value}`);
  const content = Buffer.from(await response.arrayBuffer());
  if (!content.length || content.length > MAX_COVER_BYTES) throw new Error(`Image vide ou trop volumineuse : ${value}`);
  return { sourceUrl, content, mediaType, extension };
}

async function prepareChapterContent(html: string, chapterNumber: number, language: string) {
  const $ = load(`<div id="rabipek-epub-root">${html}</div>`, undefined, false);
  const root = $('#rabipek-epub-root');
  root.find('script, iframe, object, embed').remove();
  root.find('*').each((_, element) => {
    for (const attribute of Object.keys(element.attribs ?? {})) {
      if (attribute.toLowerCase().startsWith('on')) $(element).removeAttr(attribute);
    }
  });

  const assets: Array<DownloadedImage & { archivePath: string }> = [];
  const images = root.find('img').toArray();
  for (let imageIndex = 0; imageIndex < images.length; imageIndex += 1) {
    const image = images[imageIndex]!;
    const source = $(image).attr('src');
    if (!source) throw new Error(`Chapitre ${chapterNumber} : image sans attribut src`);
    const downloaded = await downloadImage(source);
    const archivePath = `images/chapter-${String(chapterNumber).padStart(3, '0')}-${String(imageIndex + 1).padStart(3, '0')}.${downloaded.extension}`;
    $(image).attr('src', `../${archivePath}`);
    assets.push({ ...downloaded, archivePath });
  }

  return { content: asXhtml(root.html() ?? '').replace(/xml:lang="fr" lang="fr"/, `xml:lang="${xml(language)}" lang="${xml(language)}"`), assets };
}

async function buildEpubArchive(entries: Array<{ name: string; content: string | Buffer; store?: boolean }>): Promise<string> {
  const buildFilePath = await reserveEpubBuildPath();
  const output = createWriteStream(buildFilePath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  await new Promise<void>((resolve, reject) => {
    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);
    archive.pipe(output);
    for (const entry of entries) archive.append(entry.content, { name: entry.name, store: entry.store ?? false });
    void archive.finalize();
  });

  return buildFilePath;
}

type EpubSource = Awaited<ReturnType<typeof loadEpubSource>>;

async function loadEpubSource(bookId: number) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      author: { select: { id: true, name: true, designation: true } },
      extension: { select: { language: true } },
      chapters: { select: { id: true, title: true, chapterNumber: true, content: true }, orderBy: { chapterNumber: 'asc' } },
    },
  });
  if (!book) throw ApiError.notFound('Livre introuvable');
  return book;
}

function sourceRevision(book: EpubSource) {
  const payload = JSON.stringify({
    title: book.title,
    description: book.resume,
    language: book.extension?.language,
    cover: book.cover,
    chapters: book.chapters.map((chapter) => ({ title: chapter.title, number: chapter.chapterNumber, content: chapter.content })),
  });
  return createHash('sha256').update(payload).digest('hex');
}

export async function requestEpubGeneration(bookId: number, actingUser: AuthUser) {
  const book = await loadEpubSource(bookId);
  assertAuthorOwnership(actingUser, book.authorId);
  if (!book.chapters.length) throw ApiError.badRequest("Ce livre n'a aucun chapitre à convertir en EPUB");

  const latest = await prisma.epubEdition.findFirst({ where: { bookId }, orderBy: { version: 'desc' }, select: { version: true } });
  return prisma.epubEdition.create({
    data: { bookId, version: (latest?.version ?? 0) + 1, sourceRevision: sourceRevision(book) },
    select: { id: true, bookId: true, version: true, status: true, createdAt: true },
  });
}

export async function listEpubEditions(bookId: number, actingUser: AuthUser) {
  const book = await loadEpubSource(bookId);
  assertAuthorOwnership(actingUser, book.authorId);
  const currentRevision = sourceRevision(book);
  const editions = await prisma.epubEdition.findMany({
    where: { bookId },
    select: { id: true, version: true, status: true, sourceRevision: true, fileSizeBytes: true, errorMessage: true, generatedAt: true, createdAt: true },
    orderBy: { version: 'desc' },
  });
  return editions.map(({ sourceRevision: editionRevision, ...edition }) => ({ ...edition, isCurrent: editionRevision === currentRevision }));
}

export async function generateEpubEdition(editionId: number) {
  const edition = await prisma.epubEdition.findUnique({ where: { id: editionId }, select: { id: true, bookId: true, status: true } });
  if (!edition || edition.status !== EpubStatus.QUEUED) return;

  await prisma.epubEdition.update({ where: { id: editionId }, data: { status: EpubStatus.PROCESSING, errorMessage: null } });
  let buildFilePath: string | null = null;

  try {
    const book = await loadEpubSource(edition.bookId);
    if (!book.chapters.length) throw new Error("Le livre ne contient aucun chapitre");
    const language = book.extension?.language?.trim() || 'fr';
    const authorName = book.author.name ?? book.author.designation ?? 'Auteur Rabipek';
    const chapterEntries: Array<{ id: string; href: string; title: string; content: string; assets: Array<DownloadedImage & { archivePath: string }> }> = [];
    for (let index = 0; index < book.chapters.length; index += 1) {
      const chapter = book.chapters[index]!;
      const prepared = await prepareChapterContent(decryptChapterContent(chapter.content), chapter.chapterNumber, language);
      chapterEntries.push({
        id: `chapter-${index + 1}`,
        href: `text/chapter-${String(index + 1).padStart(3, '0')}.xhtml`,
        title: chapter.title,
        content: prepared.content,
        assets: prepared.assets,
      });
    }
    const cover = await downloadImage(book.cover);
    const coverItem = `<item id="cover-image" href="images/cover.${cover.extension}" media-type="${cover.mediaType}" properties="cover-image"/>`;
    const manifest = chapterEntries.map((chapter) => `<item id="${chapter.id}" href="${chapter.href}" media-type="application/xhtml+xml"/>`).join('');
    const spine = chapterEntries.map((chapter) => `<itemref idref="${chapter.id}"/>`).join('');
    const navigation = chapterEntries.map((chapter) => `<li><a href="${chapter.href}">${xml(chapter.title)}</a></li>`).join('');
    const identifier = `urn:rabipek:book:${book.id}:edition:${edition.id}`;
    const opf = `<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="${xml(language)}"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">${identifier}</dc:identifier><dc:title>${xml(book.title)}</dc:title><dc:creator>${xml(authorName)}</dc:creator><dc:language>${xml(language)}</dc:language><dc:description>${xml(book.resume)}</dc:description><meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>${coverItem}${manifest}</manifest><spine>${spine}</spine></package>`;
    const nav = `<?xml version="1.0" encoding="utf-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${xml(language)}" lang="${xml(language)}"><head><meta charset="utf-8"/><title>Sommaire</title></head><body><nav epub:type="toc" id="toc" role="doc-toc" xmlns:epub="http://www.idpf.org/2007/ops"><h1>Sommaire</h1><ol>${navigation}</ol></nav></body></html>`;
    const entries: Array<{ name: string; content: string | Buffer; store?: boolean }> = [
      { name: 'mimetype', content: 'application/epub+zip', store: true },
      { name: 'META-INF/container.xml', content: '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>' },
      { name: 'OEBPS/content.opf', content: opf },
      { name: 'OEBPS/nav.xhtml', content: nav },
      ...chapterEntries.map((chapter) => ({ name: `OEBPS/${chapter.href}`, content: chapter.content })),
      ...chapterEntries.flatMap((chapter) => chapter.assets.map((asset) => ({ name: `OEBPS/${asset.archivePath}`, content: asset.content }))),
      { name: `OEBPS/images/cover.${cover.extension}`, content: cover.content },
    ];

    buildFilePath = await buildEpubArchive(entries);
    await validateEpub(buildFilePath);
    const file = await stat(buildFilePath);
    const checksum = createHash('sha256').update(await readFile(buildFilePath)).digest('hex');

    const storageKey = `${book.id}/edition-${edition.id}.epub`;
    await persistEpubFile(buildFilePath, storageKey);
    buildFilePath = null; // déplacé/téléversé vers le stockage durable, plus de fichier temporaire à nettoyer

    await prisma.$transaction([
      prisma.epubAsset.deleteMany({ where: { epubEditionId: edition.id } }),
      prisma.epubAsset.create({ data: { epubEditionId: edition.id, sourceUrl: cover.sourceUrl, archivePath: `images/cover.${cover.extension}`, mediaType: cover.mediaType, checksum: createHash('sha256').update(cover.content).digest('hex') } }),
      ...chapterEntries.flatMap((chapter) => chapter.assets.map((asset) => prisma.epubAsset.create({ data: { epubEditionId: edition.id, sourceUrl: asset.sourceUrl, archivePath: asset.archivePath, mediaType: asset.mediaType, checksum: createHash('sha256').update(asset.content).digest('hex') } }))),
      prisma.epubEdition.update({ where: { id: edition.id }, data: { status: EpubStatus.READY, storageKey, fileSizeBytes: file.size, checksum, generatedAt: new Date(), errorMessage: null } }),
    ]);
  } catch (error) {
    if (buildFilePath && existsSync(buildFilePath)) await unlink(buildFilePath);
    const message = error instanceof Error ? error.message : 'Erreur inconnue lors de la génération EPUB';
    await prisma.epubEdition.update({ where: { id: editionId }, data: { status: EpubStatus.FAILED, errorMessage: message.slice(0, 4_000) } });
  }
}

export async function getEpubDownload(editionId: number, viewer: AuthUser) {
  const edition = await prisma.epubEdition.findUnique({
    where: { id: editionId },
    include: { book: { include: { parts: { select: { id: true, isFree: true } }, chapters: { select: { partId: true } } } } },
  });
  if (!edition || edition.status !== EpubStatus.READY || !edition.storageKey) throw ApiError.notFound('Édition EPUB indisponible');
  if (viewer.role !== 'admin' && viewer.authorId !== edition.book.authorId) {
    if (!edition.book.isFree) {
      const purchases = await prisma.achat.findMany({ where: { userId: viewer.id, bookId: edition.bookId }, select: { partId: true } });
      const ownsWholeBook = purchases.some((purchase) => purchase.partId === null);
      const ownedParts = new Set(purchases.map((purchase) => purchase.partId).filter((partId): partId is number => partId !== null));
      const paidPartIds = edition.book.parts.filter((part) => !part.isFree).map((part) => part.id);
      const hasUnassignedChapters = edition.book.chapters.some((chapter) => chapter.partId === null);
      if (!ownsWholeBook && (hasUnassignedChapters || paidPartIds.some((partId) => !ownedParts.has(partId)))) {
        throw ApiError.forbidden("Achetez le livre pour télécharger son EPUB");
      }
    }
  }

  const file = await openEpubFile(edition.storageKey);
  if (!file) throw ApiError.notFound('Fichier EPUB introuvable');
  return { ...file, filename: filenameForBook(edition.book.title) };
}

export async function resumeQueuedEpubGenerations() {
  const editions = await prisma.epubEdition.findMany({ where: { status: { in: [EpubStatus.QUEUED, EpubStatus.PROCESSING] } }, select: { id: true, status: true } });
  await prisma.epubEdition.updateMany({ where: { status: EpubStatus.PROCESSING }, data: { status: EpubStatus.QUEUED } });
  return editions.map((edition) => edition.id);
}

export async function removeEpubStorage() {
  await removeAllEpubFiles();
}
