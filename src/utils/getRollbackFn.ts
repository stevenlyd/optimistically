import { QueryClient, QueryKey } from "@tanstack/react-query";
import { mapItem } from "./mapItem";

interface GetQueryRollbackFnParams {
  queryClient: QueryClient;
  queryKey: QueryKey;
}


/**
 * Returns a rollback function for a query in the query cache.
 *
 * @param params - The parameters for creating the rollback function.
 * @param params.queryClient - The query client instance.
 * @param params.queryKey - The key of the query to rollback.
 * @returns A function that can be called to rollback the query to its previous state.
 */
export const getQueryRollbackFn = (params: GetQueryRollbackFnParams) => {
  const { queryClient, queryKey } = params;
  const snapshot = queryClient.getQueryData(queryKey);
  return () => {
    console.warn(
      `Rolling back query key: ${JSON.stringify(queryKey)}, snapshot: ${JSON.stringify(snapshot)}`
    );
    queryClient.setQueryData<typeof snapshot>(queryKey, snapshot);
  };
};

interface GetRollbackFnParams {
  queryClient: QueryClient;
  queryKeys: QueryKey[] | QueryKey;
}

export const getRollbackFn = (params: GetRollbackFnParams) => {
  const { queryClient, queryKeys } = params;

  const normalizedQueryKeys = Array.isArray(queryKeys) ? queryKeys : [queryKeys];

  const rollbackFns = normalizedQueryKeys.map((queryKey) =>
    getQueryRollbackFn({ queryClient, queryKey })
  );

  return async () => {
    await Promise.all(rollbackFns.map((fn) => fn()));
  };
};
