export class BotApi {
  #bot;

  constructor(bot) {
    this.#bot = bot;
  }

  attachCallback(regexp, callback) {
    this.#bot.onText(regexp, callback);
  }

  attachCallbackByRegexp(regexp, callback) {
    this.#bot.onText(regexp, callback);
  }

  sendMessage(chatId, message, props) {
    return this.#bot.sendMessage(chatId, message, props);
  }
}
