export type UserJson = Record<string, any>;

export type Id = `${string}____id`;

export type TDb = {
  [key: Id]: UserJson;
};
