import pg from 'pg';

import { DB_CONFIG } from '../constants.ts';

import type { Data_NS, User_NS } from '../types/index.ts';

class DBHandler {
  #pool: pg.Pool;
  #connect: pg.PoolClient | null = null;

  constructor(pool: pg.Pool) {
    this.#pool = pool;
  }

  #splitDataToKeyAndValues<T extends object>(data: T) {
    let keys = '';
    let values = '';

    Object.entries(data).forEach(([key, value], index, arr) => {
      const divider = index < arr.length - 1 ? ', ' : '';
      keys += `${key}${divider}`;
      values += `\'${value}\'${divider}`;
    });

    return {
      keys,
      values,
    };
  }

  #createUserQuery(userData: User_NS.Create) {
    const { keys, values } = this.#splitDataToKeyAndValues(userData);
    return `INSERT INTO public."users" (${keys}) VALUES (${values}) RETURNING *;`;
  }

  #createSessionQuery(session: Data_NS.Session) {
    const { keys, values } = this.#splitDataToKeyAndValues(session);

    return `INSERT INTO public."sessions" (${keys}) VALUES (${values}) RETURNING *;`;
  }

  #readUsersQuery() {
    return 'SELECT * FROM public."users"';
  }

  #readUserByEmailQuery(email: string) {
    return `SELECT * FROM public."users" WHERE email = '${email}';`;
  }

  async connect() {
    try {
      if (!this.#connect) {
        this.#connect = await this.#pool.connect();
      }
      return this;
    } catch (e) {
      throw new Error('DB connection error');
    }
  }

  async getUsers() {
    try {
      await this.connect();
      const response = await this.#connect!.query<User_NS.Read>(
        this.#readUsersQuery(),
      );

      if (!response) {
        throw new Error('DB error');
      }

      return response?.rows;
    } catch (e) {
      console.error('DB Get users error', e);

      throw new Error('DB error');
    }
  }

  async getUserByEmail(email: string) {
    try {
      await this.connect();
      const response = await this.#connect!.query<User_NS.Read>(
        this.#readUserByEmailQuery(email),
      );

      if (!response.rows[0]) {
        return null;
      }

      // [0] cause email is unique
      return response.rows[0];
    } catch (e) {
      console.error('DB Get user by email error', e);

      throw new Error('DB error');
    }
  }

  async addUser(userData: User_NS.Create) {
    try {
      await this.connect();
      const response = await this.#connect!.query<User_NS.Read>(
        this.#createUserQuery(userData),
      );

      if (!response.rows[0]) {
        throw new Error('DB error');
      }

      return response.rows[0];
    } catch (e) {
      console.error('Db Create user error', e);

      throw new Error('DB error');
    }
  }

  async addSession(session: Data_NS.Session) {
    try {
      await this.connect();
      const response = await this.#connect!.query(
        this.#createSessionQuery(session),
      );

      if (!response.rows[0]) {
        throw new Error('DB error');
      }

      return response.rows[0];
    } catch (e) {
      console.error('Db Create session error', e);

      throw new Error('DB query error');
    }
  }
}

const pool = new pg.Pool(DB_CONFIG);

const db = new DBHandler(pool);

export default db;
