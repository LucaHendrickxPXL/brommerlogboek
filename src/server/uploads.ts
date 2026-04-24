import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { AppError } from "@/server/app-errors";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const mimeToExtension = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type SupportedImageMimeType = keyof typeof mimeToExtension;
type UploadScope = "vehicles" | "trips";

export interface PreparedImageUpload {
  buffer: Buffer;
  mimeType: SupportedImageMimeType;
  extension: string;
  originalFilename: string | null;
  fileSizeBytes: number;
  widthPx: number | null;
  heightPx: number | null;
}

export interface StoredImageUpload extends PreparedImageUpload {
  absolutePath: string;
  storageKey: string;
}

function isSupportedMimeType(value: string): value is SupportedImageMimeType {
  return value in mimeToExtension;
}

function detectMimeTypeFromBuffer(buffer: Buffer): SupportedImageMimeType | null {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

function getPngDimensions(buffer: Buffer) {
  if (buffer.length < 24) {
    return {
      widthPx: null,
      heightPx: null,
    };
  }

  return {
    widthPx: buffer.readUInt32BE(16),
    heightPx: buffer.readUInt32BE(20),
  };
}

function sanitizeFilename(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value.replace(/[^\w.-]+/g, "_");
}

export function getUploadsRoot() {
  return path.resolve(
    process.env.UPLOADS_DIR ??
      path.join(/* turbopackIgnore: true */ process.cwd(), "storage", "uploads"),
  );
}

function ensureInsideUploadsRoot(targetPath: string) {
  const uploadsRoot = getUploadsRoot();
  const resolvedUploadsRoot = path.resolve(uploadsRoot);
  const resolvedTargetPath = path.resolve(targetPath);

  if (
    resolvedTargetPath !== resolvedUploadsRoot &&
    !resolvedTargetPath.startsWith(`${resolvedUploadsRoot}${path.sep}`)
  ) {
    throw new AppError({
      code: "STORAGE_PATH_INVALID",
      message: "Ongeldig uploadpad.",
    });
  }

  return resolvedTargetPath;
}

export async function prepareImageUpload(file: File | null | undefined) {
  if (!file || file.size === 0) {
    return null;
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new AppError({
      code: "UPLOAD_FILE_TOO_LARGE",
      message: "De foto is te groot. Gebruik een bestand tot 10 MB.",
      fieldErrors: {
        photo: "De foto is te groot. Gebruik een bestand tot 10 MB.",
      },
    });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedMimeType = detectMimeTypeFromBuffer(buffer);

  if (!detectedMimeType || !isSupportedMimeType(detectedMimeType)) {
    throw new AppError({
      code: "UPLOAD_FILE_TYPE_INVALID",
      message: "Gebruik een foto in jpg, png of webp.",
      fieldErrors: {
        photo: "Gebruik een foto in jpg, png of webp.",
      },
    });
  }

  const dimensions = detectedMimeType === "image/png"
    ? getPngDimensions(buffer)
    : { widthPx: null, heightPx: null };

  return {
    buffer,
    mimeType: detectedMimeType,
    extension: mimeToExtension[detectedMimeType],
    originalFilename: sanitizeFilename(file.name),
    fileSizeBytes: buffer.byteLength,
    widthPx: dimensions.widthPx,
    heightPx: dimensions.heightPx,
  } satisfies PreparedImageUpload;
}

export async function storePreparedImageUpload(
  scope: UploadScope,
  entityId: string,
  preparedUpload: PreparedImageUpload,
) {
  const filename = `${randomUUID()}.${preparedUpload.extension}`;
  const relativeSegments = [scope, entityId, filename];
  const absoluteDirectory = ensureInsideUploadsRoot(path.join(getUploadsRoot(), scope, entityId));
  const absolutePath = ensureInsideUploadsRoot(path.join(absoluteDirectory, filename));

  await fs.mkdir(absoluteDirectory, { recursive: true });
  await fs.writeFile(absolutePath, preparedUpload.buffer);

  return {
    ...preparedUpload,
    absolutePath,
    storageKey: `/api/uploads/${relativeSegments.join("/")}`,
  } satisfies StoredImageUpload;
}

export async function deleteStoredFileByStorageKey(storageKey: string | null | undefined) {
  if (!storageKey || !storageKey.startsWith("/api/uploads/")) {
    return;
  }

  const relativePath = storageKey.replace("/api/uploads/", "");
  const absolutePath = ensureInsideUploadsRoot(path.join(getUploadsRoot(), relativePath));

  await fs.rm(absolutePath, { force: true });
}

export function resolveUploadAbsolutePath(segments: string[]) {
  return ensureInsideUploadsRoot(path.join(getUploadsRoot(), ...segments));
}

export function getMimeTypeFromFilename(filename: string) {
  const extension = path.extname(filename).toLowerCase();

  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}
