export const forEachItem = <T>(item: T | T[], callback: (item: T) => void) => {
  if (Array.isArray(item)) {
    item.forEach(callback);
  } else {
    callback(item);
  }
};
