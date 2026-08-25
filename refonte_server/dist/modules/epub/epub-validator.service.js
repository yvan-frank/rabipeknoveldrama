"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEpub = validateEpub;
const node_child_process_1 = require("node:child_process");
const node_events_1 = require("node:events");
const node_util_1 = require("node:util");
const yauzl_1 = __importDefault(require("yauzl"));
const env_1 = require("../../config/env");
async function listEntries(filePath) {
    const archive = await new Promise((resolve, reject) => {
        yauzl_1.default.open(filePath, { lazyEntries: true }, (error, zip) => error || !zip ? reject(error ?? new Error('Archive EPUB illisible')) : resolve(zip));
    });
    const entries = [];
    await new Promise((resolve, reject) => {
        archive.on('error', reject);
        archive.on('entry', (entry) => {
            entries.push(entry);
            archive.readEntry();
        });
        archive.on('end', resolve);
        archive.readEntry();
    });
    archive.close();
    return entries;
}
async function readArchiveEntry(filePath, name) {
    const archive = await new Promise((resolve, reject) => {
        yauzl_1.default.open(filePath, { lazyEntries: true }, (error, zip) => error || !zip ? reject(error ?? new Error('Archive EPUB illisible')) : resolve(zip));
    });
    const entry = await new Promise((resolve, reject) => {
        archive.on('error', reject);
        archive.on('entry', (candidate) => {
            if (candidate.fileName === name)
                resolve(candidate);
            else
                archive.readEntry();
        });
        archive.on('end', () => reject(new Error(`Entrée EPUB absente : ${name}`)));
        archive.readEntry();
    });
    const stream = await new Promise((resolve, reject) => archive.openReadStream(entry, (error, value) => error || !value ? reject(error ?? new Error(`Entrée EPUB illisible : ${name}`)) : resolve(value)));
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    await (0, node_events_1.once)(stream, 'end');
    archive.close();
    return Buffer.concat(chunks);
}
async function runEpubCheck(filePath) {
    const jarPath = env_1.env.EPUBCHECK_JAR_PATH;
    if (!jarPath) {
        if (env_1.env.EPUBCHECK_REQUIRED)
            throw new Error('EPUBCHECK_JAR_PATH est requis pour valider les EPUB en production');
        return;
    }
    try {
        await (0, node_util_1.promisify)(node_child_process_1.execFile)('java', ['-jar', jarPath, filePath], { windowsHide: true, maxBuffer: 3 * 1024 * 1024 });
    }
    catch (error) {
        const details = error && typeof error === 'object' && 'stderr' in error ? String(error.stderr) : String(error);
        throw new Error(`EPUBCheck a rejeté l'archive : ${details.slice(0, 3_000)}`);
    }
}
// Contrôles structurels rapides, exécutés dans tous les environnements. EPUBCheck
// complète cette validation lorsqu'il est configuré au déploiement.
async function validateEpub(filePath) {
    const entries = await listEntries(filePath);
    const names = new Set(entries.map((entry) => entry.fileName));
    const first = entries[0];
    if (!first || first.fileName !== 'mimetype' || first.compressionMethod !== 0) {
        throw new Error("EPUB invalide : l'entrée mimetype doit être la première et non compressée");
    }
    const mimetype = (await readArchiveEntry(filePath, 'mimetype')).toString('utf8');
    if (mimetype !== 'application/epub+zip')
        throw new Error('EPUB invalide : mimetype incorrect');
    if (!names.has('META-INF/container.xml') || !names.has('OEBPS/content.opf') || !names.has('OEBPS/nav.xhtml')) {
        throw new Error('EPUB invalide : package, container ou navigation manquant');
    }
    if (!entries.some((entry) => entry.fileName.startsWith('OEBPS/text/') && entry.fileName.endsWith('.xhtml'))) {
        throw new Error('EPUB invalide : aucun chapitre XHTML');
    }
    if (entries.some((entry) => entry.fileName.includes('..') || entry.fileName.startsWith('/')))
        throw new Error('EPUB invalide : chemin d’archive dangereux');
    await runEpubCheck(filePath);
}
//# sourceMappingURL=epub-validator.service.js.map