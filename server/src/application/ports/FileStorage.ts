import { Readable } from "node:stream";

export interface SavedFile {
  storedName: string;
  sizeBytes: number;
}

export interface FileStorage {
  save(bytes: Buffer, originalName: string): Promise<SavedFile>;
  read(storedName: string): Promise<Readable>;
  remove(storedName: string): Promise<void>;
}