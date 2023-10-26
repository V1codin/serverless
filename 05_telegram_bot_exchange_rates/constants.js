export const CHAT_ID = process.env['CHAT_ID'];
export const WEATHER_API_KEY = process.env['WEATHER_API_KEY'];
export const END_POINT = `https://api.openweathermap.org/data/2.5/forecast?appid=${WEATHER_API_KEY}`;
export const CITY = 'Dnipro';
export const WEATHER_REPORTS_TO_DISPLAY = 5;
export const DEFAULT_WEATHER_INTERVAL = 10800;
export const BACK_TO_MAIN_MENU_MESSAGE = 'Повернутися до головного меню';

export const MONO_END_POINT = 'https://api.monobank.ua/bank/currency';
export const PRIVAT_END_POINT =
  'https://api.privatbank.ua/p24api/pubinfo?exchange&coursid=5';
export const REFRESH_EXCHANGE_INTERVAL = 300 * 1000;
export const CURRENCIES = ['USD', 'EUR'];

export const CURRENCY_CONFIG = {
  monoEndpoint: MONO_END_POINT,
  privatEndpoint: PRIVAT_END_POINT,
  refreshInterval: REFRESH_EXCHANGE_INTERVAL,
  chatId: CHAT_ID,
  isoCodes: {
    840: 'USA',
    980: 'UAH',
    978: 'EUR',
  },
  avaliableCurrencies: CURRENCIES,
  chooseCurrencyMessage: 'Оберіть валюту',
  fetchingFailMessage: 'Невдалося завантажити данні валют',
};

const WEATHER_MESSAGES = {
  fetchingFailMessage: 'Невдалося завантажити прогноз',
  isFetchingMessage: 'Йде обробка іншого запиту. Зачекайте',
  greetingMessage: 'Тут ви можете отримати данні о погоді у Вашому місті',
  chooseForecastIntervalMessage: 'Оберіть інтервал прогнозу',
};

export const WEATHER_CONFIG = {
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
  ...WEATHER_MESSAGES,
};

export const APP_CONFIG = {
  chatId: CHAT_ID,
  greetingMessage: 'Ласкаво просимо до чат-бота',
};
