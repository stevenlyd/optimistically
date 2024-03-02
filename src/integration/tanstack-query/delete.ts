import { QueryClient, QueryKey } from "@tanstack/react-query";
import { ItemOf } from "../../types/types";
import { getRollbackFn } from "../../utils/getRollbackFn";

type OptimisticDeleteFnParams<T extends object | object[]> = {
  matchFn: (item: ItemOf<T>) => boolean;
  queryClient: QueryClient;
  queryKey: QueryKey;
};

/**
 * Deletes an item from the query data in an optimistic way.
 * If the query data is an array, it removes the item that matches the given match function.
 * If the query data is an object, it sets the query data to undefined if it matches the given match function.
 * Returns the previous data and a rollback function.
 *
 * @template T - The type of the query data.
 * @param {OptimisticDeleteFnParams<T>} params - The parameters for the optimistic delete operation.
 * @param {(item: ItemOf<T>) => boolean} params.matchFn - The function to match the item to be deleted.
 * @param {QueryClient} params.queryClient - The query client instance.
 * @param {QueryKey} params.queryKey - The query key for the data to be updated.
 * @returns {{ previousData: T extends object[] ? ItemOf<T>[] | undefined : ItemOf<T> | undefined, rollbackFn: () => void }} - The previous data and a rollback function.
 */
export const optimisticDelete = <T extends object | object[]>(
  params: OptimisticDeleteFnParams<T>
) => {
  const { matchFn, queryClient, queryKey } = params;

  const items = queryClient.getQueryData<ItemOf<T> | ItemOf<T>[]>(queryKey);
  const previousData = structuredClone(items);

  if (Array.isArray(items)) {
    const index = items.findIndex(matchFn);

    if (index !== -1) {
      queryClient.setQueryData<ItemOf<T>[]>(queryKey, (oldItems) => {
        if (oldItems) {
          const updatedItems = [...oldItems];
          updatedItems.splice(index, 1);
          return updatedItems;
        }
        return oldItems;
      });
    }
  } else {
    const singleItem = items;

    if (singleItem && matchFn(singleItem)) {
      queryClient.setQueryData<ItemOf<T>>(queryKey, undefined);
    }
  }

  const onSuccessFn = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  const rollbackFn = getRollbackFn({ queryClient, queryKey, previousData });

  return {
    previousData: previousData as T extends object[]
      ? ItemOf<T>[] | undefined
      : ItemOf<T> | undefined,
    onSuccessFn,
    rollbackFn,
  };
};
