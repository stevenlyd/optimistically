import { QueryClient, QueryKey } from "@tanstack/react-query";

interface GetOnSuccessFnParams<
  T extends object,
  D extends Partial<T> = Partial<T>
> {
  queryClient: QueryClient;
  mainQueryKey: QueryKey;
  getChildQueryKeyFn?: (item: T) => QueryKey;
  getUniqueId: (item: D | T) => string;
  optimisticData: D | D[];
}

export const getOnSuccessFn = <
  T extends object,
  D extends Partial<T> = Partial<T>
>(
  params: GetOnSuccessFnParams<T, D>
) => {
  const {
    queryClient,
    mainQueryKey,
    getChildQueryKeyFn,
    optimisticData,
    getUniqueId,
  } = params;

  const normalizedData = Array.isArray(optimisticData)
    ? optimisticData
    : [optimisticData];

  return (returnedData: T | T[]) => {
    const normalizedReturnedData = Array.isArray(returnedData)
      ? returnedData
      : [returnedData];

    if (getChildQueryKeyFn) {
      normalizedReturnedData.forEach((item) => {
        queryClient.setQueryData(getChildQueryKeyFn(item), item);
      });
    }

    queryClient.setQueryData(mainQueryKey, (oldItems: T | T[]) => {
      if (oldItems) {
        if (Array.isArray(oldItems)) {
          const originalDataMap = new Map<string, Partial<T>>(
            normalizedData.map((i) => [getUniqueId(i), i])
          );
          const returnedDataMap = new Map<string, T>(
            normalizedReturnedData.map((i) => [getUniqueId(i), i])
          );

          const updatedItems = oldItems.map((item) => {
            const uniqueId = getUniqueId(item);
            // Check if the item is in the original payload
            const returnedItem = !!originalDataMap.get(uniqueId)
              ? // Check if the item is in the returned data
                returnedDataMap.get(uniqueId)
              : null;
            return returnedItem ?? item;
          });

          return updatedItems;
        } else if (!Array.isArray(returnedData)) {
          return returnedData;
        } else {
          throw new Error(
            `Cannot map returned data to query key:[${mainQueryKey}]`
          );
        }
      }
      return oldItems;
    });
  };
};
