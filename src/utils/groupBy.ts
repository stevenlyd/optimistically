import { QueryKey } from "@tanstack/react-query";

export const groupBy = <T extends object, I, P>(
  items: T[],
  getGroupId: (item: T) => string,
  getItemId: (item: T) => string,
  generateItem: (item: T) => I,
  generatePublicProperties: (item: T) => P
) => {
  return Array.from(
    items
      .reduce((acc, item) => {
        const groupId = getGroupId(item);
        const itemId = getItemId(item);
        const matchedGroup = acc.get(groupId);
        if (matchedGroup) {
          matchedGroup.itemsMap.set(itemId, generateItem(item));
        } else {
          const itemsMap = new Map<string, I>([[itemId, generateItem(item)]]);
          acc.set(groupId, { ...generatePublicProperties(item), itemsMap });
        }
        return acc;
      }, new Map<string, { itemsMap: Map<string, I> } & P>())
      .values()
  );
};

export const groupByQueryKey = <T extends object>(
  array: T[],
  getQueryKeyFn: (item: T) => QueryKey,
  getItemId: (item: T) => string
) => {
  return groupBy(
    array,
    (item) => JSON.stringify(getQueryKeyFn(item)),
    getItemId,
    (item) => item,
    (item) => ({ queryKey: getQueryKeyFn(item) })
  );
};
