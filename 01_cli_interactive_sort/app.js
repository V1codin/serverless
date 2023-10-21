// with typescript it would be much easier to read and maintain :))
import { createInterface } from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';

const exitCheck = (answer) => answer.toLowerCase() === 'exit';

const STATES = {
  initial: {
    message: 'Hello. Enter 10 words or digits dividing them with spaces: ',
    callback: (dataMap) => async (answer) => {
      dataMap.clear();
      if (exitCheck(answer)) {
        return 'exit';
      }

      if (!answer.trim()) return 'initial';

      const data = [];
      let tempWord = '';

      for (let i = 0; i < answer.length; i++) {
        const char = answer[i];
        if (char !== ' ') {
          tempWord += char;
        } else {
          if (tempWord) {
            data.push(tempWord);
            tempWord = '';
          }
        }
      }

      if (tempWord) {
        data.push(tempWord);
      }

      dataMap.set('data', data);

      return 'sorting';
    },
  },
  output: {
    message: '',
    callback: () => async () => 'initial',
  },
  sorting: {
    handlers: [
      {
        description: 'Alphabetically',
        exec: (arrOfStrs) =>
          arrOfStrs.filter((item) => isNaN(Number(item))).sort(),
      },
      {
        description: 'Numbers from lesser to greater',
        exec: (arrOfStrs) =>
          arrOfStrs
            .filter((item) => !isNaN(Number(item)))
            .sort((a, b) => a - b),
      },
      {
        description: 'Numbers from bigger to smaller',
        exec: (arrOfStrs) =>
          arrOfStrs
            .filter((item) => !isNaN(Number(item)))
            .sort((a, b) => b - a),
      },
      {
        description:
          'Words in ascending order by number of letters in the word',
        exec: (arrOfStrs) =>
          arrOfStrs
            .filter((item) => isNaN(Number(item)))
            .sort((a, b) => a.length - b.length),
      },
      {
        description: 'Unique words',
        exec: (arrOfStrs) => {
          const set = {};
          const result = [];
          for (let i = 0; i < arrOfStrs.length; i++) {
            const word = arrOfStrs[i];
            if (!isNaN(Number(word)) || set[word]) continue;

            set[word] = true;
            result.push(word);
          }

          return result;
        },
      },
      {
        description: 'Unique values from the set of words and numbers',
        exec: (arrOfStrs) => {
          const set = {};
          const result = [];
          for (let i = 0; i < arrOfStrs.length; i++) {
            const word = arrOfStrs[i];
            if (set[word]) continue;

            set[word] = true;
            result.push(word);
          }

          return result;
        },
      },
    ],
    message: `
How would you like to sort values:
1. Sort words alphabetically
2. Show numbers from lesser to greater
3. Show numbers from bigger to smaller
4. Display words in ascending order by number of letters in the word
5. Show only unique words
6. Display only unique values from the set of words and numbers entered by the user
To exit the program, the user need to enter exit, otherwise the program will repeat itself again and again, asking for new data and suggesting sorting

Select (1 - 7) and press ENTER: `,
    callback: function (dataMap) {
      return async (answer) => {
        if (exitCheck(answer)) {
          return 'exit';
        }

        const data = dataMap.get('data');
        if (!data) return 'initial';

        const index = Number(answer) - 1;
        if (!this.handlers[index]) return 'initial';

        dataMap.set('output', this.handlers[index].exec(data));

        return 'output';
      };
    },
  },
  exit: {
    message: 'Good bye! Come back again!',
    callback: () => () => {},
  },
};

class CLI {
  #interface;
  constructor(input, output) {
    this.#interface = createInterface({
      input,
      output,
    });
  }

  async attachQuestion(rawText, isNewLined = false) {
    const text = isNewLined ? rawText + '\n' : rawText;

    try {
      const answer = await new Promise((resolve) => {
        this.#interface.question(text, (data) => {
          resolve(data);
        });
      });

      return answer;
    } catch (e) {
      console.error('attach question error', e);
    }
  }

  write(text) {
    console.log(text);
  }

  close(text = '') {
    this.write(text);
    this.#interface.close();
    process.exit();
  }
}

class App {
  constructor(states, cli) {
    this.states = states;
    this.current = states.initial;

    this.cli = cli;
    this.data = new Map();

    this.init();
  }

  async setCurrentMessage() {
    const message = this.current.message;
    const result = await this.cli.attachQuestion(message);

    const nextStateName = await this.current.callback(this.data)(result);
    this.setNextState(nextStateName);
  }

  async init() {
    await this.setCurrentMessage();
  }

  close() {
    this.cli.close(this.current.message);
  }

  async setNextState(stateName) {
    this.current = this.states[stateName];

    switch (stateName.toLowerCase()) {
      case 'exit': {
        this.close();
        return;
      }
      case 'output': {
        const data = this.data.get('output');
        this.cli.write(data);

        this.current = this.states.initial;
        break;
      }

      default:
        break;
    }

    await this.setCurrentMessage();
  }
}

const cli = new CLI(input, output);
new App(STATES, cli);
