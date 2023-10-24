import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const TG_API_KEY = process.env['TG_BOT_API_KEY'];
const CHAT_ID = process.env['CHAT_ID'];
const WEATHER_API_KEY = process.env['WEATHER_API_KEY'];

const END_POINT = `https://api.openweathermap.org/data/2.5/forecast?appid=${WEATHER_API_KEY}`;
const CITY = 'Dnipro';
const DEFAULT_WEATHER_INTERVAL = 10800;
const WEATHER_REPORTS_TO_DISPLAY = 5;

const CONFIG = {
  endpoint: END_POINT,
  numberToDisplay: WEATHER_REPORTS_TO_DISPLAY,
  chatId: CHAT_ID,
  fetchingFailMessage: 'Weather forecast fetching failed',
  isFetchingMessage: 'There is another call to process. Please wait',
  greetingMessage: 'Welcome to weather chat bot',
  chooseForecastIntervalMessage: 'Choose forecast interval',
  requestParams: {
    q: CITY,
    lang: 'ua',
    units: 'metric',
  },
  forecastIntervals: [
    {
      time: DEFAULT_WEATHER_INTERVAL,
      message: 'Get weather forecast with 3 hours range',
    },
    {
      time: 21600,
      message: 'Get weather forecast with 6 hours range',
    },
  ],
  city: CITY,
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

class App {
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

    this.forecastMessage = `Forecast ${config.city}`;
  }

  #getKeyboard() {
    return this.#config.forecastIntervals.map((item) => {
      return [item.message];
    });
  }

  async #fetchData() {
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

  #attachIntervalChoicesClick() {
    this.#config.forecastIntervals.forEach((item) => {
      const regex = new RegExp(item.message);

      this.#bot.onText(regex, async () => {
        try {
          this.#forecastInterval = item.time;
          const data = await this.#fetchData();

          // for same number of elements for 3 hours and 6 hours of interval
          const numberToDisplay =
            (this.#forecastInterval / DEFAULT_WEATHER_INTERVAL) *
            this.#config.numberToDisplay;

          const message = this.formatWeatherData(
            data.slice(0, numberToDisplay),
          );

          await this.#bot.sendMessage(this.#config.chatId, message, {
            reply_markup: {
              remove_keyboard: true,
            },
          });
        } catch (e) {
          console.error('On text callback error', e);

          this.#bot.sendMessage(
            this.#config.chatId,
            this.#config.fetchingFailMessage,
            {
              reply_markup: {
                remove_keyboard: true,
              },
            },
          );
        }
      });
    });
  }

  #attachStartButtonClick() {
    const regex = new RegExp(this.forecastMessage);

    this.#bot.onText(regex, async () => {
      try {
        const keyboard = this.#getKeyboard();

        await this.#bot.sendMessage(
          this.#config.chatId,
          this.#config.chooseForecastIntervalMessage,
          {
            reply_markup: {
              keyboard,
            },
          },
        );
      } catch (e) {
        console.error('Choose forecast interval error', e);
      }
    });
  }

  #attachStartCallback() {
    this.#bot.onText(/\/start/, async () => {
      try {
        const keyboardButtonText = this.forecastMessage;
        await this.#bot.sendMessage(
          this.#config.chatId,
          this.#config.greetingMessage,
          {
            reply_markup: {
              keyboard: [[keyboardButtonText]],
              one_time_keyboard: true,
            },
          },
        );
      } catch (e) {
        console.error('On text callback error', e);
      }
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

  init() {
    this.#bot.on('polling_error', (error) => {
      console.error('Bot polling error', error);

      this.#bot.startPolling({ restart: true });
    });

    this.#attachIntervalChoicesClick();
    this.#attachStartCallback();
    this.#attachStartButtonClick();
  }
}

const bot = new TelegramBot(TG_API_KEY, { polling: true });
const fetcher = new AxiosFetcher(axios);

new App(bot, fetcher, CONFIG).init();
