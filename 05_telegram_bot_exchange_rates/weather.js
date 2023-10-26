import { BotApi } from './botApi.js';
import { DEFAULT_WEATHER_INTERVAL } from './constants.js';

export class WeatherApp extends BotApi {
  #fetcher;
  #config;
  #forecastInterval;
  #isFetching;

  constructor(TGBot, fetcherApi, config) {
    super(TGBot, config);

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
      this.sendMessage(this.#config.chatId, this.#config.isFetchingMessage);

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
    const keyboard = this.#config.forecastIntervals.map((item) => {
      return [item.message];
    });

    return keyboard;
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
    let message = this.#config.forecastMessage + '\n\n';

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
        message += `Time: ${temp.time}\nTemp: ${temp.temp}°C\nWind: ${temp.wind} м/с\nDescription: ${temp.desc}\n\n`;
      }
    }

    return message;
  }

  attachCallback(fn) {
    const { callback, regexp } = fn(this, this.#config);
    super.attachCallback(regexp, callback);
  }

  attachCallbackByRegexp(regexp, fn) {
    const callback = fn(this, this.#config);
    super.attachCallbackByRegexp(regexp, callback);
  }

  sendMessage(chatId, message, props) {
    return super.sendMessage(chatId, message, props);
  }
}
