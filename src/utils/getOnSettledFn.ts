import { QueryClient, QueryKey } from "@tanstack/react-query";
import { mapItem } from "./mapItem";

interface GetOnSettledFnParams<T extends object> {
  queryClient: QueryClient;
  mainQueryKey: QueryKey;
  getPayloadChildQueryKey?: (item: T) => QueryKey;
  optimisticData: T | T[];
}

export const getOnSettledFn = <T extends object>(params: GetOnSettledFnParams<T>) => {
  const { queryClient, mainQueryKey, getPayloadChildQueryKey, optimisticData } = params;

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: mainQueryKey }),
      ...(getPayloadChildQueryKey
        ? mapItem(optimisticData, (i) => getPayloadChildQueryKey(i))
        : []),
    ]);
  };
};
