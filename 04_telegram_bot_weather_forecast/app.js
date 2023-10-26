import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const TG_API_KEY = process.env['TG_BOT_API_KEY'];
const CHAT_ID = process.env['CHAT_ID'];
const WEATHER_API_KEY = process.env['WEATHER_API_KEY'];

const END_POINT = `https://api.openweathermap.org/data/2.5/forecast?appid=${WEATHER_API_KEY}`;
const CITY = 'Dnipro';
const DEFAULT_WEATHER_INTERVAL = 10800;
const WEATHER_REPORTS_TO_DISPLAY = 5;

const MESSAGES = {
  fetchingFailMessage: 'Невдалося завантажити прогноз',
  isFetchingMessage: 'Йде обробка іншого запиту. Зачекайте',
  greetingMessage: 'Ласкаво просимо до чат-бота',
  chooseCityMessage:
    'Оберіть місто (Оберайте Дніпро, давайте, бо іншого вибору у Вас немає)',
  chooseForecastIntervalMessage: 'Оберіть інтервал прогнозу',
};

const CONFIG = {
  endpoint: END_POINT,
  numberToDisplay: WEATHER_REPORTS_TO_DISPLAY,
  chatId: CHAT_ID,
  requestParams: {
    q: CITY,
    lang: 'ua',
    units: 'metric',
  },
  forecastIntervals: [
    {
      time: DEFAULT_WEATHER_INTERVAL,
      message: '3 години',
    },
    {
      time: 21600,
      message: '6 годин',
    },
  ],
  city: CITY,
  cityDisplayLang: 'Дніпро',
  ...MESSAGES,
};

class AxiosFetcher {
  #fetcher;

  constructor(fetcher) {
    this.#fetcher = fetcher;
  }

  get(url, queryParams) {
    return this.#fetcher.get(url, {
      params: queryParams,
    });
  }
}

class WeatherApp {
  #bot;
  #fetcher;
  #config;
  #forecastInterval;
  #isFetching;

  constructor(TGBotApi, fetcherApi, config) {
    this.#bot = TGBotApi;
    this.#fetcher = fetcherApi;
    this.#config = config;
    this.#isFetching = false;

    this.#forecastInterval = DEFAULT_WEATHER_INTERVAL;

    this.#config.forecastMessage = `Прогноз для міста ${config.cityDisplayLang}`;
  }

  setForecastMessage(message) {
    this.#config.forecastMessage = message;
  }

  setForecastInterval(interval) {
    this.#forecastInterval = interval;
  }

  async fetchData() {
    if (this.#isFetching) {
      this.#bot.sendMessage(
        this.#config.chatId,
        this.#config.isFetchingMessage,
      );

      return;
    }
    this.#isFetching = true;

    try {
      const params = this.getRequestParams();
      const response = await this.#fetcher.get(this.#config.endpoint, params);

      if (!response.data || !response.data.list.length) {
        throw new Error('No response data');
      }

      return response.data.list;
    } catch (e) {
      console.error('Fetch error', e);
      throw e;
    } finally {
      this.#isFetching = false;
    }
  }

  getKeyboard() {
    return this.#config.forecastIntervals.map((item) => {
      return [item.message];
    });
  }

  getDateFromTimeStamp(timeStamp) {
    const date = new Date(timeStamp * 1000);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = '0' + date.getMinutes();
    const seconds = '0' + date.getSeconds();
    const time =
      hours +
      ':' +
      minutes.substring(minutes.length - 2) +
      ':' +
      seconds.substring(seconds.length - 2);

    return time;
  }

  getRequestParams(props = {}) {
    return {
      ...this.#config.requestParams,
      ...props,
    };
  }

  formatWeatherData(data) {
    let timeStamp = 0;
    let message = '';

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const temp = {
        timeStamp: item.dt,
        time: this.getDateFromTimeStamp(item.dt),
        temp: Math.round(item.main.temp),
        wind: item.wind.speed,
        desc: item.weather[0].description,
      };

      if (i === 0) {
        timeStamp = item.dt;

        message += `Time: ${temp.time}\nTemp: ${temp.temp}°C\nWind: ${temp.wind} м/с\nDescription: ${temp.desc}\n\n`;
        continue;
      }

      // filtering by time interval
      if (item.dt - timeStamp >= this.#forecastInterval) {
        timeStamp = item.dt;
        message += `Time: ${temp.time}\nTemp: ${temp.temp}°C\n Wind: ${temp.wind} м/с\nDescription: ${temp.desc}\n\n`;
      }
    }

    return message;
  }

  attachCallback(fn) {
    const { callback, regexp } = fn(this.#bot, this.#config);
    this.#bot.onText(regexp, callback);
  }

  attachCallbackByRegexp(regexp, fn) {
    const callback = fn(this.#bot, this.#config);
    this.#bot.onText(regexp, callback);
  }
}

const bot = new TelegramBot(TG_API_KEY, { polling: true });
const fetcher = new AxiosFetcher(axios);
const app = new WeatherApp(bot, fetcher, CONFIG);

app.attachCallbackByRegexp(/\/start/, (bot, config) => {
  return async () => {
    try {
      await bot.sendMessage(config.chatId, config.greetingMessage, {
        reply_markup: {
          keyboard: [['Погода']],
          one_time_keyboard: true,
        },
      });
    } catch (e) {
      console.error('On text callback error', e);
    }
  };
});

app.attachCallbackByRegexp(/погода/i, (bot, config) => {
  return async () => {
    try {
      const keyboardButtonText = config.forecastMessage;
      await bot.sendMessage(config.chatId, config.chooseCityMessage, {
        reply_markup: {
          keyboard: [[keyboardButtonText]],
          one_time_keyboard: true,
        },
      });
    } catch (e) {
      console.error('On text callback error', e);
    }
  };
});

app.attachCallback((bot, config) => {
  const regexp = new RegExp(config.forecastMessage);
  return {
    callback: async () => {
      try {
        const keyboard = app.getKeyboard();

        await bot.sendMessage(
          config.chatId,
          config.chooseForecastIntervalMessage,
          {
            reply_markup: {
              keyboard,
            },
          },
        );
      } catch (e) {
        console.error('Choose forecast interval error', e);
      }
    },
    regexp,
  };
});

CONFIG.forecastIntervals.forEach((item) => {
  const regex = new RegExp(item.message);
  app.attachCallbackByRegexp(regex, (bot, config) => {
    return async () => {
      try {
        app.setForecastInterval(item.time);
        const data = await app.fetchData();
        6;

        // for same number of elements for 3 hours and 6 hours of interval
        const numberToDisplay =
          (item.time / DEFAULT_WEATHER_INTERVAL) * config.numberToDisplay;

        const message = app.formatWeatherData(data.slice(0, numberToDisplay));
        const keyboard = app.getKeyboard();

        await bot.sendMessage(config.chatId, message, {
          reply_markup: {
            keyboard,
          },
        });
      } catch (e) {
        console.error('On text callback error', e);

        bot.sendMessage(config.chatId, config.fetchingFailMessage, {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      }
    };
  });
});
