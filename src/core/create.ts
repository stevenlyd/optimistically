import { QueryClient, QueryKey } from "@tanstack/react-query";
import { groupByQueryKey } from "../utils/groupBy";
import { getOnSettledFn } from "../utils/getOnSettledFn";
import { getRollbackFn } from "../utils/getRollbackFn";

type OptimisticCreateFnParams<T> = {
  data: T | T[];
  getItemId: (item: T) => string;
  getQueryKey: (item: T) => QueryKey;
  childQueries?: {
    getQueryKey: (item: T) => QueryKey;
    strategy: "optimistic" | "pessimistic";
  };
  queryClient: QueryClient;
};

export const optimisticCreate = <T extends object>(
  params: OptimisticCreateFnParams<T>
) => {
  const {
    getItemId,
    getQueryKey,
    queryClient,
    data: optimisticData,
    childQueries,
  } = params;

  const { getQueryKey: getChildQueryKey, strategy } = childQueries || {};

  const normalizedData = Array.isArray(optimisticData)
    ? optimisticData
    : [optimisticData];

  const organizedData = groupByQueryKey(normalizedData, getQueryKey, getItemId);

  const { rollbackFns, onSettledFns } = organizedData.reduce(
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
          ...(getChildQueryKey && strategy === "optimistic"
            ? Array.from(itemsMap.values()).map(getChildQueryKey)
            : []),
        ],
      });

      obj.rollbackFns.push(rollbackFn);

      if (getChildQueryKey && strategy === "optimistic") {
        itemsMap.forEach((i) => {
          queryClient.setQueryData(getChildQueryKey(i), i);
        });
      }

      const itemsArr = Array.from(itemsMap.values());

      queryClient.setQueryData(queryKey, (oldItems: T | T[]) => {
        if (oldItems) {
          if (Array.isArray(oldItems)) {
            if (!oldItems.some((item) => itemsMap.has(getItemId(item)))) {
              return [...oldItems, ...itemsArr];
            } else {
              throw new Error("Item already exists in the array");
            }
          } else if (!itemsMap.has(getItemId(oldItems))) {
            return { ...oldItems, ...itemsArr[0] };
          }
          throw new Error("Item already exists in the query data");
        }
        return oldItems;
      });

      const onSettledFn = getOnSettledFn({
        queryClient,
        mainQueryKey: queryKey,
        getPayloadChildQueryKey: getChildQueryKey,
        optimisticData: itemsArr,
      });

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

  const onSuccessFn = (returnedData: T | T[]) => {
    const normalizedReturnedData = Array.isArray(returnedData)
      ? returnedData
      : [returnedData];
    const organizedReturnedData = groupByQueryKey(
      normalizedReturnedData,
      getQueryKey,
      getItemId
    );

    organizedReturnedData.forEach(({ queryKey, itemsMap }) => {
      queryClient.setQueryData(queryKey, (oldItems: T | T[]) => {
        if (oldItems) {
          if (Array.isArray(oldItems)) {
            const oldItemsMap = new Map<string, T>(
              oldItems.map((i) => [getItemId(i), i])
            );

            // Remove the optimistic data from the query data
            normalizedData.forEach((optimisticItem) => {
              const itemId = getItemId(optimisticItem);
              if (oldItemsMap.has(itemId)) {
                oldItemsMap.delete(itemId);
              }
            });

            // Add the real data to the query data
            itemsMap.forEach((i) => {
              const itemId = getItemId(i);
              oldItemsMap.set(itemId, i);
            });

            return Array.from(oldItemsMap.values());
          }

          const matchedItem = itemsMap.get(getItemId(oldItems));

          if (matchedItem) {
            return matchedItem;
          }

          throw new Error(
            `Cannot map returned data to query key:[${queryKey}]`
          );
        }
        return oldItems;
      });

      if (getChildQueryKey) {
        itemsMap.forEach((i) => {
          queryClient.setQueryData(getChildQueryKey(i), i);
        });
      }
    });
  };

  return { rollbackFn, onSuccessFn, onSettledFn };
};
