import tokenHandler from '../lib/jwt.ts';

import { PROTECTED_ROUTES } from '../constants.ts';

import type { Request, Response, NextFunction } from 'express';

export default function (req: Request, res: Response, next: NextFunction) {
  const isValidRoute = PROTECTED_ROUTES.find((item) => {
    return item.method === req.method && item.path === req.path;
  });

  if (isValidRoute) {
    const header = req.headers['authorization'];

    if (header) {
      const str = header as string;
      const token = str.split(' ')[1];
      const isValidToken = tokenHandler.isValid(token);

      if (!isValidToken) {
        return res.status(401).send({
          success: false,
          message: 'Invalid token',
        });
      }
    }
  }

  return next();
}
