import {
  writeFileSync,
  rmSync,
  createReadStream,
  mkdirSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { Readable } from "node:stream";
import type { FileStorage, SavedFile } from "../../application/ports/FileStorage.js";

export class LocalDiskFileStorage implements FileStorage {
  constructor(private dir: string) {
    mkdirSync(this.dir, { recursive: true });
  }

  async save(bytes: Buffer, originalName: string): Promise<SavedFile> {
    const ext = path.extname(originalName);
    const storedName = `${randomUUID()}${ext}`;
    writeFileSync(path.join(this.dir, storedName), bytes);
    return { storedName, sizeBytes: bytes.length };
  }

  async read(storedName: string): Promise<Readable> {
    return createReadStream(path.join(this.dir, storedName));
  }

  async remove(storedName: string): Promise<void> {
    rmSync(path.join(this.dir, storedName), { force: true });
  }
}