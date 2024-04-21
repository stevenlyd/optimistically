import { QueryClient, QueryKey } from "@tanstack/react-query";
import { groupBy, groupByQueryKey } from "../utils/groupBy";
import { OptimisticItem } from "../utils/OptimisticItem";
import { getRollbackFn } from "../utils/getRollbackFn";

type OptimisticUpdateFnParams<
  QueryDataItem extends object,
  Dto extends Partial<QueryDataItem>,
  Metadata extends object
> = {
  optimisticData: {
    data: OptimisticItem<Dto, Metadata> | OptimisticItem<Dto, Metadata>[];
    getItemId: (item: Dto & Metadata) => string;
    getQueryKey: (item: Dto & Metadata) => QueryKey;
    getChildQueryKey?: (item: Dto & Metadata) => QueryKey;
  };
  queryData: {
    getItemId: (item: QueryDataItem) => string;
    getQueryKey: (item: QueryDataItem) => QueryKey;
    getChildQueryKey?: (item: QueryDataItem) => QueryKey;
  };
  queryClient: QueryClient;
};

export const optimisticUpdate = <
  QueryDataItem extends Object,
  Dto extends Partial<QueryDataItem>,
  Metadata extends object
>(
  params: OptimisticUpdateFnParams<QueryDataItem, Dto, Metadata>
) => {
  const { optimisticData, queryData, queryClient } = params;
  const {
    data: optimisticItems,
    getItemId: getOptimisticItemId,
    getChildQueryKey: getOptimisticChildQueryKey,
    getQueryKey: getOptimisticQueryKey,
  } = optimisticData;
  const {
    getItemId: getQueryDataItemId,
    getChildQueryKey: getQueryDataChildQueryKey,
    getQueryKey: getQueryDataQueryKey,
  } = queryData;

  const normalizedItems = Array.isArray(optimisticItems) ? optimisticItems : [optimisticItems];

  const organizedItems = groupBy(
    normalizedItems,
    (item) => JSON.stringify(getOptimisticQueryKey(item.fullItem)),
    (item) => getOptimisticItemId(item.fullItem),
    (item) => item,
    (item) => ({
      queryKey: getOptimisticQueryKey(item.fullItem),
    })
  );

  const { rollbackFns, onSettledFns } = organizedItems.reduce(
    (
      obj: {
        rollbackFns: (() => void)[];
        onSettledFns: (() => void)[];
      },
      { queryKey, itemsMap }
    ) => {
      const rollbackFn = getRollbackFn({
        queryClient,
        queryKeys: [
          queryKey,
          ...(getOptimisticChildQueryKey
            ? Array.from(itemsMap.values()).map((item) => getOptimisticChildQueryKey(item.fullItem))
            : []),
        ],
      });

      obj.rollbackFns.push(rollbackFn);

      if (getOptimisticChildQueryKey) {
        itemsMap.forEach((i) => {
          queryClient.setQueryData(getOptimisticChildQueryKey(i.fullItem), i.value);
        });
      }

      queryClient.setQueryData(queryKey, (oldItems: QueryDataItem | QueryDataItem[]) => {
        if (oldItems) {
          if (Array.isArray(oldItems)) {
            const updatedItems = oldItems.map((i) => {
              const itemId = getQueryDataItemId(i);
              const matchedItem = itemsMap.get(itemId);
              if (matchedItem) {
                return { ...i, ...matchedItem.value };
              }
              return i;
            });

            return updatedItems;
          }
          const itemId = getQueryDataItemId(oldItems);
          if (itemsMap.has(itemId)) {
            return { ...oldItems, ...itemsMap.get(itemId)?.value };
          }
          throw new Error(`Cannot map returned data to query key:[${queryKey}]`);
        }
        return oldItems;
      });

      const onSettledFn = () => {
        queryClient.invalidateQueries({ queryKey });

        if (getOptimisticChildQueryKey) {
          itemsMap.forEach((i) => {
            queryClient.invalidateQueries({ queryKey: getOptimisticChildQueryKey(i.fullItem) });
          });
        }
      };

      obj.onSettledFns.push(onSettledFn);

      return obj;
    },
    {
      rollbackFns: [],
      onSettledFns: [],
    }
  );

  const rollbackFn = () => {
    rollbackFns.forEach((fn) => fn());
  };

  const onSettledFn = async () => {
    onSettledFns.forEach((fn) => fn());
  };

  const onSuccessFn = (returnedData: QueryDataItem | QueryDataItem[]) => {
    const normalizedReturnedData = Array.isArray(returnedData) ? returnedData : [returnedData];
    const organizedReturnedData = groupByQueryKey(
      normalizedReturnedData,
      getQueryDataQueryKey,
      getQueryDataItemId
    );

    const optimisticDataMap = new Map<string, OptimisticItem<Dto, Metadata>>(
      normalizedItems.map((i) => [getOptimisticItemId(i.fullItem), i])
    );

    organizedReturnedData.forEach(({ queryKey, itemsMap }) => {
      queryClient.setQueryData(queryKey, (oldItems: QueryDataItem | QueryDataItem[]) => {
        if (oldItems) {
          if (Array.isArray(oldItems)) {
            const oldItemsMap = new Map<string, QueryDataItem>(
              oldItems.map((i) => [getQueryDataItemId(i), i])
            );

            itemsMap.forEach((i) => {
              const itemId = getQueryDataItemId(i);
              if (optimisticDataMap.has(itemId)) {
                oldItemsMap.set(itemId, i);
              }
            });

            return Array.from(oldItemsMap.values());
          } else {
            const matchedItem = itemsMap.get(getQueryDataItemId(oldItems));

            if (matchedItem) {
              return matchedItem;
            }

            throw new Error(`Cannot map returned data to query key:[${queryKey}]`);
          }
        } else {
          return oldItems;
        }
      });

      if (getQueryDataChildQueryKey) {
        itemsMap.forEach((i) => {
          queryClient.setQueryData(getQueryDataChildQueryKey(i), i);
        });
      }
    });
  };

  return { rollbackFn, onSuccessFn, onSettledFn };
};
