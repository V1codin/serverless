export interface IPData {
  startNumber: number;
  startStr: string;

  endNumber: number;
  endStr: string;
  name: string;
  shortName: string;

  ipStart: string;
  ipEnd: string;
}

export type IPCache = IPData[];
export type RawCSVParsedData = [string, string, string, string];
