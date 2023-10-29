import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE_NAME = 'db.json';
const TRANSFORMED_FILE_NAME = 'transformed.json';
const TRANSFORMED_PATH = resolve(__dirname, TRANSFORMED_FILE_NAME);

const users = JSON.parse(
  await readFile(DB_FILE_NAME, { encoding: 'utf8', flag: 'r' }),
);
const set = {};

for (let i = 0; i < users.length; i++) {
  const item = users[i];
  const id = item.user._id;
  if (set[id]) {
    set[id].vacations.push({
      startDate: item.startDate,
      endDate: item.endDate,
    });
  } else {
    set[id] = {
      userId: id,
      userName: item.user.name,
      vacations: [
        {
          startDate: item.startDate,
          endDate: item.endDate,
        },
      ],
    };
  }
}

await writeFile(TRANSFORMED_PATH, JSON.stringify(Object.values(set)));
