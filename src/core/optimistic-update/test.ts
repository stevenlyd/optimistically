import { QueryClient, QueryKey } from "@tanstack/react-query";
import { getRollbackFn } from "../utils/getRollbackFn";
import { mapItem } from "../utils/mapItem";
import { getOnSuccessFn } from "../utils/getOnSuccessFn";
import { getOnSettledFn } from "../utils/getOnSettledFn";

type OptimisticUpdateFnParams<Dto, QueryDataItem> = {
  payload: {
    data: Dto | Dto[];
    getItemId: (item: Dto) => string;
    getChildQueryKey?: (item: Dto) => QueryKey;
  };
  queryData: {
    getItemId: (item: QueryDataItem) => string;
    getChildQueryKey?: (item: QueryDataItem) => QueryKey;
  };
  queryClient: QueryClient;
  mainQueryKey: QueryKey;
};

export const testOptimisticUpdate = <
  Dto extends Object,
  QueryDataItem extends Object
>(
  params: OptimisticUpdateFnParams<Dto, QueryDataItem>
) => {
  const { payload, queryData, queryClient, mainQueryKey } = params;
  const {
    data: optimisticData,
    getItemId: getPayloadItemId,
    getChildQueryKey: getPayloadChildQueryKey,
  } = payload;
  const {
    getItemId: getQueryDataItemId,
    getChildQueryKey: getQueryDataChildQueryKey,
  } = queryData;

  const normalizedData = Array.isArray(optimisticData)
    ? optimisticData
    : [optimisticData];

  const previousData = structuredClone(
    queryClient.getQueryData<QueryDataItem[] | QueryDataItem>(mainQueryKey)
  );

  const rollbackFn = getRollbackFn({
    queryClient,
    previousData,
    mainQueryKey,
    getChildQueryKeyFn: getQueryDataChildQueryKey,
  });

  const dataMap = new Map<string, Partial<Dto>>(
    normalizedData.map((i: Dto) => [getPayloadItemId(i), i])
  );

  queryClient.setQueryData(
    mainQueryKey,
    (oldItems: QueryDataItem | QueryDataItem[]) => {
      if (oldItems) {
        if (Array.isArray(oldItems)) {
          const updatedItems = mapItem(oldItems, (item) => {
            const uniqueId = getQueryDataItemId(item);
            const matchedItem = dataMap.get(uniqueId);
            if (matchedItem) {
              return { ...item, ...matchedItem };
            }
            return item;
          });
          return updatedItems;
        } else if (!Array.isArray(optimisticData)) {
          return { ...oldItems, ...optimisticData };
        }
        throw new Error(`Data in query key:[${mainQueryKey}] is not an array`);
      }
      return oldItems;
    }
  );

  const onSuccessFn = (returnedData: QueryDataItem | QueryDataItem[]) => {
    const normalizedReturnData = Array.isArray(returnedData)
      ? returnedData
      : [returnedData];

    if (getQueryDataChildQueryKey) {
      normalizedReturnData.forEach((item) => {
        queryClient.setQueryData(getQueryDataChildQueryKey(item), item);
      });
    }

    queryClient.setQueryData(
      mainQueryKey,
      (oldItems: QueryDataItem | QueryDataItem[]) => {
        if (oldItems) {
          if (Array.isArray(oldItems)) {
            const optimisticDataMap = new Map<string, Dto>(
              normalizedData.map((i) => [getPayloadItemId(i), i])
            );

            const returnedDataMap = new Map<string, QueryDataItem>(
              normalizedReturnData.map((i) => [getQueryDataItemId(i), i])
            );

            const updatedItems = oldItems.map((item) => {
              const itemId = getQueryDataItemId(item);
              // Check if the item is in the original payload
              const returnedItem = !!optimisticDataMap.get(itemId)
                ? // Check if the item is in the returned data
                  returnedDataMap.get(itemId)
                : null;
              return returnedItem ?? item;
            });

            return updatedItems;
          } else if (
            !Array.isArray(returnedData) &&
            getQueryDataItemId(returnedData) === getQueryDataItemId(oldItems)
          ) {
            return returnedData;
          }
          throw new Error(
            `Cannot map returned data to query key:[${mainQueryKey}]`
          );
        }
        return oldItems;
      }
    );
  };

  const onSettledFn = getOnSettledFn({
    queryClient,
    mainQueryKey,
    getChildQueryKeyFn: getPayloadChildQueryKey,
    optimisticData,
  });

  return { rollbackFn, onSuccessFn, onSettledFn };
};
