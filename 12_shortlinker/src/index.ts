import express from 'express';
import ExceptionHandler from './lib/exceptionHandler.ts';
import db from './db/index.ts';
import LinkHandler from './lib/linkHandler.ts';

import { APP_HOST, APP_PORT, SERVER_ERROR_MESSAGE } from './constants.ts';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/:hash', async (req, res) => {
  try {
    const hash = req.params.hash;
    const isInDb = await db.safeCheckId(hash);

    if (!isInDb) {
      throw new ExceptionHandler('Link not found', 404);
    }

    const url = await db.getDataById(hash);

    return res.redirect(url);
  } catch (e) {
    console.error('Get link error', e);

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

app.post('/short', async (req, res) => {
  try {
    const body = req.body;
    const url = body.url;
    const isValidUrl = LinkHandler.isValidUrl(url);
    if (!isValidUrl) {
      throw new ExceptionHandler('Invalid url', 400);
    }

    let linkHash = LinkHandler.getHash();
    let isInDb = db.safeCheckId(linkHash);

    while (!isInDb) {
      linkHash = LinkHandler.getHash();
      isInDb = db.safeCheckId(linkHash);
    }

    await db.write(url, linkHash);

    const shortedLink = `${APP_HOST}:${APP_PORT}/${linkHash}`;

    return res.status(200).send({
      success: true,
      shortedLink,
    });
  } catch (e) {
    console.error('Post link error', e);

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
