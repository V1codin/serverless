import ExceptionHandler from '../lib/exceptionHandler.ts';
import IPTransformer from '../lib/ipHandler.ts';

import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DB_FILENAME } from '../constants.ts';

import type { IPCache, IPData, RawCSVParsedData } from '../types.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, DB_FILENAME);

type ReadFile = typeof readFile;

class DBHandler {
  #path: string;
  #read: ReadFile;

  #cache: IPCache = [];

  constructor(dbPath: string, readFile: ReadFile) {
    this.#path = dbPath;
    this.#read = readFile;
  }

  async findByIp(ip: string) {
    const number = IPTransformer.convertIpToNumber(ip);
    const element = await this.searchIpInCache(this.#cache, number);

    if ((element && element.name === '-') || !element) {
      throw new ExceptionHandler('Invalid IP', 400);
    }

    return {
      loc: element as IPData,
      ip,
    };
  }

  searchIpInCache(arr: IPCache, toFind: number): Promise<IPData | null> {
    return new Promise((resolve) => {
      let index = -1;
      let rightIndex = arr.length - 1;

      while (index <= rightIndex) {
        let mid = Math.floor((rightIndex + index) >> 1);

        const startRange = arr[mid]!.startNumber as number;
        const endRange = arr[mid]!.endNumber as number;

        if (startRange <= toFind && endRange >= toFind) {
          return resolve(arr[mid] as IPData);
        }

        if (startRange > toFind && endRange > toFind) {
          rightIndex = mid - 1;
        } else {
          index = mid + 1;
        }
      }

      resolve(null);
    });
  }

  async init() {
    try {
      const rawData = await this.#read(this.#path, 'utf8');
      const str = rawData.split(/\r?\n/);

      for (let i = 0; i < str.length; i++) {
        const item = str[i];
        if (!item) continue;

        const [rawStartRange, rawEndRange, rawShortName, rawName] = item!.split(
          ',',
        ) as RawCSVParsedData;

        const startRange = rawStartRange.trim().replace(/"/g, '');
        const endRange = rawEndRange.trim().replace(/"/g, '');
        const shortName = rawShortName.trim().replace(/"/g, '');
        const name = rawName.trim().replace(/"/g, '');

        const startNumber = parseInt(startRange, 10);
        const endNumber = parseInt(endRange, 10);

        const ipStart = IPTransformer.convertNumberToIp(startNumber);
        const ipEnd = IPTransformer.convertNumberToIp(endNumber);

        const toPush: IPData = {
          ipStart,
          ipEnd,
          name: name,
          shortName: shortName,
          startNumber,
          startStr: startRange,
          endNumber,
          endStr: endRange,
        };

        this.#cache.push(toPush);
      }
    } catch (e) {
      console.error('Parse CSV error', e);
    }
  }
}

const db = new DBHandler(dbPath, readFile);
await db.init();

export default db;
