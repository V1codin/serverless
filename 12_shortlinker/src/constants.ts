import type { Protocols } from './types.ts';

export const SERVER_ERROR_MESSAGE = 'Internal server error';
export const APP_PORT = Number(process.env['LOCAL_PORT']) || 3000;
export const APP_HOST = process.env['LOCAL_HOST'] || 'http://localhost';
export const DB_FILENAME = 'db.json';

export const DEFAULT_VALID_PROTOCOLS: Protocols = ['http', 'https'];
export const DEFAULT_MAX_SHORTENED_LINK_LENGTH = 8;
export const DEFAULT_SHUFLE_CYCLES = 15;
