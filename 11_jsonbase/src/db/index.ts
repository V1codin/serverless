import ExceptionHandler from '../lib/exceptionHandler.ts';

import { readFile, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DB_FILENAME } from '../constants.ts';

import type { Id, TDb, UserJson } from '../types.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, DB_FILENAME);

type ReadFile = typeof readFile;
type WriteFile = typeof writeFile;

class DBHandler {
  #path: string;
  #read: ReadFile;
  #write: WriteFile;

  constructor(dbPath: string, readFile: ReadFile, writeFile: WriteFile) {
    this.#path = dbPath;
    this.#read = readFile;
    this.#write = writeFile;
  }

  #createId(id: string) {
    return `${id}____id` as Id;
  }

  async getDataById(rawId: string): Promise<UserJson> | never {
    try {
      const db = await this.read();
      const id = this.#createId(rawId);

      if (!(id in db)) {
        throw new ExceptionHandler('ID not found', 400);
      }

      return db[id as keyof TDb]!;
    } catch (e) {
      throw e;
    }
  }

  async checkId(id: Id) {
    try {
      const db = await this.read();
      if (id in db) {
        throw new ExceptionHandler('ID already exists', 409);
      }

      return true;
    } catch (e) {
      throw e;
    }
  }

  async read() {
    try {
      const data = await this.#read(this.#path, 'utf8');
      const parsed = JSON.parse(data) as TDb;

      return parsed;
    } catch (e) {
      console.log('Read DB error', e);

      throw new Error('Read DB error');
    }
  }

  async write(data: UserJson, rawId: string) {
    try {
      const id = this.#createId(rawId);
      await this.checkId(id);

      const db = await this.read();
      db[id] = data;

      await this.#write(this.#path, JSON.stringify(db));

      return rawId;
    } catch (e) {
      console.error('Write to DB error', e);

      if (e instanceof ExceptionHandler) {
        throw e;
      }

      throw new Error('Write to DB error');
    }
  }
}

const db = new DBHandler(dbPath, readFile, writeFile);

export default db;
