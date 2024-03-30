import { QueryClient, QueryKey } from "@tanstack/react-query";
import { getRollbackFn } from "./getRollbackFn";
import { getOnSettledFn } from "./getOnSettledFn";

type OptimisticDeleteFnParams<T extends object> = {
  getUniqueId: (item: T) => string;
  data: T | T[];
  queryClient: QueryClient;
  mainQueryKey: QueryKey;
  getChildQueryKeyFn?: (item: T) => QueryKey;
};

export const optimisticDelete = <T extends object>(params: OptimisticDeleteFnParams<T>) => {
  const { getUniqueId, data, queryClient, mainQueryKey, getChildQueryKeyFn } = params;

  const previousData = structuredClone(queryClient.getQueryData<T[]>(mainQueryKey));

  const rollbackFn = getRollbackFn({
    queryClient,
    previousData,
    mainQueryKey,
    getChildQueryKeyFn,
  });

  const normalizedData = Array.isArray(data) ? data : [data];

  const dataMap = new Map<string, Partial<T>>(normalizedData.map((i) => [getUniqueId(i), i]));

  queryClient.setQueryData(mainQueryKey, (oldItems: T | T[]) => {
    if (oldItems) {
      if (Array.isArray(oldItems)) {
        const updatedItems = oldItems.filter((item) => {
          const uniqueId = getUniqueId(item);
          return !dataMap.has(uniqueId);
        });
        return updatedItems;
      } else if (
        !Array.isArray(data) &&
        typeof oldItems === "object" &&
        typeof data === "object" &&
        getUniqueId(oldItems) === getUniqueId(data)
      ) {
        return undefined;
      } else {
        console.error(`No data in query key:[${mainQueryKey}] matches the provided data`);
        return oldItems;
      }
    }
    return oldItems;
  });

  const onSettledFn = getOnSettledFn({
    queryClient,
    mainQueryKey,
    getChildQueryKeyFn,
    data,
  });

  return { rollbackFn, onSettledFn };
};
