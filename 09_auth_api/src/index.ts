import express from 'express';
import db from './db/index.ts';
import crypt from './lib/crypt.ts';
import ExceptionHandler from './lib/exceptionHandler.ts';

import authTokenMiddleware from './middlewares/authToken.ts';
import tokenHandler from './lib/jwt.ts';

import {
  JWT_EXPIRES_IN_SEC,
  LOCAL_PORT,
  SIGN_IN_BODY_VALIDATION,
  SIGN_UP_BODY_VALIDATION,
} from './constants.ts';

import type { API_Response_NS } from './types/index.ts';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authTokenMiddleware);

app.post('/auth/sign-in', async (req, res) => {
  try {
    const isValidBody = crypt.validateSchemaPrimitives(
      req.body,
      SIGN_IN_BODY_VALIDATION,
    );

    if (!isValidBody) {
      throw new ExceptionHandler('Invalid email or password', 404);
    }

    const body = req.body;
    const user = await db.getUserByEmail(body.email);

    if (!user) {
      throw new ExceptionHandler('Invalid email or password', 404);
    }

    const isValidPassword = crypt.compare(body.password, user.password);

    if (!isValidPassword) {
      throw new ExceptionHandler('Invalid email or password', 404);
    }

    const safeUserData = {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    };

    const accessToken = tokenHandler.encodeToken(safeUserData, {
      expiresIn: JWT_EXPIRES_IN_SEC,
    });
    const refresh_token = tokenHandler.encodeToken({
      id: user.id,
    });

    await db.addSession({
      user_id: user.id,
      refresh_token,
    });

    const response: API_Response_NS.SignInData = {
      success: true,
      data: {
        id: user.id,
        accessToken,
        refreshToken: refresh_token,
      },
    };

    return res.status(200).send(response);
  } catch (e) {
    console.error('Sign In error', e);

    if (e instanceof ExceptionHandler) {
      return res.status(e.statusCode).send({
        success: false,
        error: e.message,
      });
    }

    return res.status(500).send('Internal server error');
  }
});

app.post('/auth/sign-up', async (req, res) => {
  try {
    const isValidBody = crypt.validateSchemaPrimitives(
      req.body,
      SIGN_UP_BODY_VALIDATION,
    );

    if (!isValidBody) {
      throw new ExceptionHandler('Invalid email or password', 409);
    }

    const body = req.body;
    const userFromDB = await db.getUserByEmail(body.email);

    if (userFromDB) {
      throw new ExceptionHandler('User already exists', 409);
    }

    const hashedPassword = crypt.hash(body.password);

    const createdUser = await db.addUser({
      email: body.email,
      password: hashedPassword,
    });

    const safeUserData = {
      id: createdUser.id,
      email: createdUser.email,
      created_at: createdUser.created_at,
    };

    const accessToken = tokenHandler.encodeToken(safeUserData, {
      expiresIn: JWT_EXPIRES_IN_SEC,
    });
    const refresh_token = tokenHandler.encodeToken({
      id: createdUser.id,
    });

    await db.addSession({
      user_id: createdUser.id,
      refresh_token,
    });

    const response: API_Response_NS.SignUpData = {
      success: true,
      data: {
        id: createdUser.id,
        accessToken,
        refreshToken: refresh_token,
      },
    };

    return res.status(201).send(response);
  } catch (e) {
    console.error('Sign Up error', e);

    if (e instanceof ExceptionHandler) {
      return res.status(e.statusCode).send({
        success: false,
        error: e.message,
      });
    }

    return res.status(500).send('Internal server error');
  }
});

app.get('/me', async (req, res) => {
  try {
    const token = req.header('authorization')?.split(' ')[1];
    const decodedToken = tokenHandler.decodeToken(token);

    if (!decodedToken) {
      throw new ExceptionHandler('Invalid token', 401);
    }

    const user = await db.getUserByEmail(decodedToken['email']);

    if (!user) {
      throw new ExceptionHandler('User not found', 404);
    }

    return res.status(200).send({
      success: true,
      data: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (e) {
    console.error('Get user error', e);

    if (e instanceof ExceptionHandler) {
      return res.status(e.statusCode).send({
        success: false,
        error: e.message,
      });
    }

    return res.status(500).send('Internal server error');
  }
});

app.listen(LOCAL_PORT, () => {
  console.log(`http://localhost/${LOCAL_PORT}`);
});
