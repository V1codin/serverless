import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

import { AxiosFetcher } from './fetcher.js';
import { WeatherApp } from './weather.js';
import { CurrencyApp } from './currency.js';
import {
  WEATHER_CONFIG,
  DEFAULT_WEATHER_INTERVAL,
  APP_CONFIG,
  BACK_TO_MAIN_MENU_MESSAGE,
  CURRENCY_CONFIG,
  CURRENCIES,
} from './constants.js';

const TG_API_KEY = process.env['TG_BOT_API_KEY'];

const bot = new TelegramBot(TG_API_KEY, { polling: true });
const fetcher = new AxiosFetcher(axios);
const weather = new WeatherApp(bot, fetcher, WEATHER_CONFIG);
const exchange = new CurrencyApp(bot, fetcher, CURRENCY_CONFIG);

class App {
  #weatherApp;
  #exchangeApp;
  #config;
  #bot;
  #isWeatherInit;
  #isExchangeInit;

  constructor(bot, weatherApp, exchangeApp, appConfig) {
    this.#bot = bot;
    this.#weatherApp = weatherApp;
    this.#exchangeApp = exchangeApp;
    this.#config = appConfig;

    this.#isWeatherInit = false;
    this.#isExchangeInit = false;
  }

  #initWeatherApp() {
    this.#weatherApp.attachCallbackByRegexp(/погода/i, (app, config) => {
      return async () => {
        try {
          const keyboard = app.getKeyboard();
          keyboard.push([BACK_TO_MAIN_MENU_MESSAGE]);

          await app.sendMessage(
            config.chatId,
            config.chooseForecastIntervalMessage,
            {
              reply_markup: {
                keyboard,
                resize_keyboard: false,
              },
            },
          );
        } catch (e) {
          console.error('Choose forecast interval error', e);
        }
      };
    });

    WEATHER_CONFIG.forecastIntervals.forEach((item) => {
      const regex = new RegExp(item.message);
      this.#weatherApp.attachCallbackByRegexp(regex, (app, config) => {
        return async () => {
          try {
            app.setForecastInterval(item.time);
            const data = await app.fetchData();

            // for same number of elements for 3 hours and 6 hours of interval
            const numberToDisplay =
              (item.time / DEFAULT_WEATHER_INTERVAL) * config.numberToDisplay;

            const message = app.formatWeatherData(
              data.slice(0, numberToDisplay),
            );

            const keyboard = app.getKeyboard();
            keyboard.push([BACK_TO_MAIN_MENU_MESSAGE]);

            await app.sendMessage(config.chatId, message, {
              reply_markup: {
                keyboard,
                resize_keyboard: false,
              },
            });
          } catch (e) {
            console.error('On text callback error', e);

            app.sendMessage(config.chatId, config.fetchingFailMessage, {
              reply_markup: {
                remove_keyboard: true,
              },
            });
          }
        };
      });
    });

    this.#isWeatherInit = true;
  }

  #initExchangeApp() {
    this.#exchangeApp.attachCallbackByRegexp(/курс валют/i, (app, config) => {
      return async () => {
        try {
          const keyboard = app.getKeyboard();
          keyboard.push([BACK_TO_MAIN_MENU_MESSAGE]);

          await app.sendMessage(config.chatId, config.chooseCurrencyMessage, {
            reply_markup: {
              keyboard,
              resize_keyboard: false,
            },
          });
        } catch (e) {
          console.error('On text callback error', e);
        }
      };
    });

    CURRENCIES.forEach((item) => {
      const regex = new RegExp(item);

      this.#exchangeApp.attachCallbackByRegexp(regex, (app, config) => {
        return async () => {
          try {
            const data = await app.fetchData();
            const message = app.formatCurrencyData(data, item);

            const keyboard = app.getKeyboard();
            keyboard.push([BACK_TO_MAIN_MENU_MESSAGE]);

            app.sendMessage(config.chatId, message, {
              reply_markup: {
                keyboard,
                resize_keyboard: false,
              },
            });
          } catch (e) {
            console.error('On text callback error', e);

            app.sendMessage(config.chatId, config.fetchingFailMessage, {
              reply_markup: {
                remove_keyboard: true,
              },
            });
          }
        };
      });
    });

    this.#isExchangeInit = true;
  }

  init() {
    const startRegexp = new RegExp(`${BACK_TO_MAIN_MENU_MESSAGE}|\/start`);
    this.#bot.onText(startRegexp, async () => {
      try {
        if (!this.#isWeatherInit && !this.#isExchangeInit) {
          return;
        }

        const keyboard = [
          [
            this.#isWeatherInit ? 'Погода' : '',
            this.#isExchangeInit ? 'Курс валют' : '',
          ],
        ];
        await this.#bot.sendMessage(
          this.#config.chatId,
          this.#config.greetingMessage,
          {
            reply_markup: {
              keyboard,
              resize_keyboard: false,
            },
          },
        );
      } catch (e) {
        console.error('On text callback error', e);
      }
    });

    this.#initWeatherApp();
    this.#initExchangeApp();
  }
}

new App(bot, weather, exchange, APP_CONFIG).init();
