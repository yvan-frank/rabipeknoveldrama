"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestEpubGeneration = requestEpubGeneration;
exports.listEpubEditions = listEpubEditions;
exports.getCurrentReadyEditionForReader = getCurrentReadyEditionForReader;
exports.generateEpubEdition = generateEpubEdition;
exports.getEpubDownload = getEpubDownload;
exports.resumeQueuedEpubGenerations = resumeQueuedEpubGenerations;
exports.removeEpubStorage = removeEpubStorage;
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const promises_1 = require("node:fs/promises");
const archiver_1 = __importDefault(require("archiver"));
const cheerio_1 = require("cheerio");
const client_1 = require("@prisma/client");
const env_1 = require("../../config/env");
const prisma_1 = require("../../lib/prisma");
const ApiError_1 = require("../../utils/ApiError");
const ownership_1 = require("../../utils/ownership");
const chapter_content_encryption_1 = require("../../utils/chapter-content-encryption");
const epub_validator_service_1 = require("./epub-validator.service");
const epub_storage_1 = require("./epub-storage");
const MAX_COVER_BYTES = 10 * 1024 * 1024;
function xml(value) {
    return value.replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character] ?? character);
}
function asXhtml(html) {
    const safe = html
        .replace(/<\/?(?:script|iframe|object|embed)[^>]*>/gi, '')
        .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/<br(\s[^>]*)?>/gi, '<br$1 />')
        .replace(/<hr(\s[^>]*)?>/gi, '<hr$1 />')
        .replace(/<img(\s[^>]*?)(?<!\/)\s*>/gi, '<img$1 />');
    return `<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="fr" lang="fr"><head><meta charset="utf-8"/><title>Chapitre</title></head><body>${safe}</body></html>`;
}
function filenameForBook(title) {
    const base = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
    return `${base || 'livre'}.epub`;
}
function resolveLocalImageUrl(value) {
    let sourceUrl;
    try {
        sourceUrl = new URL(value, `${env_1.env.APP_URL}/`);
    }
    catch {
        throw new Error(`URL d'image invalide : ${value}`);
    }
    const isSameApplication = sourceUrl.origin === new URL(env_1.env.APP_URL).origin;
    const isAllowedExternalHost = env_1.env.EPUB_EXTERNAL_IMAGE_HOSTS.includes(sourceUrl.hostname.toLowerCase()) || env_1.env.EPUB_EXTERNAL_IMAGE_HOSTS.includes(sourceUrl.host.toLowerCase());
    if (!['http:', 'https:'].includes(sourceUrl.protocol) || (!isSameApplication && !isAllowedExternalHost)) {
        throw new Error(`Domaine image non autorisé : ${sourceUrl.hostname}. Ajoutez-le à EPUB_EXTERNAL_IMAGE_HOSTS si nécessaire.`);
    }
    return sourceUrl.toString();
}
async function downloadImage(value) {
    const sourceUrl = resolveLocalImageUrl(value);
    const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok)
        throw new Error(`Image inaccessible (${response.status}) : ${value}`);
    const mediaType = response.headers.get('content-type')?.split(';')[0]?.toLowerCase() ?? '';
    const extensionByType = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
    const extension = extensionByType[mediaType];
    if (!extension)
        throw new Error(`Format d'image non supporté (${mediaType || 'inconnu'}) : ${value}`);
    const content = Buffer.from(await response.arrayBuffer());
    if (!content.length || content.length > MAX_COVER_BYTES)
        throw new Error(`Image vide ou trop volumineuse : ${value}`);
    return { sourceUrl, content, mediaType, extension };
}
async function prepareChapterContent(html, chapterNumber, language) {
    const $ = (0, cheerio_1.load)(`<div id="rabipek-epub-root">${html}</div>`, undefined, false);
    const root = $('#rabipek-epub-root');
    root.find('script, iframe, object, embed').remove();
    root.find('*').each((_, element) => {
        for (const attribute of Object.keys(element.attribs ?? {})) {
            if (attribute.toLowerCase().startsWith('on'))
                $(element).removeAttr(attribute);
        }
    });
    const assets = [];
    const images = root.find('img').toArray();
    for (let imageIndex = 0; imageIndex < images.length; imageIndex += 1) {
        const image = images[imageIndex];
        const source = $(image).attr('src');
        if (!source)
            throw new Error(`Chapitre ${chapterNumber} : image sans attribut src`);
        const downloaded = await downloadImage(source);
        const archivePath = `images/chapter-${String(chapterNumber).padStart(3, '0')}-${String(imageIndex + 1).padStart(3, '0')}.${downloaded.extension}`;
        $(image).attr('src', `../${archivePath}`);
        assets.push({ ...downloaded, archivePath });
    }
    return { content: asXhtml(root.html() ?? '').replace(/xml:lang="fr" lang="fr"/, `xml:lang="${xml(language)}" lang="${xml(language)}"`), assets };
}
async function buildEpubArchive(entries) {
    const buildFilePath = await (0, epub_storage_1.reserveEpubBuildPath)();
    const output = (0, node_fs_1.createWriteStream)(buildFilePath);
    const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
    await new Promise((resolve, reject) => {
        output.on('close', resolve);
        output.on('error', reject);
        archive.on('error', reject);
        archive.pipe(output);
        for (const entry of entries)
            archive.append(entry.content, { name: entry.name, store: entry.store ?? false });
        void archive.finalize();
    });
    return buildFilePath;
}
async function loadEpubSource(bookId) {
    const book = await prisma_1.prisma.book.findUnique({
        where: { id: bookId },
        include: {
            author: { select: { id: true, name: true, designation: true } },
            extension: { select: { language: true } },
            chapters: { select: { id: true, title: true, chapterNumber: true, content: true }, orderBy: { chapterNumber: 'asc' } },
        },
    });
    if (!book)
        throw ApiError_1.ApiError.notFound('Livre introuvable');
    return book;
}
function sourceRevision(book) {
    const payload = JSON.stringify({
        title: book.title,
        description: book.resume,
        language: book.extension?.language,
        cover: book.cover,
        chapters: book.chapters.map((chapter) => ({ title: chapter.title, number: chapter.chapterNumber, content: chapter.content })),
    });
    return (0, node_crypto_1.createHash)('sha256').update(payload).digest('hex');
}
async function requestEpubGeneration(bookId, actingUser) {
    const book = await loadEpubSource(bookId);
    (0, ownership_1.assertAuthorOwnership)(actingUser, book.authorId);
    if (!book.chapters.length)
        throw ApiError_1.ApiError.badRequest("Ce livre n'a aucun chapitre à convertir en EPUB");
    const latest = await prisma_1.prisma.epubEdition.findFirst({ where: { bookId }, orderBy: { version: 'desc' }, select: { version: true } });
    return prisma_1.prisma.epubEdition.create({
        data: { bookId, version: (latest?.version ?? 0) + 1, sourceRevision: sourceRevision(book) },
        select: { id: true, bookId: true, version: true, status: true, createdAt: true },
    });
}
async function listEpubEditions(bookId, actingUser) {
    const book = await loadEpubSource(bookId);
    (0, ownership_1.assertAuthorOwnership)(actingUser, book.authorId);
    const currentRevision = sourceRevision(book);
    const editions = await prisma_1.prisma.epubEdition.findMany({
        where: { bookId },
        select: { id: true, version: true, status: true, sourceRevision: true, fileSizeBytes: true, errorMessage: true, generatedAt: true, createdAt: true },
        orderBy: { version: 'desc' },
    });
    return editions.map(({ sourceRevision: editionRevision, ...edition }) => ({ ...edition, isCurrent: editionRevision === currentRevision }));
}
// Contrepartie lecteur de listEpubEditions : pas de vérification d'ownership
// (n'importe quel utilisateur authentifié peut consulter), et ne renvoie que
// l'édition prête et à jour, sans l'historique complet ni la possibilité de
// déclencher une génération (réservée à l'auteur/admin, cf. bookEpubEditionsRouter).
// L'accès réel au fichier reste vérifié séparément par getEpubDownload.
async function getCurrentReadyEditionForReader(bookId) {
    const book = await loadEpubSource(bookId);
    return prisma_1.prisma.epubEdition.findFirst({
        where: { bookId, status: client_1.EpubStatus.READY, sourceRevision: sourceRevision(book) },
        orderBy: { version: 'desc' },
        select: { id: true, version: true, fileSizeBytes: true, generatedAt: true },
    });
}
async function generateEpubEdition(editionId) {
    const edition = await prisma_1.prisma.epubEdition.findUnique({ where: { id: editionId }, select: { id: true, bookId: true, status: true } });
    if (!edition || edition.status !== client_1.EpubStatus.QUEUED)
        return;
    await prisma_1.prisma.epubEdition.update({ where: { id: editionId }, data: { status: client_1.EpubStatus.PROCESSING, errorMessage: null } });
    let buildFilePath = null;
    try {
        const book = await loadEpubSource(edition.bookId);
        if (!book.chapters.length)
            throw new Error("Le livre ne contient aucun chapitre");
        const language = book.extension?.language?.trim() || 'fr';
        const authorName = book.author.name ?? book.author.designation ?? 'Auteur Rabipek';
        const chapterEntries = [];
        for (let index = 0; index < book.chapters.length; index += 1) {
            const chapter = book.chapters[index];
            const prepared = await prepareChapterContent((0, chapter_content_encryption_1.decryptChapterContent)(chapter.content), chapter.chapterNumber, language);
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
        const entries = [
            { name: 'mimetype', content: 'application/epub+zip', store: true },
            { name: 'META-INF/container.xml', content: '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>' },
            { name: 'OEBPS/content.opf', content: opf },
            { name: 'OEBPS/nav.xhtml', content: nav },
            ...chapterEntries.map((chapter) => ({ name: `OEBPS/${chapter.href}`, content: chapter.content })),
            ...chapterEntries.flatMap((chapter) => chapter.assets.map((asset) => ({ name: `OEBPS/${asset.archivePath}`, content: asset.content }))),
            { name: `OEBPS/images/cover.${cover.extension}`, content: cover.content },
        ];
        buildFilePath = await buildEpubArchive(entries);
        await (0, epub_validator_service_1.validateEpub)(buildFilePath);
        const file = await (0, promises_1.stat)(buildFilePath);
        const checksum = (0, node_crypto_1.createHash)('sha256').update(await (0, promises_1.readFile)(buildFilePath)).digest('hex');
        const storageKey = `${book.id}/edition-${edition.id}.epub`;
        await (0, epub_storage_1.persistEpubFile)(buildFilePath, storageKey);
        buildFilePath = null; // déplacé/téléversé vers le stockage durable, plus de fichier temporaire à nettoyer
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.epubAsset.deleteMany({ where: { epubEditionId: edition.id } }),
            prisma_1.prisma.epubAsset.create({ data: { epubEditionId: edition.id, sourceUrl: cover.sourceUrl, archivePath: `images/cover.${cover.extension}`, mediaType: cover.mediaType, checksum: (0, node_crypto_1.createHash)('sha256').update(cover.content).digest('hex') } }),
            ...chapterEntries.flatMap((chapter) => chapter.assets.map((asset) => prisma_1.prisma.epubAsset.create({ data: { epubEditionId: edition.id, sourceUrl: asset.sourceUrl, archivePath: asset.archivePath, mediaType: asset.mediaType, checksum: (0, node_crypto_1.createHash)('sha256').update(asset.content).digest('hex') } }))),
            prisma_1.prisma.epubEdition.update({ where: { id: edition.id }, data: { status: client_1.EpubStatus.READY, storageKey, fileSizeBytes: file.size, checksum, generatedAt: new Date(), errorMessage: null } }),
        ]);
    }
    catch (error) {
        if (buildFilePath && (0, node_fs_1.existsSync)(buildFilePath))
            await (0, promises_1.unlink)(buildFilePath);
        const message = error instanceof Error ? error.message : 'Erreur inconnue lors de la génération EPUB';
        await prisma_1.prisma.epubEdition.update({ where: { id: editionId }, data: { status: client_1.EpubStatus.FAILED, errorMessage: message.slice(0, 4_000) } });
    }
}
async function getEpubDownload(editionId, viewer) {
    const edition = await prisma_1.prisma.epubEdition.findUnique({
        where: { id: editionId },
        include: { book: { include: { parts: { select: { id: true, isFree: true } }, chapters: { select: { partId: true } } } } },
    });
    if (!edition || edition.status !== client_1.EpubStatus.READY || !edition.storageKey)
        throw ApiError_1.ApiError.notFound('Édition EPUB indisponible');
    if (viewer.role !== 'admin' && viewer.authorId !== edition.book.authorId) {
        if (!edition.book.isFree) {
            const purchases = await prisma_1.prisma.achat.findMany({ where: { userId: viewer.id, bookId: edition.bookId }, select: { partId: true } });
            const ownsWholeBook = purchases.some((purchase) => purchase.partId === null);
            const ownedParts = new Set(purchases.map((purchase) => purchase.partId).filter((partId) => partId !== null));
            const paidPartIds = edition.book.parts.filter((part) => !part.isFree).map((part) => part.id);
            const hasUnassignedChapters = edition.book.chapters.some((chapter) => chapter.partId === null);
            if (!ownsWholeBook && (hasUnassignedChapters || paidPartIds.some((partId) => !ownedParts.has(partId)))) {
                throw ApiError_1.ApiError.forbidden("Achetez le livre pour télécharger son EPUB");
            }
        }
    }
    const file = await (0, epub_storage_1.openEpubFile)(edition.storageKey);
    if (!file)
        throw ApiError_1.ApiError.notFound('Fichier EPUB introuvable');
    return { ...file, filename: filenameForBook(edition.book.title) };
}
async function resumeQueuedEpubGenerations() {
    const editions = await prisma_1.prisma.epubEdition.findMany({ where: { status: { in: [client_1.EpubStatus.QUEUED, client_1.EpubStatus.PROCESSING] } }, select: { id: true, status: true } });
    await prisma_1.prisma.epubEdition.updateMany({ where: { status: client_1.EpubStatus.PROCESSING }, data: { status: client_1.EpubStatus.QUEUED } });
    return editions.map((edition) => edition.id);
}
async function removeEpubStorage() {
    await (0, epub_storage_1.removeAllEpubFiles)();
}
//# sourceMappingURL=epub.service.js.map