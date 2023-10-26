import { BotApi } from './botApi.js';

export class CurrencyApp extends BotApi {
  #fetcher;
  #config;
  #cache;

  constructor(TGBot, fetcherApi, config) {
    super(TGBot);

    this.#fetcher = fetcherApi;
    this.#config = config;
    this.#cache = {};

    this.#init();
  }

  getRates() {
    return {
      mono: this.#cache.mono,
      private: this.#cache.private,
    };
  }

  getKeyboard() {
    const keyboard = this.#config.avaliableCurrencies.map((item) => {
      return [item];
    });

    return keyboard;
  }

  formatCurrencyData(data, currency) {
    const mono = data.mono.reduce((acc, item) => {
      if (item.ccy === currency) {
        acc += `${item.ccy} -> ${item.base_ccy}\nКупівля: ${item.buy}\nПродаж: ${item.sale}\n`;
      }

      return acc;
    }, '');
    const privateBank = data.private.reduce((acc, item) => {
      if (item.ccy === currency) {
        acc += `${item.ccy} -> ${item.base_ccy}\nКупівля: ${item.buy}\nПродаж: ${item.sale}\n`;
      }

      return acc;
    }, '');

    return `Моно:\n${mono}\n\nПриватБанк:\n${privateBank}`;
  }

  #handleMonoResponse(response) {
    this.#cache['mono'] = response.reduce((acc, item) => {
      if (
        !(item.currencyCodeA in this.#config.isoCodes) ||
        !(item.currencyCodeB in this.#config.isoCodes)
      ) {
        return acc;
      }

      const currencyAStr = this.#config.isoCodes[item.currencyCodeA];
      const currencyBStr = this.#config.isoCodes[item.currencyCodeB];

      const toPush = {
        ccy: currencyAStr === 'USA' ? 'USD' : currencyAStr,
        base_ccy: currencyBStr === 'USA' ? 'USD' : currencyBStr,
        buy: item.rateBuy.toFixed(2),
        sale: item.rateSell.toFixed(2),
      };

      acc.push(toPush);

      return acc;
    }, []);
  }
  #handlePrivateResponse(response) {
    this.#cache['private'] = response.map((item) => {
      item.buy = item.buy.slice(0, 5);
      item.sale = item.sale.slice(0, 5);

      return item;
    });
  }

  async fetchData() {
    try {
      const monoResponse = await this.#fetcher.get(this.#config.monoEndpoint);
      const privateResponse = await this.#fetcher.get(
        this.#config.privatEndpoint,
      );

      this.#handleMonoResponse(monoResponse.data || []);
      this.#handlePrivateResponse(privateResponse.data || []);

      return this.getRates();
    } catch (e) {
      if (e.code === 'ERR_BAD_REQUEST') {
        return this.getRates();
      }
      console.error('Get rates error', e);
    }
  }

  #init() {
    setInterval(async () => {
      await this.fetchData();
    }, this.#config.refreshInterval);
  }

  attachCallback(fn) {
    const { callback, regexp } = fn(this, this.#config);
    super.attachCallback(regexp, callback);
  }

  attachCallbackByRegexp(regexp, fn) {
    const callback = fn(this, this.#config);
    super.attachCallbackByRegexp(regexp, callback);
  }
}
