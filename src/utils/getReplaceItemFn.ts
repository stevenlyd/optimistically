export type GetReplaceItemFnParams<T extends object, K extends keyof T> = {
  array: T[];
  item: Partial<T>;
  matchFn: (item: T) => boolean;
};

/**
 * Returns a function that replaces an item in an array based on a specified key-value pair match.
 * @template T - The type of the objects in the array.
 * @template K - The type of the key used for matching.
 * @param {GetReplaceItemFnParams<T, K>} params - The parameters for the function.
 * @param {T[]} params.array - The array to search for the item.
 * @param {Partial<T>} params.item - The item to replace the matching item with.
 * @param {(item: T) => boolean} params.matchFn - The function used to determine if an item matches the specified condition.
 * @returns {{ itemExists: boolean, replaceItemFn: (oldItems: T[] | undefined) => T[] | undefined }} - An object containing the information about the item existence and the replace item function.
 */
export const getReplaceItemFn = <T extends object, K extends keyof T>(
  params: GetReplaceItemFnParams<T, K>
) => {
  const { array, item, matchFn } = params;
  const index = array.findIndex(matchFn);

  const replaceItemFn = <U extends T[] | undefined>(oldItems: U) => {
    if (oldItems) {
      const updatedItems = [...oldItems];
      updatedItems[index] = { ...oldItems[index], ...item };
      return updatedItems;
    }
    return oldItems;
  };
  return { itemExists: index !== -1, replaceItemFn };
};
