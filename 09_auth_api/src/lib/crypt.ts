import bcrypt from 'bcrypt';

import { SALT } from '../constants.ts';

import type { Data_NS } from '../types/index.ts';

export type Bcrypt = typeof bcrypt;

class Crypt {
  #incrypter: Bcrypt;
  #salt: number;

  constructor(bcrypt: Bcrypt, salt: number) {
    this.#incrypter = bcrypt;
    this.#salt = salt;
  }

  hash(password: string) {
    return this.#incrypter.hashSync(password, this.#salt);
  }

  compare(password: string, hash: string) {
    return this.#incrypter.compareSync(password, hash);
  }

  // simple Zod alternative :)
  validateSchemaPrimitives(
    obj: Record<string, any>,
    props: Data_NS.SchemaValidation[],
  ) {
    return props.every((item) => {
      const prop = item.data;
      const toCheck = obj[prop];

      if (typeof toCheck !== typeof item.type) {
        return false;
      }

      if (typeof item.type === 'string') {
        if (toCheck.length > item.max || toCheck.length < item.min) {
          return false;
        }

        if (item.regexp) {
          if (!item.regexp.test(toCheck)) {
            return false;
          }
        }
      }

      if (typeof item.type === 'number') {
        if (toCheck > item.max || toCheck < item.min) return false;
      }

      return true;
    });
  }
}

const crypt = new Crypt(bcrypt, SALT);

export default crypt;
