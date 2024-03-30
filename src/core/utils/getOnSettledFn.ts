import { QueryClient, QueryKey } from "@tanstack/react-query";
import { mapItem } from "./mapItem";

interface GetOnSettledFnParams<T extends object> {
  queryClient: QueryClient;
  mainQueryKey: QueryKey;
  getChildQueryKeyFn?: (item: T) => QueryKey;
  optimisticData: T | T[];
}

export const getOnSettledFn = <T extends object>(
  params: GetOnSettledFnParams<T>
) => {
  const { queryClient, mainQueryKey, getChildQueryKeyFn, optimisticData } =
    params;

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: mainQueryKey }),
      ...(getChildQueryKeyFn
        ? mapItem(optimisticData, (i) => getChildQueryKeyFn(i))
        : []),
    ]);
  };
};
