import { createReadStream } from 'node:fs';
import { mkdir, rename, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '../../config/env';

export interface EpubFileHandle {
  stream: NodeJS.ReadableStream;
  contentLength?: number;
}

const LOCAL_ROOT = path.isAbsolute(env.EPUB_STORAGE_DIR) ? env.EPUB_STORAGE_DIR : path.join(process.cwd(), env.EPUB_STORAGE_DIR);
const BUILD_DIR = path.join(os.tmpdir(), 'rabipek-epub-build');

let s3Client: S3Client | null = null;
function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: env.EPUB_S3_REGION,
      endpoint: env.EPUB_S3_ENDPOINT,
      forcePathStyle: env.EPUB_S3_FORCE_PATH_STYLE,
      credentials: env.EPUB_S3_ACCESS_KEY_ID && env.EPUB_S3_SECRET_ACCESS_KEY
        ? { accessKeyId: env.EPUB_S3_ACCESS_KEY_ID, secretAccessKey: env.EPUB_S3_SECRET_ACCESS_KEY }
        : undefined,
    });
  }
  return s3Client;
}

function bucketName() {
  if (!env.EPUB_S3_BUCKET) throw new Error('EPUB_S3_BUCKET est requis avec EPUB_STORAGE_DRIVER=s3');
  return env.EPUB_S3_BUCKET;
}

function objectKey(storageKey: string) {
  return `${env.EPUB_S3_PREFIX}/${storageKey}`.replace(/\/+/g, '/');
}

function localFilePath(storageKey: string) {
  return path.join(LOCAL_ROOT, storageKey);
}

function isNotFoundError(error: unknown) {
  return typeof error === 'object' && error !== null && 'name' in error && ['NoSuchKey', 'NotFound'].includes(String((error as { name: unknown }).name));
}

/** Réserve un chemin de fichier temporaire local pour construire une archive EPUB avant de la persister. */
export async function reserveEpubBuildPath(): Promise<string> {
  await mkdir(BUILD_DIR, { recursive: true });
  return path.join(BUILD_DIR, `${randomUUID()}.epub`);
}

/** Déplace/téléverse un fichier EPUB construit localement vers le stockage durable configuré, puis supprime le fichier temporaire. */
export async function persistEpubFile(buildFilePath: string, storageKey: string): Promise<void> {
  if (env.EPUB_STORAGE_DRIVER === 's3') {
    await getS3Client().send(new PutObjectCommand({
      Bucket: bucketName(),
      Key: objectKey(storageKey),
      Body: createReadStream(buildFilePath),
      ContentType: 'application/epub+zip',
    }));
    await rm(buildFilePath, { force: true });
    return;
  }

  const destination = localFilePath(storageKey);
  await mkdir(path.dirname(destination), { recursive: true });
  await rename(buildFilePath, destination);
}

/** Ouvre un flux de lecture vers le fichier EPUB stocké, ou null s'il est introuvable. */
export async function openEpubFile(storageKey: string): Promise<EpubFileHandle | null> {
  if (env.EPUB_STORAGE_DRIVER === 's3') {
    try {
      const response = await getS3Client().send(new GetObjectCommand({ Bucket: bucketName(), Key: objectKey(storageKey) }));
      if (!response.Body) return null;
      return { stream: response.Body as NodeJS.ReadableStream, contentLength: response.ContentLength };
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  const target = localFilePath(storageKey);
  try {
    const info = await stat(target);
    return { stream: createReadStream(target), contentLength: info.size };
  } catch {
    return null;
  }
}

export async function epubFileExists(storageKey: string): Promise<boolean> {
  if (env.EPUB_STORAGE_DRIVER === 's3') {
    try {
      await getS3Client().send(new HeadObjectCommand({ Bucket: bucketName(), Key: objectKey(storageKey) }));
      return true;
    } catch (error) {
      if (isNotFoundError(error)) return false;
      throw error;
    }
  }
  try {
    await stat(localFilePath(storageKey));
    return true;
  } catch {
    return false;
  }
}

export async function deleteEpubFile(storageKey: string): Promise<void> {
  if (env.EPUB_STORAGE_DRIVER === 's3') {
    await getS3Client().send(new DeleteObjectCommand({ Bucket: bucketName(), Key: objectKey(storageKey) }));
    return;
  }
  await rm(localFilePath(storageKey), { force: true });
}

/** Supprime l'intégralité des fichiers EPUB stockés (utilitaire de nettoyage/tests). */
export async function removeAllEpubFiles(): Promise<void> {
  if (env.EPUB_STORAGE_DRIVER === 's3') {
    const client = getS3Client();
    const bucket = bucketName();
    let continuationToken: string | undefined;
    do {
      const page = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: `${env.EPUB_S3_PREFIX}/`, ContinuationToken: continuationToken }));
      for (const object of page.Contents ?? []) {
        if (object.Key) await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: object.Key }));
      }
      continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (continuationToken);
    return;
  }
  await rm(LOCAL_ROOT, { recursive: true, force: true });
}
