import express from 'express';
import dbHandler from './db/index.ts';
import ExceptionHandler from './lib/exceptionHandler.ts';

import { APP_HOST, APP_PORT, SERVER_ERROR_MESSAGE } from './constants.ts';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);

app.get('/location', async (req, res) => {
  try {
    const userIP = req.headers['x-forwarded-for'];
    if (!userIP) {
      throw new ExceptionHandler('Invalid IP', 400);
    }

    const { loc, ip } = await dbHandler.findByIp(userIP as string);
    const message = `${loc.name} - ${ip}`;

    return res.status(200).send({
      success: true,
      message,
    });
  } catch (e) {
    console.error('Location error', e);

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
