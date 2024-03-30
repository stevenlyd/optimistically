type GetUpdateItemFnParams<T extends object> = {
  array: T[];
  item: Partial<T>;
  matchFn: (item: T) => boolean;
};

/**
 * Returns a function that update an item in an array based on a specified key-value pair match.
 * @template T - The type of the objects in the array.
 * @template K - The type of the key used for matching.
 * @param {GetUpdateItemFnParams<T, K>} params - The parameters for the function.
 * @param {T[]} params.array - The array to search for the item.
 * @param {Partial<T>} params.item - The item to update the matching item with.
 * @param {(item: T) => boolean} params.matchFn - The function used to determine if an item matches the specified condition.
 * @returns {{ itemExists: boolean, updateItemFn: (oldItems: T[] | undefined) => T[] | undefined }} - An object containing the information about the item existence and the updateitem function.
 */
export const getUpdateItemFn = <T extends object>(params: GetUpdateItemFnParams<T>) => {
  const { array, item, matchFn } = params;
  const index = array.findIndex(matchFn);

  const updateItemFn = <U extends T[] | undefined>(oldItems: U) => {
    if (oldItems) {
      const updatedItems = [...oldItems];
      updatedItems[index] = { ...oldItems[index], ...item };
      return updatedItems;
    }
    return oldItems;
  };
  return { itemExists: index !== -1, updateItemFn };
};
