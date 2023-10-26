export class AxiosFetcher {
  #fetcher;

  constructor(fetcher) {
    this.#fetcher = fetcher;
  }

  get(url, queryParams) {
    return this.#fetcher.get(url, {
      params: queryParams,
    });
  }
}
