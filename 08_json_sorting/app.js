const URLS = [
  'https://jsonbase.com/sls-team/json-793',
  'https://jsonbase.com/sls-team/json-955',
  'https://jsonbase.com/sls-team/json-231',
  'https://jsonbase.com/sls-team/json-931',
  'https://jsonbase.com/sls-team/json-93',
  'https://jsonbase.com/sls-team/json-342',
  'https://jsonbase.com/sls-team/json-770',
  'https://jsonbase.com/sls-team/json-491',
  'https://jsonbase.com/sls-team/json-281',
  'https://jsonbase.com/sls-team/json-718',
  'https://jsonbase.com/sls-team/json-310',
  'https://jsonbase.com/sls-team/json-806',
  'https://jsonbase.com/sls-team/json-469',
  'https://jsonbase.com/sls-team/json-258',
  'https://jsonbase.com/sls-team/json-516',
  'https://jsonbase.com/sls-team/json-79',
  'https://jsonbase.com/sls-team/json-706',
  'https://jsonbase.com/sls-team/json-521',
  'https://jsonbase.com/sls-team/json-350',
  'https://jsonbase.com/sls-team/json-64',
];
const REGEXP = /(\"isDone\":)(true|false)/gi;

const findIsDoneProps = (obj) => {
  const result = [0, 0];

  JSON.stringify(obj).replace(REGEXP, (_, __, isDone) => {
    result[Number(isDone === 'true')]++;
  });

  return result;
};

const init = async (urls) => {
  const result = [0, 0];
  try {
    const promises = urls.map(
      (item) =>
        new Promise((resolve, reject) => {
          fetch(item)
            .then((response) => {
              if (response.ok) {
                resolve(response.json());
              } else {
                reject('The endpoint is unavailable');
              }
            })
            .catch(() => reject('The endpoint is unavailable'));
        }),
    );

    const data = await Promise.allSettled(promises);
    data.forEach((item) => {
      if (item.status === 'fulfilled') {
        const [isNot, isDone] = findIsDoneProps(item.value);

        result[0] += isDone;
        result[1] += isNot;
      } else {
        console.log(item.reason);
      }
    });

    console.log(`Found True values: ${result[0]}`);
    console.log(`Found False values: ${result[1]}`);
  } catch (e) {
    console.error('Error', e);
  }
};

await init(URLS);
