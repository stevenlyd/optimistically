import { QueryClient, QueryKey } from "@tanstack/react-query";
import { getRollbackFn } from "../utils/getRollbackFn";
import { groupByQueryKey } from "../utils/groupBy";

type OptimisticDeleteFnParams<Dto, QueryDataItem> = {
  payload: {
    data: Dto | Dto[];
    getItemId: (item: Dto) => string;
    getQueryKey: (item: Dto) => QueryKey;
    getChildQueryKey?: (item: Dto) => QueryKey;
  };
  queryData: {
    getItemId: (item: QueryDataItem) => string;
    getChildQueryKey?: (item: QueryDataItem) => QueryKey;
  };
  queryClient: QueryClient;
};

export const optimisticDelete = <Dto extends Object, QueryDataItem extends Object>(
  params: OptimisticDeleteFnParams<Dto, QueryDataItem>
) => {
  const { payload, queryData, queryClient } = params;
  const {
    data: optimisticItems,
    getItemId: getPayloadItemId,
    getChildQueryKey: getPayloadChildQueryKey,
    getQueryKey: getPayloadQueryKey,
  } = payload;
  const { getItemId: getQueryDataItemId, getChildQueryKey: getQueryDataChildQueryKey } = queryData;

  const normalizedItems = Array.isArray(optimisticItems) ? optimisticItems : [optimisticItems];

  const organizedItems = groupByQueryKey(normalizedItems, getPayloadQueryKey, getPayloadItemId);

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
          ...(getPayloadChildQueryKey
            ? Array.from(itemsMap.values()).map(getPayloadChildQueryKey)
            : []),
        ],
      });

      obj.rollbackFns.push(rollbackFn);

      if (getPayloadChildQueryKey) {
        itemsMap.forEach((item) => {
          queryClient.setQueryData(getPayloadChildQueryKey(item), item);
        });
      }

      queryClient.setQueryData(queryKey, (oldItems: QueryDataItem | QueryDataItem[]) => {
        if (oldItems) {
          if (Array.isArray(oldItems)) {
            const updatedItems = oldItems.filter((item) => {
              const uniqueId = getQueryDataItemId(item);
              return !itemsMap.has(uniqueId);
            });
            return updatedItems;
          } else if (
            !Array.isArray(optimisticItems) &&
            typeof oldItems === "object" &&
            typeof optimisticItems === "object" &&
            getQueryDataItemId(oldItems) === getPayloadItemId(optimisticItems)
          ) {
            return undefined;
          }
        }
        return oldItems;
      });

      const onSettledFn = () => {
        queryClient.invalidateQueries({ queryKey });

        if (getPayloadChildQueryKey) {
          itemsMap.forEach((item) => {
            queryClient.invalidateQueries({ queryKey: getPayloadChildQueryKey(item) });
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

  return { rollbackFn, onSettledFn };
};
