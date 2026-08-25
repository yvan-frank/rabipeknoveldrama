"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reserveEpubBuildPath = reserveEpubBuildPath;
exports.persistEpubFile = persistEpubFile;
exports.openEpubFile = openEpubFile;
exports.epubFileExists = epubFileExists;
exports.deleteEpubFile = deleteEpubFile;
exports.removeAllEpubFiles = removeAllEpubFiles;
const node_fs_1 = require("node:fs");
const promises_1 = require("node:fs/promises");
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = require("node:crypto");
const client_s3_1 = require("@aws-sdk/client-s3");
const env_1 = require("../../config/env");
const LOCAL_ROOT = node_path_1.default.isAbsolute(env_1.env.EPUB_STORAGE_DIR) ? env_1.env.EPUB_STORAGE_DIR : node_path_1.default.join(process.cwd(), env_1.env.EPUB_STORAGE_DIR);
const BUILD_DIR = node_path_1.default.join(node_os_1.default.tmpdir(), 'rabipek-epub-build');
let s3Client = null;
function getS3Client() {
    if (!s3Client) {
        s3Client = new client_s3_1.S3Client({
            region: env_1.env.EPUB_S3_REGION,
            endpoint: env_1.env.EPUB_S3_ENDPOINT,
            forcePathStyle: env_1.env.EPUB_S3_FORCE_PATH_STYLE,
            credentials: env_1.env.EPUB_S3_ACCESS_KEY_ID && env_1.env.EPUB_S3_SECRET_ACCESS_KEY
                ? { accessKeyId: env_1.env.EPUB_S3_ACCESS_KEY_ID, secretAccessKey: env_1.env.EPUB_S3_SECRET_ACCESS_KEY }
                : undefined,
        });
    }
    return s3Client;
}
function bucketName() {
    if (!env_1.env.EPUB_S3_BUCKET)
        throw new Error('EPUB_S3_BUCKET est requis avec EPUB_STORAGE_DRIVER=s3');
    return env_1.env.EPUB_S3_BUCKET;
}
function objectKey(storageKey) {
    return `${env_1.env.EPUB_S3_PREFIX}/${storageKey}`.replace(/\/+/g, '/');
}
function localFilePath(storageKey) {
    return node_path_1.default.join(LOCAL_ROOT, storageKey);
}
function isNotFoundError(error) {
    return typeof error === 'object' && error !== null && 'name' in error && ['NoSuchKey', 'NotFound'].includes(String(error.name));
}
/** Réserve un chemin de fichier temporaire local pour construire une archive EPUB avant de la persister. */
async function reserveEpubBuildPath() {
    await (0, promises_1.mkdir)(BUILD_DIR, { recursive: true });
    return node_path_1.default.join(BUILD_DIR, `${(0, node_crypto_1.randomUUID)()}.epub`);
}
/** Déplace/téléverse un fichier EPUB construit localement vers le stockage durable configuré, puis supprime le fichier temporaire. */
async function persistEpubFile(buildFilePath, storageKey) {
    if (env_1.env.EPUB_STORAGE_DRIVER === 's3') {
        await getS3Client().send(new client_s3_1.PutObjectCommand({
            Bucket: bucketName(),
            Key: objectKey(storageKey),
            Body: (0, node_fs_1.createReadStream)(buildFilePath),
            ContentType: 'application/epub+zip',
        }));
        await (0, promises_1.rm)(buildFilePath, { force: true });
        return;
    }
    const destination = localFilePath(storageKey);
    await (0, promises_1.mkdir)(node_path_1.default.dirname(destination), { recursive: true });
    await (0, promises_1.rename)(buildFilePath, destination);
}
/** Ouvre un flux de lecture vers le fichier EPUB stocké, ou null s'il est introuvable. */
async function openEpubFile(storageKey) {
    if (env_1.env.EPUB_STORAGE_DRIVER === 's3') {
        try {
            const response = await getS3Client().send(new client_s3_1.GetObjectCommand({ Bucket: bucketName(), Key: objectKey(storageKey) }));
            if (!response.Body)
                return null;
            return { stream: response.Body, contentLength: response.ContentLength };
        }
        catch (error) {
            if (isNotFoundError(error))
                return null;
            throw error;
        }
    }
    const target = localFilePath(storageKey);
    try {
        const info = await (0, promises_1.stat)(target);
        return { stream: (0, node_fs_1.createReadStream)(target), contentLength: info.size };
    }
    catch {
        return null;
    }
}
async function epubFileExists(storageKey) {
    if (env_1.env.EPUB_STORAGE_DRIVER === 's3') {
        try {
            await getS3Client().send(new client_s3_1.HeadObjectCommand({ Bucket: bucketName(), Key: objectKey(storageKey) }));
            return true;
        }
        catch (error) {
            if (isNotFoundError(error))
                return false;
            throw error;
        }
    }
    try {
        await (0, promises_1.stat)(localFilePath(storageKey));
        return true;
    }
    catch {
        return false;
    }
}
async function deleteEpubFile(storageKey) {
    if (env_1.env.EPUB_STORAGE_DRIVER === 's3') {
        await getS3Client().send(new client_s3_1.DeleteObjectCommand({ Bucket: bucketName(), Key: objectKey(storageKey) }));
        return;
    }
    await (0, promises_1.rm)(localFilePath(storageKey), { force: true });
}
/** Supprime l'intégralité des fichiers EPUB stockés (utilitaire de nettoyage/tests). */
async function removeAllEpubFiles() {
    if (env_1.env.EPUB_STORAGE_DRIVER === 's3') {
        const client = getS3Client();
        const bucket = bucketName();
        let continuationToken;
        do {
            const page = await client.send(new client_s3_1.ListObjectsV2Command({ Bucket: bucket, Prefix: `${env_1.env.EPUB_S3_PREFIX}/`, ContinuationToken: continuationToken }));
            for (const object of page.Contents ?? []) {
                if (object.Key)
                    await client.send(new client_s3_1.DeleteObjectCommand({ Bucket: bucket, Key: object.Key }));
            }
            continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
        } while (continuationToken);
        return;
    }
    await (0, promises_1.rm)(LOCAL_ROOT, { recursive: true, force: true });
}
//# sourceMappingURL=epub-storage.js.map