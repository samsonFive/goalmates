import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface ObjectStorage {
  put(bytes: Buffer, meta: { mimeType: string; originalName: string }): Promise<string>;
  get(key: string): Promise<Buffer>;
}

function uploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR ?? "./data/uploads");
}

export class LocalDiskStorage implements ObjectStorage {
  async put(bytes: Buffer, meta: { mimeType: string; originalName: string }) {
    const ext = path.extname(meta.originalName) || guessExt(meta.mimeType);
    const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
    const key = `${new Date().toISOString().slice(0, 10)}/${digest}-${randomUUID()}${ext}`;
    const full = path.join(uploadRoot(), key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, bytes);
    return key;
  }

  async get(key: string) {
    return readFile(path.join(uploadRoot(), key));
  }
}

function guessExt(mime: string) {
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "application/pdf") return ".pdf";
  return ".jpg";
}

export const storage: ObjectStorage = new LocalDiskStorage();
