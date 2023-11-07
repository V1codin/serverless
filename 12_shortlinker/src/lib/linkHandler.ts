import { URL } from 'url';

import {
  DEFAULT_MAX_SHORTENED_LINK_LENGTH,
  DEFAULT_SHUFLE_CYCLES,
  DEFAULT_VALID_PROTOCOLS,
} from '../constants.ts';

import type { Protocols } from '../types';

class LinkHandler {
  static getHash(
    max: number = DEFAULT_MAX_SHORTENED_LINK_LENGTH,
    epochs: number = DEFAULT_SHUFLE_CYCLES,
  ) {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    const arr: string[] = Array.from({ length: max }, (_, index) => {
      const max = characters.length;
      const min = index;
      const i = Math.floor(Math.random() * (max - min + 1)) + min;
      const char = characters[i] as string;
      return char;
    });

    for (let i = 0; i < epochs; i++) {
      LinkHandler.#shuffle(arr);
    }

    return arr.join('');
  }

  static #shuffle(array: string[]) {
    let i = array.length,
      j;
    while (i) {
      j = (Math.random() * i--) | 0;

      // @ts-ignore
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  static isValidUrl(
    link: string,
    protocols: Protocols = DEFAULT_VALID_PROTOCOLS,
  ) {
    try {
      const url = new URL(link);
      if (!url.protocol) return false;

      return protocols.map((x) => `${x.toLowerCase()}:`).includes(url.protocol);
    } catch (err) {
      return false;
    }
  }
}

export default LinkHandler;
