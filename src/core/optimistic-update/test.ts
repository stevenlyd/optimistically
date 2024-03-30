import { QueryClient, QueryKey } from "@tanstack/react-query";
import { ItemOf } from "../types/types";

type OptimisticUpdateFnParams<Dto, QueryItem> = {
  payload: {
    data: Dto;
    getPayloadItemId: (item: ItemOf<Dto>) => string;
    getPayloadChildQueryKey?: (item: ItemOf<Dto>) => QueryKey
  },
  queryData: {
    getQueryItemId: (item: QueryItem) => string;
    getQueryItemChildQueryKey?: (item: QueryItem) => QueryKey;
  }
  queryClient: QueryClient;
  mainQueryKey: QueryKey;

};

export const testOptimisticUpdate = <T extends object | object[], D extends object | object[]>(
  params: OptimisticUpdateFnParams<T, D>
) => {
  // const { getUniqueId, optimisticData, queryClient, mainQueryKey, getChildQueryKeyFn } = params;
  // const normalizedData = Array.isArray(optimisticData) ? optimisticData : [optimisticData];
  // const previousData = structuredClone(queryClient.getQueryData<T[]>(mainQueryKey));
  // const rollbackFn = getRollbackFn({
  //   queryClient,
  //   previousData,
  //   mainQueryKey,
  //   getChildQueryKeyFn,
  // });
  // const dataMap = new Map<string, Partial<T>>(normalizedData.map((i) => [getUniqueId(i), i]));
  // queryClient.setQueryData(mainQueryKey, (oldItems: T | T[]) => {
  //   if (oldItems) {
  //     if (Array.isArray(oldItems)) {
  //       const updatedItems = mapItem(oldItems, (item) => {
  //         const uniqueId = getUniqueId(item);
  //         const matchedItem = dataMap.get(uniqueId);
  //         if (matchedItem) {
  //           return { ...item, ...matchedItem };
  //         }
  //         return item;
  //       });
  //       return updatedItems;
  //     } else if (!Array.isArray(optimisticData)) {
  //       return { ...oldItems, ...optimisticData };
  //     }
  //     throw new Error(`Data in query key:[${mainQueryKey}] is not an array`);
  //   }
  //   return oldItems;
  // });
  // const onSuccessFn = getOnSuccessFn({
  //   queryClient,
  //   mainQueryKey,
  //   getChildQueryKeyFn,
  //   optimisticData,
  //   getUniqueId,
  // });
  // const onSettledFn = getOnSettledFn({
  //   queryClient,
  //   mainQueryKey,
  //   getChildQueryKeyFn,
  //   optimisticData,
  // });
  // return { rollbackFn, onSuccessFn, onSettledFn };
};
