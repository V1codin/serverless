import inquirer from 'inquirer';
import { writeFile, readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE_NAME = 'db.txt';
const DB_FILE_PATH = resolve(__dirname, DB_FILE_NAME);
const QUEUES = {
  initial: {
    type: 'input',
    name: 'user',
    message: "Enter the user's name. To cancel press ENTER: ",
  },
  add: [
    {
      type: 'list',
      name: 'gender',
      message: 'Choose your Gender: ',
      choices: ['male', 'female'],
    },
    {
      type: 'input',
      name: 'age',
      message: 'Enter your age: ',
      validate(input) {
        return !isNaN(input) || 'Input must be a number';
      },
    },
  ],
  find: {
    initial: {
      message: 'Would you search values in DB: ',
      type: 'confirm',
      name: 'isProceed',
    },
    queue: [
      {
        type: 'input',
        name: 'query',
        message: "Enter the user's name you wanna find in DB: ",
        validate(input) {
          return input.length > 0 || "Input can't be empty";
        },
      },
    ],
  },
};

class CLI {
  #api;

  constructor(inquirer) {
    this.#api = inquirer;
  }

  attachQuestion(promptProps) {
    return this.#api.prompt(promptProps);
  }

  write(text) {
    console.log(text);
  }

  close(text = '') {
    this.write(text);
    process.exit();
  }
}

class DB {
  #dbPath;

  constructor(dbPath) {
    this.#dbPath = dbPath;
  }

  async readDb(encoding = 'utf8') {
    try {
      const dbString = await readFile(this.#dbPath, encoding);
      const db = JSON.parse(dbString);

      return db;
    } catch (e) {
      console.error('Read DB error', e);

      throw e;
    }
  }

  async write(data) {
    try {
      const db = await this.readDb();

      const id = db.length + 1;
      data.id = id;

      db.push(data);

      await writeFile(this.#dbPath, JSON.stringify(db));

      return true;
    } catch (e) {
      console.error('Writing to DB error', e);

      throw e;
    }
  }
}

class App {
  #db;
  #cli;
  #addQueue;
  #findQueue;
  #initialQuery;
  #user;

  constructor(db, cli, queries) {
    this.#db = db;
    this.#cli = cli;

    this.#addQueue = queries.add;
    this.#findQueue = queries.find;

    this.#initialQuery = queries.initial;

    this.#user = null;
  }

  async #findQueueHandler() {
    const answer = await this.#cli.attachQuestion(this.#findQueue.initial);
    if (answer.isProceed) {
      try {
        const db = await this.#db.readDb();
        this.#cli.write(db);

        const queueToFind = this.#findQueue.queue;
        const userTofind = await this.#cli.attachQuestion(queueToFind);
        const user = db.find(
          (item) => item.user.toLowerCase() === userTofind.query.toLowerCase(),
        );

        if (user) {
          this.#cli.write(`User ${userTofind.query} was found.`);
          this.#cli.write(user);
        } else {
          this.#cli.write('There is no user with this name.');
        }
      } catch (e) {
        console.error('Finding user by name error', e);
      }
    }

    this.exit();
  }

  #setUser(answers) {
    const { user, gender, age } = answers;
    this.#user = { user, gender, age: Number(age) };
  }

  exit() {
    this.#cli.close('Good bye! Come back again!');
  }

  async init() {
    const initialAnswer = await this.#cli.attachQuestion(this.#initialQuery);

    const userName = initialAnswer.user.trim();
    if (userName === '') {
      return this.#findQueueHandler();
    }

    const rawAnswers = await this.#cli.attachQuestion(this.#addQueue);
    rawAnswers.user = userName;
    this.#setUser(rawAnswers);

    try {
      await this.#db.write(this.#user);
      this.#user = null;

      return this.init();
    } catch (e) {
      console.error('App error', e);
      this.exit();
    }
  }
}

const db = new DB(DB_FILE_PATH);
const cli = new CLI(inquirer);

new App(db, cli, QUEUES).init();
