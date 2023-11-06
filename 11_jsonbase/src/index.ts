import express from 'express';
import ExceptionHandler from './lib/exceptionHandler.ts';
import db from './db/index.ts';

import { APP_HOST, APP_PORT, SERVER_ERROR_MESSAGE } from './constants.ts';

import type { UserJson } from './types.ts';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body as UserJson;

    await db.write(body, id);

    return res.status(200).send({
      success: true,
      data: id,
    });
  } catch (e) {
    console.error('Put json error', e);

    if (e instanceof ExceptionHandler) {
      return res.status(e.statusCode).send({
        success: false,
        error: e.message,
      });
    }

    return res.status(500).send({
      success: false,
      error: SERVER_ERROR_MESSAGE,
    });
  }
});

app.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const data = await db.getDataById(id);

    return res.status(200).send({
      success: true,
      data,
    });
  } catch (e) {
    console.error('Get json error', e);

    if (e instanceof ExceptionHandler) {
      return res.status(e.statusCode).send({
        success: false,
        error: e.message,
      });
    }

    return res.status(500).send({
      success: false,
      error: SERVER_ERROR_MESSAGE,
    });
  }
});

app.listen(APP_PORT, async () => {
  console.log(`${APP_HOST}:${APP_PORT}`);
});
