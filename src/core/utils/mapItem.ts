export const mapItem = <T, K>(item: T | T[], callback: (item: T) => K): K[] => {
  if (Array.isArray(item)) {
    return item.map(callback);
  } else {
    return [callback(item)];
  }
};
