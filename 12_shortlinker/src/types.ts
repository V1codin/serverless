export type Link = string;
export type LinkHash = string;

export type TDb = {
  [key: LinkHash]: Link;
};

export type Protocols = ['http', 'https'];
