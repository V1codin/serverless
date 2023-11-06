class IPTransformer {
  static convertIpToNumber(ip: string) {
    return (
      ip.split('.').reduce((acc, item) => {
        return (acc << 8) + parseInt(item, 10);
      }, 0) >>> 0
    );
  }

  static convertNumberToIp(number: number) {
    const result = `${number >>> 24}.${(number >> 16) & 255}.${
      (number >> 8) & 255
    }.${number & 255}`;

    return result;
  }
}

export default IPTransformer;
