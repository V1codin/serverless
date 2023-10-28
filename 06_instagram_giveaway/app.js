import { readdir, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, 'db');

console.time('Processing time');
const cache = {
  unique: 0,
  records: {},
  allFiles: {},
  atLeastTen: {},
};

const uniqueValues = (cache) => cache.unique;

const existInAllFiles = (cache) => {
  let result = 0;

  for (const _ in cache.allFiles) {
    result++;
  }

  return result;
};

const existInAtleastTen = (cache) => {
  let result = 0;

  for (const _ in cache.atLeastTen) {
    result++;
  }

  return result;
};

const fileNames = await readdir(DB_PATH);

for (let i = 0; i < fileNames.length; i++) {
  const filePath = `${DB_PATH}/${fileNames[i]}`;
  const file = await readFile(filePath, { encoding: 'utf8', flag: 'r' });
  const words = [...new Set(file.split(/\r?\n/))];

  for (let k = 0; k < words.length; k++) {
    const word = words[k];
    if (!cache.records[word]) {
      cache.records[word] = [filePath];
      cache.unique++;
    } else {
      if (cache.records[word][cache.records[word].length - 1] !== filePath) {
        cache.records[word].push(filePath);

        if (cache.records[word].length === 10) {
          cache.atLeastTen[word] = true;
        }
      }
    }

    if (i === fileNames.length - 1) {
      if (cache.records[word].length === fileNames.length) {
        cache.allFiles[word] = true;
      }
    }
  }
}

console.log('Unique values', uniqueValues(cache));
console.log('Exist in all files', existInAllFiles(cache));
console.log('Exist in atleast ten files', existInAtleastTen(cache));

console.timeEnd('Processing time');
