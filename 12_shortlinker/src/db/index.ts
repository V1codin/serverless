import ExceptionHandler from '../lib/exceptionHandler.ts';

import { readFile, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DB_FILENAME } from '../constants.ts';

import type { TDb, Link, LinkHash } from '../types.ts';

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

  async getDataById(shortedLink: LinkHash): Promise<Link> | never {
    try {
      const db = await this.read();

      if (!(shortedLink in db)) {
        throw new ExceptionHandler('ID not found', 400);
      }

      return db[shortedLink as keyof TDb]!;
    } catch (e) {
      throw e;
    }
  }

  async safeCheckId(shortedLink: LinkHash) {
    try {
      const db = await this.read();
      return shortedLink in db;
    } catch (e) {
      throw new Error('DB error');
    }
  }

  async checkId(shortedLink: LinkHash) {
    try {
      const db = await this.read();
      if (shortedLink in db) {
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

  async write(url: Link, shortedLink: LinkHash) {
    try {
      await this.checkId(shortedLink);

      const db = await this.read();
      db[shortedLink] = url;

      await this.#write(this.#path, JSON.stringify(db));

      return shortedLink;
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
