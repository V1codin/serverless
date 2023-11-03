import type { ClientConfig } from 'pg';
import type { JwtConfig, JwtAlgorithm, Data_NS } from './types';

export const DB_PORT = Number(process.env['SUPABASE_PORT']);
export const DB_HOST = process.env['SUPABASE_HOST'];
export const DB_PW = process.env['SUPABASE_PASSWORD'];
export const DB_USER = process.env['SUPABASE_USER'];
export const DB_NAME = process.env['SUPABASE_DB_NAME'];
export const LOCAL_PORT = Number(process.env['LOCAL_PORT']);

export const DB_CONFIG: ClientConfig = {
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PW,
  database: DB_NAME,
};

export const SALT = Number(process.env['SALT']);
export const JWT_SECRET = process.env['JWT_SECRET'] as string;
export const JWT_ALGORITHM = process.env['JWT_ALGORITHM'] as JwtAlgorithm;
export const JWT_EXPIRES_IN_SEC = Number(process.env['JWT_EXPIRES_IN_SEC']);

export const JWT_CONFIG: JwtConfig = {
  secret: JWT_SECRET,
  options: {
    algorithm: JWT_ALGORITHM,
  },
};

const EMAIL_STRING_MIN_LENGTH = 6;
const EMAIL_STRING_MAX_LENGTH = 48;

const PASSWORD_STRING_MIN_LENGTH = 4;
const PASSWORD_STRING_MAX_LENGTH = 32;

export const SIGN_IN_BODY_VALIDATION: Data_NS.SchemaValidation[] = [
  {
    data: 'email',
    type: 'string',
    min: EMAIL_STRING_MIN_LENGTH,
    max: EMAIL_STRING_MAX_LENGTH,
  },
  {
    data: 'password',
    type: 'string',
    min: PASSWORD_STRING_MIN_LENGTH,
    max: PASSWORD_STRING_MAX_LENGTH,
  },
];

export const SIGN_UP_BODY_VALIDATION: Data_NS.SchemaValidation[] = [
  {
    data: 'email',
    type: 'string',
    min: EMAIL_STRING_MIN_LENGTH,
    max: EMAIL_STRING_MAX_LENGTH,
  },
  {
    data: 'password',
    type: 'string',
    min: PASSWORD_STRING_MIN_LENGTH,
    max: PASSWORD_STRING_MAX_LENGTH,
  },
];

export const PROTECTED_ROUTES = [
  {
    path: '/me',
    method: 'GET',
  },
];
