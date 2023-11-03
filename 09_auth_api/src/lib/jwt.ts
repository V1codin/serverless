import jwt from 'jsonwebtoken';

import { JWT_CONFIG } from '../constants.ts';

import type { SignOptions } from 'jsonwebtoken';
import type { JwtConfig } from '../types/index.ts';

export type Jwt = typeof jwt;

class JwtHandler {
  #handler: Jwt;
  #config: JwtConfig;

  constructor(jwt: Jwt, config: JwtConfig) {
    this.#handler = jwt;
    this.#config = config;
  }

  isValid(token: string | undefined) {
    if (!token) return false;
    try {
      const result = this.decodeToken(token);

      if (!result) return false;

      return Date.now() <= result.exp! * 1000;
    } catch (e) {
      return false;
    }
  }

  encodeToken(obj: Record<string, any>, options: SignOptions = {}) {
    const opts = {
      ...this.#config.options,
      ...options,
    };
    return this.#handler.sign(obj, this.#config.secret, opts);
  }

  decodeToken(token: string | undefined) {
    if (!token) return null;

    return this.#handler.decode(token, {
      json: true,
    });
  }
}

const tokenHandler = new JwtHandler(jwt, JWT_CONFIG);

export default tokenHandler;
