import { QueryClient, QueryKey } from "@tanstack/react-query";
import { getRollbackFn } from "./getRollbackFn";
import { getOnSuccessFn } from "./getOnSuccessFn";
import { getOnSettledFn } from "./getOnSettledFn";

type OptimisticCreateFnParams<T extends object> = {
  getUniqueId: (item: T) => string;
  data: T | T[];
  queryClient: QueryClient;
  mainQueryKey: QueryKey;
  getChildQueryKeyFn?: (item: T) => QueryKey;
};

export const optimisticCreate= <T extends object>(params: OptimisticCreateFnParams<T>) => {
  const { getUniqueId, data, queryClient, mainQueryKey, getChildQueryKeyFn } = params;

  const previousData = structuredClone(queryClient.getQueryData<T[]>(mainQueryKey));

  const rollbackFn = getRollbackFn({
    queryClient,
    previousData,
    mainQueryKey,
    getChildQueryKeyFn,
  });

  const normalizedData = Array.isArray(data) ? data : [data];

  const dataMap = new Map<string, T>(normalizedData.map((i) => [getUniqueId(i), i]));
  queryClient.setQueryData<T[]>(mainQueryKey, (oldItems) => {
    if (oldItems) {
      if (!oldItems.some((item) => dataMap.has(getUniqueId(item)))) {
        return [...oldItems, ...normalizedData];
      } else {
        throw new Error("Item already exists in the array");
      }
    }
    return oldItems;
  });

  const onSuccessFn = getOnSuccessFn({
    queryClient,
    mainQueryKey,
    getChildQueryKeyFn,
    data,
    getUniqueId,
  });

  const onSettledFn = getOnSettledFn({
    queryClient,
    mainQueryKey,
    getChildQueryKeyFn,
    data,
  });

  return { rollbackFn, onSuccessFn, onSettledFn };
};
