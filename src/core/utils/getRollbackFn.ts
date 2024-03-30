import { QueryClient, QueryKey } from "@tanstack/react-query";
import { mapItem } from "./mapItem";

interface GetQueryRollbackFnParams {
  queryClient: QueryClient;
  queryKey: QueryKey;
  previousData: object | object[] | undefined;
}

/**
 * Returns a rollback function that can be used to revert optimistic updates.
 * The rollback function sets the previous data for a given query key and invalidates the query.
 *
 * @param params - The parameters for creating the rollback function.
 * @param params.queryClient - The query client instance.
 * @param params.queryKey - The query key for the data to be rolled back.
 * @param params.previousData - The previous data to be set for the query key.
 * @returns The rollback function.
 */
export const getQueryRollbackFn = (params: GetQueryRollbackFnParams) => {
  const { queryClient, queryKey, previousData } = params;
  return () => {
    queryClient.setQueryData<typeof previousData>(queryKey, previousData);
  };
};

interface GetRollbackFnParams<T extends object> {
  queryClient: QueryClient;
  previousData: T | T[] | undefined;
  mainQueryKey: QueryKey;
  getChildQueryKeyFn?: (item: T) => QueryKey;
}

export const getRollbackFn = <T extends object>(
  params: GetRollbackFnParams<T>
) => {
  const { queryClient, previousData, mainQueryKey, getChildQueryKeyFn } =
    params;

  const rollbackFn = getQueryRollbackFn({
    queryClient,
    queryKey: mainQueryKey,
    previousData,
  });

  const childQueryRollbackFns = getChildQueryKeyFn
    ? mapItem(previousData, (item) => {
        if (item) {
          const childQueryKey = getChildQueryKeyFn(item);
          const previousChildData = structuredClone(
            queryClient.getQueryData<T>(childQueryKey)
          );
          return getQueryRollbackFn({
            queryClient,
            queryKey: childQueryKey,
            previousData: previousChildData,
          });
        }
      })
    : [];

  return async () => {
    await Promise.all([
      rollbackFn(),
      ...childQueryRollbackFns.map((fn) => fn?.()),
    ]);
  };
};
