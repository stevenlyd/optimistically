import { QueryClient, QueryKey } from "@tanstack/react-query";
import { ItemOf } from "../../types/types";
import { getRollbackFn } from "../../utils/getRollbackFn";
import { getReplaceItemFn } from "../../utils/getReplaceItemFn";

type OptimisticUpdateFnParams<T extends object | object[]> = {
  matchFn: (item: ItemOf<T>) => boolean;
  updateData: Partial<ItemOf<T>>;
  queryClient: QueryClient;
  queryKey: QueryKey;
};

/**
 * Updates the query data optimistically based on the provided parameters.
 * @template T - The expected type of the query data.
 * @param {OptimisticUpdateFnParams<T>} params - The parameters for the optimistic update.
 * @param {(item: ItemOf<T>) => boolean} params.matchFn - The function to match the item to be updated.
 * @param {Partial<ItemOf<T>>} params.updateData - The data to be updated.
 * @param {QueryClient} params.queryClient - The query client instance.
 * @param {QueryKey} params.queryKey - The query key for the data to be updated.
 * @returns {{ previousData: T extends object[] ? ItemOf<T>[] | undefined : ItemOf<T> | undefined, rollbackFn: () => void, onSucessFn: (returnedData: ItemOf<T>) => void }} - An object containing the previous data, rollback function, and success function.
 */
export const optimisticUpdate = <T extends object | object[]>(
  params: OptimisticUpdateFnParams<T>
) => {
  const { matchFn, updateData, queryClient, queryKey } = params;

  const items = queryClient.getQueryData<ItemOf<T> | ItemOf<T>[]>(queryKey);
  const previousData = structuredClone(items);

  let onSucessFn: (returnedData: ItemOf<T>) => void;

  if (Array.isArray(items)) {
    const { itemExists, replaceItemFn } = getReplaceItemFn({
      array: items,
      item: updateData,
      matchFn,
    });

    if (itemExists) {
      queryClient.setQueryData<ItemOf<T>[]>(queryKey, replaceItemFn);
    }

    onSucessFn = (returnedData) => {
      queryClient.setQueryData<ItemOf<T>[]>(queryKey, (oldItems) => {
        if (oldItems) {
          const { itemExists, replaceItemFn } = getReplaceItemFn({
            array: oldItems,
            item: returnedData,
            matchFn,
          });
          if (itemExists) {
            return replaceItemFn(oldItems);
          }
          return oldItems;
        }
      });
      queryClient.invalidateQueries({ queryKey });
    };
  } else {
    const singleItem = items;

    if (singleItem && matchFn(singleItem)) {
      queryClient.setQueryData<ItemOf<T>>(queryKey, () => ({ ...singleItem, ...updateData }));
    }

    onSucessFn = (returnedData) => {
      queryClient.setQueryData<ItemOf<T>>(queryKey, (oldItem) => {
        if (oldItem && matchFn(oldItem)) {
          return { ...oldItem, ...returnedData };
        }
        return oldItem;
      });
      queryClient.invalidateQueries({ queryKey });
    };
  }

  const rollbackFn = getRollbackFn({ queryClient, queryKey, previousData });

  return {
    previousData: previousData as T extends object[]
      ? ItemOf<T>[] | undefined
      : ItemOf<T> | undefined,
    rollbackFn,
    onSucessFn,
  };
};
