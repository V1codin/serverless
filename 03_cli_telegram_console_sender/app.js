import TelegramBot from 'node-telegram-bot-api';

import { Command } from 'commander';

const API_KEY = process.env['TG_BOT_API_KEY'];
const CHAT_ID = process.env['CHAT_ID'];

const APP_NAME = 'Telegram CLI';
const APP_VERSION = '1.0.0';
const APP_DESCRIPTION = 'CLI application for Telegram Bot';

const CONFIG = {
  program: {
    name: APP_NAME,
    description: APP_DESCRIPTION,
    version: APP_VERSION,
  },

  // why? - for correct binding properties to exact command
  // commander and context should be typed and also implement the methods
  // commander.command etc
  // context.messageHandler etc
  commands: [
    (commander, context) => {
      commander
        .command('send-message')
        .alias('m')
        .argument('<message>')
        .description('Send message to Telegram Bot')
        .action(context.messageHandler.bind(context));

      return commander;
    },
    (commander, context) => {
      commander
        .command('send-photo')
        .alias('p')
        .argument('<path>')
        .description(
          'Send photo to Telegram Bot. Just drag and drop it to console after p-flag',
        )
        .action(context.photoHandler.bind(context));

      return commander;
    },
  ],
};

class App {
  #bot;
  #commander;

  constructor(TGBotApi, commander, commanderProps) {
    this.#bot = TGBotApi;
    this.#commander = commander;
    this.props = commanderProps;
  }

  getChatId() {
    return CHAT_ID;
  }

  exit() {
    process.exit();
  }

  async messageHandler(message) {
    const id = this.getChatId();
    try {
      await this.#bot.sendMessage(id, message);
      console.log('The message was sent');
    } catch (e) {
      console.error('Send message error', e);
    }

    this.exit();
  }

  async photoHandler(
    path,
    options = {},
    fileOptions = {
      contentType: 'image/jpeg',
    },
  ) {
    try {
      const id = this.getChatId();
      await this.#bot.sendPhoto(id, path, options, fileOptions);
      console.log('The photo was sent');
    } catch (e) {
      console.error('Send photo error', e);
    }

    this.exit();
  }

  #setProgramInfo() {
    this.#commander
      .name(this.props.program.name)
      .description(this.props.program.description)
      .version(this.props.program.version);
  }

  #setCommands() {
    this.props.commands.forEach((fn) => {
      fn(this.#commander, this);
    });
  }

  init() {
    this.#setProgramInfo();
    this.#setCommands();

    this.#commander.parse();
  }
}

const bot = new TelegramBot(API_KEY, { polling: true });

const commander = new Command();

new App(bot, commander, CONFIG).init();
