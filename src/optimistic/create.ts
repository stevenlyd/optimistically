import { QueryClient, QueryKey } from "@tanstack/react-query";
import { ItemOf } from "../types/types";
import { getRollbackFn } from "../utils/getRollbackFn";

type OptimisticCreateFnParams<T extends object | object[]> = {
  matchFn: (item: ItemOf<T>) => boolean;
  data: ItemOf<T>;
  queryClient: QueryClient;
  queryKey: QueryKey;
};

/**
 * Creates an optimistic update for a given resource by adding a new item to the existing data.
 * If the item already exists in the data, the update is not performed.
 *
 * @template T - The expected type of the query data.
 * @param {OptimisticCreateFnParams<T>} params - The parameters for the optimistic create operation.
 * @param {(item: ItemOf<T>) => boolean} params.matchFn - The function to match the item.
 * @param {ItemOf<T>} params.data - The data to be created.
 * @param {QueryClient} params.queryClient - The query client instance.
 * @param {QueryKey} params.queryKey - The query key for the data to be updated.
 * @returns {{ previousData: T extends object[] ? ItemOf<T>[] | undefined : ItemOf<T> | undefined, rollbackFn: () => void, onSuccessFn: (returnedData: ItemOf<T>) => void }} - An object containing the previous data, rollback function, and success function.
 */
export const optimisticCreate = <T extends object | object[]>(
  params: OptimisticCreateFnParams<T>
) => {
  const { matchFn, data, queryClient, queryKey } = params;
  const items = queryClient.getQueryData<ItemOf<T> | ItemOf<T>[]>(queryKey);
  const previousData = structuredClone(items);

  let onSuccessFn: (returnedData: ItemOf<T>) => void;

  if (Array.isArray(items)) {
    const index = items.findIndex(matchFn);

    if (index === -1) {
      queryClient.setQueryData<ItemOf<T>[]>(queryKey, (oldItems) => {
        if (oldItems) {
          return [...oldItems, data];
        }
        return [data];
      });
    }

    onSuccessFn = (returnedData) => {
      queryClient.setQueryData<ItemOf<T>[]>(queryKey, (oldItems) => {
        if (oldItems) {
          const index = oldItems.findIndex(matchFn);
          if (index !== -1) {
            const updatedItems = [...oldItems];
            updatedItems[index] = returnedData;
            return updatedItems;
          } else {
            return [...oldItems, returnedData];
          }
        }
        return oldItems;
      });

      queryClient.invalidateQueries({ queryKey });
    };
  } else {
    const singleItem = items;

    if (!singleItem || !matchFn(singleItem)) {
      queryClient.setQueryData<ItemOf<T>>(queryKey, data);
    }

    onSuccessFn = (returnedData) => {
      queryClient.setQueryData<ItemOf<T>>(queryKey, returnedData);
      queryClient.invalidateQueries({ queryKey });
    };
  }

  const rollbackFn = getRollbackFn({ queryClient, queryKey, previousData });

  return {
    previousData: previousData as T extends object[]
      ? ItemOf<T>[] | undefined
      : ItemOf<T> | undefined,
    rollbackFn,
    onSuccessFn,
  };
};
